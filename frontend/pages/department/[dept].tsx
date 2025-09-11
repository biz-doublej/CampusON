import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function DepartmentRedirectPage() {
  const router = useRouter();
  const { dept } = router.query as { dept?: string };

  useEffect(() => {
    if (!dept) return;
    const normalized = String(dept).toLowerCase();
    // map known aliases with hyphen
    const alias = normalized.replace('_', '-');
    // if already lowercase route exists, redirect there
    if (router.asPath !== `/department/${alias}`) {
      router.replace(`/department/${alias}`).catch(() => void 0);
    }
  }, [dept]);

  return null;
}

