import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// カスタムメトリクス
const errorRate = new Rate('errors');
const searchTime = new Trend('search_response_time');
const complexSearchTime = new Trend('complex_search_time');

// テスト設定
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ウォームアップ
    { duration: '2m', target: 80 },    // 負荷を徐々に上げる
    { duration: '3m', target: 100 },   // 100同時ユーザーで維持
    { duration: '30s', target: 0 },    // クールダウン
  ],
  thresholds: {
    'search_response_time': ['p(95)<2000'],     // 95%が2秒以内
    'complex_search_time': ['p(95)<3000'],      // 複雑な検索も3秒以内
    'errors': ['rate<0.01'],                    // エラー率1%未満
    'http_req_failed': ['rate<0.01'],           // HTTPエラー率1%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // テストユーザーでログイン
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
  
  // 検索用のテストデータを準備
  const salesPersons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const dateRanges = generateDateRanges();
  const searchKeywords = ['新規', '提案', '見積', '契約', '訪問', '相談', '課題', '計画'];
  
  return { 
    token: authData.token,
    salesPersons,
    dateRanges,
    searchKeywords
  };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // ランダムに検索タイプを選択
  const searchType = Math.random();
  
  if (searchType < 0.3) {
    // 単純な日付範囲検索
    performDateRangeSearch(headers, data);
  } else if (searchType < 0.6) {
    // 営業担当者による検索
    performSalesPersonSearch(headers, data);
  } else if (searchType < 0.8) {
    // 複合条件検索
    performComplexSearch(headers, data);
  } else {
    // 全文検索（実装されている場合）
    performFullTextSearch(headers, data);
  }

  // 実際のユーザー行動をシミュレート
  sleep(Math.random() * 2 + 1); // 1-3秒待機
}

function performDateRangeSearch(headers, data) {
  const dateRange = data.dateRanges[Math.floor(Math.random() * data.dateRanges.length)];
  
  const startTime = Date.now();
  const res = http.get(
    `${BASE_URL}/api/reports?start_date=${dateRange.start}&end_date=${dateRange.end}`,
    { 
      headers,
      tags: { search_type: 'date_range' }
    }
  );
  const responseTime = Date.now() - startTime;

  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'response time < 2s': () => responseTime < 2000,
  });

  errorRate.add(!result);
  searchTime.add(responseTime);
}

function performSalesPersonSearch(headers, data) {
  const salesPersonId = data.salesPersons[Math.floor(Math.random() * data.salesPersons.length)];
  
  const startTime = Date.now();
  const res = http.get(
    `${BASE_URL}/api/reports?sales_person_id=${salesPersonId}&per_page=50`,
    { 
      headers,
      tags: { search_type: 'sales_person' }
    }
  );
  const responseTime = Date.now() - startTime;

  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'response time < 2s': () => responseTime < 2000,
  });

  errorRate.add(!result);
  searchTime.add(responseTime);
}

function performComplexSearch(headers, data) {
  const dateRange = data.dateRanges[Math.floor(Math.random() * data.dateRanges.length)];
  const salesPersonId = data.salesPersons[Math.floor(Math.random() * data.salesPersons.length)];
  const page = Math.floor(Math.random() * 5) + 1;
  
  const params = new URLSearchParams({
    start_date: dateRange.start,
    end_date: dateRange.end,
    sales_person_id: salesPersonId,
    page: page,
    per_page: 20,
  });
  
  const startTime = Date.now();
  const res = http.get(
    `${BASE_URL}/api/reports?${params.toString()}`,
    { 
      headers,
      tags: { search_type: 'complex' }
    }
  );
  const responseTime = Date.now() - startTime;

  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'has pagination info': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.pagination && body.pagination.total !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 3s': () => responseTime < 3000,
  });

  errorRate.add(!result);
  complexSearchTime.add(responseTime);
}

function performFullTextSearch(headers, data) {
  const keyword = data.searchKeywords[Math.floor(Math.random() * data.searchKeywords.length)];
  
  // キーワード検索エンドポイント（実装されている場合）
  const startTime = Date.now();
  const res = http.get(
    `${BASE_URL}/api/reports?search=${encodeURIComponent(keyword)}`,
    { 
      headers,
      tags: { search_type: 'full_text' }
    }
  );
  const responseTime = Date.now() - startTime;

  // 全文検索が実装されていない場合も考慮
  const isNotImplemented = res.status === 400 || res.status === 404;
  
  if (!isNotImplemented) {
    const result = check(res, {
      'status is 200': (r) => r.status === 200,
      'has results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
      'response time < 3s': () => responseTime < 3000,
    });

    errorRate.add(!result);
    searchTime.add(responseTime);
  }
}

function generateDateRanges() {
  const ranges = [];
  const now = new Date();
  
  // 様々な期間の日付範囲を生成
  const periods = [
    { days: 7, name: 'week' },
    { days: 30, name: 'month' },
    { days: 90, name: 'quarter' },
    { days: 180, name: 'half_year' },
    { days: 365, name: 'year' },
  ];
  
  periods.forEach(period => {
    for (let i = 0; i < 3; i++) {
      const end = new Date(now);
      end.setDate(end.getDate() - (i * period.days));
      const start = new Date(end);
      start.setDate(start.getDate() - period.days);
      
      ranges.push({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        type: period.name,
      });
    }
  });
  
  return ranges;
}

export function handleSummary(data) {
  return {
    'search-performance-summary.json': JSON.stringify(data),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n=== Search Performance Test Results ===\n\n';
  
  // Search time metrics
  const searchTimeMetric = data.metrics['search_response_time'];
  if (searchTimeMetric) {
    summary += 'Search Response Times:\n';
    summary += `  Median: ${searchTimeMetric.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${searchTimeMetric.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  99th percentile: ${searchTimeMetric.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  // Complex search metrics
  const complexSearchMetric = data.metrics['complex_search_time'];
  if (complexSearchMetric && complexSearchMetric.values.count > 0) {
    summary += 'Complex Search Times:\n';
    summary += `  Median: ${complexSearchMetric.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${complexSearchMetric.values['p(95)'].toFixed(2)}ms\n\n`;
  }
  
  // Error rate
  const errors = data.metrics['errors'];
  if (errors) {
    summary += `Error Rate: ${(errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  // HTTP metrics
  const httpFailed = data.metrics['http_req_failed'];
  if (httpFailed) {
    summary += `HTTP Failure Rate: ${(httpFailed.values.rate * 100).toFixed(2)}%\n`;
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