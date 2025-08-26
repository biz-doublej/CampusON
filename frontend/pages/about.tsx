import React from 'react';
import Head from 'next/head';

const AboutPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>회사소개 - CampusON</title>
        <meta name="description" content="DoubleJ 회사 및 CampusON 소개" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">CampusON</h1>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-medium mb-6">
                AI로 열리는 새로운 캠퍼스
              </div>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                CampusON은 학생·교수·대학이 함께 성장할 수 있도록 설계된 <strong>AI 기반 교육 플랫폼</strong>입니다.<br />
                강의 요약, 시험 대비, 과제 관리부터 학사 행정까지 — <strong>캠퍼스 생활 전반을 AI가 지원</strong>합니다.
              </p>
              <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-6 py-3 rounded-lg text-lg font-semibold">
                💡 "공부는 학생이, 지원은 CampusON이"
              </div>
          </div>

          {/* Three Versions Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">CampusON 소개</h2>
            
            {/* Landing Version */}
            <div className="mb-12">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">①</span>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900">회사 가치</h3>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-lg text-gray-700 leading-relaxed">
                    <blockquote className="border-l-4 border-blue-500 pl-4 mb-4 italic text-xl">
                      "CampusON – AI로 열리는 새로운 캠퍼스"
                    </blockquote>
                    <p className="mb-4">
                      CampusON은 학생·교수·대학이 함께 성장할 수 있도록 설계된 <strong className="text-blue-600">AI 기반 교육 플랫폼</strong>입니다.
                    </p>
                    <p className="mb-4">
                      강의 요약, 시험 대비, 과제 관리부터 학사 행정까지 — <strong className="text-blue-600">캠퍼스 생활 전반을 AI가 지원</strong>합니다.
                    </p>
                    <div className="text-center">
                      <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">"공부는 학생이, 지원은 CampusON이"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IR Pitch Version */}
            <div className="mb-12">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">②</span>
                  </div>
                  <h3 className="text-2xl font-bold text-purple-900">비즈니스 소개</h3>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  
                  {/* Vision */}
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-purple-500 rounded mr-2"></div>
                      비전
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-2">목표</h5>
                        <p className="text-sm text-gray-700">대학 교육·행정을 AI로 혁신, 글로벌 스마트 캠퍼스 표준 구축</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-2">시장성</h5>
                        <p className="text-sm text-gray-700">전 세계 약 2만 개 이상의 대학, 2억 명 이상의 대학생 대상 시장</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-2">차별화</h5>
                        <p className="text-sm text-gray-700">GPT·Gemini 같은 범용 AI와 달리, <strong>대학교 환경에 특화된 All-in-One AI 플랫폼</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded mr-2"></div>
                      서비스 구성
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                        <span className="text-2xl mr-3">📚</span>
                        <div>
                          <h5 className="font-semibold text-blue-900">학습 AI</h5>
                          <p className="text-sm text-gray-700">강의 요약, 맞춤형 학습 경로, 자동 퀴즈 생성</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-green-50 rounded-lg">
                        <span className="text-2xl mr-3">🧑‍🏫</span>
                        <div>
                          <h5 className="font-semibold text-green-900">교수 AI</h5>
                          <p className="text-sm text-gray-700">채점 보조, 강의 피드백 리포트</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                        <span className="text-2xl mr-3">🏛</span>
                        <div>
                          <h5 className="font-semibold text-yellow-900">행정 AI</h5>
                          <p className="text-sm text-gray-700">학사 일정·상담 관리, 자동 응답 챗봇</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-pink-50 rounded-lg">
                        <span className="text-2xl mr-3">👥</span>
                        <div>
                          <h5 className="font-semibold text-pink-900">커뮤니티 AI</h5>
                          <p className="text-sm text-gray-700">동아리 추천, 학생 네트워킹</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Model */}
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded mr-2"></div>
                      수익 모델
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                        <strong>B2B:</strong> 대학 단위 라이선스 계약
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                        <strong>B2C:</strong> 학생 프리미엄 구독제 ($5~15/월)
                      </div>
                      <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
                        <strong>B2G/에듀테크 제휴:</strong> 데이터 기반 맞춤형 서비스
                      </div>
                    </div>
                  </div>

                  {/* Growth Strategy */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-red-500 rounded mr-2"></div>
                      성장 전략
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</div>
                        <span>한국·미국 주요 대학 파일럿 런칭</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</div>
                        <span>글로벌 확장 → 아시아·유럽 대학 진출</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</div>
                        <span>CampusON을 <strong>대학교 전용 AI SaaS 플랫폼</strong>으로 스탠더드화</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* School Partnership Version */}
            <div className="mb-12">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">③</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-900">기관 협력 안내</h3>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-center mb-8">
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">CampusON은 대학을 위한 AI 동반자입니다.</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">🎓</span>
                        </div>
                        <h5 className="font-semibold text-blue-900 mb-2">학생에게는</h5>
                        <p className="text-gray-700"><strong>AI 학습 파트너</strong>를</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">👨‍🏫</span>
                        </div>
                        <h5 className="font-semibold text-green-900 mb-2">교수에게는</h5>
                        <p className="text-gray-700"><strong>강의 혁신 도구</strong>를</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">🏛️</span>
                        </div>
                        <h5 className="font-semibold text-purple-900 mb-2">대학에는</h5>
                        <p className="text-gray-700"><strong>스마트 캠퍼스 솔루션</strong>을 제공합니다</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-bold text-green-900 mb-4">도입 시 기대효과</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📈</span>
                        <span className="text-gray-700">학생 학습 성취도 향상</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">⏱️</span>
                        <span className="text-gray-700">교수·행정 업무 시간 절감</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🌍</span>
                        <span className="text-gray-700">글로벌 캠퍼스 경쟁력 강화</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-2">CampusON은 단순한 AI가 아니라,</h4>
                    <p className="text-lg"><strong>"학교 전체를 연결하는 AI 허브"</strong>입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DoubleJ Company Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* DoubleJ Company */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">DoubleJ</h2>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                미국에 본사를 둔 DoubleJ는 교육 기술 분야의 선도 기업으로, 
                AI와 머신러닝을 활용한 혁신적인 교육 솔루션을 개발합니다.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  AI 기반 교육 기술 개발
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  글로벌 교육 플랫폼 운영
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  혁신적인 학습 분석 시스템
                </li>
              </ul>
            </div>

            {/* CampusON Platform */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">CampusON</h2>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                경복대학교를 위해 특별히 설계된 CampusON은 PDF 문제 파싱, 
                개인화된 학습 분석 등 최첨단 기능을 제공하는 교육 플랫폼입니다.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  AI 기반 PDF 문제 파싱
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  개인화된 학습 추천
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  실시간 학습 분석
                </li>
              </ul>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Our Mission & Vision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mission</h3>
                <p className="text-gray-600">
                  AI 기술을 통해 교육의 혁신을 이끌고,<br />
                  모든 학습자에게 개인화된 교육 경험을 제공합니다.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vision</h3>
                <p className="text-gray-600">
                  글로벌 교육 기술의 선도 기업으로서<br />
                  미래 교육의 새로운 표준을 만들어갑니다.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-900 text-white rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">DoubleJ Inc.</h3>
                <p className="text-gray-300 text-sm">
                  미국 본사<br />
                  Educational Technology Solutions
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">CampusON</h3>
                <p className="text-gray-300 text-sm">
                  경복대학교 캠퍼스<br />
                  AI 교육 플랫폼 서비스
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-gray-300 text-sm">
                  기술 지원 및 문의<br />
                  24/7 고객 서비스
                </p>
              </div>
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

export default AboutPage;