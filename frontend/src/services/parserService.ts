import axios from 'axios';
import { ApiResponse } from '../types';

// 파서 결과 타입 정의
export interface ParsedQuestion {
  number: number;
  content: string;
  description?: string[] | string;
  options: Record<string, string>;
  answer?: string;
  explanation?: string;
}

export interface ParsedResult {
  questions: ParsedQuestion[];
  metadata?: {
    title?: string;
    year?: number;
    subject?: string;
    totalQuestions?: number;
  };
}

// 파서 API 서비스
const USE_PROXY = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_PARSER_API_URL;
const PARSER_API_URL = USE_PROXY ? '/parser' : (process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001');

export const parserService = {
  /**
   * 파일 업로드 및 파싱 요청
   * @param file 업로드할 PDF 파일
   * @returns 파싱 결과
   */
  async parseFile(file: File): Promise<ApiResponse<ParsedResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 실제 API 호출
      const response = await axios.post(`${PARSER_API_URL}/api/parse?auto_ingest=false&auto_save=false`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('파일 파싱 오류:', error);
      return {
        success: false,
        error: '파일 파싱 중 오류가 발생했습니다.'
      };
    }
  },

  /**
   * 파싱 결과 조회
   * @param resultId 파싱 결과 ID
   * @returns 파싱 결과
   */
  async getParseResult(resultId: string): Promise<ApiResponse<ParsedResult>> {
    try {
      const response = await axios.get(`${PARSER_API_URL}/api/results/${resultId}`);
      return response.data;
    } catch (error) {
      console.error('파싱 결과 조회 오류:', error);
      return {
        success: false,
        error: '파싱 결과 조회 중 오류가 발생했습니다.'
      };
    }
  }
};

export default parserService;
