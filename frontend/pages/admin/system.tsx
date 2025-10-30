import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { adminAPI } from '../../src/services/api';
import { saveRuntimeSettings } from '../../src/utils/runtimeConfig';
import type { AdminSystemSettings } from '../../src/types';

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await adminAPI.getSettings();
        if (r.success && r.data) setSettings(r.data);
      } catch {}
    })();
  }, []);

  const update = async (patch: Partial<AdminSystemSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      setSaving(true);
      const r = await adminAPI.updateSettings(next);
      if (r.success && r.data) setSettings(r.data);
      // persist to runtime to immediately reflect in UI
      saveRuntimeSettings(patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">시스템 설정</h1>
          {!settings ? (
            <div className="text-gray-600">불러오는 중...</div>
          ) : (
            <div className="space-y-6 bg-white rounded border p-6">
              <Toggle label="전역 챗봇 활성화" checked={!!settings.enableGlobalChat} onChange={(v) => update({ enableGlobalChat: v })} />
              <Toggle label="PDF 파싱 활성화" checked={!!settings.enablePdfParsing} onChange={(v) => update({ enablePdfParsing: v })} />
              <div>
                <label className="text-sm text-gray-600">기본 테마</label>
                <select value={'light'} disabled className="mt-1 block border rounded px-3 py-2 opacity-60 cursor-not-allowed">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">테마는 라이트(흰색)으로 고정되어 있습니다.</p>
              </div>
              <Toggle label="고급 분석(Analytics) 활성화" checked={!!settings.analytics?.enabled} onChange={(v) => update({ analytics: { enabled: v } })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="컴팩트 모드" checked={!!settings.compactMode} onChange={(v) => update({ compactMode: v })} />
                <Toggle label="애니메이션" checked={settings.animation !== false} onChange={(v) => update({ animation: v })} />
                <Toggle label="상단 시스템 배너 표시" checked={settings.showSystemBanner !== false} onChange={(v) => update({ showSystemBanner: v })} />
                <div>
                  <label className="text-sm text-gray-600">언어</label>
                  <select value={settings.language || 'ko'} onChange={(e) => update({ language: e.target.value })} className="mt-1 block border rounded px-3 py-2">
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">{saving ? '저장 중...' : '저장됨'}</div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-gray-800">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full relative transition ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 ${checked ? 'left-6' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition`} />
      </button>
    </label>
  );
}
