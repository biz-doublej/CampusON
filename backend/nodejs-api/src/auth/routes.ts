import express, { Request, Response } from 'express';
import { 
  createUser, 
  authenticateUser, 
  generateToken,
  isValidEmail,
  isValidPassword,
  findUserByEmail,
  findUserByUserId,
  findUserById,
  createActivity
} from './utils';

// 타입 정의 (임시 해결책)
type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';
type Department = 'NURSING' | 'DENTAL_HYGIENE' | 'PHYSICAL_THERAPY';

const router = express.Router();

// 프론트엔드 학과 코드를 백엔드 enum으로 매핑
const mapDepartment = (frontendDept: string): Department | undefined => {
  const mapping: Record<string, Department> = {
    'nursing': 'NURSING' as Department,
    'dental_hygiene': 'DENTAL_HYGIENE' as Department,
    'physical_therapy': 'PHYSICAL_THERAPY' as Department
  };
  return mapping[frontendDept];
};

// 회원가입
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department, user_id } = req.body;

    // 입력 검증
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.'
      });
    }

    // 이메일 형식 검증
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '경복대학교 이메일 주소를 사용해주세요. (예: example@kbu.ac.kr)'
      });
    }

    // 비밀번호 강도 검증
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.'
      });
    }

    // 역할 검증
    if (!['STUDENT', 'PROFESSOR'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 역할입니다.'
      });
    }

    // 기존 사용자 확인
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 이메일입니다.'
      });
    }

    // 학번/교직원번호 중복 확인
    if (user_id) {
      const existingUserId = await findUserByUserId(user_id);
      if (existingUserId) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 학번/교직원번호입니다.'
        });
      }
    }

    // 사용자 생성
    const mappedDepartment = department ? mapDepartment(department) : undefined;
    if (department && !mappedDepartment) {
      return res.status(400).json({
        success: false,
        message: '지원되지 않는 학과입니다.'
      });
    }

    const newUser = await createUser({
      user_id: user_id || `temp_${Date.now()}`, // 임시 ID 생성
      name,
      email,
      password,
      role: role.toUpperCase() as Role,
      department: mappedDepartment
    });

    // 활동 로그 생성
    await createActivity(newUser.id, 'LOGIN', '회원가입', '새 계정이 생성되었습니다.');

    // JWT 토큰 생성
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: '회원가입이 완료되었습니다.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 인증
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '잘못된 이메일 또는 비밀번호입니다.'
      });
    }

    // 활동 로그 생성
    await createActivity(user.id, 'LOGIN', '로그인', '시스템에 로그인했습니다.');

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: '로그인 성공'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 로그아웃 (토큰 무효화는 클라이언트에서 처리)
router.post('/logout', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

// 프로필 조회 (인증 필요)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // 미들웨어에서 설정된 사용자 정보 사용
    const user = (req as any).user as { id: string; email: string; role: string };
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    // 최신 사용자 정보 조회
    const currentUser = await findUserById(user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = currentUser;

    return res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router;