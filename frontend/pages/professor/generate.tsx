import React, { useState } from 'react';
import Head from 'next/head';
import aiService from '../../src/services/aiService';

export default function GenerateQuestionsPage() {
  const [topic, setTopic] = useState('일반');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('중');
  const [subject, setSubject] = useState('물리치료학');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await aiService.generateQuestions(topic, count, difficulty, subject);
      setQuestions(res.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ingest = async () => {
    const normalized = questions.map(q => ({
      number: q.number || q.question_number,
      content: q.content,
      options: q.options,
      description: q.description,
      subject: q.subject,
      area_name: q.area_name,
      year: q.year,
    }));
    await aiService.ingest(normalized);
    alert('지식베이스로 인덱싱 완료');
  };

  const saveAndCreateQuiz = async () => {
    const normalized = questions.map(q => ({
      number: q.number || q.question_number,
      content: q.content,
      options: q.options,
      description: q.description,
      answer: q.correct_answer,
      subject: q.subject,
      area_name: q.area_name,
      year: q.year,
    }));
    try {
      const saved = await (await import('../../src/services/questionService')).default.bulkSave(normalized);
      const ids = saved.question_ids || [];
      if (ids.length === 0) { alert('저장된 질문이 없습니다.'); return; }
      const res = await (await import('../../src/services/quizService')).default.create(`AI 생성 퀴즈`, ids.map((id: number) => ({ id })));
      const qid = res?.quiz?.id;
      if (qid) {
        alert(`퀴즈 생성 완료 (ID: ${qid})`);
        location.href = `/student/quiz/${qid}`;
      }
    } catch (e) {
      console.error(e);
      alert('저장/퀴즈 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Head><title>문제 생성 - CampusON</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">AI 문제 생성</h1>
          <div className="bg-white p-4 rounded shadow mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="border p-2 rounded" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="주제" />
            <input className="border p-2 rounded" type="number" min={1} max={20} value={count} onChange={e=>setCount(Number(e.target.value))} />
            <select className="border p-2 rounded" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
              <option value="하">하</option>
              <option value="중">중</option>
              <option value="상">상</option>
            </select>
            <input className="border p-2 rounded" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="도메인(예: 물리치료학)" />
            <button onClick={generate} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={loading}>{loading ? '생성 중…' : '생성'}</button>
          </div>

          {questions.length > 0 && (
            <div className="mb-4 flex gap-3">
              <button onClick={ingest} className="px-3 py-2 bg-green-600 text-white rounded">지식베이스에 인덱싱</button>
              <button onClick={saveAndCreateQuiz} className="px-3 py-2 bg-blue-600 text-white rounded">저장 후 퀴즈 생성</button>
            </div>
          )}

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white p-4 rounded shadow">
                <div className="font-semibold mb-2">{idx + 1}. {q.content}</div>
                <ul className="list-disc ml-6">
                  {Object.entries(q.options || {}).map(([k, v]) => (
                    <li key={k}>{k}. {String(v)}</li>
                  ))}
                </ul>
                {q.correct_answer && <div className="mt-2 text-sm text-gray-600">정답: {q.correct_answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
