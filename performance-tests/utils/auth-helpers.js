import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/**
 * ユーザーログインしてトークンを取得
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - パスワード
 * @returns {object} - { token, user } または null
 */
export function getAuthToken(email, password) {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200) {
    console.error(`Login failed for ${email}: ${loginRes.status}`);
    return null;
  }

  try {
    const authData = JSON.parse(loginRes.body);
    return {
      token: authData.token,
      user: authData.user,
    };
  } catch (error) {
    console.error(`Failed to parse login response: ${error}`);
    return null;
  }
}

/**
 * 複数のユーザーでログインしてトークンリストを取得
 * @param {Array} users - { email, password } のリスト
 * @returns {Array} - 成功したログインのトークンリスト
 */
export function getMultipleAuthTokens(users) {
  const tokens = [];
  
  users.forEach(user => {
    const auth = getAuthToken(user.email, user.password);
    if (auth) {
      tokens.push(auth);
    }
  });
  
  return tokens;
}

/**
 * 認証ヘッダーを生成
 * @param {string} token - 認証トークン
 * @returns {object} - HTTPヘッダーオブジェクト
 */
export function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * テストユーザーを作成（管理者権限が必要）
 * @param {string} adminToken - 管理者のトークン
 * @param {object} userData - ユーザーデータ
 * @returns {object} - 作成されたユーザー情報 または null
 */
export function createTestUser(adminToken, userData) {
  const headers = getAuthHeaders(adminToken);
  
  const createRes = http.post(
    `${BASE_URL}/api/sales-persons`,
    JSON.stringify(userData),
    { headers }
  );
  
  if (createRes.status !== 201 && createRes.status !== 200) {
    console.error(`Failed to create user: ${createRes.status}`);
    return null;
  }
  
  try {
    return JSON.parse(createRes.body);
  } catch (error) {
    console.error(`Failed to parse create user response: ${error}`);
    return null;
  }
}

/**
 * テストユーザーを削除（管理者権限が必要）
 * @param {string} adminToken - 管理者のトークン
 * @param {number} userId - ユーザーID
 * @returns {boolean} - 削除成功かどうか
 */
export function deleteTestUser(adminToken, userId) {
  const headers = getAuthHeaders(adminToken);
  
  const deleteRes = http.del(
    `${BASE_URL}/api/sales-persons/${userId}`,
    null,
    { headers }
  );
  
  return deleteRes.status === 204 || deleteRes.status === 200;
}

/**
 * バッチでテストユーザーを作成
 * @param {string} adminToken - 管理者のトークン
 * @param {number} count - 作成するユーザー数
 * @param {string} prefix - ユーザー名のプレフィックス
 * @returns {Array} - 作成されたユーザーのリスト
 */
export function createTestUsersBatch(adminToken, count, prefix = 'test') {
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const userData = {
      name: `${prefix} User ${i}`,
      email: `${prefix}${i}@example.com`,
      password: 'Test1234!',
      department: '性能テスト部',
      is_manager: false,
    };
    
    const user = createTestUser(adminToken, userData);
    if (user) {
      users.push({
        ...user,
        password: userData.password, // テスト用にパスワードも保持
      });
    }
  }
  
  return users;
}

/**
 * テスト用の顧客を作成（管理者権限が必要）
 * @param {string} adminToken - 管理者のトークン
 * @param {object} customerData - 顧客データ
 * @returns {object} - 作成された顧客情報 または null
 */
export function createTestCustomer(adminToken, customerData) {
  const headers = getAuthHeaders(adminToken);
  
  const createRes = http.post(
    `${BASE_URL}/api/customers`,
    JSON.stringify(customerData),
    { headers }
  );
  
  if (createRes.status !== 201 && createRes.status !== 200) {
    console.error(`Failed to create customer: ${createRes.status}`);
    return null;
  }
  
  try {
    return JSON.parse(createRes.body);
  } catch (error) {
    console.error(`Failed to parse create customer response: ${error}`);
    return null;
  }
}

/**
 * バッチで顧客を作成
 * @param {string} adminToken - 管理者のトークン
 * @param {number} count - 作成する顧客数
 * @returns {Array} - 作成された顧客のリスト
 */
export function createTestCustomersBatch(adminToken, count) {
  const customers = [];
  const companies = ['株式会社', '有限会社', '合同会社'];
  const industries = ['製造', '商社', 'IT', 'サービス', '小売'];
  
  for (let i = 1; i <= count; i++) {
    const companyType = companies[Math.floor(Math.random() * companies.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    
    const customerData = {
      company_name: `${companyType}テスト${industry}${i}`,
      contact_person: `担当者${i}`,
      phone: `03-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      email: `contact${i}@test-company.com`,
      address: `東京都テスト区テスト町${i}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`,
    };
    
    const customer = createTestCustomer(adminToken, customerData);
    if (customer) {
      customers.push(customer);
    }
  }
  
  return customers;
}

/**
 * セッショントークンの有効性を確認
 * @param {string} token - 確認するトークン
 * @returns {boolean} - トークンが有効かどうか
 */
export function validateToken(token) {
  const headers = getAuthHeaders(token);
  
  const res = http.get(
    `${BASE_URL}/api/auth/me`,
    { headers }
  );
  
  return res.status === 200;
}

/**
 * ログアウト処理
 * @param {string} token - ログアウトするトークン
 * @returns {boolean} - ログアウト成功かどうか
 */
export function logout(token) {
  const headers = getAuthHeaders(token);
  
  const res = http.post(
    `${BASE_URL}/api/auth/logout`,
    null,
    { headers }
  );
  
  return res.status === 204 || res.status === 200;
}