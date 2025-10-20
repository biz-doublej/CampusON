import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import ChatWidget from '../../src/components/chat/ChatWidget';
import { assignmentsAPI } from '../../src/services/api';
import type {
  AssignmentSummary,
  AssignmentType,
  SubmissionMethod,
  AssignmentResource,
  AssignmentConfig,
} from '../../src/types';

const TYPE_LIBRARY: Record<AssignmentType, {
  label: string;
  description: string;
  color: string;
  defaultSubmission: SubmissionMethod;
  presetDeliverables: string[];
  presetChecklist: string[];
  defaultTags: string[];
  suggestedInstructions: string;
}> = {
  UPLOAD: {
    label: '자료 업로드',
    description: '파일이나 리포트를 업로드 받는 일반 과제',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    defaultSubmission: 'file',
    presetDeliverables: ['PDF 리포트 제출', '출처 및 참고 문헌 기재'],
    presetChecklist: ['파일 명명 규칙 확인', '표절 검사 보고서 첨부'],
    defaultTags: ['리포트', '개인']
    ,
    suggestedInstructions: '과제 설명과 제출 형식을 명확히 적어주세요.'
  },
  QUIZ: {
    label: '퀴즈/평가',
    description: '객관식·주관식 평가를 위한 퀴즈형 과제',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    defaultSubmission: 'quiz',
    presetDeliverables: ['AI 문제 생성 메뉴에서 퀴즈 작성', '정답 및 해설 검토'],
    presetChecklist: ['문항 난이도 균형 확인', '응시 시간 설정'],
    defaultTags: ['퀴즈', '평가'],
    suggestedInstructions: '퀴즈 범위와 응시 시간을 안내해주세요.'
  },
  PROJECT: {
    label: '팀 프로젝트',
    description: '팀 기반 장기 프로젝트나 캡스톤 설계',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    defaultSubmission: 'link',
    presetDeliverables: ['프로젝트 계획서', '최종 발표 자료', '팀 회의록'],
    presetChecklist: ['중간 점검 일정 안내', '팀별 역할 분담 확인'],
    defaultTags: ['프로젝트', '팀'],
    suggestedInstructions: '프로젝트 목표와 평가 기준, 팀 협업 가이드라인을 안내해주세요.'
  },
  PRACTICAL: {
    label: '실습/시뮬레이션',
    description: '실습실 활동이나 시뮬레이션 학습 과제',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    defaultSubmission: 'simulation',
    presetDeliverables: ['실습 체크리스트 제출', '실습 소감문 작성'],
    presetChecklist: ['안전 수칙 교육 확인', '장비 점검'],
    defaultTags: ['실습', '체험'],
    suggestedInstructions: '실습 목표, 준비물, 안전 수칙을 구체적으로 안내해주세요.'
  },
  PRESENTATION: {
    label: '발표/세미나',
    description: '발표 자료 제출 및 발표 일정 관리',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    defaultSubmission: 'presentation',
    presetDeliverables: ['발표 자료(PPT)', '발표 스크립트'],
    presetChecklist: ['발표 시간 준수', '질문 리스트 준비'],
    defaultTags: ['발표', '세미나'],
    suggestedInstructions: '발표 형식, 시간, 평가 기준을 안내해주세요.'
  },
  REFLECTION: {
    label: '학습 저널',
    description: '성찰 에세이, 저널 등 기록형 과제',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    defaultSubmission: 'portfolio',
    presetDeliverables: ['학습 내용 요약', '개인 성찰 문항 답변'],
    presetChecklist: ['개인 경험과 사례 언급', '추가 학습 계획 작성'],
    defaultTags: ['에세이', '성찰'],
    suggestedInstructions: '성찰 포인트와 분량, 평가 요소를 안내해주세요.'
  },
  CLINICAL: {
    label: '임상 기록',
    description: '임상·현장 실습 기록 및 보고서 작성',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    defaultSubmission: 'in_person',
    presetDeliverables: ['임상 케이스 기록지', '지도교수 피드백'],
    presetChecklist: ['환자 정보 비식별화', '윤리 준수 서약'],
    defaultTags: ['임상', '현장실습'],
    suggestedInstructions: '보고서 양식과 개인정보 보호 지침을 안내해주세요.'
  },
};

