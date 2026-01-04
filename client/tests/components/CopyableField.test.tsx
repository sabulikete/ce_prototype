import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CopyableField from '../../src/components/UI/CopyableField';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CopyableField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  it('renders value in input field', () => {
    render(<CopyableField value="https://example.com/invite/abc123" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('https://example.com/invite/abc123');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders optional label', () => {
    render(<CopyableField value="test" label="Invite URL" />);

    expect(screen.getByText('Invite URL')).toBeInTheDocument();
  });

  it('copies value to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    render(<CopyableField value="https://example.com/invite/abc123" />);

    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    await user.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/invite/abc123');
  });

  it('shows copied state after successful copy', async () => {
    const user = userEvent.setup();
    render(<CopyableField value="test-value" feedbackDuration={100} />);

    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    await user.click(copyBtn);

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('calls onCopy callback after successful copy', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<CopyableField value="test-value" onCopy={onCopy} />);

    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    await user.click(copyBtn);

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('disables copy button when value is empty', () => {
    render(<CopyableField value="" />);

    const copyBtn = screen.getByRole('button');
    expect(copyBtn).toBeDisabled();
  });

  it('applies disabled styling when disabled prop is true', () => {
    const { container } = render(<CopyableField value="test" disabled />);

    expect(container.querySelector('.copyable-field.disabled')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CopyableField value="test" className="custom-class" />);

    expect(container.querySelector('.copyable-field.custom-class')).toBeInTheDocument();
  });

  it('resets copied state after feedbackDuration', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<CopyableField value="test" feedbackDuration={1000} />);

    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    await user.click(copyBtn);

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();

    vi.advanceTimersByTime(1000);

    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
