import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center max-w-md px-4">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>
            <FileQuestion className="relative h-24 w-24 text-primary/80" />
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          ページが見つかりません
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          お探しのページは存在しないか、移動された可能性があります。
          URLをご確認いただくか、ホームページからお探しください。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            前のページへ戻る
          </Button>
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Button>
          </Link>
        </div>

        {/* Additional help */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            問題が解決しない場合は
          </p>
          <Link 
            href="/contact" 
            className="text-sm text-primary hover:underline"
          >
            システム管理者にお問い合わせください
          </Link>
        </div>
      </div>
    </div>
  );
}
