import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import FileUploader from '../../src/components/FileUploader';
import ParsedResultViewer from '../../src/components/ParsedResultViewer';
import aiService from '../../src/services/aiService';
import questionService from '../../src/services/questionService';
import quizService from '../../src/services/quizService';
import { parserAPI } from '../../src/services/api';
import type { User } from '../../src/types';
import type { ParsedResult } from '../../src/services/parserService';
import axios from 'axios';
import { getApiUrl } from '../../src/utils/config';

const ProfessorUploadPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [isParsingComplete, setIsParsingComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [guidelineOpen] = useState(true);
  const [status, setStatus] = useState<{ parser: { ok: boolean; url: string; version?: string }; node: { ok: boolean; url: string } }>({
    parser: { ok: false, url: process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001' },
    node: { ok: false, url: getApiUrl() },
  });

  React.useEffect(() => {
    setMounted(true);
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // 간단 기술 상태 체크
  useEffect(() => {
    const checkStatus = async () => {
      const parserUrl = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';
      const nodeUrl = getApiUrl();
      try {
        const ph = await axios.get(`${parserUrl}/api/health`, { timeout: 3000 });
        setStatus((s) => ({ ...s, parser: { ok: true, url: parserUrl, version: ph.data?.version } }));
      } catch {
        setStatus((s) => ({ ...s, parser: { ok: false, url: parserUrl } }));
      }
      try {
        const nh = await axios.get(`${nodeUrl}/health`, { timeout: 3000 });
        if (nh.status === 200) setStatus((s) => ({ ...s, node: { ok: true, url: nodeUrl } }));
      } catch {
        setStatus((s) => ({ ...s, node: { ok: false, url: nodeUrl } }));
      }
    };
    checkStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleParseComplete = (result: ParsedResult) => {
    setParsedResult(result);
    setIsParsingComplete(true);
  };

  const handleStartNew = () => {
    setParsedResult(null);
    setIsParsingComplete(false);
  };

  const handleGoBack = () => {
    router.push('/professor');
  };

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <div className="min-h-screen bg-gray-50" style={{ userSelect: 'none' }}>
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={handleGoBack}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="교수 대시보드로 돌아가기"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">PDF 업로드 & 파싱</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-gray-700">안녕하세요, {mounted ? (user?.name || user?.user_id) : ''}님</span>
                  <p className="text-sm text-gray-500">교수</p>
                </div>
                
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {mounted && user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt="Profile"
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {mounted ? (user?.name?.charAt(0) || '교') : '교'}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 간편 안내 + 기술 상태 */}
        <div className="max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-2">간편 안내</h2>
              <p className="text-sm text-gray-600">PDF를 업로드하면 자동으로 문항을 추출합니다. 결과를 검토한 뒤 바로 퀴즈를 생성할 수 있습니다.</p>
              <ul className="mt-3 text-sm text-gray-700 list-disc list-inside">
                <li>국가고시/모의고사 PDF 권장</li>
                <li>표/그림이 많은 경우 설명이 간략화될 수 있음</li>
                <li>필요 시 AI 보정으로 품질 개선 가능</li>
              </ul>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">기술 상태</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Parser API</span>
                  <span className={status.parser.ok ? 'text-green-600' : 'text-red-600'}>{status.parser.ok ? '연결됨' : '연결 안 됨'}</span>
                </div>
                <div className="text-gray-500 break-all">{status.parser.url}{status.parser.version ? ` · v${status.parser.version}` : ''}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-700">Node API</span>
                  <span className={status.node.ok ? 'text-green-600' : 'text-red-600'}>{status.node.ok ? '연결됨' : '연결 안 됨'}</span>
                </div>
                <div className="text-gray-500 break-all">{status.node.url}</div>
                <div className="mt-3 text-gray-600">
                  <div>적용 기술</div>
                  <ul className="list-disc list-inside">
                    <li>PDF 파싱: Poppler 기반 + 규칙/휴리스틱</li>
                    <li>AI 보정: OpenAI/Gemini (선택)</li>
                    <li>RAG/FAISS: 선택적 구성</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {!isParsingComplete ? (
              // 파일 업로드 단계
              <div>
                <div className="mb-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      문제 PDF 업로드
                    </h2>
                    <p className="text-gray-600 mb-8">
                      시험 문제가 포함된 PDF 파일을 업로드하여 자동으로 문제를 추출하세요.
                      <br />
                      파싱된 결과는 검토 후 문제 데이터베이스에 저장할 수 있습니다.
                    </p>
                  </div>

                  {/* 업로드 가이드라인 */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">업로드 가이드라인</h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-medium text-blue-900 mb-4">업로드 가이드라인</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">지원 형식</h4>
                        <ul className="text-blue-700 text-sm space-y-1">
                          <li>• PDF 파일만 지원</li>
                          <li>• 최대 파일 크기: 10MB</li>
                          <li>• 고품질 스캔 권장</li>
                          <li>• 모든 문제 처리 가능</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">문제 형식</h4>
                        <ul className="text-blue-700 text-sm space-y-1">
                          <li>• 번호. 문제내용 형태</li>
                          <li>• 박스 또는 들여쓰기로 추가설명</li>
                          <li>• 1번~5번 또는 ①②③④⑤ 선택지</li>
                          <li>• 명확한 문제 번호 표기</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">최적화 팁</h4>
                        <ul className="text-blue-700 text-sm space-y-1">
                          <li>• 선명한 글씨와 레이아웃</li>
                          <li>• 박스 경계선 명확하게</li>
                          <li>• 선택지 간 충분한 간격</li>
                          <li>• 한 페이지에 너무 많은 문제 지양</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* 문제 형식 예시 */}
                    <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-3">예상 문제 형식</h4>
                      <div className="bg-gray-50 p-4 rounded border text-sm font-mono">
                        <div className="text-gray-800">
                          <div className="mb-2"><strong>1. 다음 중 물리치료의 주요 목적으로 가장 적절한 것은?</strong></div>
                          <div className="border border-gray-300 p-2 mb-2 bg-blue-50">
                            <div className="text-xs text-gray-600 mb-1">┌──────────────────────────────────────────────────────────┐</div>
                            <div className="text-xs">│ 다음 조건을 참고하여 문제를 해결하시오:                           │</div>
                            <div className="text-xs">│ - 환자는 65세 여성으로 무릇 통증 호소                              │</div>
                            <div className="text-xs">│ - 보행 시 어려움과 범위 제한                                     │</div>
                            <div className="text-xs text-gray-600">└──────────────────────────────────────────────────────────┘</div>
                          </div>
                          <div className="space-y-1">
                            <div>1번 통증 완화</div>
                            <div>2번 근력 강화 및 기능 회복</div>
                            <div>3번 진단 및 치료 계획 수립</div>
                            <div>4번 수술적 치료</div>
                            <div>5번 약물 치료</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 파일 업로더 컴포넌트 */}
                <FileUploader onParseComplete={handleParseComplete} />
              </div>
            ) : (
              // 파싱 결과 표시 단계
              <div>
                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        파싱 결과
                      </h2>
                      <p className="text-gray-600">
                        파싱된 결과를 검토하고 필요시 수정하세요.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleStartNew}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        새 파일 업로드
                      </button>
                      <button
                        onClick={async () => {
                          if (!parsedResult) return;
                          const normalized = (parsedResult.questions || []).map(q => ({
                            number: q.number,
                            content: q.content,
                            options: q.options,
                            description: q.description,
                            answer: q.answer,
                            subject: parsedResult.metadata?.subject,
                            year: parsedResult.metadata?.year,
                          }));
                          try {
                            const saved = await questionService.bulkSave(normalized);
                            await aiService.ingest(normalized);
                            alert(`저장 완료: ${saved.count}개 질문`);
                          } catch (e) {
                            console.error(e);
                            alert('저장 중 오류가 발생했습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        결과 저장
                      </button>
                      <button
                        onClick={async () => {
                          if (!parsedResult) return;
                          const normalized = (parsedResult.questions || []).map(q => ({
                            number: q.number,
                            content: q.content,
                            options: q.options,
                            description: q.description,
                            answer: q.answer,
                            subject: parsedResult.metadata?.subject,
                            year: parsedResult.metadata?.year,
                          }));
                          try {
                            const saved = await questionService.bulkSave(normalized);
                            const ids = saved.question_ids || [];
                            if (ids.length === 0) {
                              alert('저장된 질문이 없습니다.');
                              return;
                            }
                            const res = await quizService.create(`${parsedResult.metadata?.title || '퀴즈'}`, ids.map((id: number) => ({ id })));
                            const qid = res?.quiz?.id;
                            if (qid) {
                              alert(`퀴즈 생성 완료 (ID: ${qid})`);
                              router.push(`/student/quiz/${qid}`);
                            } else {
                              alert('퀴즈 생성 실패');
                            }
                          } catch (e) {
                            console.error(e);
                            alert('저장/퀴즈 생성 중 오류가 발생했습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        저장 후 퀴즈 생성
                      </button>
                      <button
                        onClick={async () => {
                          if (!parsedResult) return;
                          try {
                            const payload = {
                              metadata: parsedResult.metadata,
                              questions: parsedResult.questions || [],
                            };
                            const response = await parserAPI.importParsedQuestions(payload);
                            if (response.success) {
                              const assignmentId = response.data?.assignment?.id;
                              alert(`문제 저장 완료 (과제 ID: ${assignmentId || '신규'})`);
                              if (assignmentId) {
                                router.push(`/professor/assignments/${assignmentId}`);
                              }
                            } else {
                              alert(response.message || '문제 저장 중 오류가 발생했습니다.');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('문제 저장 중 오류가 발생했습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        문제 저장
                      </button>
                    </div>
                  </div>
                </div>

                {/* 파싱 결과 뷰어 컴포넌트 */}
                {parsedResult && (
                  <ParsedResultViewer
                    result={parsedResult}
                    onUpdate={(next) => setParsedResult(next)}
                  />
                )}
                {parsedResult && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">문항 수</div>
                      <div className="text-2xl font-semibold">{parsedResult.questions?.length ?? 0}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">제목</div>
                      <div className="text-base font-medium truncate">{parsedResult.metadata?.title || '제목 없음'}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm text-gray-500">과목/연도</div>
                      <div className="text-base font-medium">{parsedResult.metadata?.subject || '-'} / {parsedResult.metadata?.year || '-'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 도움말 섹션 */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">도움말</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">1. 업로드</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    PDF 파일을 드래그하거나 클릭하여 선택하세요.
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">2. 검토</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    파싱된 결과를 확인하고 필요시 수정하세요.
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">3. 저장</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    검토 완료된 문제를 데이터베이스에 저장하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorUploadPage;
