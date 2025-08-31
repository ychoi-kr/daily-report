import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 営業担当者を作成
  const salesPerson1 = await prisma.salesPerson.create({
    data: {
      name: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      isManager: false,
    },
  });

  const salesPerson2 = await prisma.salesPerson.create({
    data: {
      name: '鈴木花子',
      email: 'suzuki@example.com',
      department: '営業1課',
      isManager: false,
    },
  });

  const manager = await prisma.salesPerson.create({
    data: {
      name: '田中部長',
      email: 'tanaka@example.com',
      department: '営業1課',
      isManager: true,
    },
  });

  console.log('Created sales persons:', {
    salesPerson1,
    salesPerson2,
    manager,
  });

  // 顧客を作成
  const customer1 = await prisma.customer.create({
    data: {
      companyName: 'ABC商事',
      contactPerson: '佐藤一郎',
      phone: '03-1234-5678',
      email: 'sato@abc.co.jp',
      address: '東京都千代田区大手町1-1-1',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyName: 'XYZ工業',
      contactPerson: '高橋二郎',
      phone: '06-9876-5432',
      email: 'takahashi@xyz.co.jp',
      address: '大阪府大阪市北区梅田2-2-2',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyName: 'DEF商社',
      contactPerson: '伊藤三郎',
      phone: '045-1111-2222',
      email: 'ito@def.co.jp',
      address: '神奈川県横浜市中区山下町3-3-3',
    },
  });

  console.log('Created customers:', { customer1, customer2, customer3 });

  // 日報を作成
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const report1 = await prisma.dailyReport.create({
    data: {
      salesPersonId: salesPerson1.salesPersonId,
      reportDate: today,
      problem:
        '新規開拓の進捗が遅れている。競合他社の動向について情報収集が必要。',
      plan: 'ABC商事への見積もり作成。新規リスト50件に電話アプローチ。',
      visitRecords: {
        create: [
          {
            customerId: customer1.customerId,
            visitContent: '新商品の提案を実施。次回見積もり提出予定。',
            visitTime: '10:00',
          },
          {
            customerId: customer2.customerId,
            visitContent: '既存システムの保守相談。追加機能の要望あり。',
            visitTime: '14:00',
          },
        ],
      },
    },
    include: {
      visitRecords: true,
    },
  });

  console.log('Created daily report with visit records:', report1);

  // 上長コメントを追加
  const comment = await prisma.managerComment.create({
    data: {
      reportId: report1.reportId,
      managerId: manager.salesPersonId,
      comment:
        '新規開拓については明日相談しましょう。ABC商事の見積もりは優先度高めでお願いします。',
    },
  });

  console.log('Created manager comment:', comment);

  // 昨日の日報も作成
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const report2 = await prisma.dailyReport.create({
    data: {
      salesPersonId: salesPerson1.salesPersonId,
      reportDate: yesterday,
      problem: '見積もり作成に時間がかかりすぎている。効率化が必要。',
      plan: '顧客訪問3件。新規アポイント取得。',
      visitRecords: {
        create: [
          {
            customerId: customer3.customerId,
            visitContent: '初回訪問。会社概要と製品説明を実施。',
            visitTime: '11:00',
          },
        ],
      },
    },
    include: {
      visitRecords: true,
    },
  });

  console.log('Created yesterday report:', report2);

  // 鈴木花子の日報も作成
  const report3 = await prisma.dailyReport.create({
    data: {
      salesPersonId: salesPerson2.salesPersonId,
      reportDate: today,
      problem: '既存顧客のフォローアップが遅れている。',
      plan: '既存顧客5社への定期訪問。契約更新の確認。',
      visitRecords: {
        create: [
          {
            customerId: customer1.customerId,
            visitContent: '契約更新の打ち合わせ。条件面で合意。',
            visitTime: '13:00',
          },
        ],
      },
    },
    include: {
      visitRecords: true,
    },
  });

  console.log('Created report for Suzuki:', report3);

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
