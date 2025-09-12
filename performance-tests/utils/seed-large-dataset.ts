import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/ja';

const prisma = new PrismaClient();

interface SeedConfig {
  salesPersonCount: number;
  customerCount: number;
  reportDays: number;
  visitsPerReport: { min: number; max: number };
  commentsPerReport: { min: number; max: number };
}

const defaultConfig: SeedConfig = {
  salesPersonCount: 100,
  customerCount: 500,
  reportDays: 90,
  visitsPerReport: { min: 1, max: 5 },
  commentsPerReport: { min: 0, max: 3 },
};

async function seedLargeDataset(config: SeedConfig = defaultConfig) {
  console.log('🌱 Starting large dataset seeding...');
  console.log(`Configuration:`, config);

  try {
    // トランザクション内で実行
    await prisma.$transaction(async (tx) => {
      // 1. 営業担当者の作成
      console.log(`Creating ${config.salesPersonCount} sales persons...`);
      const salesPersons = [];
      
      for (let i = 1; i <= config.salesPersonCount; i++) {
        const isManager = i <= Math.ceil(config.salesPersonCount * 0.1); // 10%を管理者に
        
        const salesPerson = await tx.salesPerson.create({
          data: {
            name: faker.person.fullName(),
            email: `sales${i}@example.com`,
            password: await hash('Test1234!', 10),
            department: `営業${Math.ceil(i / 20)}課`, // 20人ごとに課を分ける
            isManager: isManager,
          },
        });
        
        salesPersons.push(salesPerson);
        
        if (i % 10 === 0) {
          console.log(`  Created ${i} sales persons...`);
        }
      }
      
      console.log(`✅ Created ${salesPersons.length} sales persons`);

      // 2. 顧客の作成
      console.log(`Creating ${config.customerCount} customers...`);
      const customers = [];
      
      for (let i = 1; i <= config.customerCount; i++) {
        const customer = await tx.customer.create({
          data: {
            companyName: faker.company.name() + (['株式会社', '有限会社', '合同会社'][Math.floor(Math.random() * 3)]),
            contactPerson: faker.person.fullName(),
            phone: faker.phone.number('03-####-####'),
            email: faker.internet.email(),
            address: faker.location.streetAddress(true),
          },
        });
        
        customers.push(customer);
        
        if (i % 50 === 0) {
          console.log(`  Created ${i} customers...`);
        }
      }
      
      console.log(`✅ Created ${customers.length} customers`);

      // 3. 日報とその関連データの作成
      console.log(`Creating reports for the last ${config.reportDays} days...`);
      
      const managers = salesPersons.filter(sp => sp.isManager);
      const nonManagers = salesPersons.filter(sp => !sp.isManager);
      
      let totalReports = 0;
      let totalVisits = 0;
      let totalComments = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let dayOffset = 0; dayOffset < config.reportDays; dayOffset++) {
        const reportDate = new Date(today);
        reportDate.setDate(reportDate.getDate() - dayOffset);
        
        // 各営業担当者が70%の確率で日報を作成
        for (const salesPerson of nonManagers) {
          if (Math.random() > 0.7) continue;
          
          try {
            // 日報作成
            const report = await tx.dailyReport.create({
              data: {
                salesPersonId: salesPerson.id,
                reportDate: reportDate,
                problem: generateProblemText(),
                plan: generatePlanText(),
              },
            });
            
            totalReports++;
            
            // 訪問記録の作成
            const visitCount = Math.floor(
              Math.random() * (config.visitsPerReport.max - config.visitsPerReport.min + 1) 
              + config.visitsPerReport.min
            );
            
            for (let v = 0; v < visitCount; v++) {
              const customer = customers[Math.floor(Math.random() * customers.length)];
              const hour = 9 + Math.floor(Math.random() * 9); // 9-17時
              const minute = Math.floor(Math.random() * 60);
              
              await tx.visitRecord.create({
                data: {
                  reportId: report.id,
                  customerId: customer.id,
                  visitTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                  visitContent: generateVisitContent(),
                },
              });
              
              totalVisits++;
            }
            
            // 管理者コメントの作成
            const commentCount = Math.floor(
              Math.random() * (config.commentsPerReport.max - config.commentsPerReport.min + 1)
              + config.commentsPerReport.min
            );
            
            for (let c = 0; c < commentCount; c++) {
              const manager = managers[Math.floor(Math.random() * managers.length)];
              
              await tx.managerComment.create({
                data: {
                  reportId: report.id,
                  managerId: manager.id,
                  comment: generateComment(),
                },
              });
              
              totalComments++;
            }
          } catch (error) {
            // 重複エラーなどは無視
            if (!error.message.includes('Unique constraint')) {
              console.error(`Error creating report for ${salesPerson.name} on ${reportDate.toISOString().split('T')[0]}:`, error.message);
            }
          }
        }
        
        if ((dayOffset + 1) % 10 === 0) {
          console.log(`  Processed ${dayOffset + 1} days...`);
          console.log(`    Reports: ${totalReports}, Visits: ${totalVisits}, Comments: ${totalComments}`);
        }
      }
      
      console.log(`✅ Created ${totalReports} reports with ${totalVisits} visits and ${totalComments} comments`);
    });

    // 統計情報の表示
    const stats = await getStatistics();
    console.log('\n📊 Database Statistics:');
    console.log(`  Sales Persons: ${stats.salesPersons} (Managers: ${stats.managers})`);
    console.log(`  Customers: ${stats.customers}`);
    console.log(`  Reports: ${stats.reports}`);
    console.log(`  Visit Records: ${stats.visitRecords}`);
    console.log(`  Manager Comments: ${stats.managerComments}`);
    
    console.log('\n✨ Large dataset seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getStatistics() {
  const [salesPersons, managers, customers, reports, visitRecords, managerComments] = await Promise.all([
    prisma.salesPerson.count(),
    prisma.salesPerson.count({ where: { isManager: true } }),
    prisma.customer.count(),
    prisma.dailyReport.count(),
    prisma.visitRecord.count(),
    prisma.managerComment.count(),
  ]);
  
  return {
    salesPersons,
    managers,
    customers,
    reports,
    visitRecords,
    managerComments,
  };
}

function generateProblemText(): string {
  const problems = [
    '新規開拓の進捗が遅れています。リード獲得の施策を検討する必要があります。',
    '競合他社の新サービスについて顧客から問い合わせがありました。対応策の検討が必要です。',
    '既存顧客からの追加発注が予想を下回っています。フォローアップが必要です。',
    '提案書の作成に時間がかかりすぎています。効率化の方法を考える必要があります。',
    '顧客からの技術的な質問に即答できないケースが増えています。',
    '見積もり作成の精度向上が課題です。過去のデータを分析する必要があります。',
    'クロージングのタイミングを逃すケースが散見されます。',
    '顧客のニーズと提案内容のミスマッチが発生しました。',
    'アフターフォローの体制を強化する必要があります。',
    '営業資料の更新が追いついていません。最新情報の反映が必要です。',
  ];
  
  return problems[Math.floor(Math.random() * problems.length)] + 
    '\n' + 
    faker.lorem.sentence();
}

function generatePlanText(): string {
  const plans = [
    '明日はABC商事への見積もり作成と、新規リスト50件への電話アプローチを行います。',
    'XYZ工業への提案書を完成させ、午後に訪問してプレゼンテーションを実施します。',
    '既存顧客3社を訪問し、追加提案の機会を探ります。',
    '新製品の勉強会に参加し、その後2件の商談を予定しています。',
    '月次レポートの作成と、来月の活動計画を立案します。',
    '重要顧客への定期訪問を実施し、関係強化を図ります。',
    '展示会で獲得したリードへのフォローアップを行います。',
    '営業チーム会議で成功事例を共有します。',
    '新規開拓リストの精査と優先順位付けを行います。',
    '競合分析レポートを作成し、差別化ポイントを明確にします。',
  ];
  
  return plans[Math.floor(Math.random() * plans.length)] + 
    '\n' + 
    faker.lorem.sentence();
}

function generateVisitContent(): string {
  const contents = [
    '新商品の提案を実施。次回見積もり提出予定。',
    '既存システムの保守相談。追加機能の要望あり。',
    '定期訪問。現状のヒアリングと課題の確認。',
    '見積もり提出と詳細説明。前向きに検討いただける。',
    'クレーム対応。問題は解決し、関係修復。',
    '契約更新の相談。条件面での調整が必要。',
    'デモンストレーション実施。好感触を得る。',
    '競合他社からの切り替え提案。詳細資料を要求される。',
    'アフターフォロー訪問。満足度は高い。',
    '新規案件の相談。要件定義から参画予定。',
  ];
  
  const content = contents[Math.floor(Math.random() * contents.length)];
  
  if (Math.random() > 0.5) {
    return content + ' ' + faker.lorem.sentence();
  }
  
  return content;
}

function generateComment(): string {
  const comments = [
    '新規開拓については明日相談しましょう。',
    '良い進捗です。この調子で続けてください。',
    '提案内容を再検討する必要があります。',
    '顧客の反応が良好ですね。クロージングのタイミングを見計らってください。',
    '競合情報の収集をお願いします。',
    'フォローアップのタイミングが適切でした。',
    '次回の訪問では決裁者の同席を依頼してください。',
    '資料の品質向上が見られます。継続してください。',
    '課題への対応策を一緒に考えましょう。',
    'チーム内での情報共有をお願いします。',
  ];
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// CLIから実行する場合
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const config: SeedConfig = {
    salesPersonCount: parseInt(args[0]) || defaultConfig.salesPersonCount,
    customerCount: parseInt(args[1]) || defaultConfig.customerCount,
    reportDays: parseInt(args[2]) || defaultConfig.reportDays,
    visitsPerReport: defaultConfig.visitsPerReport,
    commentsPerReport: defaultConfig.commentsPerReport,
  };
  
  seedLargeDataset(config)
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedLargeDataset, getStatistics, SeedConfig };