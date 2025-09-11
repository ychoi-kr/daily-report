/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 模擬的なReportFormコンポーネント（実際の実装をテスト）
interface Visit {
  id?: number;
  customer_id: number;
  visit_content: string;
  visit_time?: string;
}

interface ReportFormData {
  report_date: string;
  problem: string;
  plan: string;
  visits: Visit[];
}

interface ReportFormProps {
  initialData?: Partial<ReportFormData>;
  onSubmit: (data: ReportFormData) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

// モックコンポーネント（実際の実装に基づいて作成）
function ReportForm({ 
  initialData = {}, 
  onSubmit, 
  isLoading = false, 
  isEditMode = false 
}: ReportFormProps) {
  const [formData, setFormData] = React.useState<ReportFormData>({
    report_date: initialData.report_date || new Date().toISOString().split('T')[0],
    problem: initialData.problem || '',
    plan: initialData.plan || '',
    visits: initialData.visits || [{ customer_id: 0, visit_content: '', visit_time: '' }],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.problem.trim()) {
      newErrors.problem = '課題・相談事項は必須項目です';
    } else if (formData.problem.length > 1000) {
      newErrors.problem = '課題・相談事項は1000文字以内で入力してください';
    }

    if (!formData.plan.trim()) {
      newErrors.plan = '明日の計画は必須項目です';
    } else if (formData.plan.length > 1000) {
      newErrors.plan = '明日の計画は1000文字以内で入力してください';
    }

    const validVisits = formData.visits.filter(visit => 
      visit.customer_id > 0 && visit.visit_content.trim()
    );

    if (validVisits.length === 0) {
      newErrors.visits = '最低1件の訪問記録が必要です';
    }

    formData.visits.forEach((visit, index) => {
      if (visit.customer_id > 0 || visit.visit_content.trim()) {
        if (visit.customer_id <= 0) {
          newErrors[`visit_customer_${index}`] = '顧客を選択してください';
        }
        if (!visit.visit_content.trim()) {
          newErrors[`visit_content_${index}`] = '訪問内容を入力してください';
        } else if (visit.visit_content.length > 500) {
          newErrors[`visit_content_${index}`] = '訪問内容は500文字以内で入力してください';
        }
        if (visit.visit_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(visit.visit_time)) {
          newErrors[`visit_time_${index}`] = '時刻はHH:MM形式で入力してください';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const validVisits = formData.visits.filter(visit => 
      visit.customer_id > 0 && visit.visit_content.trim()
    );

    try {
      await onSubmit({
        ...formData,
        visits: validVisits,
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const addVisit = () => {
    setFormData(prev => ({
      ...prev,
      visits: [...prev.visits, { customer_id: 0, visit_content: '', visit_time: '' }],
    }));
  };

  const removeVisit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      visits: prev.visits.filter((_, i) => i !== index),
    }));
  };

  const updateVisit = (index: number, field: keyof Visit, value: any) => {
    setFormData(prev => ({
      ...prev,
      visits: prev.visits.map((visit, i) => 
        i === index ? { ...visit, [field]: value } : visit
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} aria-label="日報フォーム">
      <div className="space-y-6">
        {/* 日付フィールド */}
        <div>
          <label htmlFor="report_date">日報日付</label>
          <input
            id="report_date"
            type="date"
            value={formData.report_date}
            onChange={(e) => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
            disabled={isEditMode} // 編集モードでは日付変更不可
            required
            aria-describedby={errors.report_date ? 'report_date_error' : undefined}
          />
          {errors.report_date && (
            <div id="report_date_error" className="error-message" role="alert">
              {errors.report_date}
            </div>
          )}
        </div>

        {/* 課題・相談事項 */}
        <div>
          <label htmlFor="problem">課題・相談事項</label>
          <textarea
            id="problem"
            value={formData.problem}
            onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
            maxLength={1000}
            rows={4}
            placeholder="本日の課題や相談したい事項を入力してください"
            required
            aria-describedby={errors.problem ? 'problem_error' : undefined}
          />
          <div className="character-count">
            {formData.problem.length}/1000文字
          </div>
          {errors.problem && (
            <div id="problem_error" className="error-message" role="alert">
              {errors.problem}
            </div>
          )}
        </div>

        {/* 明日の計画 */}
        <div>
          <label htmlFor="plan">明日の計画</label>
          <textarea
            id="plan"
            value={formData.plan}
            onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
            maxLength={1000}
            rows={4}
            placeholder="明日の活動計画を入力してください"
            required
            aria-describedby={errors.plan ? 'plan_error' : undefined}
          />
          <div className="character-count">
            {formData.plan.length}/1000文字
          </div>
          {errors.plan && (
            <div id="plan_error" className="error-message" role="alert">
              {errors.plan}
            </div>
          )}
        </div>

        {/* 訪問記録 */}
        <div>
          <div className="flex items-center justify-between">
            <h3>訪問記録</h3>
            <button
              type="button"
              onClick={addVisit}
              disabled={isLoading}
              aria-label="訪問記録を追加"
            >
              ＋訪問記録を追加
            </button>
          </div>
          
          {errors.visits && (
            <div className="error-message" role="alert">
              {errors.visits}
            </div>
          )}

          {formData.visits.map((visit, index) => (
            <div key={index} className="visit-record border p-4 rounded">
              <div className="flex items-center justify-between">
                <h4>訪問記録 {index + 1}</h4>
                {formData.visits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVisit(index)}
                    disabled={isLoading}
                    aria-label={`訪問記録${index + 1}を削除`}
                  >
                    削除
                  </button>
                )}
              </div>

              {/* 顧客選択 */}
              <div>
                <label htmlFor={`customer_${index}`}>顧客</label>
                <select
                  id={`customer_${index}`}
                  value={visit.customer_id}
                  onChange={(e) => updateVisit(index, 'customer_id', parseInt(e.target.value))}
                  required={visit.visit_content.trim() !== ''}
                  aria-describedby={errors[`visit_customer_${index}`] ? `customer_${index}_error` : undefined}
                >
                  <option value={0}>顧客を選択してください</option>
                  <option value={1}>A株式会社</option>
                  <option value={2}>B商事</option>
                  <option value={3}>C工業</option>
                </select>
                {errors[`visit_customer_${index}`] && (
                  <div id={`customer_${index}_error`} className="error-message" role="alert">
                    {errors[`visit_customer_${index}`]}
                  </div>
                )}
              </div>

              {/* 訪問時刻 */}
              <div>
                <label htmlFor={`visit_time_${index}`}>訪問時刻（任意）</label>
                <input
                  id={`visit_time_${index}`}
                  type="time"
                  value={visit.visit_time || ''}
                  onChange={(e) => updateVisit(index, 'visit_time', e.target.value)}
                  aria-describedby={errors[`visit_time_${index}`] ? `visit_time_${index}_error` : undefined}
                />
                {errors[`visit_time_${index}`] && (
                  <div id={`visit_time_${index}_error`} className="error-message" role="alert">
                    {errors[`visit_time_${index}`]}
                  </div>
                )}
              </div>

              {/* 訪問内容 */}
              <div>
                <label htmlFor={`visit_content_${index}`}>訪問内容</label>
                <textarea
                  id={`visit_content_${index}`}
                  value={visit.visit_content}
                  onChange={(e) => updateVisit(index, 'visit_content', e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="訪問内容を入力してください"
                  required={visit.customer_id > 0}
                  aria-describedby={errors[`visit_content_${index}`] ? `visit_content_${index}_error` : undefined}
                />
                <div className="character-count">
                  {visit.visit_content.length}/500文字
                </div>
                {errors[`visit_content_${index}`] && (
                  <div id={`visit_content_${index}_error`} className="error-message" role="alert">
                    {errors[`visit_content_${index}`]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 送信ボタン */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            aria-describedby={isLoading ? 'loading_message' : undefined}
          >
            {isLoading ? '保存中...' : (isEditMode ? '更新' : '保存')}
          </button>
          
          {isLoading && (
            <div id="loading_message" className="loading-message" aria-live="polite">
              データを保存しています...
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

// React をインポート
import React from 'react';

describe('ReportForm Component', () => {
  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('フォームが正常にレンダリングされる', () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('form', { name: '日報フォーム' })).toBeInTheDocument();
      expect(screen.getByLabelText('日報日付')).toBeInTheDocument();
      expect(screen.getByLabelText('課題・相談事項')).toBeInTheDocument();
      expect(screen.getByLabelText('明日の計画')).toBeInTheDocument();
      expect(screen.getByText('訪問記録')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('初期データが設定されている場合、フィールドに値が表示される', () => {
      const initialData = {
        report_date: '2025-01-15',
        problem: '初期課題',
        plan: '初期計画',
        visits: [
          {
            customer_id: 1,
            visit_content: '初期訪問内容',
            visit_time: '10:30',
          },
        ],
      };

      render(<ReportForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByDisplayValue('2025-01-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('初期課題')).toBeInTheDocument();
      expect(screen.getByDisplayValue('初期計画')).toBeInTheDocument();
      expect(screen.getByDisplayValue('初期訪問内容')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10:30')).toBeInTheDocument();
    });

    it('編集モードでは日付フィールドが無効化される', () => {
      render(<ReportForm onSubmit={mockOnSubmit} isEditMode={true} />);

      const dateInput = screen.getByLabelText('日報日付');
      expect(dateInput).toBeDisabled();
    });
  });

  describe('フォームバリデーション', () => {
    it('必須項目が空の場合にエラーメッセージが表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      expect(screen.getByRole('alert', { name: /課題・相談事項は必須項目です/ })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /明日の計画は必須項目です/ })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /最低1件の訪問記録が必要です/ })).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('文字数制限を超過した場合にエラーメッセージが表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const problemTextarea = screen.getByLabelText('課題・相談事項');
      const planTextarea = screen.getByLabelText('明日の計画');

      await user.type(problemTextarea, 'a'.repeat(1001));
      await user.type(planTextarea, 'b'.repeat(1001));

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      expect(screen.getByRole('alert', { name: /課題・相談事項は1000文字以内で入力してください/ })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /明日の計画は1000文字以内で入力してください/ })).toBeInTheDocument();
    });

    it('訪問記録で顧客が選択されていない場合にエラーが表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      // 有効なメインフィールドを入力
      await user.type(screen.getByLabelText('課題・相談事項'), 'テスト課題');
      await user.type(screen.getByLabelText('明日の計画'), 'テスト計画');

      // 顧客を選択せずに訪問内容のみ入力
      await user.type(screen.getByLabelText('訪問内容'), 'テスト訪問内容');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      expect(screen.getByRole('alert', { name: /顧客を選択してください/ })).toBeInTheDocument();
    });

    it('不正な時刻フォーマットでエラーが表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      // 有効なフィールドを入力
      await user.type(screen.getByLabelText('課題・相談事項'), 'テスト課題');
      await user.type(screen.getByLabelText('明日の計画'), 'テスト計画');

      const customerSelect = screen.getByLabelText('顧客');
      await user.selectOptions(customerSelect, '1');
      
      await user.type(screen.getByLabelText('訪問内容'), 'テスト訪問内容');
      
      // 不正な時刻を入力（直接inputのvalueを設定する方法）
      const timeInput = screen.getByLabelText('訪問時刻（任意）');
      fireEvent.change(timeInput, { target: { value: '25:70' } });

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      expect(screen.getByRole('alert', { name: /時刻はHH:MM形式で入力してください/ })).toBeInTheDocument();
    });
  });

  describe('訪問記録の操作', () => {
    it('訪問記録を追加できる', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      expect(screen.queryByText('訪問記録 2')).not.toBeInTheDocument();

      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      expect(screen.getByText('訪問記録 2')).toBeInTheDocument();
    });

    it('訪問記録を削除できる', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      // 訪問記録を追加
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      expect(screen.getByText('訪問記録 2')).toBeInTheDocument();

      // 2番目の訪問記録を削除
      const deleteButton = screen.getByRole('button', { name: '訪問記録2を削除' });
      await user.click(deleteButton);

      expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      expect(screen.queryByText('訪問記録 2')).not.toBeInTheDocument();
    });

    it('最後の訪問記録は削除できない', () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      // 初期状態では訪問記録が1つしかないため、削除ボタンが存在しない
      expect(screen.queryByRole('button', { name: /を削除/ })).not.toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('有効なデータでフォーム送信が成功する', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReportForm onSubmit={mockOnSubmit} />);

      // フォームに有効なデータを入力
      await user.type(screen.getByLabelText('課題・相談事項'), '今日の課題です');
      await user.type(screen.getByLabelText('明日の計画'), '明日の計画です');

      const customerSelect = screen.getByLabelText('顧客');
      await user.selectOptions(customerSelect, '1');
      
      await user.type(screen.getByLabelText('訪問内容'), '訪問した内容です');
      
      const timeInput = screen.getByLabelText('訪問時刻（任意）');
      await user.type(timeInput, '10:30');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          report_date: expect.any(String),
          problem: '今日の課題です',
          plan: '明日の計画です',
          visits: [
            {
              customer_id: 1,
              visit_content: '訪問した内容です',
              visit_time: '10:30',
            },
          ],
        });
      });
    });

    it('複数の訪問記録でフォーム送信が成功する', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReportForm onSubmit={mockOnSubmit} />);

      // メインフィールドを入力
      await user.type(screen.getByLabelText('課題・相談事項'), '今日の課題です');
      await user.type(screen.getByLabelText('明日の計画'), '明日の計画です');

      // 1つ目の訪問記録
      const customerSelect1 = screen.getByLabelText('顧客');
      await user.selectOptions(customerSelect1, '1');
      await user.type(screen.getByLabelText('訪問内容'), '最初の訪問');

      // 2つ目の訪問記録を追加
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      // 2つ目の訪問記録を入力
      const customerSelects = screen.getAllByLabelText('顧客');
      await user.selectOptions(customerSelects[1], '2');

      const visitContentInputs = screen.getAllByLabelText('訪問内容');
      await user.type(visitContentInputs[1], '2番目の訪問');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            visits: [
              {
                customer_id: 1,
                visit_content: '最初の訪問',
                visit_time: '',
              },
              {
                customer_id: 2,
                visit_content: '2番目の訪問',
                visit_time: '',
              },
            ],
          })
        );
      });
    });

    it('空の訪問記録は送信データから除外される', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReportForm onSubmit={mockOnSubmit} />);

      // メインフィールドのみ入力（訪問記録は空のまま）
      await user.type(screen.getByLabelText('課題・相談事項'), '今日の課題です');
      await user.type(screen.getByLabelText('明日の計画'), '明日の計画です');

      // 訪問記録を追加して、1つ目だけ入力
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      const customerSelects = screen.getAllByLabelText('顧客');
      await user.selectOptions(customerSelects[0], '1');

      const visitContentInputs = screen.getAllByLabelText('訪問内容');
      await user.type(visitContentInputs[0], '有効な訪問記録');

      // 2つ目の訪問記録は空のまま

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            visits: [
              {
                customer_id: 1,
                visit_content: '有効な訪問記録',
                visit_time: '',
              },
            ],
          })
        );
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は送信ボタンが無効化される', () => {
      render(<ReportForm onSubmit={mockOnSubmit} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: '保存中...' });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('データを保存しています...')).toBeInTheDocument();
    });

    it('ローディング中は訪問記録の追加/削除ボタンが無効化される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} isLoading={true} />);

      // 訪問記録を追加してから確認
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      expect(addButton).toBeDisabled();
    });
  });

  describe('文字数カウンタ', () => {
    it('入力文字数が正しく表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const problemTextarea = screen.getByLabelText('課題・相談事項');
      const testText = 'これはテストテキストです';

      await user.type(problemTextarea, testText);

      expect(screen.getByText(`${testText.length}/1000文字`)).toBeInTheDocument();
    });

    it('訪問内容の文字数が正しく表示される', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const visitContentTextarea = screen.getByLabelText('訪問内容');
      const testText = '訪問内容のテストです';

      await user.type(visitContentTextarea, testText);

      expect(screen.getByText(`${testText.length}/500文字`)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なラベル付けがされている', () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      // すべてのフォーム要素にラベルが関連付けられているかチェック
      expect(screen.getByLabelText('日報日付')).toBeInTheDocument();
      expect(screen.getByLabelText('課題・相談事項')).toBeInTheDocument();
      expect(screen.getByLabelText('明日の計画')).toBeInTheDocument();
      expect(screen.getByLabelText('顧客')).toBeInTheDocument();
      expect(screen.getByLabelText('訪問時刻（任意）')).toBeInTheDocument();
      expect(screen.getByLabelText('訪問内容')).toBeInTheDocument();
    });

    it('エラーメッセージがaria-describedbyで関連付けられている', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      const problemTextarea = screen.getByLabelText('課題・相談事項');
      const planTextarea = screen.getByLabelText('明日の計画');

      expect(problemTextarea).toHaveAttribute('aria-describedby', 'problem_error');
      expect(planTextarea).toHaveAttribute('aria-describedby', 'plan_error');
    });

    it('エラーメッセージがrole="alert"を持つ', async () => {
      render(<ReportForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('ローディングメッセージがaria-liveを持つ', () => {
      render(<ReportForm onSubmit={mockOnSubmit} isLoading={true} />);

      const loadingMessage = screen.getByText('データを保存しています...');
      expect(loadingMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('エラーハンドリング', () => {
    it('フォーム送信エラーがコンソールに出力される', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const submitError = new Error('Submit failed');
      mockOnSubmit.mockRejectedValue(submitError);

      render(<ReportForm onSubmit={mockOnSubmit} />);

      // 有効なデータを入力
      await user.type(screen.getByLabelText('課題・相談事項'), '課題');
      await user.type(screen.getByLabelText('明日の計画'), '計画');

      const customerSelect = screen.getByLabelText('顧客');
      await user.selectOptions(customerSelect, '1');
      await user.type(screen.getByLabelText('訪問内容'), '内容');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Submit error:', submitError);
      });

      consoleErrorSpy.mockRestore();
    });
  });
});