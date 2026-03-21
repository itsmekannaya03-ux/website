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
  const [isPublished, setIsPublished] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.user) { router.push('/'); return; }
        if (meData.user.blocked) { router.push('/blocked'); return; }

        // Fetch quiz state first to see if published
        const pollStatus = async () => {
          const res = await fetch(`/api/quiz?t=${Date.now()}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.quizState?.resultsPublished) {
            setIsPublished(true);
            // Submit and get final result
            const submitRes = await fetch('/api/quiz/submit', { method: 'POST' });
            const submitData = await submitRes.json();
            if (submitData.result) {
              setResult(submitData.result);
              setTimeout(() => setShowScore(true), 500);
              // Confetti
              setConfetti(Array.from({ length: 40 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                color: ['#6c63ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][Math.floor(Math.random() * 6)],
                delay: Math.random() * 2,
              })));
            }
            return true;
          }
          return false;
        };

        const isAlreadyPublished = await pollStatus();
        setLoading(false);

        if (!isAlreadyPublished) {
          const interval = setInterval(async () => {
            try {
              const done = await pollStatus();
              if (done) clearInterval(interval);
            } catch { /* retry next time */ }
          }, 5000); // 5 seconds polling
          return () => clearInterval(interval);
        }
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
          <img src="/feedx-logo.jpeg" alt="FEEDX" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Calculating results...</p>
        </div>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="page-container" style={{ background: '#0a0a14' }}>
        <div className="glass-card" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div className="reveal-loader" style={{ marginBottom: '2rem' }}>
            <div className="pulse-circle"></div>
            <div className="pulse-circle" style={{ animationDelay: '0.5s' }}></div>
            <div className="pulse-circle" style={{ animationDelay: '1s' }}></div>
            <span style={{ fontSize: '3rem', position: 'relative', zIndex: 10 }}>⏳</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Quiz Completed!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Excellent work! Your answers have been safely recorded.
          </p>
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.25rem', 
            background: 'rgba(21,182,214,0.1)', 
            borderRadius: '15px',
            border: '1px solid rgba(21,182,214,0.2)'
          }}>
            <p style={{ color: 'var(--accent-light)', fontWeight: 600, margin: 0 }}>
              Waiting for the Admin to publish the final results...
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Results will appear automatically once the admin presses "Display Results".
            </p>
            <button 
              className="btn-primary" 
              style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ maxWidth: 450, textAlign: 'center' }}>
          <p>Processing your results...</p>
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

      <div className="glass-card" style={{ maxWidth: 550, width: '100%', textAlign: 'center', position: 'relative', zIndex: 20, padding: '4rem 2rem' }}>
        <div style={{
          animation: showScore ? 'scoreReveal 1.2s cubic-bezier(0.17, 0.89, 0.32, 1.49) both' : 'none',
          opacity: showScore ? 1 : 0,
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>
            {result.passed ? '🎉' : '📖'}
          </div>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
            Quiz Completed
          </h2>

          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 900, 
            marginBottom: '1.5rem',
            lineHeight: 1.2
          }}>
            You Scored <br />
            <span style={{ 
              background: result.passed ? 'linear-gradient(135deg, #22c55e, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '4.5rem'
            }}>
              {result.totalScore}
            </span>
            <span style={{ fontSize: '2rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>
              out of {result.totalQns}
            </span>
          </h1>

          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '20px', 
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            display: 'inline-block',
            marginBottom: '2.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '1.2rem', color: result.passed ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
              {result.passed ? '✅ SUCCESS: YOU PASSED' : '❌ KEEP TRYING: YOU FAILED'}
            </p>
          </div>

          <div>
            <button 
              className="btn-primary" 
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
