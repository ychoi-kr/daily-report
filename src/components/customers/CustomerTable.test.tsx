import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerTable } from './CustomerTable';
import { Customer } from '@/lib/types/customer';
import { vi } from 'vitest';

describe('CustomerTable', () => {
  const mockCustomers: Customer[] = [
    {
      id: 1,
      company_name: 'ABC商事',
      contact_person: '山田太郎',
      phone: '03-1234-5678',
      email: 'yamada@abc.com',
      address: '東京都千代田区',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      company_name: 'XYZ工業',
      contact_person: '佐藤花子',
      phone: '06-9876-5432',
      email: 'sato@xyz.com',
      address: '大阪府大阪市',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ];

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPageChange: vi.fn(),
  };

  it('renders customer data correctly', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={1}
        totalPages={1}
        {...mockHandlers}
      />
    );

    // Check if customer data is displayed
    expect(screen.getByText('ABC商事')).toBeInTheDocument();
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.getByText('XYZ工業')).toBeInTheDocument();
    expect(screen.getByText('佐藤花子')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(
      <CustomerTable
        customers={[]}
        loading={true}
        currentPage={1}
        totalPages={1}
        {...mockHandlers}
      />
    );

    // Check for skeleton elements (they have the class 'animate-pulse')
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no customers', () => {
    render(
      <CustomerTable
        customers={[]}
        loading={false}
        currentPage={1}
        totalPages={1}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('顧客データが見つかりません')).toBeInTheDocument();
    expect(screen.getByText('新規登録ボタンから顧客を追加してください')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={1}
        totalPages={1}
        {...mockHandlers}
      />
    );

    // Find and click the first edit button
    const editButtons = screen.getAllByRole('button', { name: /編集/i });
    fireEvent.click(editButtons[0]);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={1}
        totalPages={1}
        {...mockHandlers}
      />
    );

    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /削除/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('handles pagination correctly', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={2}
        totalPages={5}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('ページ 2 / 5')).toBeInTheDocument();

    // Click previous page button
    const prevButton = screen.getByRole('button', { name: /前へ/i });
    fireEvent.click(prevButton);
    expect(mockHandlers.onPageChange).toHaveBeenCalledWith(1);

    // Click next page button
    const nextButton = screen.getByRole('button', { name: /次へ/i });
    fireEvent.click(nextButton);
    expect(mockHandlers.onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables pagination buttons appropriately', () => {
    // Test first page
    const { rerender } = render(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={1}
        totalPages={3}
        {...mockHandlers}
      />
    );

    let prevButton = screen.getByRole('button', { name: /前へ/i });
    expect(prevButton).toBeDisabled();

    // Test last page
    rerender(
      <CustomerTable
        customers={mockCustomers}
        loading={false}
        currentPage={3}
        totalPages={3}
        {...mockHandlers}
      />
    );

    const nextButton = screen.getByRole('button', { name: /次へ/i });
    expect(nextButton).toBeDisabled();
  });
});