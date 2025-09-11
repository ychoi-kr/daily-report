import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound Page', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    const heading = screen.getByRole('heading', { level: 1, name: /404/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<NotFound />);
    const message = screen.getByRole('heading', {
      level: 2,
      name: /ページが見つかりません/i,
    });
    expect(message).toBeInTheDocument();
  });

  it('renders explanation text', () => {
    render(<NotFound />);
    const explanation = screen.getByText(
      /お探しのページは存在しないか、移動された可能性があります。/i
    );
    expect(explanation).toBeInTheDocument();
  });

  it('renders home link', () => {
    render(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /ホームへ戻る/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has proper styling classes', () => {
    render(<NotFound />);
    const homeButton = screen.getByRole('button', { name: /ホームへ戻る/i });
    expect(homeButton).toHaveClass('bg-primary');
  });
});
