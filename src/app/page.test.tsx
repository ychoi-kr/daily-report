import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /영업 일일 보고 시스템/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<Home />);
    const description = screen.getByText(
      /영업 담당자가 일일 활동을 보고하고 상사가 피드백을 제공하는 시스템입니다/i
    );
    expect(description).toBeInTheDocument();
  });

  it('renders all navigation cards', () => {
    render(<Home />);

    // クイックスタートカード
    const quickStartCard = screen.getByRole('heading', {
      name: /🚀 빠른 시작/i,
    });
    expect(quickStartCard).toBeInTheDocument();

    // 日報管理カード
    const reportCard = screen.getByRole('heading', { name: /📊 일일 보고 관리/i });
    expect(reportCard).toBeInTheDocument();

    // 顧客管理カード
    const customerCard = screen.getByRole('heading', { name: /👥 고객 관리/i });
    expect(customerCard).toBeInTheDocument();

    // 営業担当者管理カード  
    const salesPersonsCard = screen.getByRole('heading', {
      name: /👥 영업 담당자 관리/i,
    });
    expect(salesPersonsCard).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Home />);

    // ログインリンク
    const loginLink = screen.getByRole('link', { name: /로그인 페이지로/i });
    expect(loginLink).toHaveAttribute('href', '/login');

    // 日報一覧リンク
    const reportsLink = screen.getByRole('link', { name: /일일 보고 목록으로/i });
    expect(reportsLink).toHaveAttribute('href', '/reports');

    // 顧客管理リンク
    const customersLink = screen.getByRole('link', { name: /고객 관리로/i });
    expect(customersLink).toHaveAttribute('href', '/customers');

    // 営業担当者管理リンク
    const salesPersonsLink = screen.getByRole('link', { name: /영업 담당자 관리로/i });
    expect(salesPersonsLink).toHaveAttribute('href', '/sales-persons');
  });

  it('renders the footer copyright', () => {
    render(<Home />);
    const copyright = screen.getByText(
      /© 2025 영업 일일 보고 시스템. All rights reserved./i
    );
    expect(copyright).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<Home />);

    // ボタンのクラスチェック
    const loginButton = screen.getByRole('link', { name: /로그인 페이지로/i });
    expect(loginButton).toHaveClass('btn-primary');

    const reportsButton = screen.getByRole('link', { name: /일일 보고 목록으로/i });
    expect(reportsButton).toHaveClass('btn-secondary');
  });
});
