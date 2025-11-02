import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { normalizeDepartment, getDepartmentDashboardPath } from '../../src/config/departments';

export default function StudentRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr) as { department?: string };
        if (u?.department) {
          const depKey = normalizeDepartment(u.department);
          const path = getDepartmentDashboardPath(depKey);
          if (router.asPath !== path) {
            router.replace(path).catch(() => void 0);
            return;
          }
        }
      }
    } catch {}
    // fallback: general dashboard
    router.replace('/dashboard').catch(() => void 0);
  }, [router]);
  return null;
}
