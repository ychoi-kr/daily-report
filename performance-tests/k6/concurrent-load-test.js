import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// カスタムメトリクス
const errorRate = new Rate('errors');
const successRate = new Rate('success_rate');
const concurrentUsers = new Counter('concurrent_users');
const responseTime = new Trend('avg_response_time');

// 各操作のメトリクス
const loginTime = new Trend('login_time');
const listViewTime = new Trend('list_view_time');
const reportCreateTime = new Trend('report_create_time');
const reportViewTime = new Trend('report_view_time');

// テスト設定
export const options = {
  stages: [
    { duration: '1m', target: 25 },    // 25ユーザーまで増加
    { duration: '1m', target: 50 },    // 50ユーザーまで増加
    { duration: '1m', target: 75 },    // 75ユーザーまで増加
    { duration: '3m', target: 100 },   // 100ユーザーまで増加して維持
    { duration: '5m', target: 100 },   // 100ユーザーで5分間維持
    { duration: '2m', target: 0 },     // クールダウン
  ],
  thresholds: {
    'errors': ['rate<0.01'],                    // エラー率1%未満
    'success_rate': ['rate>0.99'],              // 成功率99%以上
    'avg_response_time': ['p(95)<3000'],        // 95%が3秒以内
    'http_req_failed': ['rate<0.01'],           // HTTPエラー率1%未満
    'http_req_duration': ['p(95)<3000'],        // HTTPリクエストの95%が3秒以内
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // 100ユーザー分のアカウント情報を準備
  const users = [];
  for (let i = 1; i <= 100; i++) {
    users.push({
      email: `user${i}@example.com`,
      password: 'Test1234!',
      id: i,
    });
  }
  
  // 顧客IDリスト
  const customerIds = Array.from({ length: 50 }, (_, i) => i + 1);
  
  return { users, customerIds };
}

export default function (data) {
  // VUごとに異なるユーザーを割り当て
  const vuId = __VU;
  const userIndex = (vuId - 1) % data.users.length;
  const user = data.users[userIndex];
  
  concurrentUsers.add(1);
  
  // ユーザーの典型的な操作フローをシミュレート
  group('User Session', function () {
    let token = null;
    let userId = null;
    
    // 1. ログイン
    group('Login', function () {
      const startTime = Date.now();
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
          email: user.email,
          password: user.password,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'Login' },
        }
      );
      const duration = Date.now() - startTime;
      loginTime.add(duration);
      
      const loginSuccess = check(loginRes, {
        'login successful': (r) => r.status === 200,
        'received token': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.token !== undefined;
          } catch {
            return false;
          }
        },
      });
      
      if (loginSuccess) {
        const authData = JSON.parse(loginRes.body);
        token = authData.token;
        userId = authData.user.id;
      } else {
        errorRate.add(1);
        return; // ログイン失敗時は以降の処理をスキップ
      }
      
      sleep(1);
    });
    
    if (!token) return;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // 2. 日報一覧の表示
    group('View Reports List', function () {
      const startTime = Date.now();
      const listRes = http.get(
        `${BASE_URL}/api/reports?page=1&per_page=20`,
        {
          headers,
          tags: { name: 'View Reports List' },
        }
      );
      const duration = Date.now() - startTime;
      listViewTime.add(duration);
      responseTime.add(duration);
      
      const listSuccess = check(listRes, {
        'list loaded': (r) => r.status === 200,
        'has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data !== undefined;
          } catch {
            return false;
          }
        },
      });
      
      if (!listSuccess) {
        errorRate.add(1);
      }
      
      sleep(Math.random() * 2 + 1); // 1-3秒待機
    });
    
    // 3. ランダムに日報作成または既存日報の閲覧
    if (Math.random() < 0.3) {
      // 30%の確率で日報作成
      group('Create Report', function () {
        const reportData = generateReportData(data.customerIds);
        
        const startTime = Date.now();
        const createRes = http.post(
          `${BASE_URL}/api/reports`,
          JSON.stringify(reportData),
          {
            headers,
            tags: { name: 'Create Report' },
          }
        );
        const duration = Date.now() - startTime;
        reportCreateTime.add(duration);
        responseTime.add(duration);
        
        const createSuccess = check(createRes, {
          'report created': (r) => r.status === 201 || r.status === 200 || r.status === 409, // 409は重複エラー
          'response time < 3s': () => duration < 3000,
        });
        
        if (!createSuccess && createRes.status !== 409) {
          errorRate.add(1);
        }
        
        sleep(2);
      });
    } else {
      // 70%の確率で既存日報の閲覧
      group('View Report Detail', function () {
        const reportId = Math.floor(Math.random() * 100) + 1;
        
        const startTime = Date.now();
        const detailRes = http.get(
          `${BASE_URL}/api/reports/${reportId}`,
          {
            headers,
            tags: { name: 'View Report Detail' },
          }
        );
        const duration = Date.now() - startTime;
        reportViewTime.add(duration);
        responseTime.add(duration);
        
        const viewSuccess = check(detailRes, {
          'report loaded': (r) => r.status === 200 || r.status === 404, // 404も許容
          'response time < 3s': () => duration < 3000,
        });
        
        if (!viewSuccess && detailRes.status !== 404) {
          errorRate.add(1);
        }
        
        sleep(Math.random() * 3 + 2); // 2-5秒待機
      });
    }
    
    // 4. 追加の操作（顧客一覧の取得など）
    if (Math.random() < 0.5) {
      group('View Customers', function () {
        const startTime = Date.now();
        const customersRes = http.get(
          `${BASE_URL}/api/customers?page=1&per_page=20`,
          {
            headers,
            tags: { name: 'View Customers' },
          }
        );
        const duration = Date.now() - startTime;
        responseTime.add(duration);
        
        const customersSuccess = check(customersRes, {
          'customers loaded': (r) => r.status === 200,
        });
        
        if (!customersSuccess) {
          errorRate.add(1);
        }
        
        sleep(1);
      });
    }
    
    // 5. ログアウト
    group('Logout', function () {
      const logoutRes = http.post(
        `${BASE_URL}/api/auth/logout`,
        null,
        {
          headers,
          tags: { name: 'Logout' },
        }
      );
      
      check(logoutRes, {
        'logout successful': (r) => r.status === 204 || r.status === 200,
      });
    });
  });
  
  // セッション間の待機時間
  sleep(Math.random() * 5 + 5); // 5-10秒待機
}

