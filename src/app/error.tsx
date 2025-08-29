'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-600 mb-8">
          申し訳ございません。予期しないエラーが発生しました。
          問題が解決しない場合は、システム管理者にお問い合わせください。
        </p>
        <button onClick={reset} className="btn-primary mr-4">
          もう一度試す
        </button>
        <Link href="/" className="btn-secondary">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
