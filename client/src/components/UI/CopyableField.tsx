import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import './CopyableField.css';

export interface CopyableFieldProps {
  /** The value to display and copy */
  value: string;
  /** Optional label shown above the field */
  label?: string;
  /** Whether the field is disabled (still copyable but visually muted) */
  disabled?: boolean;
  /** Callback fired after successful copy */
  onCopy?: () => void;
  /** Duration in ms to show the "Copied" state (default 2000) */
  feedbackDuration?: number;
  /** Additional CSS class for the container */
  className?: string;
}

/**
 * A read-only text field with an always-visible copy button.
 * Shows feedback when copied successfully.
 */
const CopyableField: React.FC<CopyableFieldProps> = ({
  value,
  label,
  disabled = false,
  onCopy,
  feedbackDuration = 2000,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, feedbackDuration);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [value, onCopy, feedbackDuration]);

  return (
    <div className={`copyable-field ${disabled ? 'disabled' : ''} ${className}`.trim()}>
      {label && <label className="copyable-field-label">{label}</label>}
      <div className="copyable-field-container">
        <input
          type="text"
          value={value}
          readOnly
          className="copyable-field-input"
          aria-label={label || 'Copyable value'}
        />
        <button
          type="button"
          className={`copyable-field-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={!value}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};

export default CopyableField;
