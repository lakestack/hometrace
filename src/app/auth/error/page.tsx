'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');

  return (
    <div>
      <h1>Error</h1>
      <p>Error Code: {errorCode}</p>
      {errorCode === '401' && (
        <p>You are not authorized to access this page.</p>
      )}
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
