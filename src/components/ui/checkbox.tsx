import React from 'react';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ 
  checked = false, 
  onCheckedChange, 
  disabled = false,
  className = '' 
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={`
        h-4 w-4 
        text-purple-600 
        border-gray-300 
        rounded 
        focus:ring-purple-500 
        focus:ring-2
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
}
