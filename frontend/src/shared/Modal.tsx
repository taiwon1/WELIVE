'use client';

import { ReactNode } from 'react';
import { cn } from './lib/helper';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className={cn('w-[90%] max-w-md rounded-xl bg-white', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