const SUBMISSION_LABELS: Record<SubmissionMethod, string> = {
  file: '파일 업로드',
  link: '링크 제출',
  quiz: '퀴즈(온라인)',
  presentation: '발표 진행',
  in_person: '대면 제출',
  lab_report: '실험 보고서 업로드',
  portfolio: '포트폴리오 공유',
  simulation: '시뮬레이션 기록',
};

const DEFAULT_RESOURCE: AssignmentResource = { title: '', url: '', type: 'link' };

const buildConfig = (params: {
  instructions: string;
  submissionMethod: SubmissionMethod;
  deliverables: string[];
  checklist: string[];
  allowLate: boolean;
  latePolicy: string;
  groupEnabled: boolean;
  groupMin: number | '';
  groupMax: number | '';
  maxScore: number | '';
  rubric: string;
  evaluationCriteria: string[];
  notifyBeforeDays: number | '';
  additionalNotes: string;
}): AssignmentConfig | null => {
  const {
    instructions,
    submissionMethod,
    deliverables,
    checklist,
    allowLate,
    latePolicy,
    groupEnabled,
    groupMin,
    groupMax,
    maxScore,
    rubric,
    evaluationCriteria,
    notifyBeforeDays,
    additionalNotes,
  } = params;

  const payload: AssignmentConfig = {
    submissionMethod,
  };

  if (instructions.trim()) payload.instructions = instructions.trim();
  if (deliverables.length) payload.deliverables = deliverables;
  if (checklist.length) payload.checklist = checklist;
  if (allowLate) {
    payload.allowLate = true;
    if (latePolicy.trim()) payload.latePolicy = latePolicy.trim();
  }
  if (groupEnabled) {
    payload.groupWork = {
      enabled: true,
      minSize: typeof groupMin === 'number' ? groupMin : undefined,
      maxSize: typeof groupMax === 'number' ? groupMax : undefined,
    };
  }
  const grading: AssignmentConfig['grading'] = {};
  if (typeof maxScore === 'number') grading.maxScore = maxScore;
  if (rubric.trim()) grading.rubric = rubric.trim();
  if (grading.maxScore !== undefined || grading.rubric) payload.grading = grading;
  if (evaluationCriteria.length) payload.evaluationCriteria = evaluationCriteria;
  if (typeof notifyBeforeDays === 'number') payload.notifyBeforeDays = notifyBeforeDays;
  if (additionalNotes.trim()) payload.additionalNotes = additionalNotes.trim();

  return Object.keys(payload).length > 1 || payload.instructions || payload.deliverables || payload.checklist
    ? payload
    : null;
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'published':
      return '공개 중';
    case 'closed':
      return '마감';
    case 'draft':
    default:
      return '초안';
  }
};

const getTypeMeta = (type: AssignmentType) => TYPE_LIBRARY[type] ?? TYPE_LIBRARY.UPLOAD;

