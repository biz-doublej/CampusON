import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CommunityRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/community/boards').catch(() => void 0);
  }, []);
  return null;
}
