import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Timer, 
  CheckCircle, 
  AlertTriangle, 
  GraduationCap,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const UniversalDiagnosticTestRunner = () => {
  const { department } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  // 테스트 데이터 로드
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `http://localhost:8000/api/universal-diagnosis/department/${department}/start-test`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTestData(data);
          setTimeRemaining(data.test_info?.time_limit * 60 || 3600); // 기본 60분
          setTestStarted(true);
        } else {
          throw new Error('테스트 데이터를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('테스트 로드 실패:', error);
        alert('테스트를 시작할 수 없습니다. 다시 시도해주세요.');
        navigate('/student/universal-diagnosis');
      }
    };

    if (department) {
      fetchTestData();
    }
  }, [department, navigate]);

  // 타이머
  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining]);

  // 숫자키 선택 기능
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (testData && currentQuestionIndex < testData.questions.length) {
        const key = event.key;
        const currentQuestion = testData.questions[currentQuestionIndex];
        
        // 1-5 숫자키로 답안 선택
        if (['1', '2', '3', '4', '5'].includes(key) && currentQuestion.options[key]) {
          handleAnswerChange(currentQuestion.id, key);
        }
        
        // 엔터키로 다음 문제
        if (key === 'Enter' && !isLastQuestion) {
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [testData, currentQuestionIndex, answers]);

  // 답안 선택
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // 다음 문제
  const handleNextQuestion = () => {
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // 이전 문제
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // 테스트 제출
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8000/api/universal-diagnosis/department/${department}/submit-test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test_session_id: testData.test_session_id,
            answers: answers
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        navigate(`/student/universal-diagnosis/result/${result.result_id}`);
      } else {
        throw new Error('답안 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('제출 실패:', error);
      alert('답안 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const getProgress = () => {
    if (!testData) return 0;
    return ((currentQuestionIndex + 1) / testData.questions.length) * 100;
  };

  // 답안 완성도 계산
  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (!testData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">테스트 로딩 중...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === testData.questions.length - 1;
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {testData.test_info?.department_name} 진단테스트
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* 진행률 */}
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {testData.questions.length}
                </span>
              </div>
              
              {/* 답안 완성도 */}
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {getAnsweredCount()} / {testData.questions.length} 완료
                </span>
              </div>
              
              {/* 타이머 */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono text-sm font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐트 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* 문제 */}
          <div className="mb-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="bg-indigo-100 text-indigo-600 rounded-full px-3 py-1 text-sm font-semibold">
                문제 {currentQuestionIndex + 1}
              </div>
              {currentQuestion.difficulty && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentQuestion.difficulty === 'hard' 
                    ? 'bg-red-100 text-red-600' 
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {currentQuestion.difficulty === 'hard' ? '어려움' : 
                   currentQuestion.difficulty === 'medium' ? '보통' : '쉬움'}
                </span>
              )}
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* 선택지 */}
          <div className="space-y-3 mb-8">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <label 
                key={key}
                className={`block p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  currentAnswer === key 
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name={`question_${currentQuestion.id}`}
                    value={key}
                    checked={currentAnswer === key}
                    onChange={() => handleAnswerChange(currentQuestion.id, key)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">{key}.</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* 키보드 힌트 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600">
              💡 <strong>키보드 단축키:</strong> 숫자 키(1-5)로 답안 선택, Enter로 다음 문제
            </p>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>이전 문제</span>
            </button>

            <div className="flex items-center space-x-4">
              {!isLastQuestion ? (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <span>다음 문제</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>제출 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>테스트 완료</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단 경고 */}
        {timeRemaining < 300 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-600">
                <strong>시간이 얼마 남지 않았습니다!</strong> 
                남은 시간: <span className="font-mono">{formatTime(timeRemaining)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalDiagnosticTestRunner; 