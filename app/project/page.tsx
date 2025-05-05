'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectConfig } from '@/components/config/project-config';

export default function ProjectPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id') as string | null;

  return (
    <main className="flex min-h-screen flex-col">
      {projectId ? (
        <ProjectConfig projectId={projectId} />
      ) : (
        <div>No project ID specified.</div> // Or some other placeholder/error state
      )}
    </main>
  );
} 
