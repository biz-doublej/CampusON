import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  GraduationCap,
  TrendingUp,
  CheckCircle,
  X,
  Lightbulb,
  BookOpen,
  BarChart3,
  Star,
  ArrowLeft,
  Award,
  Target
} from 'lucide-react';

const UniversalDiagnosticTestResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `http://localhost:8000/api/universal-diagnosis/result/${resultId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setResultData(data);
        } else {
          throw new Error('결과를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('결과 로드 실패:', error);
        alert('결과를 불러올 수 없습니다.');
        navigate('/student/universal-diagnosis');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResult();
    }
  }, [resultId, navigate]);

  // 등급별 색상
  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'bg-green-500',
      'A': 'bg-green-400', 
      'B+': 'bg-lime-500',
      'B': 'bg-yellow-400',
      'C+': 'bg-orange-500',
      'C': 'bg-red-500',
      'D+': 'bg-red-600',
      'D': 'bg-red-700',
      'F': 'bg-red-800'
    };
    return gradeColors[grade] || 'bg-gray-500';
  };

  // 퍼센트를 바 차트로 표시
  const ScoreBar = ({ label, score, maxScore, color = 'bg-blue-500' }) => {
    const percentage = Math.round((score/maxScore) * 100);
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">
            {score}/{maxScore} ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">결과를 찾을 수 없습니다.</h2>
        <button 
          onClick={() => navigate('/student/universal-diagnosis')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          진단테스트로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/student/universal-diagnosis')}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>진단테스트로 돌아가기</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-6 mt-6">
            <BarChart3 className="h-12 w-12 text-white/90" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {resultData.department_name} 진단테스트 결과
              </h1>
              <p className="text-xl text-white/90 mb-1">
                총점: {resultData.total_score}점 / {resultData.max_score}점
              </p>
              <p className="text-white/80">
                응시일: {new Date(resultData.completed_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="text-center">
              <div className={`${getGradeColor(resultData.grade)} text-white rounded-lg px-6 py-4`}>
                <div className="text-3xl font-bold">{resultData.grade}</div>
                <div className="text-sm opacity-90">등급</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐트 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 점수 분석 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">점수 분석</h2>
            </div>
            
            <ScoreBar 
              label="전체 점수"
              score={resultData.total_score}
              maxScore={resultData.max_score}
              color="bg-indigo-500"
            />

            {resultData.category_scores && Object.entries(resultData.category_scores).map(([category, score]) => (
              <ScoreBar 
                key={category}
                label={category}
                score={score.score}
                maxScore={score.max_score}
                color="bg-green-500"
              />
            ))}

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700 font-medium">
                상위 {Math.round(resultData.percentile || 0)}% 성과
              </p>
            </div>
          </div>

          {/* 상세 분석 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">상세 분석</h2>
            </div>

            {/* 강점 영역 */}
            {resultData.strengths && resultData.strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="flex items-center space-x-2 text-lg font-semibold text-green-700 mb-3">
                  <CheckCircle className="h-5 w-5" />
                  <span>강점 영역</span>
                </h3>
                <div className="space-y-2">
                  {resultData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 개선 영역 */}
            {resultData.weaknesses && resultData.weaknesses.length > 0 && (
              <div className="mb-6">
                <h3 className="flex items-center space-x-2 text-lg font-semibold text-orange-700 mb-3">
                  <X className="h-5 w-5" />
                  <span>개선 영역</span>
                </h3>
                <div className="space-y-2">
                  {resultData.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI 분석 및 추천 */}
        {resultData.ai_analysis && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">AI 분석 및 학습 추천</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI 분석 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">종합 분석</h3>
                <div className="prose prose-sm text-gray-600">
                  <p>{resultData.ai_analysis.summary || '분석 중입니다...'}</p>
                </div>
              </div>

              {/* 학습 추천 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">추천 학습 방향</h3>
                {resultData.ai_analysis.recommendations && (
                  <div className="space-y-3">
                    {resultData.ai_analysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <BookOpen className="h-4 w-4 text-indigo-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 문제별 정답/오답 분석 */}
        {resultData.question_results && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">문제별 분석</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resultData.question_results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.is_correct 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">문제 {index + 1}</span>
                    {result.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>정답: {result.correct_answer}</p>
                    <p>선택: {result.user_answer}</p>
                    {result.category && (
                      <p className="mt-1 text-xs text-gray-500">영역: {result.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalDiagnosticTestResult; 