import React from 'react';
import Head from 'next/head';

const TermsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>이용약관 - CampusON</title>
        <meta name="description" content="CampusON 서비스 이용약관" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">이용약관</h1>
            <p className="text-gray-600">CampusON 서비스 이용에 관한 약관을 안내드립니다.</p>
            <div className="mt-4 text-sm text-gray-500">
              최종 업데이트: 2025년 1월 1일 | 적용일: 2025년 1월 1일
            </div>
          </div>

          {/* Terms Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose max-w-none">
              
              {/* 제1조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  이 약관은 DoubleJ(이하 "회사")가 제공하는 CampusON 서비스(이하 "서비스")의 
                  이용조건 및 절차, 회사와 이용자 간의 권리, 의무, 책임사항 및 기타 필요한 
                  사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              {/* 제2조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-2">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>"서비스"라 함은 회사가 제공하는 CampusON 교육 플랫폼을 의미합니다.</li>
                    <li>"이용자"라 함은 본 약관에 따라 회사가 제공하는 서비스를 받는 경복대학교 구성원을 말합니다.</li>
                    <li>"계정"이라 함은 서비스 이용을 위해 이용자가 등록한 고유한 식별정보를 의미합니다.</li>
                    <li>"콘텐츠"라 함은 서비스에서 제공되는 모든 정보, 데이터, 텍스트, 이미지 등을 의미합니다.</li>
                  </ol>
                </div>
              </section>

              {/* 제3조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (서비스의 제공)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 다음과 같은 서비스를 제공합니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI 기반 PDF 문제 파싱 및 분석 서비스</li>
                    <li>개인화된 학습 분석 및 추천 서비스</li>
                    <li>교육 콘텐츠 관리 및 검색 서비스</li>
                    <li>학습 진도 및 성과 분석 서비스</li>
                    <li>기타 회사가 정하는 서비스</li>
                  </ul>
                </div>
              </section>

              {/* 제4조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (이용자의 의무)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">이용자는 다음 행위를 하여서는 안 됩니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>타인의 정보를 도용하여 서비스를 이용하는 행위</li>
                    <li>서비스의 안정적 운영을 방해하는 행위</li>
                    <li>다른 이용자의 개인정보를 수집, 저장, 공개하는 행위</li>
                    <li>저작권 등 타인의 권리를 침해하는 콘텐츠를 업로드하는 행위</li>
                    <li>서비스를 상업적 목적으로 무단 이용하는 행위</li>
                  </ul>
                </div>
              </section>

              {/* 제5조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (개인정보 보호)</h2>
                <p className="text-gray-700 leading-relaxed">
                  회사는 이용자의 개인정보를 소중히 여기며, 개인정보보호법 등 관련 법령에 따라 
                  이용자의 개인정보를 보호합니다. 개인정보의 수집, 이용, 제공, 파기 등에 관한 
                  구체적인 사항은 별도의 개인정보처리방침에서 정합니다.
                </p>
              </section>

              {/* 제6조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (지적재산권)</h2>
                <p className="text-gray-700 leading-relaxed">
                  서비스에 포함된 모든 지적재산권은 회사에 귀속됩니다. 이용자는 서비스를 이용함으로써 
                  얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 
                  영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
                </p>
              </section>

              {/* 제7조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (서비스 이용의 제한)</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>본 약관을 위반한 경우</li>
                    <li>서비스의 정상적인 운영을 방해한 경우</li>
                    <li>관련 법령을 위반한 경우</li>
                    <li>기타 회사가 정한 정책에 위반한 경우</li>
                  </ul>
                </div>
              </section>

              {/* 제8조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (면책조항)</h2>
                <p className="text-gray-700 leading-relaxed">
                  회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지, 정전 등 불가항력으로 인한 
                  서비스 중단에 대해서는 책임을 지지 않습니다. 또한 이용자의 귀책사유로 인한 
                  서비스 이용 장애에 대해서는 책임을 지지 않습니다.
                </p>
              </section>

              {/* 제9조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (약관의 개정)</h2>
                <p className="text-gray-700 leading-relaxed">
                  회사는 필요한 경우 이 약관을 개정할 수 있으며, 개정된 약관은 서비스 화면에 
                  공지함으로써 효력을 발생합니다. 이용자가 개정된 약관에 동의하지 않는 경우 
                  서비스 이용을 중단할 수 있습니다.
                </p>
              </section>

              {/* 제10조 */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (준거법 및 관할법원)</h2>
                <p className="text-gray-700 leading-relaxed">
                  이 약관은 대한민국 법을 준거법으로 하며, 서비스 이용과 관련하여 발생한 분쟁에 
                  대해서는 관련 법령에 따른 법원을 관할법원으로 합니다.
                </p>
              </section>

            </div>
          </div>

          {/* Company Info */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">서비스 제공자 정보</h3>
            <div className="text-blue-800 space-y-2">
              <p><strong>회사명:</strong> DoubleJ</p>
              <p><strong>서비스명:</strong> CampusON</p>
              <p><strong>대상 기관:</strong> 경복대학교</p>
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

export default TermsPage;