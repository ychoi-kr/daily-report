import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// カスタムメトリクス
const errorRate = new Rate('errors');
const createTime = new Trend('report_create_time');
const successRate = new Rate('create_success_rate');

// テスト設定
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ウォームアップ
    { duration: '1m', target: 30 },    // 負荷を徐々に上げる
    { duration: '3m', target: 50 },    // 50同時ユーザーで維持
    { duration: '30s', target: 0 },    // クールダウン
  ],
  thresholds: {
    'report_create_time': ['p(95)<2000'],     // 95%が2秒以内
    'report_create_time': ['p(99)<3000'],     // 99%が3秒以内
    'create_success_rate': ['rate>0.99'],     // 成功率99%以上
    'errors': ['rate<0.01'],                  // エラー率1%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// テストデータ用の顧客IDリスト
const customers = new SharedArray('customers', function () {
  return Array.from({ length: 100 }, (_, i) => i + 1);
});

export function setup() {
  // テストユーザーでログイン
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: `sales${i}@example.com`,
        password: 'Test1234!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (loginRes.status === 200) {
      const authData = JSON.parse(loginRes.body);
      users.push({ 
        token: authData.token, 
        userId: authData.user.id,
        name: authData.user.name 
      });
    }
  }
  
  return { users };
}

export default function (data) {
  // ランダムなユーザーを選択
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  // 日報作成用のデータを生成
  const reportDate = generateRandomDate();
  const visitCount = Math.floor(Math.random() * 5) + 1; // 1-5件の訪問記録
  
  const reportData = {
    report_date: reportDate,
    problem: generateProblemText(),
    plan: generatePlanText(),
    visits: generateVisits(visitCount),
  };

  // 日報作成リクエスト
  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/api/reports`,
    JSON.stringify(reportData),
    { headers }
  );
  const responseTime = Date.now() - startTime;

  // レスポンスチェック
  const isSuccess = res.status === 201 || res.status === 200;
  const result = check(res, {
    'status is 201 or 200': () => isSuccess,
    'response has id': (r) => {
      if (!isSuccess) return false;
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 2s': () => responseTime < 2000,
  });

  // 重複エラーの場合は成功として扱う（同一日付の日報作成試行）
  const isDuplicateError = res.status === 409 || 
    (res.status === 400 && res.body.includes('duplicate'));
  
  errorRate.add(!result && !isDuplicateError);
  successRate.add(isSuccess || isDuplicateError);
  createTime.add(responseTime);

  // 実際のユーザー行動をシミュレート
  sleep(Math.random() * 3 + 2); // 2-5秒待機
}

function generateRandomDate() {
  const now = new Date();
  const daysBack = Math.floor(Math.random() * 30); // 過去30日間のランダムな日付
  now.setDate(now.getDate() - daysBack);
  return now.toISOString().split('T')[0];
}

function generateProblemText() {
  const problems = [
    '新規開拓の進捗が遅れています。リード獲得の施策を検討する必要があります。',
    '競合他社の新サービスについて顧客から問い合わせがありました。対応策の検討が必要です。',
    '既存顧客からの追加発注が予想を下回っています。フォローアップが必要です。',
    '提案書の作成に時間がかかりすぎています。効率化の方法を考える必要があります。',
    '顧客からの技術的な質問に即答できないケースが増えています。',
  ];
  return problems[Math.floor(Math.random() * problems.length)];
}

function generatePlanText() {
  const plans = [
    '明日はABC商事への見積もり作成と、新規リスト50件への電話アプローチを行います。',
    'XYZ工業への提案書を完成させ、午後に訪問してプレゼンテーションを実施します。',
    '既存顧客3社を訪問し、追加提案の機会を探ります。',
    '新製品の勉強会に参加し、その後2件の商談を予定しています。',
    '月次レポートの作成と、来月の活動計画を立案します。',
  ];
  return plans[Math.floor(Math.random() * plans.length)];
}

function generateVisits(count) {
  const visits = [];
  const contents = [
    '新商品の提案を実施。次回見積もり提出予定。',
    '既存システムの保守相談。追加機能の要望あり。',
    '定期訪問。現状のヒアリングと課題の確認。',
    '見積もり提出と詳細説明。前向きに検討いただける。',
    'クレーム対応。問題は解決し、関係修復。',
  ];
  
  for (let i = 0; i < count; i++) {
    const hour = 9 + Math.floor(Math.random() * 9); // 9-17時
    const minute = Math.floor(Math.random() * 60);
    
    visits.push({
      customer_id: customers[Math.floor(Math.random() * customers.length)],
      visit_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      visit_content: contents[Math.floor(Math.random() * contents.length)],
    });
  }
  
  return visits;
}

export function handleSummary(data) {
  return {
    'reports-create-performance-summary.json': JSON.stringify(data),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n=== Report Creation Performance Test Results ===\n\n';
  
  // Create time metrics
  const createTimeMetric = data.metrics['report_create_time'];
  if (createTimeMetric) {
    summary += 'Creation Times:\n';
    summary += `  Median: ${createTimeMetric.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${createTimeMetric.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  99th percentile: ${createTimeMetric.values['p(99)'].toFixed(2)}ms\n`;
    summary += `  Max: ${createTimeMetric.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Success rate
  const successRateMetric = data.metrics['create_success_rate'];
  if (successRateMetric) {
    summary += `Success Rate: ${(successRateMetric.values.rate * 100).toFixed(2)}%\n`;
  }
  
  // Error rate
  const errors = data.metrics['errors'];
  if (errors) {
    summary += `Error Rate: ${(errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  // Total requests
  const reqCount = data.metrics['http_reqs'];
  if (reqCount) {
    summary += `Total Requests: ${reqCount.values.count}\n`;
    summary += `Request Rate: ${reqCount.values.rate.toFixed(2)} req/s\n`;
  }
  
  // Thresholds
  summary += '\nThresholds:\n';
  for (const [key, value] of Object.entries(data.thresholds || {})) {
    const status = value.ok ? '✓' : '✗';
    summary += `  ${status} ${key}\n`;
  }
  
  return summary;
}