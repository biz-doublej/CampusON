import { NextPageContext } from 'next';
import { useRouter } from 'next/router';

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const StudyAnimation = () => (
  <div className="relative mx-auto h-64 w-full max-w-sm md:h-72">
    <div className="animate-floating absolute inset-x-12 top-6 rounded-3xl bg-white/80 p-6 shadow-[0_25px_50px_-12px_rgba(59,130,246,0.35)] backdrop-blur">
      <div className="space-y-3 text-left">
        <div className="h-3 w-24 rounded-full bg-sky-200" />
        <div className="h-3 w-32 rounded-full bg-sky-300" />
        <div className="h-3 w-28 rounded-full bg-indigo-200" />
      </div>
    </div>
    <div className="animate-floating-delayed absolute inset-x-4 bottom-8 rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 p-6 text-white shadow-[0_25px_70px_-18px_rgba(79,70,229,0.45)]">
      <div className="space-y-2 text-sm">
        <p className="font-semibold">Reviewing Lesson Plan</p>
        <p className="text-indigo-100">잠시만요! 학습 자료를 다시 정리하고 있어요.</p>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-indigo-100">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white" />
        <span>캠퍼스ON이 자동으로 복구 중입니다.</span>
      </div>
    </div>
    <div className="pointer-events-none absolute inset-0">
      <div className="animate-breathe absolute -left-6 top-10 h-24 w-24 rounded-full bg-indigo-200/60 blur-2xl" />
      <div className="animate-breathe-delay absolute -right-4 bottom-6 h-28 w-28 rounded-full bg-purple-200/60 blur-2xl" />
    </div>
    <style jsx>{`
      @keyframes floating {
        0%, 100% { transform: translateY(0px) rotate(-1deg); }
        50% { transform: translateY(-10px) rotate(1deg); }
      }
      @keyframes floatingDelayed {
        0%, 100% { transform: translateY(0px) rotate(2deg); }
        50% { transform: translateY(-12px) rotate(-2deg); }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(0.95); opacity: 0.5; }
        50% { transform: scale(1.08); opacity: 0.8; }
      }
      .animate-floating { animation: floating 6s ease-in-out infinite; }
      .animate-floating-delayed { animation: floatingDelayed 7s ease-in-out infinite; }
      .animate-breathe { animation: breathe 8s ease-in-out infinite; }
      .animate-breathe-delay { animation: breathe 9s ease-in-out infinite; }
    `}</style>
  </div>
);

function Error({ statusCode }: ErrorProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const title = statusCode === 404
    ? '찾을 수 없는 페이지'
    : statusCode === 500
      ? '서비스 점검 중입니다'
      : '예상치 못한 오류가 발생했어요';

  const description = statusCode === 404
    ? '요청하신 페이지가 이동되었거나 삭제되었어요. 아래 버튼으로 다시 경로를 안내해 드릴게요.'
    : statusCode === 500
      ? '잠시 서비스를 재정비하고 있습니다. 곧 정상화될 예정이니 잠시 후 다시 시도해주세요.'
      : '잠깐 오류가 발생했어요. 홈으로 이동하거나 이전 페이지로 돌아가 주세요.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:gap-20">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500 md:text-sm">
              {statusCode || 'Error'} • Something happened
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-[2.9rem] md:leading-[1.2]">
              {title}
            </h1>
          </div>
          <p className="max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">{description}</p>
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
          <p className="text-xs text-gray-400">
            문제가 계속된다면 관리자에게 문의해주세요. 빠르게 도와드릴게요.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md md:max-w-lg">
          <StudyAnimation />
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404;
  return { statusCode };
};

export default Error;
