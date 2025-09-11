import React from 'react';
import { useRouter } from 'next/router';
import { DynamicDashboardRouter } from '../src/utils/dashboardRouter';
import type { User } from '../src/types';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        const route = DynamicDashboardRouter.getRouteForUser(user);
        router.push(route.path);
        return;
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white">
      {/* Top Nav */}
      <header className="relative z-10 border-b border-gray-200/60 backdrop-blur bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 7.5C4 6.12 5.79 5 8 5h8c2.21 0 4 1.12 4 2.5V15c0 1.38-1.79 2.5-4 2.5H9.6a2 2 0 0 0-1.27.46L6 20v-2.5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">CampusON</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/auth/register')} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">회원가입</button>
            <button onClick={handleGetStarted} className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">로그인</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-300/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] bg-blue-200/40 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/10 text-indigo-700 mb-4">
                <span className="w-2 h-2 bg-indigo-600 rounded-full" /> 대학교 전용 All‑in‑One AI 플랫폼
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                함께하는 공부,
                <br />캠퍼스ON
              </h1>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                PDF 문제 파싱, 전공 교재 RAG, 커뮤니티, 과제·평가까지.
                한 곳에서 빠르고 정확하게 학습과 업무를 이어보세요.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <button onClick={handleGetStarted} className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700">바로 시작하기</button>
                <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">데모 둘러보기</button>
              </div>
              <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"/>보안·비공개 환경</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full"/>전공 교재 RAG</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"/>문제 파싱 자동화</div>
              </div>
            </div>
            <div>
              <div className="relative rounded-2xl border border-indigo-100 bg-white/70 backdrop-blur shadow-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                    <div className="text-sm text-indigo-700 font-medium mb-1">전공 RAG</div>
                    <div className="text-xs text-gray-500">교재 기반 답변</div>
                    <div className="mt-3 h-20 rounded-lg bg-white border flex items-center justify-center text-gray-400">Q&A</div>
                  </div>
                  <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                    <div className="text-sm text-blue-700 font-medium mb-1">문제 파싱</div>
                    <div className="text-xs text-gray-500">PDF→문항 데이터</div>
                    <div className="mt-3 h-20 rounded-lg bg-white border flex items-center justify-center text-gray-400">Parser</div>
                  </div>
                  <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                    <div className="text-sm text-emerald-700 font-medium mb-1">커뮤니티</div>
                    <div className="text-xs text-gray-500">학과 소통 허브</div>
                    <div className="mt-3 h-20 rounded-lg bg-white border flex items-center justify-center text-gray-400">Boards</div>
                  </div>
                  <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                    <div className="text-sm text-amber-700 font-medium mb-1">과제/평가</div>
                    <div className="text-xs text-gray-500">진행·통계 통합</div>
                    <div className="mt-3 h-20 rounded-lg bg-white border flex items-center justify-center text-gray-400">Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">핵심 기능</h2>
          <p className="mt-3 text-gray-600">대학 환경에 꼭 맞춘 기능만 깔끔하게 담았습니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: '교재 RAG Q&A', desc: '전공 교재를 기반으로 정확한 답변', color: 'from-indigo-500 to-violet-500' },
            { title: 'PDF 문제 파싱', desc: '시험지에서 자동으로 문항 추출', color: 'from-blue-500 to-cyan-500' },
            { title: '커뮤니티', desc: '학과 소통과 자료 공유', color: 'from-emerald-500 to-teal-500' },
            { title: '과제/평가', desc: '과제 관리와 성적 통계', color: 'from-amber-500 to-orange-500' },
          ].map((f, i) => (
            <div key={i} className="relative rounded-xl border bg-white shadow-sm p-6">
              <div className={`absolute -z-10 inset-0 rounded-xl bg-gradient-to-br ${f.color} opacity-10`} />
              <div className="text-lg font-semibold text-gray-900">{f.title}</div>
              <div className="mt-2 text-sm text-gray-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto rounded-2xl border bg-white shadow-sm p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900">지금 바로 CampusON을 시작해 보세요</h3>
          <p className="mt-2 text-gray-600">로그인하면 학과 맞춤 대시보드로 이동합니다.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={handleGetStarted} className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">시작하기</button>
            <button onClick={() => router.push('/auth/register')} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">회원가입</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
