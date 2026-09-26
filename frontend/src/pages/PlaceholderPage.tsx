import React from 'react';
import { Breadcrumbs } from '../layouts/Breadcrumbs';

interface PlaceholderPageProps {
  title: string;
  section?: string;
  description: string;
  icon: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  section = 'Operations',
  description,
  icon,
}) => {
  return (
    <div className="flex flex-col w-full">
      <Breadcrumbs currentSection={section} currentPageTitle={title} />
      <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center mb-space-md shadow-sm">
          <span className="material-symbols-outlined text-[32px]">{icon}</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface mb-2">
          {title}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
          {description}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed/40 text-primary font-label-caps text-label-caps uppercase font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Scheduled for Milestone 2</span>
        </div>
      </div>
    </div>
  );
};
