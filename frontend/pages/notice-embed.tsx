import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function NoticeEmbedPage() {
  const DEFAULT_URL = 'https://www.kbu.ac.kr/kor/CMS/Board/Board.do?mCode=MN069';
  const [url, setUrl] = useState(DEFAULT_URL);
  const [target, setTarget] = useState<string>(DEFAULT_URL);

  useEffect(() => {
    setTarget(url.trim() || DEFAULT_URL);
  }, [url, DEFAULT_URL]);

  return (
    <>
      <Head>
        <title>학교 공지 임베드 - CampusON</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">학교 공지 사이트 임베드</h1>
          <div className="flex gap-2 mb-4">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1 border p-2 rounded"
              placeholder="https://www.kbu.ac.kr/kor/CMS/Board/Board.do?mCode=MN069"
            />
          </div>
          {target && (
            <div className="border rounded overflow-hidden" style={{height:'70vh'}}>
              <iframe src={target} className="w-full h-full" title="학교 공지" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
