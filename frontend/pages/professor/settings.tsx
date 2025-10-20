import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { authAPI } from '@/services/api';
import type {
  UserSettings,
  UserAccountPreferences,
  UserNotificationPreferences,
  SocialProvider,
} from '@/types';

const DEFAULT_ACCOUNT: UserAccountPreferences = {
  language: 'ko',
  timezone: 'Asia/Seoul',
};

const DEFAULT_NOTIFICATIONS: UserNotificationPreferences = {
  email: true,
  sms: false,
  push: true,
  digest: true,
};

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어 (Korean)' },
  { value: 'en', label: 'English' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+09:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+09:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+00:00)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-05:00)' },
];

const SOCIAL_PROVIDERS: Record<
  SocialProvider,
  { label: string; description: string; accent: string }
> = {
  kakao: {
    label: '카카오',
    description: '카카오 계정으로 빠르게 로그인하고 알림을 받을 수 있습니다.',
    accent: 'text-yellow-500',
  },
  google: {
    label: 'Google',
    description: 'Google Workspace와 연동하여 과제와 캘린더를 싱크합니다.',
    accent: 'text-red-500',
  },
};

type FeedbackState = { type: 'success' | 'error'; text: string } | null;

export default function ProfessorSettingsPage() {
  const parserApi = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [accountForm, setAccountForm] = useState<UserAccountPreferences>(DEFAULT_ACCOUNT);
  const [notificationForm, setNotificationForm] =
    useState<UserNotificationPreferences>(DEFAULT_NOTIFICATIONS);

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [socialInputs, setSocialInputs] = useState<Record<SocialProvider, string>>({
    kakao: '',
    google: '',
  });
  const [socialFeedback, setSocialFeedback] = useState<Record<SocialProvider, FeedbackState>>({
    kakao: null,
    google: null,
  });
  const [socialLoading, setSocialLoading] = useState<Record<SocialProvider, boolean>>({
    kakao: false,
    google: false,
  });

  const applySettings = (data: UserSettings) => {
    setSettings(data);
    setAccountForm({
      language: data.account.language,
      timezone: data.account.timezone,
    });
    setNotificationForm({
      email: data.notifications.email,
      sms: data.notifications.sms,
      push: data.notifications.push,
      digest: data.notifications.digest,
    });
    setSocialInputs({
      kakao: data.social.kakao.externalEmail ?? '',
      google: data.social.google.externalEmail ?? '',
    });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await authAPI.getSettings();
        if (response.success && response.data) {
          applySettings(response.data);
        } else {
          setLoadError(response.message || '설정을 불러오는 데 실패했습니다.');
        }
      } catch (error: any) {
        setLoadError(error?.response?.data?.message || '설정을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleAccountChange = (field: keyof UserAccountPreferences, value: string) => {
    setAccountForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationToggle = (field: keyof UserNotificationPreferences) => {
    setNotificationForm((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePreferencesSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPreferencesMessage(null);
    setPreferencesError(null);
    setSavingPreferences(true);

    try {
      const response = await authAPI.updateSettings({
        account: accountForm,
        notifications: notificationForm,
      });

      if (response.success && response.data) {
        applySettings(response.data);
        setPreferencesMessage('설정이 저장되었습니다.');
      } else {
        setPreferencesError(response.message || '설정을 저장하지 못했습니다.');
      }
    } catch (error: any) {
      setPreferencesError(
        error?.response?.data?.message || '설정을 저장하는 중 오류가 발생했습니다.',
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordInput = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setPasswordMessage(response.message || '비밀번호가 변경되었습니다.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordError(response.message || '비밀번호를 변경하지 못했습니다.');
      }
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.message || '비밀번호를 변경하는 중 오류가 발생했습니다.',
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSocialInputChange = (provider: SocialProvider, value: string) => {
    setSocialInputs((prev) => ({
      ...prev,
      [provider]: value,
    }));
    setSocialFeedback((prev) => ({
      ...prev,
      [provider]: null,
    }));
  };

  const handleSocialUpdate = async (provider: SocialProvider, nextConnected: boolean) => {
    setSocialFeedback((prev) => ({
      ...prev,
      [provider]: null,
    }));

    if (nextConnected && !socialInputs[provider]) {
      setSocialFeedback((prev) => ({
        ...prev,
        [provider]: { type: 'error', text: '연동할 계정 이메일을 입력해주세요.' },
      }));
      return;
    }

    setSocialLoading((prev) => ({
      ...prev,
      [provider]: true,
    }));

    try {
      const response = await authAPI.updateSocialLink({
        provider,
        connected: nextConnected,
        externalEmail: nextConnected ? socialInputs[provider] : null,
      });

      if (response.success && response.data) {
        const updatedLink = response.data;
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                social: {
                  ...prev.social,
                  [provider]: updatedLink,
                },
              }
            : prev,
        );
        setSocialInputs((prev) => ({
          ...prev,
          [provider]: updatedLink.externalEmail ?? '',
        }));
        setSocialFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'success',
            text: nextConnected ? '연동이 완료되었습니다.' : '연동이 해제되었습니다.',
          },
        }));
      } else {
        setSocialFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'error',
            text: response.message || '연동 상태를 변경하지 못했습니다.',
          },
        }));
      }
    } catch (error: any) {
      setSocialFeedback((prev) => ({
        ...prev,
        [provider]: {
          type: 'error',
          text: error?.response?.data?.message || '연동 변경 중 오류가 발생했습니다.',
        },
      }));
    } finally {
      setSocialLoading((prev) => ({
        ...prev,
        [provider]: false,
      }));
    }
  };

  const renderSocialRow = (provider: SocialProvider) => {
    const info = SOCIAL_PROVIDERS[provider];
    const state = settings?.social[provider];
    const feedback = socialFeedback[provider];
    const isConnected = Boolean(state?.connected);

    return (
      <div
        key={provider}
        className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-3">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wide ${info.accent}`}>
              {info.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {isConnected ? `${info.label} 계정이 연동되어 있습니다.` : `${info.label} 계정을 연동하세요`}
            </p>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>

          {isConnected ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              <p>
                연동 이메일: <span className="font-medium">{state?.externalEmail}</span>
              </p>
              {state?.linkedAt ? (
                <p className="mt-1">
                  연동 시각:{' '}
                  {new Date(state.linkedAt).toLocaleString(undefined, {
                    hour12: false,
                  })}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor={`${provider}-email`}>
                연동할 계정 이메일
              </label>
              <input
                id={`${provider}-email`}
                type="email"
                value={socialInputs[provider]}
                onChange={(event) => handleSocialInputChange(provider, event.target.value)}
                placeholder={`${info.label} 이메일을 입력하세요`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          )}

          {feedback ? (
            <div
              className={`rounded-lg px-4 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {feedback.text}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSocialUpdate(provider, !isConnected)}
            disabled={socialLoading[provider]}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              isConnected
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            }`}
          >
            {socialLoading[provider]
              ? '처리 중...'
              : isConnected
                ? `${info.label} 연동 해제`
                : `${info.label} 연동하기`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head>
        <title>설정 - 교수</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">설정</h1>
            <p className="mt-2 text-sm text-gray-500">
              계정 기본 정보와 보안, 소셜 연동을 관리할 수 있는 페이지입니다.
            </p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
              <p className="text-sm text-gray-500">설정을 불러오는 중입니다...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
              {loadError}
            </div>
          ) : !settings ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              표시할 설정 정보가 없습니다.
            </div>
          ) : (
            <div className="space-y-8">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">계정 환경설정</h2>
                    <p className="text-sm text-gray-500">
                      인터페이스 언어와 알림 수신 여부를 설정합니다.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="language">
                        기본 언어
                      </label>
                      <select
                        id="language"
                        value={accountForm.language}
                        onChange={(event) => handleAccountChange('language', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="timezone">
                        기본 시간대
                      </label>
                      <select
                        id="timezone"
                        value={accountForm.timezone}
                        onChange={(event) => handleAccountChange('timezone', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">알림 수신</p>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      {(
                        [
                          { key: 'email', label: '이메일 알림', helper: '과제와 공지사항을 이메일로 받아보세요.' },
                          { key: 'sms', label: 'SMS 알림', helper: '긴급 공지 및 실습 일정 알림을 문자로 전송합니다.' },
                          { key: 'push', label: '푸시 알림', helper: '웹 브라우저 푸시 알림으로 주요 이벤트를 확인합니다.' },
                          { key: 'digest', label: '주간 리포트', helper: '매주 월요일 아침 학습 리포트를 이메일로 전달합니다.' },
                        ] as { key: keyof UserNotificationPreferences; label: string; helper: string }[]
                      ).map((item) => (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 transition hover:border-blue-400 hover:shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={notificationForm[item.key]}
                            onChange={() => handleNotificationToggle(item.key)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <span className="block text-sm font-medium text-gray-800">{item.label}</span>
                            <span className="mt-1 block text-xs text-gray-500">{item.helper}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {preferencesMessage ? (
                    <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                      {preferencesMessage}
                    </div>
                  ) : null}
                  {preferencesError ? (
                    <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                      {preferencesError}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPreferences}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {savingPreferences ? '저장 중...' : '설정 저장'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">비밀번호 변경</h2>
                  <p className="text-sm text-gray-500">
                    현재 비밀번호를 확인한 뒤 새 비밀번호로 교체합니다.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="current-password">
                      현재 비밀번호
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => handlePasswordInput('currentPassword', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="new-password">
                        새 비밀번호
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={(event) => handlePasswordInput('newPassword', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="confirm-password">
                        새 비밀번호 확인
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => handlePasswordInput('confirmPassword', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  {passwordError ? (
                    <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{passwordError}</div>
                  ) : null}
                  {passwordMessage ? (
                    <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                      {passwordMessage}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:bg-gray-400"
                    >
                      {changingPassword ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">소셜 계정 연동</h2>
                  <p className="text-sm text-gray-500">
                    외부 서비스를 연동하면 로그인과 알림이 더 편리해집니다.
                  </p>
                </div>

                <div className="space-y-4">
                  {renderSocialRow('kakao')}
                  {renderSocialRow('google')}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">시스템 정보</h2>
                    <p className="text-sm text-gray-500">
                      프론트엔드와 파서 API 기본 연결 정보를 확인할 수 있습니다.
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <a className="text-blue-600 hover:underline" href="/professor/generate">
                      AI 문제 생성 바로가기
                    </a>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Parser API Base URL
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{parserApi}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      환경 변수 <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_PARSER_API_URL</code> 값을
                      수정하면 변경됩니다.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">빠른 링크</p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-600">
                      <li>
                        <a className="hover:underline" href="/community">
                          커뮤니티
                        </a>
                      </li>
                      <li>
                        <a className="hover:underline" href="/notice-embed">
                          공지 임베드
                        </a>
                      </li>
                      <li>
                        <a className="hover:underline" href="/professor/assignments">
                          과제 관리
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
