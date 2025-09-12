/**
 * E2Eテストで使用するテストデータの定義
 */

export const TEST_USERS = {
  // 一般営業担当者
  REGULAR_USER: {
    email: 'yamada@example.com',
    password: 'Test1234!',
    name: '山田太郎',
    department: '営業1課',
    isManager: false,
  },
  // 管理者
  MANAGER_USER: {
    email: 'tanaka@example.com',
    password: 'Manager123!',
    name: '田中部長',
    department: '営業部',
    isManager: true,
  },
  // 無効なユーザー（ログインエラーテスト用）
  INVALID_USER: {
    email: 'invalid@example.com',
    password: 'WrongPassword',
  },
} as const;

export const TEST_CUSTOMERS = [
  {
    id: 1,
    companyName: 'ABC商事',
    contactPerson: '佐藤一郎',
    phone: '03-1234-5678',
    email: 'sato@abc.co.jp',
    address: '東京都千代田区丸の内1-1-1',
  },
  {
    id: 2,
    companyName: 'XYZ工業',
    contactPerson: '鈴木二郎',
    phone: '06-9876-5432',
    email: 'suzuki@xyz.co.jp',
    address: '大阪府大阪市北区梅田1-1-1',
  },
  {
    id: 3,
    companyName: 'DEF株式会社',
    contactPerson: '高橋三郎',
    phone: '052-1111-2222',
    email: 'takahashi@def.co.jp',
    address: '愛知県名古屋市中区栄1-1-1',
  },
] as const;

export const TEST_REPORT_DATA = {
  BASIC_REPORT: {
    reportDate: '2025-09-12',
    problem: 'テスト用の課題・相談事項です。新規開拓の進捗が遅れています。',
    plan: 'テスト用の明日の計画です。ABC商事への見積もり作成を予定しています。',
    visits: [
      {
        customerId: 1,
        visitTime: '10:00',
        visitContent: 'テスト用の訪問内容です。新商品の提案を実施しました。',
      },
      {
        customerId: 2,
        visitTime: '14:30',
        visitContent: 'テスト用の訪問内容です。既存システムの保守相談を行いました。',
      },
    ],
  },
  COMMENT_TEXT: 'テスト用のコメントです。お疲れ様でした。次回の訪問も期待しています。',
} as const;

export const VALIDATION_TEST_DATA = {
  EMPTY_FIELDS: {
    problem: '',
    plan: '',
    visitContent: '',
  },
  MAX_LENGTH_EXCEEDED: {
    problem: 'あ'.repeat(1001), // 1000文字制限を超える
    plan: 'い'.repeat(1001),
    visitContent: 'う'.repeat(501), // 500文字制限を超える
    comment: 'え'.repeat(501),
  },
  INVALID_EMAIL_FORMATS: [
    'invalid-email',
    '@invalid.com',
    'invalid@',
    'invalid.email.com',
  ],
} as const;