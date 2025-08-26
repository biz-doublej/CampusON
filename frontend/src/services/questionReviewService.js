/**
 * 문제 검토 및 승인 API 서비스
 */
import apiClient, { fileUploadApiClient } from './api.js';

export const questionReviewApi = {
  /**
   * 멀티파일 업로드 및 파싱 (2차 승인 프로세스)
   * 문제지와 정답지를 함께 업로드하여 통합 파싱
   * 지원 형식: PDF, Excel(.xlsx, .xls), 텍스트(.txt)
   * 타임아웃: 5분 (파싱 시간 고려)
   */
  uploadFilesWithReview: (files, onUploadProgress, title = null, category = null) => {
    const formData = new FormData();
    
    // 파일이 배열이 아닌 경우 배열로 변환
    const fileList = Array.isArray(files) ? files : [files];
    
    // 다중 파일 업로드: 정답지와 문제지 함께 전송
    fileList.forEach(file => {
      formData.append('files', file);
    });
    
    // 제목과 카테고리가 있으면 추가
    if (title && title.trim()) {
      formData.append('title', title.trim());
    }
    if (category && category.trim()) {
      formData.append('category', category.trim());
    }
    
    const config = {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onUploadProgress) {
          onUploadProgress(percentCompleted);
        }
      }
    };
    
    return fileUploadApiClient.post('/professor/upload/pdf-with-review', formData, config)
      .then(response => response.data);
  },

  // 하위 호환성을 위한 별칭
  uploadPdfWithReview: function(files, onUploadProgress, title = null, category = null) {
    return this.uploadFilesWithReview(files, onUploadProgress, title, category);
  },

  /**
   * 승인 대기 중인 문제들 조회
   */
  getPendingQuestions: () => {
    return apiClient.get('/professor/questions/pending')
      .then(response => response.data);
  },

  /**
   * 문제 내용 수정
   */
  updateQuestion: (updateData) => {
    const { question_id, ...data } = updateData;
    return apiClient.put(`/professor/questions/${question_id}`, data)
      .then(response => response.data);
  },

  /**
   * 문제 일괄 승인/거부
   */
  approveQuestions: (request) => {
    return apiClient.post('/professor/questions/approve', request)
      .then(response => response.data);
  },

  /**
   * 문제 상세 정보 조회 (수정 이력 포함)
   */
  getQuestionDetail: (questionId) => {
    return apiClient.get(`/professor/questions/${questionId}/detail`)
      .then(response => response.data);
  },

  /**
   * 업로드 히스토리 조회
   */
  getUploadHistory: () => {
    return apiClient.get('/professor/upload/history')
      .then(response => response.data);
  },
};

export default questionReviewApi;
