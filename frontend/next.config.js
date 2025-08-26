/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 환경변수 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_PARSER_API_URL: process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001',
  },

  // 이미지 최적화 설정
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: true
  },

  // API 리라이트 (개발 환경에서만)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*'
        },
        {
          source: '/parser/:path*', 
          destination: 'http://localhost:8001/:path*'
        }
      ];
    }
    return [];
  },

  // 빌드 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // 실험적 기능 비활성화
  experimental: {
    esmExternals: false,
  },

  // 페이지 확장자 설정
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig; 