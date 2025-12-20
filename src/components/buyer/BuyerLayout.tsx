import { ReactNode } from 'react';
import { BuyerHeader } from './BuyerHeader';
import { BottomNav } from './BottomNav';

interface BuyerLayoutProps {
  children: ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <BuyerHeader />
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
