/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './error';

describe('Error Component', () => {
  // console.errorをモック
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const mockReset = vi.fn();
  const mockError = new Error('Test error message') as Error & {
    digest?: string;
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders error heading', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /エラーが発生しました/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    const message = screen.getByText(
      /申し訳ございません。予期しないエラーが発生しました。/i
    );
    expect(message).toBeInTheDocument();
  });

  it('renders contact message', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    const contactMessage = screen.getByText(
      /問題が解決しない場合は、システム管理者にお問い合わせください。/i
    );
    expect(contactMessage).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Application error:',
      mockError
    );
  });

  it('calls reset function when retry button is clicked', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    const retryButton = screen.getByRole('button', { name: /もう一度試す/i });

    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders home link', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);
    const homeLink = screen.getByRole('link', { name: /ホームへ戻る/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has proper styling classes', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /もう一度試す/i });
    expect(retryButton).toHaveClass('bg-primary');

    const homeLink = screen.getByRole('link', { name: /ホームへ戻る/i });
    expect(homeLink).toHaveClass('border');
  });

  it('handles error with digest property', () => {
    const errorWithDigest = {
      ...mockError,
      digest: 'test-digest-123',
    } as Error & { digest?: string };

    render(<ErrorBoundary error={errorWithDigest} reset={mockReset} />);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Application error:',
      errorWithDigest
    );
  });
});
