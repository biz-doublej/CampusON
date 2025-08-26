#!/usr/bin/env python3
"""
Gemini + HyperCLOVA PDF 파서 고속 테스트 스크립트
- 실시간 진행 상황 표시
- 상세한 로깅
- 최적화된 성능
"""

import os
import sys
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor

# 프로젝트 루트 디렉토리를 시스템 패스에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.AI_parser.parser.gemini_question_parser import GeminiQuestionParser

# 상세한 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FastGeminiParserTester:
    """고속 Gemini 파서 테스터 클래스"""
    
    def __init__(self, questions_dir: str = "uploads/questions", 
                 results_dir: str = "data/parser_results"):
        """
        테스터 초기화
        
        Args:
            questions_dir: PDF 파일이 있는 디렉토리
            results_dir: 결과를 저장할 디렉토리
        """
        self.questions_dir = Path(questions_dir)
        self.results_dir = Path(results_dir)
        self.parser = None
        self.start_time = None
        
        # 결과 디렉토리 생성
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"🔧 테스터 초기화 완료")
        print(f"📁 입력 폴더: {self.questions_dir}")
        print(f"📁 출력 폴더: {self.results_dir}")
        print("=" * 60)
    
    def log_progress(self, step: str, current: int, total: int, details: str = ""):
        """진행률 로그 출력"""
        percentage = (current / total) * 100 if total > 0 else 0
        elapsed = time.time() - self.start_time if self.start_time else 0
        
        print(f"📊 [{percentage:6.1f}%] {step} ({current}/{total})")
        if details:
            print(f"   └─ {details}")
        if elapsed > 0:
            print(f"   └─ ⏱️ 경과 시간: {elapsed:.1f}초")
        print("-" * 40)
    
    def find_pdf_files(self) -> Dict[str, Dict[str, Optional[str]]]:
        """PDF 파일들을 연도별로 스캔하여 쌍을 찾기"""
        print("🔍 PDF 파일 스캔 시작...")
        files = {}
        
        if not self.questions_dir.exists():
            print(f"❌ 디렉토리가 존재하지 않습니다: {self.questions_dir}")
            return files
        
        # PDF 파일 스캔
        pdf_files = list(self.questions_dir.glob("*.pdf"))
        print(f"📁 총 {len(pdf_files)}개의 PDF 파일 발견")
        
        for i, pdf_file in enumerate(pdf_files):
            filename = pdf_file.name
            print(f"📄 [{i+1}/{len(pdf_files)}] 파일 분석: {filename}")
            
            # 연도 추출 (정규식 사용)
            import re
            year_match = re.search(r'(\d{4})년도', filename)
            if year_match:
                year = year_match.group(1)
                
                if year not in files:
                    files[year] = {"question": None, "answer": None}
                
                if "기출문제" in filename or "문제" in filename:
                    files[year]["question"] = str(pdf_file)
                    print(f"   └─ 📖 문제지로 분류: {year}년도")
                elif "답안" in filename or "정답" in filename:
                    files[year]["answer"] = str(pdf_file)
                    print(f"   └─ 📋 정답지로 분류: {year}년도")
            else:
                print(f"   └─ ⚠️ 연도 패턴을 찾을 수 없음")
        
        print("=" * 60)
        return files
    
    def get_complete_pairs(self, files: Dict[str, Dict[str, Optional[str]]]) -> List[Tuple[str, str, str]]:
        """완전한 쌍(문제지+정답지)을 가진 연도 찾기"""
        print("🔗 완전한 쌍 찾기...")
        complete_pairs = []
        
        for year, pair in files.items():
            if pair["question"] and pair["answer"]:
                complete_pairs.append((year, pair["question"], pair["answer"]))
                print(f"✅ {year}년도 완전한 쌍 발견")
                print(f"   └─ 📖 문제지: {Path(pair['question']).name}")
                print(f"   └─ 📋 정답지: {Path(pair['answer']).name}")
            else:
                print(f"❌ {year}년도 불완전한 쌍")
                if not pair["question"]:
                    print(f"   └─ 📖 문제지 없음")
                if not pair["answer"]:
                    print(f"   └─ 📋 정답지 없음")
        
        print(f"📊 총 {len(complete_pairs)}개의 완전한 쌍 발견")
        print("=" * 60)
        return complete_pairs
    
    def detailed_progress_callback(self, step: str, progress: float, details: str = ""):
        """상세한 진행률 콜백 함수"""
        elapsed = time.time() - self.start_time if self.start_time else 0
        print(f"🔄 [{progress:6.1f}%] {step}")
        if details:
            print(f"   └─ {details}")
        print(f"   └─ ⏱️ 경과 시간: {elapsed:.1f}초")
        print("-" * 40)
    
    async def process_year_fast(self, year: str, question_file: str, answer_file: str) -> Dict:
        """특정 연도를 고속으로 처리"""
        print(f"🚀 {year}년도 고속 처리 시작")
        print(f"📋 정답지: {Path(answer_file).name}")
        print(f"📖 문제지: {Path(question_file).name}")
        print("=" * 60)
        
        try:
            # 처리 시작 시간 기록
            process_start = time.time()
            
            # 1단계: 문제지 파싱
            print("📖 1단계: 문제지 파싱 시작...")
            step_start = time.time()
            
            questions = await self.parser.parse_pdf_to_questions(
                question_file, 
                progress_callback=self.detailed_progress_callback
            )
            
            step_time = time.time() - step_start
            print(f"✅ 1단계 완료 ({step_time:.1f}초)")
            
            if not questions:
                print(f"❌ {year}년도 문제지 파싱 실패")
                return None
            
            print(f"📊 추출된 문제 수: {len(questions)}")
            print("-" * 40)
            
            # 2단계: 정답지 파싱
            print("📋 2단계: 정답지 파싱 시작...")
            step_start = time.time()
            
            answers = await self.parser.parse_pdf_to_answers(
                answer_file,
                progress_callback=self.detailed_progress_callback
            )
            
            step_time = time.time() - step_start
            print(f"✅ 2단계 완료 ({step_time:.1f}초)")
            
            if not answers:
                print(f"❌ {year}년도 정답지 파싱 실패")
                return None
            
            print(f"📊 추출된 정답 수: {len(answers)}")
            print("-" * 40)
            
            # 3단계: 정답 매칭
            print("🔗 3단계: 정답 매칭 시작...")
            step_start = time.time()
            
            result = await self.parser.match_questions_and_answers(
                questions, 
                answers,
                progress_callback=self.detailed_progress_callback
            )
            
            step_time = time.time() - step_start
            print(f"✅ 3단계 완료 ({step_time:.1f}초)")
            
            if not result:
                print(f"❌ {year}년도 정답 매칭 실패")
                return None
            
            print(f"📊 매칭된 문제 수: {len(result.get('questions', []))}")
            print("-" * 40)
            
            # 4단계: 결과 저장
            print("💾 4단계: 결과 저장 시작...")
            step_start = time.time()
            
            output_file = self.results_dir / f"{year}년도_물리치료사_국가시험_완전분석.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            step_time = time.time() - step_start
            total_time = time.time() - process_start
            
            print(f"✅ 4단계 완료 ({step_time:.1f}초)")
            print(f"🎉 {year}년도 전체 처리 완료!")
            print(f"⏱️ 총 소요 시간: {total_time:.1f}초")
            print(f"📁 저장 위치: {output_file}")
            print("=" * 60)
            
            return result
            
        except Exception as e:
            print(f"❌ {year}년도 처리 중 오류 발생:")
            print(f"   └─ 오류: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    async def run_fast_test(self):
        """고속 테스트 실행"""
        print("🚀 고속 Gemini 파서 테스트 시작")
        print("=" * 60)
        
        # 전체 시작 시간 기록
        self.start_time = time.time()
        
        # Gemini API 키 확인
        print("🔑 Gemini API 키 확인...")
        gemini_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not gemini_key:
            print("❌ Gemini API 키가 설정되지 않았습니다!")
            print("   환경변수 GEMINI_API_KEY 또는 GOOGLE_API_KEY를 설정해주세요.")
            return
        
        print("✅ Gemini API 키 확인 완료")
        print(f"   └─ 키: {gemini_key[:10]}...")
        print("-" * 40)
        
        # 파서 초기화
        print("⚙️ Gemini 파서 초기화...")
        try:
            init_start = time.time()
            self.parser = GeminiQuestionParser()
            init_time = time.time() - init_start
            print(f"✅ 파서 초기화 완료 ({init_time:.1f}초)")
        except Exception as e:
            print(f"❌ 파서 초기화 실패: {str(e)}")
            import traceback
            traceback.print_exc()
            return
        
        print("-" * 40)
        
        # PDF 파일 스캔
        files = self.find_pdf_files()
        if not files:
            print("❌ PDF 파일을 찾을 수 없습니다.")
            return
        
        complete_pairs = self.get_complete_pairs(files)
        if not complete_pairs:
            print("❌ 완전한 쌍을 가진 연도를 찾을 수 없습니다.")
            return
        
        # 2021년도만 처리
        target_year = "2021"
        target_pair = None
        
        for year, question_file, answer_file in complete_pairs:
            if year == target_year:
                target_pair = (year, question_file, answer_file)
                break
        
        if not target_pair:
            print(f"❌ {target_year}년도 파일을 찾을 수 없습니다.")
            print("사용 가능한 연도:")
            for year, _, _ in complete_pairs:
                print(f"   └─ {year}년도")
            return
        
        print(f"🎯 {target_year}년도 선택")
        print("=" * 60)
        
        # 처리 시작
        year, question_file, answer_file = target_pair
        result = await self.process_year_fast(year, question_file, answer_file)
        
        total_elapsed = time.time() - self.start_time
        
        if result:
            # 요약 정보 생성
            summary = {
                "test_date": datetime.now().isoformat(),
                "processed_year": year,
                "total_questions": len(result.get('questions', [])),
                "parser_engine": "Gemini + HyperCLOVA",
                "success": True,
                "processing_time_seconds": total_elapsed,
                "files": {
                    "question": Path(question_file).name,
                    "answer": Path(answer_file).name,
                    "output": f"{year}년도_물리치료사_국가시험_완전분석.json"
                }
            }
            
            # 요약 파일 저장
            summary_file = self.results_dir / f"{year}년도_테스트_요약.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            
            print("🎉 테스트 성공적으로 완료!")
            print(f"⏱️ 총 소요 시간: {total_elapsed:.1f}초")
            print(f"📁 결과 저장 위치: {self.results_dir}")
            print(f"📄 주요 결과 파일: {year}년도_물리치료사_국가시험_완전분석.json")
            print(f"📊 요약 파일: {year}년도_테스트_요약.json")
            print(f"📈 총 문제 수: {len(result.get('questions', []))}")
            print("=" * 60)
        else:
            print("❌ 테스트 실패")
            print(f"⏱️ 총 소요 시간: {total_elapsed:.1f}초")

async def main():
    """메인 함수"""
    print("🚀 Gemini + HyperCLOVA PDF 파서 고속 테스트")
    print("=" * 60)
    print("📋 이 스크립트는 다음 작업을 수행합니다:")
    print("  1. 2021년도 PDF 파일 고속 처리")
    print("  2. Gemini로 PDF 파싱 (문제 추출)")
    print("  3. HyperCLOVA로 AI 해설 생성")  
    print("  4. 정답지와 문제지를 매칭하여 완전한 JSON 생성")
    print("  5. 결과를 data/parser_results 폴더에 저장")
    print("  6. 실시간 진행 상황 표시")
    print("=" * 60)
    
    # Gemini API 키 확인
    gemini_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not gemini_key:
        print("⚠️ 경고: Gemini API 키가 설정되지 않았습니다!")
        print("   환경변수 GEMINI_API_KEY 또는 GOOGLE_API_KEY를 설정해주세요.")
        print("   예: $env:GEMINI_API_KEY = 'your-api-key-here'")
        print()
        return
    
    # 테스터 실행
    tester = FastGeminiParserTester()
    await tester.run_fast_test()

if __name__ == "__main__":
    asyncio.run(main()) 