import type { ReactNode } from 'react';

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`min-w-0 rounded-md border border-line bg-white p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
