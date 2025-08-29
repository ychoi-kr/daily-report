import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">営業日報システム</h1>
          <p className="text-lg text-gray-600">
            営業担当者が日々の活動を報告し、上長がフィードバックを行うためのシステムです
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🚀 クイックスタート</h2>
            <p className="text-gray-600 mb-4">
              システムを利用開始するには、まずログインしてください。
            </p>
            <Link href="/login" className="btn-primary">
              ログインページへ
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">📊 日報管理</h2>
            <p className="text-gray-600 mb-4">
              日報の作成、閲覧、管理を効率的に行えます。
            </p>
            <Link href="/reports" className="btn-secondary">
              日報一覧へ
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">👥 顧客管理</h2>
            <p className="text-gray-600 mb-4">
              訪問先の顧客情報を一元管理できます。
            </p>
            <Link href="/customers" className="btn-secondary">
              顧客管理へ
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">⚙️ システム設定</h2>
            <p className="text-gray-600 mb-4">
              営業担当者やシステムの設定を管理できます。
            </p>
            <Link href="/settings" className="btn-secondary">
              設定へ
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 営業日報システム. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
