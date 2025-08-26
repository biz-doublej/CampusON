// 동적 import를 사용하여 PrismaClient 임포트
const { PrismaClient } = require('@prisma/client');

// Global variable to store Prisma client instance for development hot reloads
declare global {
  var __prisma: any | undefined;
}

// Create or reuse Prisma client instance
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, store the client on the global object
// to prevent multiple instances during hot reloads
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export default prisma;