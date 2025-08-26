/**
 * 인증 유틸리티 함수들 - 데이터베이스 연동 포함
 */
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';

// 타입 정의 (임시 해결책)
type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';
type Department = 'NURSING' | 'DENTAL_HYGIENE' | 'PHYSICAL_THERAPY';
type ActivityType = 'ASSIGNMENT' | 'TEST' | 'GRADE' | 'LOGIN' | 'UPLOAD' | 'CLINICAL_PRACTICE' | 'SIMULATION' | 'PRACTICAL_TRAINING';

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: Department | null;
  profile_image?: string | null;
  year?: number | null;
  created_at: Date;
  updated_at: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 비밀번호 해싱
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// 비밀번호 검증 (기존 함수 유지)
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// 기존 함수 유지 (하위 호환성)
export const getPasswordHash = async (password: string): Promise<string> => {
  return hashPassword(password);
};

// JWT 토큰 생성
export const generateToken = (payload: Record<string, any>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// 기존 함수 유지 (하위 호환성)
export const createAccessToken = (payload: Record<string, any>): string => {
  return generateToken(payload);
};

// JWT 토큰 검증
export const verifyToken = (token: string): Record<string, any> => {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, any>;
  } catch (error) {
    throw new Error('유효하지 않은 토큰입니다.');
  }
};

// 토큰에서 사용자 정보 추출 (기존 함수 유지)
export const getUserFromToken = (token: string): Record<string, any> | null => {
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// 이메일 유효성 검사 (경복대학교 도메인 필수)
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@kbu\.ac\.kr$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검사
export const isValidPassword = (password: string): boolean => {
  // 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// 사용자 생성
export const createUser = async (userData: {
  user_id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: Department;
}): Promise<User> => {
  const hashedPassword = await hashPassword(userData.password);
  
  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
};

// 이메일로 사용자 찾기
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

// ID로 사용자 찾기
export const findUserById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

// 사용자 ID(학번/교직원번호)로 사용자 찾기
export const findUserByUserId = async (user_id: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { user_id },
  });
};

// 사용자 인증
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) return null;
  
  return user;
};

// 활동 로그 생성
export const createActivity = async (userId: string, type: string, title: string, description: string) => {
  // ActivityType enum에 매칭되는지 확인
  const validTypes = ['ASSIGNMENT', 'TEST', 'GRADE', 'LOGIN', 'UPLOAD', 'CLINICAL_PRACTICE', 'SIMULATION', 'PRACTICAL_TRAINING'];
  const activityType = validTypes.includes(type.toUpperCase()) 
    ? (type.toUpperCase() as ActivityType) 
    : ('LOGIN' as ActivityType);
  
  return await prisma.activity.create({
    data: {
      user_id: userId,
      type: activityType,
      title,
      description,
    },
  });
}; 