'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        {/* Tukubi-branded error UI — use Caribbean Futurism colors (coral #FF6B6B, purple #6B4FBB, etc.) */}
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #0a2444 100%)' }}>
          <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
            <h1>Something went wrong</h1>
            <p>An unexpected error occurred. Our team has been notified.</p>
            <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#FF6B6B', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}