export default function ProfessorAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('UPLOAD');
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(TYPE_LIBRARY.UPLOAD.defaultSubmission);
  const [instructions, setInstructions] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deliverableDraft, setDeliverableDraft] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [allowLate, setAllowLate] = useState(false);
  const [latePolicy, setLatePolicy] = useState('');
  const [groupEnabled, setGroupEnabled] = useState(false);
  const [groupMin, setGroupMin] = useState<number | ''>(2);
  const [groupMax, setGroupMax] = useState<number | ''>(4);
  const [maxScore, setMaxScore] = useState<number | ''>(100);
  const [rubric, setRubric] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>([]);
  const [criteriaDraft, setCriteriaDraft] = useState('');
  const [notifyBeforeDays, setNotifyBeforeDays] = useState<number | ''>(2);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [resources, setResources] = useState<AssignmentResource[]>([]);
  const [resourceDraft, setResourceDraft] = useState<AssignmentResource>(DEFAULT_RESOURCE);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [assignments]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsAPI.list();
      if (res.success && Array.isArray(res.data)) {
        setAssignments(res.data as AssignmentSummary[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const applyPresetIfEmpty = (type: AssignmentType) => {
    const meta = getTypeMeta(type);
    if (!instructions.trim()) setInstructions(meta.suggestedInstructions);
    if (deliverables.length === 0) setDeliverables(meta.presetDeliverables);
    if (checklist.length === 0) setChecklist(meta.presetChecklist);
    if (tags.length === 0) setTags(meta.defaultTags);
    setSubmissionMethod(meta.defaultSubmission);
  };

  const handleTypeChange = (type: AssignmentType) => {
    setAssignmentType(type);
    applyPresetIfEmpty(type);
  };

  useEffect(() => {
    applyPresetIfEmpty(assignmentType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddDeliverable = () => {
    const value = deliverableDraft.trim();
    if (!value) return;
    setDeliverables((prev) => [...new Set([...prev, value])]);
    setDeliverableDraft('');
  };

  const handleRemoveDeliverable = (value: string) => {
    setDeliverables((prev) => prev.filter((item) => item !== value));
  };

  const handleAddChecklist = () => {
    const value = checklistDraft.trim();
    if (!value) return;
    setChecklist((prev) => [...prev, value]);
    setChecklistDraft('');
  };

  const handleRemoveChecklist = (value: string) => {
    setChecklist((prev) => prev.filter((item) => item !== value));
  };

  const handleAddCriteria = () => {
    const value = criteriaDraft.trim();
    if (!value) return;
    setEvaluationCriteria((prev) => [...prev, value]);
    setCriteriaDraft('');
  };

  const handleRemoveCriteria = (value: string) => {
    setEvaluationCriteria((prev) => prev.filter((item) => item !== value));
  };

  const handleTagInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' ) {
      event.preventDefault();
      const tag = tagsInput.trim();
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleAddResource = () => {
    const title = resourceDraft.title.trim();
    const url = resourceDraft.url.trim();
    if (!title || !url) return;
    setResources((prev) => [...prev, { ...resourceDraft, title, url }]);
    setResourceDraft(DEFAULT_RESOURCE);
  };

  const handleRemoveResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setAssignmentType('UPLOAD');
    setSubmissionMethod(TYPE_LIBRARY.UPLOAD.defaultSubmission);
    setInstructions('');
    setDeliverables([]);
    setChecklist([]);
    setAllowLate(false);
    setLatePolicy('');
    setGroupEnabled(false);
    setGroupMin(2);
    setGroupMax(4);
    setMaxScore(100);
    setRubric('');
    setEvaluationCriteria([]);
    setNotifyBeforeDays(2);
    setAdditionalNotes('');
    setTags([]);
    setTagsInput('');
    setResources([]);
    setResourceDraft(DEFAULT_RESOURCE);
  };

  const createAssignment = async () => {
    if (!title.trim() || !description.trim() || !dueDate) return;
    try {
      setCreating(true);

      const config = buildConfig({
        instructions,
        submissionMethod,
        deliverables,
        checklist,
        allowLate,
        latePolicy,
        groupEnabled,
        groupMin,
        groupMax,
        maxScore,
        rubric,
        evaluationCriteria,
        notifyBeforeDays,
        additionalNotes,
      });

      const payload = {
        title: title.trim(),
        description: description.trim(),
        due_date: new Date(dueDate).toISOString(),
        status: 'draft' as const,
        type: assignmentType,
        config,
        tags,
        resources,
      };

      const res = await assignmentsAPI.create(payload);
      if (res.success && res.data) {
        resetForm();
        await loadAssignments();
      } else {
        alert(res.message || '과제 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: 'draft' | 'published' | 'closed') => {
    try {
      const res = await assignmentsAPI.updateStatus(id, status);
      if (!res.success) {
        throw new Error(res.message || '상태 변경 실패');
      }
      await loadAssignments();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || '상태 변경 중 오류가 발생했습니다.';
      alert(message);
    }
  };

  const renderTags = (values: string[] | undefined) => {
    if (!values || values.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 border border-gray-200">
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderDeliverablesSummary = (config: AssignmentConfig | null | undefined) => {
    if (!config?.deliverables || config.deliverables.length === 0) return null;
    const preview = config.deliverables.slice(0, 2);
    return (
      <div className="mt-3 space-y-1">
        {preview.map((item) => (
          <div key={item} className="text-xs text-gray-600 flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
            <span>{item}</span>
          </div>
        ))}
        {config.deliverables.length > 2 && (
          <div className="text-xs text-gray-400">외 {config.deliverables.length - 2}개 제출 항목</div>
        )}
      </div>
    );
  };

  const renderResourcesSummary = (values: AssignmentResource[] | undefined) => {
    if (!values || values.length === 0) return null;
    const preview = values.slice(0, 2);
    return (
      <div className="mt-3 space-y-1">
        {preview.map((resource, index) => (
          <div key={`${resource.url}-${index}`} className="text-xs text-blue-600 truncate">
            <span className="font-medium">[{resource.type || 'link'}]</span> {resource.title}
          </div>
        ))}
        {values.length > 2 && (
          <div className="text-xs text-gray-400">외 {values.length - 2}개의 참고 자료</div>
        )}
      </div>
    );
  };

  const typeOptions = (Object.keys(TYPE_LIBRARY) as AssignmentType[]);

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>과제 관리 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">과제 설계 & 제출 관리</h1>
              <p className="mt-1 text-sm text-gray-500">다양한 학습 활동을 유형에 맞춰 설계하고, 제출 현황을 한눈에 관리하세요.</p>
            </div>
            <button
              onClick={() => router.push('/professor/questions')}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              AI 퀴즈 출제 바로가기
            </button>
          </header>

          <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">새 과제 설계</h2>
              <p className="text-sm text-gray-500">과제 유형을 선택하면 추천 설정이 자동으로 채워집니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeOptions.map((type) => {
                const meta = getTypeMeta(type);
                const isActive = assignmentType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`h-full rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? `${meta.color} border-2 shadow`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <p className="mt-1 text-xs text-gray-600 leading-5">{meta.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">과제 제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="예: 임상 실습 케이스 분석 리포트"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">요약 설명</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="과제 목적과 기대 학습 결과를 간단하게 작성하세요."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">마감 일시</span>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">제출 방식</span>
                  <select
                    value={submissionMethod}
                    onChange={(event) => setSubmissionMethod(event.target.value as SubmissionMethod)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {(Object.keys(SUBMISSION_LABELS) as SubmissionMethod[]).map((method) => (
                      <option key={method} value={method}>
                        {SUBMISSION_LABELS[method]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">상세 안내 / 지침</span>
                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="과제 수행 절차, 평가 기준, 제출 형식을 안내하세요."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={6}
                  />
                </label>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">제출 항목 (Deliverables)</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={deliverableDraft}
                      onChange={(event) => setDeliverableDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddDeliverable();
                        }
                      }}
                      placeholder="예: 최종 보고서 PDF"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                      추가
                    </button>
                  </div>
                  {deliverables.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {deliverables.map((item) => (
                        <li key={item} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                          <span>{item}</span>
                          <button type="button" onClick={() => handleRemoveDeliverable(item)} className="text-xs text-red-500 hover:text-red-600">삭제</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">평가 체크리스트</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={checklistDraft}
                      onChange={(event) => setChecklistDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddChecklist();
                        }
                      }}
                      placeholder="예: 참고 문헌 형식 준수"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklist}
                      className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                      추가
                    </button>
                  </div>
                  {checklist.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {checklist.map((item) => (
                        <li key={item} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                          <span>{item}</span>
                          <button type="button" onClick={() => handleRemoveChecklist(item)} className="text-xs text-red-500 hover:text-red-600">삭제</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={allowLate} onChange={(event) => setAllowLate(event.target.checked)} />
                    지각 제출 허용
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={groupEnabled} onChange={(event) => setGroupEnabled(event.target.checked)} />
                    팀/조별 수행
                  </label>
                  {allowLate && (
                    <input
                      value={latePolicy}
                      onChange={(event) => setLatePolicy(event.target.value)}
                      placeholder="지각 제출 시 감점 정책"
                      className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  )}
                  {groupEnabled && (
                    <>
                      <input
                        type="number"
                        min={2}
                        value={groupMin}
                        onChange={(event) => setGroupMin(event.target.value ? Number(event.target.value) : '')}
                        placeholder="최소 팀원 수"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        type="number"
                        min={2}
                        value={groupMax}
                        onChange={(event) => setGroupMax(event.target.value ? Number(event.target.value) : '')}
                        placeholder="최대 팀원 수"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">만점</span>
                    <input
                      type="number"
                      min={0}
                      value={maxScore}
                      onChange={(event) => setMaxScore(event.target.value ? Number(event.target.value) : '')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">마감 전 리마인드 (일)</span>
                    <input
                      type="number"
                      min={0}
                      value={notifyBeforeDays}
                      onChange={(event) => setNotifyBeforeDays(event.target.value ? Number(event.target.value) : '')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">평가 루브릭 / 비고</span>
                  <textarea
                    value={rubric}
                    onChange={(event) => setRubric(event.target.value)}
                    placeholder="평가 루브릭, 피드백 방식 등 추가 안내를 작성하세요."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700">평가 기준 항목</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={criteriaDraft}
                      onChange={(event) => setCriteriaDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddCriteria();
                        }
                      }}
                      placeholder="예: 창의성 20%"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button type="button" onClick={handleAddCriteria} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700">
                      추가
                    </button>
                  </div>
                  {evaluationCriteria.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {evaluationCriteria.map((item) => (
                        <li key={item} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                          <span>{item}</span>
                          <button type="button" onClick={() => handleRemoveCriteria(item)} className="text-xs text-red-500 hover:text-red-600">삭제</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">추가 메모</span>
                  <textarea
                    value={additionalNotes}
                    onChange={(event) => setAdditionalNotes(event.target.value)}
                    placeholder="조교 역할, 참고 사항 등을 작성하세요."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700">태그</label>
                  <input
                    value={tagsInput}
                    onChange={(event) => setTagsInput(event.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="예: 실습, 3학년"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                          #{tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="text-blue-400 hover:text-blue-600">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">참고 자료</label>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <input
                      value={resourceDraft.title}
                      onChange={(event) => setResourceDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="자료 제목"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                      value={resourceDraft.url}
                      onChange={(event) => setResourceDraft((prev) => ({ ...prev, url: event.target.value }))}
                      placeholder="https://..."
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <select
                      value={resourceDraft.type || 'link'}
                      onChange={(event) => setResourceDraft((prev) => ({ ...prev, type: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="link">링크</option>
                      <option value="template">템플릿</option>
                      <option value="video">강의 영상</option>
                      <option value="guide">가이드 문서</option>
                    </select>
                  </div>
                  <textarea
                    value={resourceDraft.description || ''}
                    onChange={(event) => setResourceDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="자료 설명 (선택)"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={handleAddResource} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700">
                      자료 추가
                    </button>
                  </div>
                  {resources.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {resources.map((resource, index) => (
                        <li key={`${resource.url}-${index}`} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{resource.title}</div>
                              <div className="text-xs text-blue-600 break-all">{resource.url}</div>
                              {resource.description && (
                                <div className="mt-1 text-xs text-gray-500">{resource.description}</div>
                              )}
                            </div>
                            <button type="button" onClick={() => handleRemoveResource(index)} className="text-xs text-red-500 hover:text-red-600">
                              삭제
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={createAssignment}
                    disabled={creating}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {creating ? '생성 중...' : '과제 초안 저장'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">등록된 과제</h2>
                <p className="text-sm text-gray-500">과제 유형과 제출 상태를 한눈에 확인하고 관리하세요.</p>
              </div>
              {loading && <span className="text-sm text-gray-500">불러오는 중...</span>}
            </div>

            {sortedAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                아직 생성된 과제가 없습니다. 위 양식을 통해 첫 과제를 만들어보세요.
              </div>
            ) : (
              <ul className="space-y-4">
                {sortedAssignments.map((assignment) => {
                  const meta = getTypeMeta(assignment.type as AssignmentType);
                  return (
                    <li key={assignment.id} className="rounded-xl border border-gray-200 p-5 transition hover:shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-xs text-gray-500">마감 {new Date(assignment.due_date).toLocaleString()}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs font-medium text-gray-600">상태: {formatStatus(assignment.status)}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{assignment.description}</p>
                          {assignment.config?.instructions && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{assignment.config.instructions}</p>
                          )}
                          {renderTags(assignment.tags)}
                          {renderDeliverablesSummary(assignment.config)}
                          {renderResourcesSummary(assignment.resources)}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 md:w-48">
                          {assignment.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(assignment.id, 'published')}
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              공개 전환
                            </button>
                          )}
                          {assignment.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(assignment.id, 'closed')}
                              className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900"
                            >
                              마감 처리
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => router.push(`/professor/assignments/${assignment.id}`)}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            제출 현황 보기
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <ChatWidget
          title="학사 도우미 봇"
          suggestedQuestions={[
            '이번 강의 요약과 과제 아이디어 추천해줘',
            '평가 루브릭 템플릿 만들어줘',
            '퀴즈 출제용 문항 5개 추천해줘',
            '마감 임박 과제 리마인드 문구 작성해줘',
          ]}
        />
      </div>
    </ProtectedRoute>
  );
}
