# PDF 파싱 알고리즘 가이드

## 📋 개요

이 문서는 국가시험 문제지 PDF에서 문제, 선택지, 정답을 정확하게 추출하기 위한 알고리즘과 패턴 인식 기법을 설명합니다.

## 🔍 PDF 문서 분석

### 일반적인 국가시험 PDF 구조

```
[표지/제목 영역]
2023년도 물리치료사 국가시험 문제지

[문제 영역]
1. 다음 중 물리치료사의 역할로 가장 적절한 것은?
   1) 환자의 진단을 내리는 것
   2) 환자의 재활을 돕는 것
   3) 약물을 처방하는 것
   4) 수술을 집도하는 것
   5) 의료기기를 판매하는 것

2. 근육의 주요 기능이 아닌 것은?
   ① 체온 조절
   ② 자세 유지
   ③ 혈액 순환
   ④ 관절 움직임
   ⑤ 호르몬 분비

[정답 영역 - 문서 마지막 또는 별도 페이지]
정답
1번: 2
2번: ⑤
```

### 패턴 분석

#### 1. 문제 번호 패턴
```python
# 다양한 문제 번호 형식
patterns = [
    r'^(\d+)\.\s*',      # "1. 문제내용"
    r'^(\d+)\)\s*',      # "1) 문제내용"  
    r'^문제\s*(\d+)',    # "문제 1"
    r'^(\d+)번',         # "1번"
]

# 예제 텍스트에서 추출
sample_texts = [
    "1. 다음 중 물리치료사의 역할은?",
    "2) 근육의 기능이 아닌 것은?",
    "문제 3. 관절의 종류에 대한 설명으로",
    "4번. 뼈의 구조에서"
]
```

#### 2. 선택지 패턴
```python
# 선택지 형식들
option_patterns = {
    'numeric_paren': r'^(\d+)\)\s*(.+)$',           # "1) 내용"
    'circle_numbers': r'^([①-⑤])\s*(.+)$',          # "① 내용"
    'korean_letters': r'^([가-마])\.\s*(.+)$',      # "가. 내용"
    'parentheses': r'^\((\d+)\)\s*(.+)$',          # "(1) 내용"
    'alphabet': r'^([A-E])\.\s*(.+)$',             # "A. 내용"
}

# 선택지 변환 매핑
def normalize_option_key(key: str) -> str:
    """선택지 키를 숫자로 표준화"""
    mappings = {
        '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
        '가': '1', '나': '2', '다': '3', '라': '4', '마': '5',
        'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5',
    }
    return mappings.get(key, key)
```

#### 3. 정답 패턴
```python
# 정답 섹션 패턴들
answer_patterns = [
    r'정답[\s:]*(.*?)(?=\n\n|\Z)',                    # "정답: 1, 2, 3..."
    r'해답[\s:]*(.*?)(?=\n\n|\Z)',                    # "해답: 1, 2, 3..."
    r'(\d+)번?\s*[:\.]\s*([①-⑤]|\d+|[가-마])',        # "1번: ②"
    r'(\d+)\s*[-\.\)]\s*([①-⑤]|\d+|[가-마])',        # "1 - ②"
]
```

## 🤖 파싱 알고리즘 구현

### 1. 텍스트 전처리

```python
import re
from typing import List, Dict, Tuple

def preprocess_text(text: str) -> str:
    """텍스트 전처리를 수행합니다."""
    
    # 1. 불필요한 공백 정리
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # 2. 특수 문자 정리
    text = text.replace('\r', '\n')
    text = text.replace('\t', ' ')
    
    # 3. 페이지 번호, 헤더/푸터 제거
    text = re.sub(r'- \d+ -', '', text)  # 페이지 번호
    text = re.sub(r'^\d+/\d+$', '', text, flags=re.MULTILINE)  # "1/50" 형식
    
    # 4. 반복되는 제목 제거
    lines = text.split('\n')
    unique_lines = []
    seen_lines = set()
    
    for line in lines:
        clean_line = line.strip()
        if clean_line and clean_line not in seen_lines:
            unique_lines.append(line)
            seen_lines.add(clean_line)
        elif not clean_line:
            unique_lines.append(line)
    
    return '\n'.join(unique_lines)

def extract_text_by_sections(pdf_path: str) -> Dict[str, str]:
    """PDF를 섹션별로 분리하여 텍스트를 추출합니다."""
    import pdfplumber
    
    sections = {
        'title': '',
        'questions': '',
        'answers': ''
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        all_text = ""
        
        for page_num, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            
            # 첫 페이지는 제목 정보 포함 가능성 높음
            if page_num == 0:
                sections['title'] += page_text[:500]  # 첫 500자
            
            all_text += page_text + "\n"
        
        # 정답 섹션 분리 (보통 문서 후반부)
        answer_match = re.search(r'(정답|해답|답안).*', all_text, re.DOTALL | re.IGNORECASE)
        if answer_match:
            answer_start = answer_match.start()
            sections['questions'] = all_text[:answer_start]
            sections['answers'] = all_text[answer_start:]
        else:
            sections['questions'] = all_text
    
    return sections
```

