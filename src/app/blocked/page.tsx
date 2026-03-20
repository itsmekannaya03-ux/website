'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockedPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user) router.push('/');
      })
      .catch(() => router.push('/'));
  }, [router]);

  return (
    <div className="blocked-overlay">
      <div className="blocked-content">
        <div className="blocked-icon">🚫</div>
        <h2>Account Blocked</h2>
        <p>
          Your account has been blocked due to suspicious activity detected during the quiz.
          This may include switching tabs, opening other applications, or attempting to use
          external tools.
        </p>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          The admin has been notified. If you believe this is an error, please contact the quiz organizers.
        </p>
      </div>
    </div>
  );
}
