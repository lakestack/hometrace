'use client';

import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
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