### 2. 지능형 문제 추출

```python
class IntelligentQuestionExtractor:
    def __init__(self):
        self.question_patterns = [
            re.compile(r'^(\d+)\.\s*(.+?)(?=\n\s*\d+\.|$)', re.MULTILINE | re.DOTALL),
            re.compile(r'^(\d+)\)\s*(.+?)(?=\n\s*\d+\)|$)', re.MULTILINE | re.DOTALL),
            re.compile(r'문제\s*(\d+)[\.:]?\s*(.+?)(?=문제\s*\d+|$)', re.MULTILINE | re.DOTALL),
        ]
        
        self.option_patterns = [
            re.compile(r'^\s*(\d+)\)\s*(.+?)(?=\n\s*\d+\)|$)', re.MULTILINE),
            re.compile(r'^\s*([①-⑤])\s*(.+?)(?=\n\s*[①-⑤]|$)', re.MULTILINE),
            re.compile(r'^\s*([가-마])\.\s*(.+?)(?=\n\s*[가-마]\.|$)', re.MULTILINE),
        ]

    def extract_questions_advanced(self, text: str) -> List[Dict]:
        """고급 문제 추출 알고리즘"""
        questions = []
        
        # 1단계: 문제 블록 분리
        question_blocks = self._split_into_question_blocks(text)
        
        for block in question_blocks:
            try:
                question_data = self._parse_question_block(block)
                if question_data:
                    questions.append(question_data)
            except Exception as e:
                print(f"문제 블록 파싱 실패: {e}")
                continue
        
        return questions

    def _split_into_question_blocks(self, text: str) -> List[str]:
        """텍스트를 문제 블록으로 분리"""
        
        # 가장 적합한 패턴 찾기
        best_pattern = None
        max_matches = 0
        
        for pattern in self.question_patterns:
            matches = pattern.findall(text)
            if len(matches) > max_matches:
                max_matches = len(matches)
                best_pattern = pattern
        
        if not best_pattern:
            return []
        
        # 패턴으로 분리
        splits = best_pattern.split(text)
        blocks = []
        
        for i in range(1, len(splits), 3):
            if i + 1 < len(splits):
                question_num = splits[i]
                question_content = splits[i + 1]
                blocks.append(f"{question_num}. {question_content}")
        
        return blocks

    def _parse_question_block(self, block: str) -> Dict:
        """개별 문제 블록을 파싱"""
        lines = block.split('\n')
        
        # 문제 번호 추출
        first_line = lines[0].strip()
        number_match = re.match(r'^(\d+)', first_line)
        if not number_match:
            return None
        
        question_num = int(number_match.group(1))
        
        # 문제 내용과 선택지 분리
        content_lines = []
        option_lines = []
        
        in_options = False
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            
            # 선택지 시작 감지
            is_option = False
            for pattern in self.option_patterns:
                if pattern.match(line):
                    is_option = True
                    in_options = True
                    break
            
            if is_option or in_options:
                option_lines.append(line)
            else:
                content_lines.append(line)
        
        # 문제 내용 정제
        content = ' '.join(content_lines).strip()
        content = self._clean_question_content(content)
        
        # 선택지 파싱
        options = self._parse_options(option_lines)
        
        return {
            'number': question_num,
            'content': content,
            'options': options
        }

    def _clean_question_content(self, content: str) -> str:
        """문제 내용을 정제합니다."""
        
        # 일반적인 불필요한 패턴 제거
        patterns_to_remove = [
            r'^\d+\.\s*',  # 문제 번호
            r'문제\s*\d+\s*[\.:]?\s*',  # "문제 1."
            r'\[.*?\]',  # 대괄호 안의 내용
            r'\(단,.*?\)',  # 조건 설명
        ]
        
        for pattern in patterns_to_remove:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        
        # 공백 정리
        content = re.sub(r'\s+', ' ', content).strip()
        
        return content

    def _parse_options(self, option_lines: List[str]) -> Dict[str, str]:
        """선택지를 파싱합니다."""
        options = {}
        
        for line in option_lines:
            for pattern in self.option_patterns:
                match = pattern.match(line)
                if match:
                    key = self._normalize_option_key(match.group(1))
                    value = match.group(2).strip()
                    options[key] = value
                    break
        
        return options

    def _normalize_option_key(self, key: str) -> str:
        """선택지 키를 표준화"""
        mapping = {
            '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
            '가': '1', '나': '2', '다': '3', '라': '4', '마': '5',
        }
        return mapping.get(key, key)
```

