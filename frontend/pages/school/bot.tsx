import React, { useState } from 'react';
import Head from 'next/head';
import schoolService from '../../src/services/schoolService';

export default function SchoolBotPage() {
  const [q, setQ] = useState('경복대학교 셔틀버스 시간 알려줘');
  const [url, setUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    try {
      const res = await schoolService.query(q, { top_k: 5, urls: url ? [url] : undefined });
      setAnswer(res.answer || '');
      setSources(res.sources || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>학교 안내 봇</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">학교 안내 봇</h1>
          <div className="bg-white p-4 rounded border mb-4">
            <input className="w-full border p-2 rounded mb-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="질문을 입력하세요" />
            <input className="w-full border p-2 rounded mb-2" value={url} onChange={e=>setUrl(e.target.value)} placeholder="참고할 학교 공지/서비스 URL (선택)" />
            <button onClick={ask} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '조회 중…' : '질문'}</button>
          </div>
          {answer && (
            <div className="bg-white p-4 rounded border mb-4 whitespace-pre-wrap">
              {answer}
            </div>
          )}
          {sources && sources.length > 0 && (
            <div className="bg-white p-4 rounded border">
              <div className="font-semibold mb-2">참고 자료</div>
              <ul className="list-disc ml-5 text-sm text-gray-700">
                {sources.map((s, idx) => (
                  <li key={idx}>{s.meta?.url || (s.text?.slice(0, 60) + '…')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

