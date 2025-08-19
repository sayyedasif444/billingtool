'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface SimpleDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function SimpleDateInput({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className,
  id
}: SimpleDateInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pr-10", className)}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Calendar className="h-4 w-4 text-white" />
      </div>
    </div>
  );
}
