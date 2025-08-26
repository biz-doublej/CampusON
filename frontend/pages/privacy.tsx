import React from 'react';
import Head from 'next/head';

const PrivacyPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>개인정보처리방침 - CampusON</title>
        <meta name="description" content="CampusON 개인정보처리방침" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
            <p className="text-gray-600">CampusON 서비스의 개인정보 처리 방침을 안내드립니다.</p>
            <div className="mt-4 text-sm text-gray-500">
              최종 업데이트: 2025년 1월 1일 | 적용일: 2025년 1월 1일
            </div>
          </div>

          {/* Privacy Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose max-w-none">
              
              {/* 개요 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">개인정보처리방침 개요</h2>
                <p className="text-gray-700 leading-relaxed">
                  DoubleJ(이하 "회사")는 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 
                  보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 
                  다음과 같이 개인정보처리방침을 수립·공개합니다.
                </p>
              </section>

              {/* 제1조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (개인정보의 처리목적)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>서비스 제공:</strong> CampusON 교육 플랫폼 서비스 제공, 개인화된 학습 분석 제공</li>
                    <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정이용 방지</li>
                    <li><strong>서비스 개선:</strong> 신규 서비스 개발 및 기존 서비스 개선, 이용자 만족도 조사</li>
                    <li><strong>학습 분석:</strong> 학습 패턴 분석, 개인화된 문제 추천, 학습 성과 분석</li>
                    <li><strong>고객 지원:</strong> 고객 문의 및 불만 처리, 공지사항 전달</li>
                  </ul>
                </div>
              </section>

              {/* 제2조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (수집하는 개인정보의 항목)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 다음과 같은 개인정보를 수집합니다:</p>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">필수 정보</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>이메일 주소 (경복대학교 계정: @kbu.ac.kr)</li>
                      <li>이름</li>
                      <li>학번 또는 교직원번호</li>
                      <li>소속 학과 또는 부서</li>
                      <li>이용자 구분 (학생/교수/직원)</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">자동 수집 정보</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>서비스 이용 기록, 접속 로그, 쿠키</li>
                      <li>접속 IP 정보, 브라우저 정보</li>
                      <li>학습 활동 데이터 (문제 풀이 기록, 학습 시간 등)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 제3조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (개인정보의 처리 및 보유기간)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 개인정보를 다음과 같이 처리하고 보유합니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>회원정보:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따른 보존의무가 있는 경우 해당 기간)</li>
                    <li><strong>학습 데이터:</strong> 서비스 이용 종료 후 1년</li>
                    <li><strong>접속 로그:</strong> 3개월</li>
                    <li><strong>민원 처리 기록:</strong> 3년</li>
                  </ul>
                  <p className="mt-4">
                    단, 관련 법령에서 정한 보존의무가 있는 경우에는 해당 법령에서 정한 기간 동안 보존합니다.
                  </p>
                </div>
              </section>

              {/* 제4조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h2>
                <p className="text-gray-700 leading-relaxed">
                  회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
                  다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4 text-gray-700">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                  <li>통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정 개인을 알아볼 수 없는 형태로 가공하여 제공하는 경우</li>
                </ul>
              </section>

              {/* 제5조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (개인정보 처리의 위탁)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>수탁업체:</strong> DoubleJ 본사 (미국)</p>
                    <p><strong>위탁업무:</strong> AI 기반 학습 분석 서비스, 클라우드 인프라 관리</p>
                    <p><strong>보유/이용기간:</strong> 위탁계약 종료 시까지</p>
                  </div>
                  <p className="mt-4">
                    위탁업무의 내용이나 수탁업체가 변경될 경우에는 지체없이 본 개인정보처리방침을 
                    통하여 공개하도록 하겠습니다.
                  </p>
                </div>
              </section>

              {/* 제6조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (이용자의 권리와 행사방법)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>개인정보 처리현황 통지 요구</li>
                    <li>개인정보 열람 요구</li>
                    <li>개인정보 정정·삭제 요구</li>
                    <li>개인정보 처리정지 요구</li>
                  </ul>
                  <p className="mt-4">
                    위 권리는 개인정보보호법 등 관련 법령에 따라 행사할 수 있으며, 
                    서비스 내 설정 메뉴 또는 고객센터를 통해 요청하실 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제7조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (개인정보의 안전성 확보조치)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>개인정보 암호화: 비밀번호, 민감정보 등의 암호화 저장</li>
                    <li>해킹 등에 대비한 기술적 대책: 보안프로그램 설치, 갱신 및 점검</li>
                    <li>개인정보에 대한 접근 제한: 개인정보를 처리하는 직원을 최소한으로 제한</li>
                    <li>접근권한의 관리: 개인정보처리시스템에 대한 접근권한의 부여, 변경, 말소 기록 및 관리</li>
                    <li>보안교육: 개인정보취급자에 대한 정기적인 보안교육 실시</li>
                  </ul>
                </div>
              </section>

              {/* 제8조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (개인정보보호책임자)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:</p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>개인정보보호책임자</strong></p>
                    <p>소속: DoubleJ CampusON 팀</p>
                    <p>연락처: campuson-privacy@doublej.com</p>
                  </div>
                </div>
              </section>

              {/* 제9조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (개인정보처리방침의 변경)</h2>
                <p className="text-gray-700 leading-relaxed">
                  이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다. 
                  법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
                  변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>
              </section>

            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">개인정보 관련 문의</h3>
            <div className="text-green-800 space-y-2">
              <p><strong>회사명:</strong> DoubleJ</p>
              <p><strong>서비스명:</strong> CampusON</p>
              <p><strong>개인정보보호책임자:</strong> CampusON 개인정보보호팀</p>
              <p><strong>연락처:</strong> campuson-privacy@doublej.com</p>
              <p><strong>시행일:</strong> 2025년 1월 1일</p>
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

export default PrivacyPage;