import React, { useState } from 'react';
import { ParsedQuestion, ParsedResult } from '../services/parserService';

interface ParsedResultViewerProps {
  result: ParsedResult;
  onUpdate?: (next: ParsedResult) => void;
}

const ParsedResultViewer: React.FC<ParsedResultViewerProps> = ({ result, onUpdate }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const { questions, metadata } = result;
  const currentQuestion = questions[currentQuestionIndex];

  const updateQuestion = (index: number, patch: Partial<ParsedQuestion>) => {
    const nextQuestions = questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    onUpdate?.({ ...result, questions: nextQuestions });
  };

  // 다음 문제로 이동
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // 이전 문제로 이동
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // 특정 문제로 이동
  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // 정답 표시 토글
  const toggleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  // JSON 다운로드
  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `parsed_result_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 메인 결과 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* 메타데이터 및 컨트롤 헤더 */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-6 border-b border-gray-200">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 rounded-lg w-12 h-12 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {metadata?.title || '파싱된 문제'}
                  </h2>
                  <p className="text-gray-600 mt-1">총 {questions.length}개 문제</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {metadata?.subject && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {metadata.subject}
                  </span>
                )}
                {metadata?.year && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {metadata.year}년도
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={toggleShowAnswers}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAnswers 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {showAnswers ? '정답 숨기기' : '정답 보기'}
              </button>
              <button
                onClick={handleDownloadJson}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                JSON 다운로드
              </button>
            </div>
          </div>

          {/* 문제 내비게이션 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">문제 선택</h3>
            <div className="flex overflow-x-auto pb-2 gap-2">
              {questions.map((question, index) => (
                <button
                  key={`${question?.number ?? 'n'}-${index}`}
                  onClick={() => handleQuestionSelect(index)}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    index === currentQuestionIndex 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {question.number}
                </button>
              ))}
            </div>
          </div>

          {/* 현재 문제 표시 */}
          {currentQuestion && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium mr-3">
                    {currentQuestion.number}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900">문제 {currentQuestion.number}</h3>
                </div>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              
              <div className="mb-6">
                <div className="bg-white rounded-lg p-4 mb-4 border">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">문제</h4>
                  <p className="text-gray-900 leading-relaxed">{currentQuestion.content}</p>
                </div>
                
                {/* 박스 내용 (추가설명/조건/지문) 표시 */}
                {currentQuestion.description && currentQuestion.description.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-700 mb-3">추가설명</h4>
                    <div className="space-y-1">
                      {currentQuestion.description.map((desc, index) => (
                        <p key={index} className="text-blue-900 leading-relaxed text-sm">
                          {desc}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">선택지</h4>
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isAnswer = currentQuestion.answer === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => updateQuestion(currentQuestionIndex, { answer: key })}
                        className={`w-full text-left p-4 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-green-200 ${
                          isAnswer
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-green-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium mr-3 ${
                              isAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 정답 및 해설 */}
              {showAnswers && currentQuestion.answer && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-blue-900">정답: {currentQuestion.answer}</span>
                  </div>
                  {currentQuestion.explanation && (
                    <div className="border-t border-blue-200 pt-3 mt-3">
                      <h5 className="font-medium text-blue-900 mb-2">해설</h5>
                      <p className="text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 이전/다음 버튼 */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    currentQuestionIndex === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  이전
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    currentQuestionIndex === questions.length - 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  다음
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParsedResultViewer;