### 3. 정답 매칭 알고리즘

```python
class AnswerMatcher:
    def __init__(self):
        self.answer_patterns = [
            # "1번: 2" 형태
            re.compile(r'(\d+)번?\s*[:\.]\s*([①-⑤]|\d+|[가-마])', re.MULTILINE),
            # "1. ②" 형태  
            re.compile(r'(\d+)\.\s*([①-⑤]|\d+|[가-마])', re.MULTILINE),
            # "1-2" 형태
            re.compile(r'(\d+)\s*[-–]\s*([①-⑤]|\d+|[가-마])', re.MULTILINE),
            # 표 형태 (탭 구분)
            re.compile(r'(\d+)\s+([①-⑤]|\d+|[가-마])', re.MULTILINE),
        ]

    def extract_answers(self, answer_text: str) -> Dict[int, str]:
        """정답 텍스트에서 정답을 추출합니다."""
        answers = {}
        
        # 정답 섹션 정제
        answer_text = self._clean_answer_section(answer_text)
        
        # 각 패턴으로 시도
        for pattern in self.answer_patterns:
            matches = pattern.findall(answer_text)
            
            for question_num, answer in matches:
                try:
                    num = int(question_num)
                    normalized_answer = self._normalize_answer(answer)
                    if normalized_answer:
                        answers[num] = normalized_answer
                except ValueError:
                    continue
        
        return answers

    def _clean_answer_section(self, text: str) -> str:
        """정답 섹션을 정제합니다."""
        
        # 정답 섹션 시작점 찾기
        start_patterns = [
            r'정답',
            r'해답', 
            r'답안',
            r'정해',
            r'Answer'
        ]
        
        for pattern in start_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                text = text[match.start():]
                break
        
        # 불필요한 텍스트 제거
        text = re.sub(r'해설.*', '', text, flags=re.DOTALL)  # 해설 부분 제거
        text = re.sub(r'문제.*?정답', '정답', text, flags=re.DOTALL)
        
        return text

    def _normalize_answer(self, answer: str) -> str:
        """정답을 표준 형식으로 변환"""
        mapping = {
            '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
            '가': '1', '나': '2', '다': '3', '라': '4', '마': '5',
        }
        return mapping.get(answer, answer)

    def match_answers_to_questions(self, questions: List[Dict], answers: Dict[int, str]):
        """정답을 문제에 매칭합니다."""
        for question in questions:
            question_num = question.get('number')
            if question_num in answers:
                question['answer'] = answers[question_num]
```

## 🔧 품질 향상 기법

### 1. 신뢰도 검증

```python
class QualityValidator:
    def validate_parsing_result(self, questions: List[Dict]) -> Dict[str, float]:
        """파싱 결과의 품질을 검증합니다."""
        
        scores = {
            'completeness': self._check_completeness(questions),
            'consistency': self._check_consistency(questions),
            'format_validity': self._check_format_validity(questions)
        }
        
        scores['overall'] = sum(scores.values()) / len(scores)
        return scores

    def _check_completeness(self, questions: List[Dict]) -> float:
        """완성도 검사"""
        if not questions:
            return 0.0
        
        complete_questions = 0
        for q in questions:
            if (q.get('content') and 
                q.get('options') and 
                len(q.get('options', {})) >= 2):
                complete_questions += 1
        
        return complete_questions / len(questions)

    def _check_consistency(self, questions: List[Dict]) -> float:
        """일관성 검사"""
        if len(questions) < 2:
            return 1.0
        
        # 문제 번호 연속성 확인
        numbers = [q.get('number', 0) for q in questions]
        numbers.sort()
        
        expected = list(range(numbers[0], numbers[0] + len(numbers)))
        consistency = sum(1 for a, b in zip(numbers, expected) if a == b) / len(numbers)
        
        return consistency

    def _check_format_validity(self, questions: List[Dict]) -> float:
        """형식 유효성 검사"""
        valid_questions = 0
        
        for q in questions:
            is_valid = True
            
            # 문제 내용 길이 검사
            content = q.get('content', '')
            if len(content) < 10 or len(content) > 1000:
                is_valid = False
            
            # 선택지 개수 검사
            options = q.get('options', {})
            if len(options) < 2 or len(options) > 6:
                is_valid = False
            
            # 선택지 키 형식 검사
            for key in options.keys():
                if not re.match(r'^[1-6]$', str(key)):
                    is_valid = False
            
            if is_valid:
                valid_questions += 1
        
        return valid_questions / len(questions) if questions else 0.0
```

