import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// カスタムメトリクス
const errorRate = new Rate('errors');
const listLoadTime = new Trend('reports_list_load_time');

// テスト設定
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ウォームアップ
    { duration: '2m', target: 100 },  // 同時ユーザー100まで増加
    { duration: '3m', target: 100 },  // 100ユーザーで維持
    { duration: '1m', target: 0 },    // クールダウン
  ],
  thresholds: {
    'reports_list_load_time': ['p(95)<3000'], // 95%が3秒以内
    'reports_list_load_time': ['p(99)<5000'], // 99%が5秒以内
    'errors': ['rate<0.01'],                  // エラー率1%未満
    'http_req_failed': ['rate<0.01'],         // HTTPエラー率1%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // 複数のテストユーザーでログイン
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: `test${i}@example.com`,
        password: 'Test1234!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (loginRes.status === 200) {
      const authData = JSON.parse(loginRes.body);
      users.push({ token: authData.token, userId: authData.user.id });
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

  // 異なる検索条件でテスト
  const testCases = [
    { 
      name: 'All Reports', 
      params: '' 
    },
    { 
      name: 'Recent Reports', 
      params: '?start_date=' + getDateString(-7) + '&end_date=' + getDateString(0) 
    },
    { 
      name: 'Reports with Pagination', 
      params: '?page=1&per_page=20' 
    },
    { 
      name: 'Reports by User', 
      params: `?sales_person_id=${user.userId}` 
    },
    { 
      name: 'Large Page Size', 
      params: '?per_page=100' 
    },
  ];

  const testCase = testCases[Math.floor(Math.random() * testCases.length)];
  
  const startTime = Date.now();
  const res = http.get(
    `${BASE_URL}/api/reports${testCase.params}`,
    { 
      headers,
      tags: { name: testCase.name }
    }
  );
  const loadTime = Date.now() - startTime;

  // レスポンスチェック
  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
    'response has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.pagination !== undefined;
      } catch {
        return false;
      }
    },
    'load time < 3s': () => loadTime < 3000,
  });

  errorRate.add(!result);
  listLoadTime.add(loadTime);

  // 実際のユーザー行動をシミュレート（1-3秒のランダム待機）
  sleep(Math.random() * 2 + 1);
}

function getDateString(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export function handleSummary(data) {
  return {
    'reports-list-performance-summary.json': JSON.stringify(data),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n=== Reports List Performance Test Results ===\n\n';
  
  // List load time metrics
  const loadTime = data.metrics['reports_list_load_time'];
  if (loadTime) {
    summary += 'Load Times:\n';
    summary += `  Median: ${loadTime.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${loadTime.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  99th percentile: ${loadTime.values['p(99)'].toFixed(2)}ms\n`;
    summary += `  Max: ${loadTime.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Request metrics
  const reqDuration = data.metrics['http_req_duration'];
  if (reqDuration) {
    summary += 'HTTP Request Duration:\n';
    summary += `  Median: ${reqDuration.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${reqDuration.values['p(95)'].toFixed(2)}ms\n\n`;
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