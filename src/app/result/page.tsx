'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ResultData {
  totalScore: number;
  totalQns: number;
  passed: boolean;
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScore, setShowScore] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.user) { router.push('/'); return; }
        if (meData.user.blocked) { router.push('/blocked'); return; }

        // Submit results first
        const submitRes = await fetch('/api/quiz/submit', { method: 'POST' });
        const submitData = await submitRes.json();
        if (submitData.result) {
          setResult(submitData.result);
        }
        setLoading(false);

        // Trigger animations
        setTimeout(() => setShowScore(true), 500);

        // Generate confetti
        const particles = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: ['#6c63ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][Math.floor(Math.random() * 6)],
          delay: Math.random() * 2,
        }));
        setConfetti(particles);
      } catch {
        router.push('/');
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center' }}>
          <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Calculating results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ maxWidth: 450, textAlign: 'center' }}>
          <p>No results found. Please complete the quiz first.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => router.push('/waiting')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((result.totalScore / result.totalQns) * 100);

  return (
    <div className="page-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Confetti */}
      {confetti.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            bottom: '-20px',
            left: `${p.left}%`,
            width: '10px',
            height: '10px',
            background: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            animation: `confetti 3s ease-out ${p.delay}s forwards`,
            zIndex: 10,
          }}
        />
      ))}

      <div className="glass-card" style={{ maxWidth: 500, width: '100%', textAlign: 'center', position: 'relative', zIndex: 20 }}>
        <div style={{
          animation: showScore ? 'scoreReveal 1s ease forwards' : 'none',
          opacity: showScore ? 1 : 0,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
            {result.passed ? '🏆' : '📚'}
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '0.5rem',
            background: result.passed
              ? 'linear-gradient(135deg, #22c55e, #06b6d4)'
              : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {result.passed ? 'Congratulations!' : 'Keep Learning!'}
          </h1>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
            {result.passed
              ? 'You passed the quiz! Great job!'
              : 'You didn\'t pass this time. Keep practicing!'}
          </p>

          {/* Score circle */}
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: `conic-gradient(${result.passed ? 'var(--success)' : 'var(--danger)'} ${percentage * 3.6}deg, rgba(100,100,255,0.1) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: result.passed
              ? '0 0 40px rgba(34, 197, 94, 0.3)'
              : '0 0 40px rgba(239, 68, 68, 0.2)',
          }}>
            <div style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
                {percentage}%
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {result.totalScore}/{result.totalQns}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{result.totalScore}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.75rem', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
                {result.totalQns - result.totalScore}
              </div>
              <div className="stat-label">Wrong/Missed</div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <span className={result.passed ? 'badge badge-success' : 'badge badge-danger'} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
              {result.passed ? '✅ PASSED' : '❌ FAILED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
