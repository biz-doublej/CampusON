import { Department } from '../types';

// 지원되는 학과 정보
export interface DepartmentInfo {
  key: Department;
  name: string;
  fullName: string;
  description: string;
  color: string;
  icon: string;
}

export const DEPARTMENTS: Record<Department, DepartmentInfo> = {
  nursing: {
    key: 'nursing',
    name: '간호학부',
    fullName: '간호학부',
    description: '인간의 건강증진과 질병예방, 질병회복을 위한 전문 간호 인력 양성',
    color: 'bg-blue-500',
    icon: '🏥'
  },
  dental_hygiene: {
    key: 'dental_hygiene',
    name: '치위생학과',
    fullName: '치위생학과',
    description: '구강 건강 관리 및 치위생 전문 인력 양성',
    color: 'bg-green-500',
    icon: '🦷'
  },
  physical_therapy: {
    key: 'physical_therapy',
    name: '물리치료학과',
    fullName: '물리치료학과',
    description: '운동 기능 장애의 예방과 치료를 위한 물리치료 전문 인력 양성',
    color: 'bg-purple-500',
    icon: '🏃‍♂️'
  }
};

// 학과 목록 배열
export const DEPARTMENT_LIST = Object.values(DEPARTMENTS);

// 학과 옵션 (select용)
export const DEPARTMENT_OPTIONS = DEPARTMENT_LIST.map(dept => ({
  value: dept.key,
  label: dept.name
}));

// 학과 정보 조회 함수
export const getDepartmentInfo = (department: Department): DepartmentInfo => {
  return DEPARTMENTS[department];
};

// 학과별 대시보드 경로
export const getDepartmentDashboardPath = (department: Department): string => {
  return `/department/${department.replace('_', '-')}`;
};

// 학과별 색상 클래스
export const getDepartmentColor = (department: Department): string => {
  return DEPARTMENTS[department].color;
};

// 입력 문자열을 Department 키로 정규화 (대소문자/구분자 허용)
export const normalizeDepartment = (input: string): Department => {
  const s = (input || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '_');
  switch (s) {
    case 'nursing':
      return 'nursing';
    case 'dental_hygiene':
    case 'dentalhygiene':
      return 'dental_hygiene';
    case 'physical_therapy':
    case 'physicaltherapy':
      return 'physical_therapy';
    default:
      return 'nursing';
  }
};
