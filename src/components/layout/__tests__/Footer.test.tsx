import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders copyright text with current year', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);
    
    expect(screen.getByText(`© ${currentYear} 営業日報システム. All rights reserved.`))
      .toBeInTheDocument();
  });

  it('displays version when showVersion is true', () => {
    render(<Footer showVersion={true} />);
    
    expect(screen.getByText(/Version/)).toBeInTheDocument();
  });

  it('hides version when showVersion is false', () => {
    render(<Footer showVersion={false} />);
    
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer />);
    
    expect(screen.getByText('ヘルプ')).toBeInTheDocument();
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
    expect(screen.getByText('利用規約')).toBeInTheDocument();
  });

  it('footer links have correct href attributes', () => {
    render(<Footer />);
    
    const helpLink = screen.getByText('ヘルプ').closest('a');
    const privacyLink = screen.getByText('プライバシーポリシー').closest('a');
    const termsLink = screen.getByText('利用規約').closest('a');
    
    expect(helpLink).toHaveAttribute('href', '/help');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<Footer className="custom-footer-class" />);
    
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('custom-footer-class');
  });

  it('has proper accessibility attributes', () => {
    render(<Footer />);
    
    const helpLink = screen.getByText('ヘルプ').closest('a');
    const privacyLink = screen.getByText('プライバシーポリシー').closest('a');
    const termsLink = screen.getByText('利用規約').closest('a');
    
    expect(helpLink).toHaveAttribute('aria-label', 'Help');
    expect(privacyLink).toHaveAttribute('aria-label', 'Privacy Policy');
    expect(termsLink).toHaveAttribute('aria-label', 'Terms of Service');
  });

  it('uses environment variable for version if available', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_VERSION;
    process.env.NEXT_PUBLIC_APP_VERSION = '2.0.0';
    
    render(<Footer showVersion={true} />);
    
    expect(screen.getByText('Version 2.0.0')).toBeInTheDocument();
    
    // Restore original value
    process.env.NEXT_PUBLIC_APP_VERSION = originalEnv;
  });

  it('uses default version when environment variable is not set', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_VERSION;
    delete process.env.NEXT_PUBLIC_APP_VERSION;
    
    render(<Footer showVersion={true} />);
    
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    
    // Restore original value
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_APP_VERSION = originalEnv;
    }
  });
});