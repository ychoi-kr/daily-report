import Link from 'next/link';

export default function HelpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">영업 일일 보고 시스템</h1>
          <p className="text-lg text-gray-600">
            영업 담당자가 일일 활동을 보고하고 상사가 피드백을 제공하는 시스템입니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🚀 빠른 시작</h2>
            <p className="text-gray-600 mb-4">
              시스템을 이용하려면 먼저 로그인해주세요.
            </p>
            <Link href="/login" className="btn-primary">
              로그인 페이지로
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">📊 일일 보고 관리</h2>
            <p className="text-gray-600 mb-4">
              일일 보고의 작성, 열람, 관리를 효율적으로 수행합니다.
            </p>
            <Link href="/reports" className="btn-secondary">
              일일 보고 목록으로
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">👥 고객 관리</h2>
            <p className="text-gray-600 mb-4">
              방문한 고객 정보를 일원화하여 관리합니다.
            </p>
            <Link href="/customers" className="btn-secondary">
              고객 관리로
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">👥 영업 담당자 관리</h2>
            <p className="text-gray-600 mb-4">
              영업 담당자의 정보를 관리합니다 (관리자 전용).
            </p>
            <Link href="/sales-persons" className="btn-secondary">
              영업 담당자 관리로
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 영업 일일 보고 시스템. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
