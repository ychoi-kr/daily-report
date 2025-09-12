import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './loading';

describe('Loading Component', () => {
  it('renders loading text', () => {
    render(<Loading />);
    const loadingText = screen.getByText(/読み込み中.../i);
    expect(loadingText).toBeInTheDocument();
  });

  it('renders spinner element', () => {
    render(<Loading />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has proper styling classes for spinner', () => {
    render(<Loading />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
  });

  it('is centered on the page', () => {
    render(<Loading />);
    const container = document.querySelector('.fixed');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
  });
});
