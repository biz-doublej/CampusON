import { useRouter } from 'next/router';

const StudyAnimation = () => (
  <div className="relative mx-auto h-64 w-full max-w-sm md:h-72">
    <div className="animate-floating absolute inset-x-12 top-6 rounded-3xl bg-white/80 p-6 shadow-[0_25px_50px_-12px_rgba(59,130,246,0.35)] backdrop-blur">
      <div className="space-y-3 text-left">
        <div className="h-3 w-24 rounded-full bg-indigo-200" />
        <div className="h-3 w-32 rounded-full bg-indigo-300" />
        <div className="h-3 w-20 rounded-full bg-indigo-200" />
      </div>
    </div>
    <div className="animate-floating-delayed absolute inset-x-4 bottom-8 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-6 text-white shadow-[0_25px_70px_-18px_rgba(56,189,248,0.45)]">
      <div className="flex items-center gap-4">
        <div className="study-book"></div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Study Mode ON</p>
          <p className="text-indigo-100">지식의 숲에서 경로를 다시 찾고 있어요...</p>
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute inset-0">
      <div className="animate-breathe absolute -left-4 top-6 h-24 w-24 rounded-full bg-indigo-200/60 blur-2xl" />
      <div className="animate-breathe-delay absolute -right-6 bottom-4 h-28 w-28 rounded-full bg-sky-200/60 blur-2xl" />
    </div>
    <style jsx>{`
      .study-book {
        width: 40px;
        height: 32px;
        background: linear-gradient(135deg, #eef2ff 0%, #bfd7ff 100%);
        border-radius: 6px 6px 4px 4px;
        position: relative;
        box-shadow: 0 10px 24px rgba(15, 118, 110, 0.35);
      }
      .study-book::before,
      .study-book::after {
        content: '';
        position: absolute;
        left: 4px;
        right: 4px;
        height: 2px;
        border-radius: 9999px;
        background: rgba(59, 130, 246, 0.25);
      }
      .study-book::before {
        top: 10px;
      }
      .study-book::after {
        top: 18px;
      }
      @keyframes floating {
        0%, 100% { transform: translateY(0px) rotate(-1deg); }
        50% { transform: translateY(-10px) rotate(1deg); }
      }
      @keyframes floatingDelayed {
        0%, 100% { transform: translateY(0px) rotate(2deg); }
        50% { transform: translateY(-12px) rotate(-2deg); }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(0.95); opacity: 0.55; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      .animate-floating { animation: floating 6s ease-in-out infinite; }
      .animate-floating-delayed { animation: floatingDelayed 7s ease-in-out infinite; }
      .animate-breathe { animation: breathe 8s ease-in-out infinite; }
      .animate-breathe-delay { animation: breathe 9s ease-in-out infinite; }
    `}</style>
  </div>
);

export default function Custom404() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-100">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:gap-20">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500 md:text-sm">404 • Page not found</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-[2.9rem] md:leading-[1.2]">
              길을 잠시 잃었어요.<br className="hidden md:block" /> 다시 학습 여정을 이어가 볼까요?
            </h1>
          </div>
          <p className="max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">
            찾으시는 페이지가 존재하지 않거나 이동되었어요. 아래 버튼으로 홈으로 돌아가거나,
            이전 페이지에서 다시 학습을 이어갈 수 있어요.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={handleGoHome}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 sm:w-auto"
            >
              홈으로 이동
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 sm:w-auto"
            >
              이전 페이지
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md md:max-w-lg">
          <StudyAnimation />
        </div>
      </div>
    </div>
  );
}
