import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import quizService from '../../../src/services/quizService';

type QuizItem = {
  id: number;
  number: number;
  content: string;
  options: Record<string, string>;
  difficulty?: string;
};

export default function QuizPlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const quizId = Number(id);

  useEffect(() => {
    if (!router.isReady || !id) return;
    (async () => {
      try {
        const data = await quizService.get(quizId);
        setItems(data?.quiz?.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, id]);

  const handleChange = (qid: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await quizService.submit(quizId, answers);
      setResult({ score: res.score, correct: res.correct, total: res.total });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Head>
        <title>퀴즈 풀기 - CampusON</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">퀴즈 풀기</h1>
          {loading && <div>불러오는 중…</div>}
          {!loading && items.length === 0 && <div>퀴즈가 없습니다.</div>}
          {!loading && items.map((q, idx) => (
            <div key={q.id} className="bg-white p-5 rounded-lg shadow mb-4">
              <div className="font-semibold mb-2">{idx + 1}. {q.content}</div>
              <div className="space-y-2">
                {Object.entries(q.options || {}).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={k}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      checked={answers[String(q.id)] === k}
                    />
                    <span>{k}. {v}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {items.length > 0 && (
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md">제출</button>
          )}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <div>점수: {result.score}</div>
              <div>정답: {result.correct} / {result.total}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

