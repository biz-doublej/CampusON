import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import communityV2Service from '../../src/services/communityV2Service';

export default function CommunityBoardsPage() {
  const [boards, setBoards] = useState<any[]>([]);
  const [name, setName] = useState('자유게시판');
  const [desc, setDesc] = useState('자유롭게 소통해요');
  const [anon, setAnon] = useState(false);
  const [userId, setUserId] = useState('student01');

  const load = async () => {
    const res = await communityV2Service.listBoards();
    setBoards(res.boards || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await communityV2Service.verify(userId, true);
    await communityV2Service.createBoard(userId, name, desc, anon);
    await load();
  };

  return (
    <>
      <Head><title>커뮤니티 게시판</title></Head>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">게시판</h1>
        <div className="bg-white p-4 rounded border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input className="border p-2 rounded" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="user_id" />
            <input className="border p-2 rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="게시판명" />
            <input className="border p-2 rounded" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={anon} onChange={e=>setAnon(e.target.checked)} />익명</label>
            <button className="bg-blue-600 text-white rounded px-3" onClick={create}>게시판 생성</button>
          </div>
        </div>
        <div className="grid gap-3">
          {boards.map(b => (
            <Link key={b.id} href={`/community/board/${b.id}`} className="block bg-white p-4 border rounded hover:bg-gray-50">
              <div className="font-semibold">{b.name} {b.is_anonymous ? '(익명)' : ''}</div>
            </Link>
          ))}
          {boards.length === 0 && <div className="text-gray-500">게시판이 없습니다.</div>}
        </div>
      </div>
    </>
  );
}

