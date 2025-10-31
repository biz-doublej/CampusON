from __future__ import annotations

import pickle
import sys
import types
from pathlib import Path
from typing import Iterator, List

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402
from app.db.database import Base, get_db  # noqa: E402


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Iterator:
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Ensure FAISS artifacts are written inside the pytest tmpdir
    import app.ai.rag as rag_module

    index_dir = tmp_path / "faiss"
    index_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(rag_module, "INDEX_DIR", str(index_dir))
    monkeypatch.setattr(rag_module, "INDEX_PATH", str(index_dir / "kb.index"))
    monkeypatch.setattr(rag_module, "IDS_PATH", str(index_dir / "kb.ids.json"))

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def deterministic_embeddings(monkeypatch):
    def _embed(text, model_type=None, model_name=None):
        def _single(value: str) -> List[float]:
            length = len(value.encode("utf-8"))
            return [
                float((length % 5) + 1),
                float((length % 7) + 2),
                float((length % 11) + 3),
            ]

        if isinstance(text, list):
            return [_single(t) for t in text]
        return _single(str(text))

    monkeypatch.setattr("app.utils.embedding_utils.create_embedding", _embed)


@pytest.fixture()
def fake_faiss(monkeypatch):
    class FakeIndex:
        def __init__(self, dim: int):
            self.d = dim
            self._vectors: np.ndarray | None = None

        def add(self, arr: np.ndarray):
            arr = np.array(arr, dtype=np.float32)
            if self._vectors is None:
                self._vectors = arr
            else:
                self._vectors = np.vstack([self._vectors, arr])

        def search(self, query: np.ndarray, top_k: int):
            if self._vectors is None or self._vectors.size == 0:
                scores = np.zeros((1, top_k), dtype=np.float32)
                indices = -np.ones((1, top_k), dtype=np.int64)
                return scores, indices
            q = np.array(query, dtype=np.float32).reshape(1, -1)
            sims = np.dot(self._vectors, q.T).flatten()
            order = np.argsort(-sims)[:top_k]
            scores = sims[order].reshape(1, -1).astype(np.float32)
            indices = order.reshape(1, -1).astype(np.int64)
            return scores, indices

    def _write_index(index: FakeIndex, path: str):
        data = {
            "dim": index.d,
            "vectors": index._vectors.tolist() if index._vectors is not None else [],
        }
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as fp:
            pickle.dump(data, fp)

    def _read_index(path: str):
        with open(path, "rb") as fp:
            data = pickle.load(fp)
        idx = FakeIndex(int(data["dim"]))
        vectors = np.array(data.get("vectors") or [], dtype=np.float32)
        if vectors.size:
            idx.add(vectors)
        return idx

    module = types.ModuleType("faiss")
    module.IndexFlatIP = FakeIndex
    module.write_index = _write_index
    module.read_index = _read_index

    monkeypatch.setitem(sys.modules, "faiss", module)

    import app.ai.rag as rag_module

    monkeypatch.setattr(rag_module, "faiss", module)

    yield module


def test_rag_status_empty(client):
    resp = client.get("/api/ai/rag/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    status = data["status"]
    assert status["total_chunks"] == 0
    assert status["index_exists"] is False


def test_rag_ingest_and_query_fallback(client):
    payload = {
        "documents": [
            {"text": "물리치료 평가에서 근력 평가는 MMT로 수행한다.", "meta": {"topic": "musculoskeletal"}},
            {"text": "심폐 재활 환자는 호흡 운동과 순환 운동을 병행한다.", "meta": {"topic": "cardiopulmonary"}},
        ],
        "chunk_size": 120,
        "chunk_overlap": 20,
    }
    resp = client.post("/api/ai/rag/ingest", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["ingested"] >= 2

    status_resp = client.get("/api/ai/rag/status")
    status = status_resp.json()["status"]
    assert status["total_chunks"] >= 2

    query_resp = client.post("/api/ai/rag/query", json={"query": "근력 평가", "top_k": 2})
    assert query_resp.status_code == 200
    results = query_resp.json()["results"]
    assert isinstance(results, list)
    assert len(results) >= 1
    assert "근력" in results[0]["text"]


@pytest.mark.usefixtures("deterministic_embeddings", "fake_faiss")
def test_rag_build_and_query_with_index(client):
    docs = [
        {"text": "임상 실습에서 감염관리 표준주의 절차를 준수한다.", "meta": {"department": "nursing"}},
        {"text": "근골격계 재활은 스트레칭과 근력 강화 운동이 핵심이다.", "meta": {"department": "physical_therapy"}},
    ]
    resp = client.post("/api/ai/rag/ingest", json={"documents": docs, "build_index": False})
    assert resp.status_code == 200
    assert resp.json()["ingested"] >= 2

    build_resp = client.post("/api/ai/rag/build")
    assert build_resp.status_code == 200
    build_data = build_resp.json()
    # fake_faiss returns success by writing an index
    assert build_data.get("success") is True
    assert build_data["status"]["index_exists"] is True

    query_resp = client.post("/api/ai/rag/query", json={"query": "감염관리 표준주의", "top_k": 1})
    assert query_resp.status_code == 200
    results = query_resp.json()["results"]
    assert results
    assert "감염관리" in results[0]["text"]


def test_rag_upload_text_file(client):
    content = "물리치료 평가 체크리스트".encode("utf-8")
    files = {"file": ("notes.txt", content, "text/plain")}
    resp = client.post(
        "/api/ai/rag/upload",
        data={
            "department": "physical_therapy",
            "course": "임상실습",
            "chunk_size": "400",
            "chunk_overlap": "80",
            "build_index": "false",
        },
        files=files,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["ingested"] >= 1
    assert body["status"]["total_chunks"] >= 1