### 2. 오류 복구 및 보정

```python
class ErrorRecovery:
    def auto_correct_questions(self, questions: List[Dict]) -> List[Dict]:
        """자동 오류 보정"""
        corrected = []
        
        for q in questions:
            corrected_q = self._correct_single_question(q)
            if corrected_q:
                corrected.append(corrected_q)
        
        # 문제 번호 재정렬
        corrected = self._renumber_questions(corrected)
        
        return corrected

    def _correct_single_question(self, question: Dict) -> Dict:
        """개별 문제 보정"""
        q = question.copy()
        
        # 문제 내용 보정
        content = q.get('content', '')
        content = self._clean_question_content(content)
        q['content'] = content
        
        # 선택지 보정
        options = q.get('options', {})
        corrected_options = {}
        
        for key, value in options.items():
            # 키 정규화
            normalized_key = re.sub(r'[^\d]', '', str(key))
            if normalized_key and normalized_key.isdigit():
                # 값 정제
                clean_value = re.sub(r'^\s*[^\w]*\s*', '', value)
                corrected_options[normalized_key] = clean_value
        
        q['options'] = corrected_options
        
        return q if corrected_options else None

    def _renumber_questions(self, questions: List[Dict]) -> List[Dict]:
        """문제 번호 재정렬"""
        for i, q in enumerate(questions, 1):
            q['number'] = i
        return questions
```

## 📊 성능 최적화

### 멀티프로세싱 활용

```python
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor
import time

class PerformanceOptimizer:
    def __init__(self, max_workers=None):
        self.max_workers = max_workers or mp.cpu_count()

    def parallel_page_extraction(self, pdf_path: str) -> List[str]:
        """페이지별 병렬 텍스트 추출"""
        import pdfplumber
        
        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            
            # 페이지 단위로 분할
            page_ranges = [(i, i+1) for i in range(page_count)]
            
            with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
                page_texts = list(executor.map(
                    self._extract_page_range,
                    [(pdf_path, start, end) for start, end in page_ranges]
                ))
            
            return page_texts

    def _extract_page_range(self, args: tuple) -> str:
        """페이지 범위의 텍스트 추출"""
        pdf_path, start, end = args
        
        import pdfplumber
        text = ""
        
        with pdfplumber.open(pdf_path) as pdf:
            for i in range(start, min(end, len(pdf.pages))):
                page_text = pdf.pages[i].extract_text() or ""
                text += page_text + "\n"
        
        return text

    def cached_pattern_matching(self, text: str, patterns: List[str]) -> Dict:
        """패턴 매칭 결과 캐싱"""
        import hashlib
        import pickle
        import os
        
        # 텍스트 해시 생성
        text_hash = hashlib.md5(text.encode()).hexdigest()
        cache_file = f"/tmp/pattern_cache_{text_hash}.pkl"
        
        # 캐시 확인
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        
        # 패턴 매칭 수행
        results = {}
        for pattern in patterns:
            results[pattern] = re.findall(pattern, text, re.MULTILINE)
        
        # 결과 캐싱
        with open(cache_file, 'wb') as f:
            pickle.dump(results, f)
        
        return results
```

## 🧪 테스트 케이스

### 다양한 PDF 형식 테스트

```python
test_cases = [
    {
        'name': '표준 국가시험 형식',
        'description': '일반적인 5지선다형',
        'sample_text': '''
        1. 다음 중 물리치료사의 역할은?
        1) 진단
        2) 재활  
        3) 처방
        4) 수술
        5) 판매
        '''
    },
    {
        'name': '원문자 선택지',
        'description': '①②③④⑤ 형식',
        'sample_text': '''
        1. 근육의 기능이 아닌 것은?
        ① 움직임
        ② 지지
        ③ 소화
        ④ 열생산
        ⑤ 보호
        '''
    },
    {
        'name': '한글 선택지',
        'description': '가나다라마 형식',
        'sample_text': '''
        1. 올바른 것을 고르시오.
        가. 첫번째 선택지
        나. 두번째 선택지
        다. 세번째 선택지
        라. 네번째 선택지
        마. 다섯번째 선택지
        '''
    }
]
```

---

이 알고리즘 가이드를 참고하여 다양한 PDF 형식에 대응할 수 있는 견고한 파서를 개발하세요! 