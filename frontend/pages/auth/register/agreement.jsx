import React, { useState } from 'react';
import { useRouter } from 'next/router';
import useResponsive from '../../../src/hooks/useResponsive';

const Agreement = () => {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false
  });

  const handleAgreementChange = (type) => {
    setAgreements(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleAllAgree = () => {
    const allChecked = Object.values(agreements).every(value => value);
    const newValue = !allChecked;
    setAgreements({
      terms: newValue,
      privacy: newValue,
      marketing: newValue
    });
  };

  const canProceed = agreements.terms && agreements.privacy;

  const handleNext = () => {
    if (canProceed) {
      router.push('/auth/register/dept');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className={`w-full max-w-md bg-white rounded-xl shadow-lg p-8 ${isMobile ? 'mx-4' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관 동의</h1>
          <p className="text-gray-600">서비스 이용을 위해 약관에 동의해주세요</p>
        </div>

        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Object.values(agreements).every(value => value)}
                onChange={handleAllAgree}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-lg font-medium text-gray-900">전체 동의</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.terms}
                onChange={() => handleAgreementChange('terms')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-900">
                <span className="text-red-500">[필수]</span> 이용약관 동의
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.privacy}
                onChange={() => handleAgreementChange('privacy')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-900">
                <span className="text-red-500">[필수]</span> 개인정보 처리방침 동의
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.marketing}
                onChange={() => handleAgreementChange('marketing')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-900">
                <span className="text-gray-500">[선택]</span> 마케팅 정보 수신 동의
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-3 px-4 rounded-md font-medium transition duration-200 ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            다음 단계
          </button>

          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Agreement; 