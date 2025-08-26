import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  HelpCircle, 
  Eye, 
  EyeOff,
  AlertCircle 
} from 'lucide-react';
import apiClient from '../services/api';

const LoginSidebar = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        user_id: formData.userId,
        password: formData.password,
      });

      if (response.data && response.data.access_token) {
        // 토큰과 사용자 정보 저장
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 역할에 따라 리다이렉트
        const userRole = response.data.user.role;
        if (userRole === 'professor') {
          navigate('/professor/dashboard');
        } else if (userRole === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindAccount = () => {
    // ID/PW 찾기 기능 구현
    alert('ID/PW 찾기 기능은 준비 중입니다.');
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-5">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🔐</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">로그인</h2>
        <p className="text-sm text-gray-600">계정에 로그인하세요</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle size={16} className="text-red-500 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <LogIn size={16} className="mr-2" />
          )}
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            to="/register"
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <UserPlus size={16} className="mr-2" />
            회원가입
          </Link>
          
          <button
            onClick={handleFindAccount}
            className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <HelpCircle size={16} className="mr-2" />
            ID/PW 찾기
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          * 소셜 로그인은 테스트 기간 동안 비활성화됩니다
        </p>
      </div>
    </div>
  );
};

export default LoginSidebar;
