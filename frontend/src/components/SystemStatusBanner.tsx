import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/config';
import { getRuntimeSettings } from '../utils/runtimeConfig';

const nodeBase = getApiUrl();
const pythonBase = (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001')) || '';

export default function SystemStatusBanner() {
  const [nodeOk, setNodeOk] = useState(true);
  const [pyOk, setPyOk] = useState(true);

  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        const r = await fetch(`${nodeBase}/health`, { cache: 'no-store' });
        if (mounted) setNodeOk(r.ok);
      } catch { if (mounted) setNodeOk(false); }
      if (pythonBase) {
        try {
          const r2 = await fetch(`${pythonBase}/api/health`, { cache: 'no-store' });
          if (mounted) setPyOk(r2.ok);
        } catch { if (mounted) setPyOk(false); }
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const show = getRuntimeSettings().showSystemBanner !== false;
  if (!show) return null;
  if (nodeOk && pyOk) return null;

  return (
    <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div>
          {!nodeOk && <span>Node API 연결 불안정</span>}
          {!nodeOk && !pyOk && <span className="mx-2">·</span>}
          {!pyOk && <span>Python AI API 연결 불안정</span>}
        </div>
        <button className="underline" onClick={() => location.reload()}>새로고침</button>
      </div>
    </div>
  );
}
