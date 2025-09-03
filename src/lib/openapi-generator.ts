import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// スキーマのインポート
import {
  ErrorResponseSchema,
  PaginationSchema,
  PaginationQuerySchema,
  IdParamSchema,
} from './schemas/common';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  UserSchema,
} from './schemas/auth';
import {
  SalesPersonSchema,
  SalesPersonDetailSchema,
  CreateSalesPersonRequestSchema,
  UpdateSalesPersonRequestSchema,
  SalesPersonQuerySchema,
  CreateSalesPersonResponseSchema,
  UpdateSalesPersonResponseSchema,
} from './schemas/sales-person';
import {
  CustomerSchema,
  CustomerDetailSchema,
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  CustomerQuerySchema,
  CreateCustomerResponseSchema,
  UpdateCustomerResponseSchema,
} from './schemas/customer';
import {
  DailyReportListItemSchema,
  DailyReportDetailSchema,
  CreateReportRequestSchema,
  UpdateReportRequestSchema,
  ReportQuerySchema,
  CreateReportResponseSchema,
  UpdateReportResponseSchema,
  ManagerCommentSchema,
  CreateCommentRequestSchema,
  CreateCommentResponseSchema,
} from './schemas/report';

export function generateOpenApiSpec() {
  const registry = new OpenAPIRegistry();

  // 共通コンポーネントの登録
  registry.register('ErrorResponse', ErrorResponseSchema);
  registry.register('Pagination', PaginationSchema);

  // 認証関連の登録
  registry.register('LoginRequest', LoginRequestSchema);
  registry.register('LoginResponse', LoginResponseSchema);
  registry.register('User', UserSchema);

  // 営業担当者関連の登録
  registry.register('SalesPerson', SalesPersonSchema);
  registry.register('SalesPersonDetail', SalesPersonDetailSchema);
  registry.register('CreateSalesPersonRequest', CreateSalesPersonRequestSchema);
  registry.register('UpdateSalesPersonRequest', UpdateSalesPersonRequestSchema);
  registry.register(
    'CreateSalesPersonResponse',
    CreateSalesPersonResponseSchema
  );
  registry.register(
    'UpdateSalesPersonResponse',
    UpdateSalesPersonResponseSchema
  );

  // 顧客関連の登録
  registry.register('Customer', CustomerSchema);
  registry.register('CustomerDetail', CustomerDetailSchema);
  registry.register('CreateCustomerRequest', CreateCustomerRequestSchema);
  registry.register('UpdateCustomerRequest', UpdateCustomerRequestSchema);
  registry.register('CreateCustomerResponse', CreateCustomerResponseSchema);
  registry.register('UpdateCustomerResponse', UpdateCustomerResponseSchema);

  // 日報関連の登録
  registry.register('DailyReportListItem', DailyReportListItemSchema);
  registry.register('DailyReportDetail', DailyReportDetailSchema);
  registry.register('CreateReportRequest', CreateReportRequestSchema);
  registry.register('UpdateReportRequest', UpdateReportRequestSchema);
  registry.register('CreateReportResponse', CreateReportResponseSchema);
  registry.register('UpdateReportResponse', UpdateReportResponseSchema);
  registry.register('ManagerComment', ManagerCommentSchema);
  registry.register('CreateCommentRequest', CreateCommentRequestSchema);
  registry.register('CreateCommentResponse', CreateCommentResponseSchema);

  // セキュリティスキーム
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  // APIエンドポイントの登録

  // 認証API
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    summary: 'ログイン',
    description: 'ユーザー認証を行い、JWTトークンを発行します',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'ログイン成功',
        content: {
          'application/json': {
            schema: LoginResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証失敗',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    summary: 'ログアウト',
    description: 'ユーザーのセッションを終了します',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      204: {
        description: 'ログアウト成功',
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    summary: 'ログインユーザー情報取得',
    description: '現在ログインしているユーザーの情報を取得します',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'ユーザー情報取得成功',
        content: {
          'application/json': {
            schema: UserSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // 日報API
  registry.registerPath({
    method: 'get',
    path: '/api/v1/reports',
    summary: '日報一覧取得',
    description: '日報の一覧を取得します',
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    request: {
      query: ReportQuerySchema.merge(PaginationQuerySchema),
    },
    responses: {
      200: {
        description: '日報一覧取得成功',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(DailyReportListItemSchema),
              pagination: PaginationSchema,
            }),
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/reports/{id}',
    summary: '日報詳細取得',
    description: '指定されたIDの日報詳細を取得します',
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: '日報詳細取得成功',
        content: {
          'application/json': {
            schema: DailyReportDetailSchema,
          },
        },
      },
      404: {
        description: '日報が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/reports',
    summary: '日報作成',
    description: '新しい日報を作成します',
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateReportRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '日報作成成功',
        content: {
          'application/json': {
            schema: CreateReportResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      409: {
        description: '同じ日付の日報が既に存在します',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/reports/{id}',
    summary: '日報更新',
    description: '指定されたIDの日報を更新します',
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateReportRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '日報更新成功',
        content: {
          'application/json': {
            schema: UpdateReportResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '日報が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/reports/{id}',
    summary: '日報削除',
    description: '指定されたIDの日報を削除します',
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      204: {
        description: '日報削除成功',
      },
      404: {
        description: '日報が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // コメントAPI
  registry.registerPath({
    method: 'get',
    path: '/api/v1/reports/{id}/comments',
    summary: '日報コメント一覧取得',
    description: '指定された日報のコメント一覧を取得します',
    tags: ['Comments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: 'コメント一覧取得成功',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(ManagerCommentSchema),
            }),
          },
        },
      },
      404: {
        description: '日報が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/reports/{id}/comments',
    summary: '日報コメント追加',
    description: '指定された日報にコメントを追加します（管理者のみ）',
    tags: ['Comments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: CreateCommentRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'コメント追加成功',
        content: {
          'application/json': {
            schema: CreateCommentResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '日報が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // 営業担当者API
  registry.registerPath({
    method: 'get',
    path: '/api/v1/sales-persons',
    summary: '営業担当者一覧取得',
    description: '営業担当者の一覧を取得します（管理者のみ）',
    tags: ['Sales Persons'],
    security: [{ bearerAuth: [] }],
    request: {
      query: SalesPersonQuerySchema,
    },
    responses: {
      200: {
        description: '営業担当者一覧取得成功',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(SalesPersonSchema),
            }),
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/sales-persons/{id}',
    summary: '営業担当者詳細取得',
    description: '指定されたIDの営業担当者詳細を取得します（管理者のみ）',
    tags: ['Sales Persons'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: '営業担当者詳細取得成功',
        content: {
          'application/json': {
            schema: SalesPersonDetailSchema,
          },
        },
      },
      404: {
        description: '営業担当者が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/sales-persons',
    summary: '営業担当者作成',
    description: '新しい営業担当者を作成します（管理者のみ）',
    tags: ['Sales Persons'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateSalesPersonRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '営業担当者作成成功',
        content: {
          'application/json': {
            schema: CreateSalesPersonResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'メールアドレスが既に使用されています',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/sales-persons/{id}',
    summary: '営業担当者更新',
    description: '指定されたIDの営業担当者を更新します（管理者のみ）',
    tags: ['Sales Persons'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateSalesPersonRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '営業担当者更新成功',
        content: {
          'application/json': {
            schema: UpdateSalesPersonResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '営業担当者が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'メールアドレスが既に使用されています',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/sales-persons/{id}',
    summary: '営業担当者削除',
    description: '指定されたIDの営業担当者を削除します（管理者のみ）',
    tags: ['Sales Persons'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      204: {
        description: '営業担当者削除成功',
      },
      404: {
        description: '営業担当者が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // 顧客API
  registry.registerPath({
    method: 'get',
    path: '/api/v1/customers',
    summary: '顧客一覧取得',
    description: '顧客の一覧を取得します',
    tags: ['Customers'],
    security: [{ bearerAuth: [] }],
    request: {
      query: CustomerQuerySchema.merge(PaginationQuerySchema),
    },
    responses: {
      200: {
        description: '顧客一覧取得成功',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(CustomerSchema),
              pagination: PaginationSchema,
            }),
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/customers/{id}',
    summary: '顧客詳細取得',
    description: '指定されたIDの顧客詳細を取得します',
    tags: ['Customers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: '顧客詳細取得成功',
        content: {
          'application/json': {
            schema: CustomerDetailSchema,
          },
        },
      },
      404: {
        description: '顧客が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/customers',
    summary: '顧客作成',
    description: '新しい顧客を作成します（管理者のみ）',
    tags: ['Customers'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateCustomerRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '顧客作成成功',
        content: {
          'application/json': {
            schema: CreateCustomerResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/customers/{id}',
    summary: '顧客更新',
    description: '指定されたIDの顧客を更新します（管理者のみ）',
    tags: ['Customers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateCustomerRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '顧客更新成功',
        content: {
          'application/json': {
            schema: UpdateCustomerResponseSchema,
          },
        },
      },
      400: {
        description: 'リクエストエラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '顧客が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/customers/{id}',
    summary: '顧客削除',
    description: '指定されたIDの顧客を削除します（管理者のみ）',
    tags: ['Customers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      204: {
        description: '顧客削除成功',
      },
      404: {
        description: '顧客が見つかりません',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: '権限エラー（管理者のみ）',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: '営業日報システム API',
      description:
        '営業担当者が日々の活動を報告し、上長がフィードバックを行うための営業日報管理システムのAPI',
      contact: {
        name: 'API Support',
        email: 'support@sales-report.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.sales-report.example.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: '認証関連のAPI',
      },
      {
        name: 'Reports',
        description: '日報関連のAPI',
      },
      {
        name: 'Comments',
        description: 'コメント関連のAPI',
      },
      {
        name: 'Sales Persons',
        description: '営業担当者関連のAPI',
      },
      {
        name: 'Customers',
        description: '顧客関連のAPI',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  });
}
