import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getAuthToken } from '../utils/auth-helpers.js';

// カスタムメトリクス
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// テスト設定
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ウォームアップ
    { duration: '2m', target: 50 },   // 負荷を徐々に上げる
    { duration: '3m', target: 50 },   // 定常状態
    { duration: '30s', target: 0 },   // クールダウン
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95%のリクエストが1秒以内
    'http_req_duration': ['p(99)<2000'], // 99%のリクエストが2秒以内
    'errors': ['rate<0.01'],             // エラー率1%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // テスト用ユーザーでログインしてトークンを取得
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'test@example.com',
      password: __ENV.TEST_USER_PASSWORD || 'Test1234!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const authData = JSON.parse(loginRes.body);
  return { token: authData.token };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 各APIエンドポイントをテスト
  const endpoints = [
    { method: 'GET', path: '/api/reports', name: 'Get Reports List' },
    { method: 'GET', path: '/api/reports/1', name: 'Get Report Detail' },
    { method: 'GET', path: '/api/customers', name: 'Get Customers' },
    { method: 'GET', path: '/api/sales-persons', name: 'Get Sales Persons' },
    { method: 'GET', path: '/api/auth/me', name: 'Get Current User' },
  ];

  endpoints.forEach(endpoint => {
    const res = http[endpoint.method.toLowerCase()](
      `${BASE_URL}${endpoint.path}`,
      null,
      { headers, tags: { name: endpoint.name } }
    );

    // レスポンスチェック
    const result = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!result);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(1); // 1秒待機
}

export function handleSummary(data) {
  return {
    'api-response-time-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  
  let summary = `\n${indent}=== API Response Time Test Results ===\n\n`;
  
  // HTTP duration metrics
  const httpDuration = data.metrics['http_req_duration'];
  if (httpDuration) {
    summary += `${indent}Response Times:\n`;
    summary += `${indent}  Median: ${httpDuration.values.med.toFixed(2)}ms\n`;
    summary += `${indent}  95th percentile: ${httpDuration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  99th percentile: ${httpDuration.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  // Error rate
  const errors = data.metrics['errors'];
  if (errors) {
    summary += `${indent}Error Rate: ${(errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  // Thresholds
  summary += `\n${indent}Thresholds:\n`;
  for (const [key, value] of Object.entries(data.thresholds || {})) {
    const status = value.ok ? '✓' : '✗';
    summary += `${indent}  ${status} ${key}\n`;
  }
  
  return summary;
}