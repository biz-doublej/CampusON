'use client';

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { ragAPI } from '../../src/services/api';
import type { RagStatus, RagQueryResult } from '../../src/types';

const formatBytes = (value: number) => {
  if (!value || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, idx);
  return `${size.toFixed(1)} ${units[idx]}`;
};

const defaultMetaExample = JSON.stringify({ department: 'nursing', source: 'manual' }, null, 2);

const AdminRagPage = () => {
  const [status, setStatus] = useState<RagStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  const [query, setQuery] = useState<string>('');
  const [topK, setTopK] = useState<number>(5);
  const [queryResults, setQueryResults] = useState<RagQueryResult[]>([]);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const [ingestText, setIngestText] = useState<string>('');
  const [ingestMeta, setIngestMeta] = useState<string>(defaultMetaExample);
  const [chunkSize, setChunkSize] = useState<number>(800);
  const [chunkOverlap, setChunkOverlap] = useState<number>(120);
  const [autoBuild, setAutoBuild] = useState<boolean>(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestLoading, setIngestLoading] = useState<boolean>(false);

  const refreshStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await ragAPI.getStatus();
      if (res.success) {
        setStatus(res.status);
        setStatusError(null);
      } else {
        setStatusError('RAG 상태 조회에 실패했습니다.');
      }
    } catch (err) {
      setStatusError('RAG 상태 조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleBuildIndex = async () => {
    try {
      setStatusError(null);
      const res = await ragAPI.buildIndex();
      if (!res.success) {
        setStatusError(res.error || '인덱스 빌드에 실패했습니다.');
      }
      if (res.status) {
        setStatus(res.status);
      } else {
        await refreshStatus();
      }
    } catch (err) {
      setStatusError('인덱스 빌드 중 오류가 발생했습니다.');
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setQueryError('검색어를 입력하세요.');
      return;
    }
    try {
      setQueryLoading(true);
      setQueryError(null);
      const res = await ragAPI.query(query.trim(), topK);
      if (res.success) {
        setQueryResults(res.results || []);
      } else {
        setQueryError('검색 결과를 가져오지 못했습니다.');
      }
    } catch (err) {
      setQueryError('검색 중 오류가 발생했습니다.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestText.trim()) {
      setIngestError('추가할 문서를 입력하세요.');
      return;
    }
    let parsedMeta: Record<string, unknown> | undefined;
    if (ingestMeta.trim()) {
      try {
        parsedMeta = JSON.parse(ingestMeta);
      } catch (err) {
        setIngestError('문서 메타데이터가 올바른 JSON 형식이 아닙니다.');
        return;
      }
    }

    const documents = ingestText
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => ({ text: block, meta: parsedMeta }));

    if (documents.length === 0) {
      setIngestError('유효한 문서를 찾지 못했습니다.');
      return;
    }

    try {
      setIngestLoading(true);
      setIngestError(null);
      setIngestMessage(null);
      const res = await ragAPI.ingestDocuments(documents, {
        chunkSize,
        chunkOverlap,
        defaultMeta: parsedMeta,
        buildIndex: autoBuild,
      });
      if (res.success) {
        setIngestMessage(`총 ${res.ingested}개의 청크가 추가되었습니다.`);
        setStatus(res.status);
        await refreshStatus();
      } else {
        setIngestError('문서 인덱싱에 실패했습니다.');
      }
    } catch (err) {
      setIngestError('문서 인덱싱 중 오류가 발생했습니다.');
    } finally {
      setIngestLoading(false);
    }
  };

  const statusItems = useMemo(() => {
    if (!status) return [];
    return [
      { label: '총 청크 수', value: status.total_chunks.toLocaleString() },
      { label: 'FAISS 사용 가능', value: status.faiss_available ? '가능' : '불가' },
      { label: '인덱스 존재 여부', value: status.index_exists ? '예' : '아니오' },
      { label: '벡터 개수', value: status.vector_count.toLocaleString() },
      { label: '차원 수', value: status.dimension ?? '미정' },
      { label: '인덱스 크기', value: formatBytes(status.index_size) },
      { label: '최근 빌드', value: status.last_built ? new Date(status.last_built).toLocaleString() : '기록 없음' },
    ];
  }, [status]);

  return (
    <>
      <Head>
        <title>CampusON 관리자 | RAG 관리</title>
      </Head>
      <div className="min-h-screen bg-slate-900 text-slate-100 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <header>
            <h1 className="text-3xl font-semibold">RAG 지식베이스 관리</h1>
            <p className="mt-2 text-slate-300">
              학습 콘텐츠를 검색 가능한 지식베이스로 관리하고, 인덱스를 빌드하거나 질의를 실행할 수 있습니다.
            </p>
          </header>

          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">현재 상태</h2>
              <div className="space-x-2">
                <button
                  onClick={refreshStatus}
                  className="rounded-lg border border-slate-500 px-4 py-1.5 text-sm hover:bg-slate-700 transition"
                  disabled={loadingStatus}
                >
                  {loadingStatus ? '새로고침 중...' : '새로고침'}
                </button>
                <button
                  onClick={handleBuildIndex}
                  className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium hover:bg-indigo-600 transition"
                >
                  인덱스 빌드
                </button>
              </div>
            </div>
            {statusError && <p className="mt-3 text-sm text-rose-400">{statusError}</p>}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">문서 인덱싱</h2>
            <p className="text-sm text-slate-300">
              두 줄 이상의 공백으로 구분된 각 블록이 개별 문서로 처리됩니다. 기본 메타데이터는 JSON 형태로 설정합니다.
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">문서 본문</label>
                <textarea
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={10}
                  placeholder="문서를 입력하거나 붙여넣으세요."
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">기본 메타데이터 (JSON)</label>
                <textarea
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={10}
                  value={ingestMeta}
                  onChange={(e) => setIngestMeta(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col text-sm text-slate-300">
                    청크 길이
                    <input
                      type="number"
                      min={200}
                      className="mt-1 rounded-md border border-slate-600 bg-slate-900/70 px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col text-sm text-slate-300">
                    청크 오버랩
                    <input
                      type="number"
                      min={0}
                      className="mt-1 rounded-md border border-slate-600 bg-slate-900/70 px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(Number(e.target.value))}
                    />
                  </label>
                </div>
                <label className="inline-flex items-center space-x-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    checked={autoBuild}
                    onChange={(e) => setAutoBuild(e.target.checked)}
                  />
                  <span>인덱스 자동 재빌드</span>
                </label>
              </div>
            </div>
            {ingestError && <p className="text-sm text-rose-400">{ingestError}</p>}
            {ingestMessage && <p className="text-sm text-emerald-400">{ingestMessage}</p>}
            <button
              onClick={handleIngest}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition disabled:cursor-not-allowed disabled:bg-emerald-800/60"
              disabled={ingestLoading}
            >
              {ingestLoading ? '인덱싱 중...' : '문서 추가'}
            </button>
          </section>

          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">질의 실행</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-slate-300">검색어</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 간호사정 활력징후 절차"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <label className="text-sm text-slate-300">
                Top K
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="mt-1 w-24 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                />
              </label>
              <button
                onClick={handleQuery}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition disabled:cursor-not-allowed disabled:bg-indigo-800/60"
                disabled={queryLoading}
              >
                {queryLoading ? '검색 중...' : '검색'}
              </button>
            </div>
            {queryError && <p className="text-sm text-rose-400">{queryError}</p>}
            <div className="space-y-4">
              {queryResults.map((item, idx) => (
                <div key={`${item.text.slice(0, 32)}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>결과 #{idx + 1}</span>
                    {typeof item.score === 'number' && <span>유사도: {item.score.toFixed(3)}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-100">{item.text}</p>
                  {item.meta && (
                    <details className="mt-2 text-sm text-slate-300">
                      <summary className="cursor-pointer text-slate-400">메타데이터 보기</summary>
                      <pre className="mt-2 rounded bg-slate-900/70 p-3 text-xs text-slate-200">
                        {JSON.stringify(item.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {!queryLoading && queryResults.length === 0 && (
                <p className="text-sm text-slate-400">검색 결과가 없습니다. 지식베이스를 인덱싱했는지 확인하세요.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminRagPage;
