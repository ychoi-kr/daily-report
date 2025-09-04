import { NextRequest } from 'next/server';

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

// メモリストレージ（本番環境ではRedisを推奨）
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimitUtil {
  private static readonly MAX_ATTEMPTS = 5; // 最大試行回数
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15分のウィンドウ
  private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1分ごとにクリーンアップ

  // 定期的なクリーンアップ
  static {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          rateLimitStore.delete(key);
        }
      }
    }, RateLimitUtil.CLEANUP_INTERVAL_MS);
  }

  /**
   * IPアドレスを取得
   */
  private static getClientIdentifier(request: NextRequest): string {
    // Cloudflare, Vercelなどのプロキシ経由の場合のIPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    const ip =
      cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';

    // IPとユーザーエージェントを組み合わせて識別子を作成
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }

  /**
   * レート制限をチェック
   */
  static checkRateLimit(request: NextRequest): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: Date;
  } {
    const identifier = this.getClientIdentifier(request);
    const now = Date.now();

    let entry = rateLimitStore.get(identifier);

    if (!entry || entry.resetTime < now) {
      // 新規エントリまたはリセット時間経過
      entry = {
        attempts: 0,
        resetTime: now + this.WINDOW_MS,
      };
      rateLimitStore.set(identifier, entry);
    }

    const remainingAttempts = Math.max(0, this.MAX_ATTEMPTS - entry.attempts);
    const allowed = remainingAttempts > 0;

    return {
      allowed,
      remainingAttempts,
      resetTime: new Date(entry.resetTime),
    };
  }

  /**
   * 試行回数を増やす
   */
  static incrementAttempts(request: NextRequest): void {
    const identifier = this.getClientIdentifier(request);
    const entry = rateLimitStore.get(identifier);

    if (entry) {
      entry.attempts++;
    }
  }

  /**
   * 成功時にレート制限をリセット
   */
  static resetRateLimit(request: NextRequest): void {
    const identifier = this.getClientIdentifier(request);
    rateLimitStore.delete(identifier);
  }

  /**
   * レート制限エラーレスポンスのヘッダーを設定
   */
  static setRateLimitHeaders(
    response: Response,
    remainingAttempts: number,
    resetTime: Date
  ): void {
    response.headers.set('X-RateLimit-Limit', this.MAX_ATTEMPTS.toString());
    response.headers.set('X-RateLimit-Remaining', remainingAttempts.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
  }
}
