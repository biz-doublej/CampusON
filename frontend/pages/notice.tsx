import React from 'react';
import Head from 'next/head';

const NoticePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>공지사항 - CampusON</title>
        <meta name="description" content="CampusON 공지사항 및 업데이트 정보" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">공지사항</h1>
            <p className="text-gray-600">CampusON의 최신 소식과 업데이트 정보를 확인하세요.</p>
          </div>

          {/* Notice List */}
          <div className="space-y-6">
            {/* Notice Item */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                    중요
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900">
                    CampusON 시스템 정식 런칭 안내
                  </h2>
                </div>
                <span className="text-sm text-gray-500">2025-01-15</span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                안녕하세요. CampusON 팀입니다.<br />
                경복대학교를 위한 AI 기반 교육 플랫폼 CampusON이 정식으로 런칭되었습니다. 
                DoubleJ 회사의 최신 기술을 바탕으로 개발된 본 시스템은 PDF 문제 파싱, 
                개인화된 학습 분석 등 혁신적인 기능을 제공합니다.
              </p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                자세히 보기 →
              </button>
            </div>

            {/* Notice Item */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                    업데이트
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900">
                    박스 형태 문제 파싱 기능 개선
                  </h2>
                </div>
                <span className="text-sm text-gray-500">2025-01-10</span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                한국어 시험 문제의 박스 형태 추가설명 및 조건문 파싱 기능이 대폭 개선되었습니다. 
                이제 더 정확하고 완전한 문제 분석이 가능합니다.
              </p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                자세히 보기 →
              </button>
            </div>

            {/* Notice Item */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                    일반
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900">
                    서비스 이용 가이드 업데이트
                  </h2>
                </div>
                <span className="text-sm text-gray-500">2025-01-05</span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                새로운 사용자를 위한 상세한 이용 가이드가 업데이트되었습니다. 
                PDF 업로드부터 문제 분석까지 단계별 안내를 확인하세요.
              </p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                자세히 보기 →
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            <button 
              onClick={() => window.history.back()} 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              이전으로
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoticePage;