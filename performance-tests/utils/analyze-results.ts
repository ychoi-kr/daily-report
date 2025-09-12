import * as fs from 'fs';
import * as path from 'path';

interface K6Summary {
  metrics: {
    [key: string]: {
      values: {
        avg?: number;
        min?: number;
        med?: number;
        max?: number;
        'p(90)'?: number;
        'p(95)'?: number;
        'p(99)'?: number;
        count?: number;
        rate?: number;
      };
    };
  };
  thresholds: {
    [key: string]: {
      ok: boolean;
      threshold?: string;
    };
  };
  root_group: {
    name: string;
    groups?: any[];
    checks?: any[];
  };
}

interface TestResult {
  testName: string;
  timestamp: Date;
  summary: K6Summary;
  performance: {
    avgResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    successRate: number;
    requestsPerSecond: number;
    totalRequests: number;
  };
  thresholdsPassed: boolean;
  failedThresholds: string[];
}

interface PerformanceReport {
  generatedAt: Date;
  environment: string;
  tests: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallSuccessRate: number;
    recommendations: string[];
  };
}

class PerformanceAnalyzer {
  private resultsDir: string;
  private outputDir: string;

  constructor(resultsDir: string = './performance-tests/results', outputDir: string = './performance-tests/reports') {
    this.resultsDir = resultsDir;
    this.outputDir = outputDir;
    
    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * k6の結果JSONファイルを読み込んで分析
   */
  async analyzeResults(): Promise<PerformanceReport> {
    const testResults: TestResult[] = [];
    
    // 結果ファイルを検索
    const files = this.findResultFiles();
    
    for (const file of files) {
      const result = await this.analyzeFile(file);
      if (result) {
        testResults.push(result);
      }
    }
    
    // レポート生成
    const report = this.generateReport(testResults);
    
    // レポートを保存
    await this.saveReport(report);
    
    return report;
  }

  /**
   * 結果ファイルを検索
   */
  private findResultFiles(): string[] {
    if (!fs.existsSync(this.resultsDir)) {
      console.warn(`Results directory ${this.resultsDir} does not exist`);
      return [];
    }
    
    const files = fs.readdirSync(this.resultsDir);
    return files
      .filter(file => file.endsWith('-summary.json'))
      .map(file => path.join(this.resultsDir, file));
  }

  /**
   * 個別のファイルを分析
   */
  private async analyzeFile(filePath: string): Promise<TestResult | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const summary: K6Summary = JSON.parse(content);
      
      const testName = path.basename(filePath).replace('-summary.json', '');
      const stats = fs.statSync(filePath);
      
      // パフォーマンスメトリクスを抽出
      const performance = this.extractPerformanceMetrics(summary);
      
      // 閾値のチェック
      const { passed, failed } = this.checkThresholds(summary);
      
      return {
        testName,
        timestamp: stats.mtime,
        summary,
        performance,
        thresholdsPassed: passed,
        failedThresholds: failed,
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * パフォーマンスメトリクスを抽出
   */
  private extractPerformanceMetrics(summary: K6Summary): TestResult['performance'] {
    const httpDuration = summary.metrics['http_req_duration'] || {};
    const errors = summary.metrics['errors'] || {};
    const successRate = summary.metrics['success_rate'] || {};
    const httpReqs = summary.metrics['http_reqs'] || {};
    
    return {
      avgResponseTime: httpDuration.values?.avg || 0,
      medianResponseTime: httpDuration.values?.med || 0,
      p95ResponseTime: httpDuration.values?.['p(95)'] || 0,
      p99ResponseTime: httpDuration.values?.['p(99)'] || 0,
      errorRate: errors.values?.rate || 0,
      successRate: successRate.values?.rate || 1 - (errors.values?.rate || 0),
      requestsPerSecond: httpReqs.values?.rate || 0,
      totalRequests: httpReqs.values?.count || 0,
    };
  }

  /**
   * 閾値のチェック
   */
  private checkThresholds(summary: K6Summary): { passed: boolean; failed: string[] } {
    const failed: string[] = [];
    let allPassed = true;
    
    for (const [key, value] of Object.entries(summary.thresholds || {})) {
      if (!value.ok) {
        allPassed = false;
        failed.push(key);
      }
    }
    
    return { passed: allPassed, failed };
  }

  /**
   * レポート生成
   */
  private generateReport(testResults: TestResult[]): PerformanceReport {
    const passedTests = testResults.filter(t => t.thresholdsPassed).length;
    const failedTests = testResults.length - passedTests;
    
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(testResults);
    
    return {
      generatedAt: new Date(),
      environment: process.env.NODE_ENV || 'development',
      tests: testResults,
      summary: {
        totalTests: testResults.length,
        passedTests,
        failedTests,
        overallSuccessRate: testResults.length > 0 ? passedTests / testResults.length : 0,
        recommendations,
      },
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(testResults: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    // 平均応答時間のチェック
    const avgResponseTimes = testResults.map(t => t.performance.avgResponseTime);
    const overallAvg = avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length;
    
    if (overallAvg > 2000) {
      recommendations.push('平均応答時間が2秒を超えています。データベースクエリの最適化やキャッシュの導入を検討してください。');
    }
    
    // P95応答時間のチェック
    const p95Times = testResults.map(t => t.performance.p95ResponseTime);
    const maxP95 = Math.max(...p95Times);
    
    if (maxP95 > 3000) {
      recommendations.push('95パーセンタイルの応答時間が3秒を超えています。重い処理の非同期化を検討してください。');
    }
    
    // エラー率のチェック
    const errorRates = testResults.map(t => t.performance.errorRate);
    const maxErrorRate = Math.max(...errorRates);
    
    if (maxErrorRate > 0.01) {
      recommendations.push('エラー率が1%を超えているテストがあります。エラーログを確認し、原因を調査してください。');
    }
    
    // 特定のテストに関する推奨事項
    testResults.forEach(test => {
      if (!test.thresholdsPassed) {
        recommendations.push(`${test.testName}のテストが失敗しています。失敗した閾値: ${test.failedThresholds.join(', ')}`);
      }
      
      if (test.testName.includes('concurrent') && test.performance.errorRate > 0.005) {
        recommendations.push('同時アクセステストでエラーが発生しています。接続プール設定やリソース制限を確認してください。');
      }
      
      if (test.testName.includes('create') && test.performance.p95ResponseTime > 2000) {
        recommendations.push('作成処理のパフォーマンスが低下しています。トランザクション処理やバリデーション処理を見直してください。');
      }
    });
    
    // 成功している場合の推奨事項
    if (recommendations.length === 0) {
      recommendations.push('すべてのパフォーマンステストが基準を満たしています。');
      recommendations.push('定期的なパフォーマンステストの実行を継続してください。');
    }
    
    return recommendations;
  }

  /**
   * レポートを保存
   */
  private async saveReport(report: PerformanceReport): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // JSON形式で保存
    const jsonPath = path.join(this.outputDir, `performance-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📊 JSON report saved to: ${jsonPath}`);
    
    // HTML形式で保存
    const htmlPath = path.join(this.outputDir, `performance-report-${timestamp}.html`);
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📊 HTML report saved to: ${htmlPath}`);
    
    // Markdown形式で保存
    const mdPath = path.join(this.outputDir, `performance-report-${timestamp}.md`);
    const mdContent = this.generateMarkdownReport(report);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`📊 Markdown report saved to: ${mdPath}`);
  }

  /**
   * HTMLレポート生成
   */
  private generateHtmlReport(report: PerformanceReport): string {
    const statusColor = report.summary.failedTests === 0 ? 'green' : 'red';
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ${report.generatedAt.toLocaleString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #007bff; color: white; }
        tr:hover { background: #f5f5f5; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-size: 12px; color: #666; }
        .metric-value { font-size: 20px; font-weight: bold; color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>営業日報システム - パフォーマンステストレポート</h1>
        
        <div class="summary">
            <p><strong>実行日時:</strong> ${report.generatedAt.toLocaleString()}</p>
            <p><strong>環境:</strong> ${report.environment}</p>
            <p class="status">テスト結果: ${report.summary.passedTests}/${report.summary.totalTests} 成功</p>
        </div>
        
        <h2>パフォーマンスメトリクス</h2>
        <table>
            <thead>
                <tr>
                    <th>テスト名</th>
                    <th>平均応答時間</th>
                    <th>中央値</th>
                    <th>95%ile</th>
                    <th>99%ile</th>
                    <th>エラー率</th>
                    <th>RPS</th>
                    <th>状態</th>
                </tr>
            </thead>
            <tbody>
                ${report.tests.map(test => `
                <tr>
                    <td>${test.testName}</td>
                    <td>${test.performance.avgResponseTime.toFixed(2)}ms</td>
                    <td>${test.performance.medianResponseTime.toFixed(2)}ms</td>
                    <td>${test.performance.p95ResponseTime.toFixed(2)}ms</td>
                    <td>${test.performance.p99ResponseTime.toFixed(2)}ms</td>
                    <td>${(test.performance.errorRate * 100).toFixed(2)}%</td>
                    <td>${test.performance.requestsPerSecond.toFixed(2)}</td>
                    <td class="${test.thresholdsPassed ? 'pass' : 'fail'}">${test.thresholdsPassed ? '✓ PASS' : '✗ FAIL'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h2>推奨事項</h2>
        ${report.summary.recommendations.map(rec => `
        <div class="recommendation">${rec}</div>
        `).join('')}
        
        <h2>詳細結果</h2>
        ${report.tests.map(test => `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>${test.testName}</h3>
            <div>
                <div class="metric">
                    <div class="metric-label">総リクエスト数</div>
                    <div class="metric-value">${test.performance.totalRequests}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">成功率</div>
                    <div class="metric-value">${(test.performance.successRate * 100).toFixed(2)}%</div>
                </div>
            </div>
            ${test.failedThresholds.length > 0 ? `
            <p style="color: red;"><strong>失敗した閾値:</strong> ${test.failedThresholds.join(', ')}</p>
            ` : ''}
        </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Markdownレポート生成
   */
  private generateMarkdownReport(report: PerformanceReport): string {
    return `# 営業日報システム - パフォーマンステストレポート

## 概要
- **実行日時**: ${report.generatedAt.toLocaleString()}
- **環境**: ${report.environment}
- **テスト結果**: ${report.summary.passedTests}/${report.summary.totalTests} 成功

## パフォーマンスメトリクス

| テスト名 | 平均応答時間 | 中央値 | 95%ile | 99%ile | エラー率 | RPS | 状態 |
|---------|------------|--------|--------|--------|---------|-----|------|
${report.tests.map(test => 
`| ${test.testName} | ${test.performance.avgResponseTime.toFixed(2)}ms | ${test.performance.medianResponseTime.toFixed(2)}ms | ${test.performance.p95ResponseTime.toFixed(2)}ms | ${test.performance.p99ResponseTime.toFixed(2)}ms | ${(test.performance.errorRate * 100).toFixed(2)}% | ${test.performance.requestsPerSecond.toFixed(2)} | ${test.thresholdsPassed ? '✓ PASS' : '✗ FAIL'} |`
).join('\n')}

## 推奨事項

${report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## 詳細結果

${report.tests.map(test => `
### ${test.testName}
- **総リクエスト数**: ${test.performance.totalRequests}
- **成功率**: ${(test.performance.successRate * 100).toFixed(2)}%
${test.failedThresholds.length > 0 ? `- **失敗した閾値**: ${test.failedThresholds.join(', ')}` : ''}
`).join('\n')}

---
*Generated at ${report.generatedAt.toISOString()}*
`;
  }
}

// CLIから実行する場合
if (require.main === module) {
  const analyzer = new PerformanceAnalyzer();
  
  analyzer.analyzeResults()
    .then(report => {
      console.log('\n✨ Performance analysis completed!');
      console.log(`📊 Total tests: ${report.summary.totalTests}`);
      console.log(`✅ Passed: ${report.summary.passedTests}`);
      console.log(`❌ Failed: ${report.summary.failedTests}`);
      console.log(`📈 Success rate: ${(report.summary.overallSuccessRate * 100).toFixed(2)}%`);
    })
    .catch(error => {
      console.error('Error analyzing results:', error);
      process.exit(1);
    });
}

export { PerformanceAnalyzer, PerformanceReport, TestResult };