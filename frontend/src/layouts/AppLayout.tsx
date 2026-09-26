import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <Header />
      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)] flex-1">
        <div className="max-w-[1600px] mx-auto px-margin py-margin">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