function generateReportData(customerIds) {
  const now = new Date();
  const daysBack = Math.floor(Math.random() * 7);
  now.setDate(now.getDate() - daysBack);
  
  const visitCount = Math.floor(Math.random() * 3) + 1;
  const visits = [];
  
  for (let i = 0; i < visitCount; i++) {
    visits.push({
      customer_id: customerIds[Math.floor(Math.random() * customerIds.length)],
      visit_time: `${9 + Math.floor(Math.random() * 9)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      visit_content: 'テスト訪問記録 - 性能テスト実施中',
    });
  }
  
  return {
    report_date: now.toISOString().split('T')[0],
    problem: '性能テスト実施中の課題記載',
    plan: '性能テスト完了後の計画',
    visits: visits,
  };
}

export function handleSummary(data) {
  return {
    'concurrent-load-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n=== Concurrent Load Test Results (100 Users) ===\n\n';
  
  // Overall metrics
  summary += 'Overall Performance:\n';
  
  const avgResponse = data.metrics['avg_response_time'];
  if (avgResponse) {
    summary += `  Average Response Time: ${avgResponse.values.avg.toFixed(2)}ms\n`;
    summary += `  Median Response Time: ${avgResponse.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${avgResponse.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  99th percentile: ${avgResponse.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  // Operation-specific metrics
  summary += 'Operation Performance:\n';
  
  const operations = [
    { metric: 'login_time', name: 'Login' },
    { metric: 'list_view_time', name: 'List View' },
    { metric: 'report_create_time', name: 'Report Creation' },
    { metric: 'report_view_time', name: 'Report Detail View' },
  ];
  
  operations.forEach(op => {
    const metric = data.metrics[op.metric];
    if (metric && metric.values.count > 0) {
      summary += `  ${op.name}:\n`;
      summary += `    Median: ${metric.values.med.toFixed(2)}ms\n`;
      summary += `    95th percentile: ${metric.values['p(95)'].toFixed(2)}ms\n`;
    }
  });
  
  summary += '\n';
  
  // Error metrics
  const errors = data.metrics['errors'];
  if (errors) {
    summary += `Error Rate: ${(errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  const httpFailed = data.metrics['http_req_failed'];
  if (httpFailed) {
    summary += `HTTP Failure Rate: ${(httpFailed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  // Request metrics
  const reqCount = data.metrics['http_reqs'];
  if (reqCount) {
    summary += `\nTotal Requests: ${reqCount.values.count}\n`;
    summary += `Request Rate: ${reqCount.values.rate.toFixed(2)} req/s\n`;
  }
  
  const reqDuration = data.metrics['http_req_duration'];
  if (reqDuration) {
    summary += `\nHTTP Request Duration:\n`;
    summary += `  Median: ${reqDuration.values.med.toFixed(2)}ms\n`;
    summary += `  95th percentile: ${reqDuration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  99th percentile: ${reqDuration.values['p(99)'].toFixed(2)}ms\n`;
  }
  
  // VUs metrics
  const vus = data.metrics['vus'];
  if (vus) {
    summary += `\nVirtual Users:\n`;
    summary += `  Max: ${vus.values.max}\n`;
  }
  
  // Thresholds
  summary += '\nThresholds:\n';
  for (const [key, value] of Object.entries(data.thresholds || {})) {
    const status = value.ok ? '✓ PASS' : '✗ FAIL';
    summary += `  ${status}: ${key}\n`;
  }
  
  // Summary conclusion
  const allThresholdsPassed = Object.values(data.thresholds || {}).every(t => t.ok);
  summary += '\n' + '='.repeat(50) + '\n';
  if (allThresholdsPassed) {
    summary += 'RESULT: All performance thresholds PASSED ✓\n';
    summary += 'The system can handle 100 concurrent users successfully.\n';
  } else {
    summary += 'RESULT: Some performance thresholds FAILED ✗\n';
    summary += 'Performance optimization may be required.\n';
  }
  
  return summary;
}