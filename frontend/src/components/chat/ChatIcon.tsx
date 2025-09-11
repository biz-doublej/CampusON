import React from 'react';

export default function ChatIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6.5C4 5.119 5.79 4 8 4h8c2.21 0 4 1.119 4 2.5V14c0 1.381-1.79 2.5-4 2.5H9.618a2 2 0 0 0-1.265.454L5.5 19.5V16c-0.828 0-1.5-0.672-1.5-1.5v-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="10" r="1" fill="currentColor"/>
      <circle cx="12" cy="10" r="1" fill="currentColor"/>
      <circle cx="15" cy="10" r="1" fill="currentColor"/>
    </svg>
  );
}

