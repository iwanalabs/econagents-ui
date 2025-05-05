'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectConfig } from '@/components/config/project-config';

function ProjectPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id') as string | null;

  return (
    <>
      {projectId ? (
        <ProjectConfig projectId={projectId} />
      ) : (
        <div>No project ID specified.</div> // Or some other placeholder/error state
      )}
    </>
  );
}

export default function ProjectPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectPageContent />
      </Suspense>
    </main>
  );
} 
