'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
interface Topper { name: string; score: number; total: number }

export default function WaitingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quizActive, setQuizActive] = useState(false);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<{ passed: number; failed: number; pending: number; toppers: Topper[] } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [resultsPublished, setResultsPublished] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.user) { router.push('/'); return; }
        if (meData.user.blocked) { router.push('/blocked'); return; }
        if (meData.user.role === 'admin') { router.push('/admin'); return; }
        setUserName(meData.user.name || 'Student');

        const quizRes = await fetch('/api/quiz');
        const quizData = await quizRes.json();
        if (quizData.quizState?.isActive) setQuizActive(true);
        if (quizData.quizState?.resultsPublished) setResultsPublished(true);
        setHasSubmitted(!!meData.user.hasSubmitted);

        const statsRes = await fetch('/api/quiz/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    check();
    const interval = setInterval(async () => {
      try {
        const quizRes = await fetch('/api/quiz');
        const quizData = await quizRes.json();
        if (quizData.quizState?.isActive) setQuizActive(true);
        if (quizData.quizState?.resultsPublished) setResultsPublished(true);
        const statsRes = await fetch('/api/quiz/stats');
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center' }}>
          <img src="/feedx-logo.jpeg" alt="FEEDX" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 580, width: '100%', textAlign: 'center' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease-out' }}>
          <img
            src="/feedx-logo.jpeg"
            alt="FEEDX Logo"
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent-light)',
              boxShadow: '0 0 20px var(--accent-glow)',
              marginBottom: '1rem'
            }}
          />
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 800, 
            marginBottom: '0.25rem',
            fontFamily: "'Playfair Display', serif" 
          }}>
            C Programming Unplugged 2.0
          </h1>
          <p style={{ 
            fontSize: '0.9rem', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            color: 'var(--text-secondary)' 
          }}>
            FEEDX Community Quiz Event
          </p>
        </div>

        {/* Welcome Block */}
        {!hasSubmitted && !resultsPublished && (
          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Welcome, <span style={{ color: 'var(--accent-light)' }}>{userName}</span>!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Read the instructions carefully before starting.
            </p>
          </div>
        )}

        {/* Instructions Block */}
        {!hasSubmitted && !resultsPublished && (
          <div className="glass-card" style={{ 
            padding: '1.75rem', 
            marginBottom: '1.5rem',
            textAlign: 'left',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: 'var(--accent-light)', 
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Instructions
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.85rem',
              fontSize: '0.95rem',
              color: 'var(--text-secondary)'
            }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span>Each question has <strong style={{color: 'var(--text-primary)'}}>4 options</strong> and a <strong style={{color: 'var(--danger)'}}>10-second timer</strong></span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span>Click <strong style={{color: 'var(--text-primary)'}}>"Show Options"</strong> to reveal answers and start the timer</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span>You must select an answer within the time limit</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span><strong style={{color: 'var(--danger)'}}>DO NOT</strong> switch tabs, open other apps, or leave this page</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span>Any cheating attempt will <strong style={{color: 'var(--danger)'}}>immediately block</strong> your account</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-light)', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                <span>Results will be shown at the end with animations</span>
              </li>
            </ul>
          </div>
        )}

        {/* Status Area */}
        <div style={{ padding: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
          {quizActive && !hasSubmitted ? (
            <div className="glass-card" style={{ border: '1px solid var(--success)', background: 'rgba(34,197,94,0.05)', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--success)' }}>🚀 The Quiz is LIVE NOW!</h2>
              <button className="btn-primary" style={{ width: '100%', padding: '1.25rem' }} onClick={() => router.push('/quiz')}>
                Enter Quiz & Answer Now
              </button>
            </div>
          ) : !hasSubmitted && !resultsPublished ? (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              color: 'var(--warning)',
              fontSize: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}>⏳</span>
              <strong>Waiting for the official start...</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Please stay on this page. The quiz will begin shortly.
              </div>
            </div>
          ) : null}
        </div>

        {/* Live Stats Section - Only show if submitted or results are out */}
        {(hasSubmitted || resultsPublished) && stats && (stats.passed > 0 || stats.failed > 0) && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center', letterSpacing: '1px' }}>
              📊 OFFICIAL SCOREBOARD
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="stat-value" style={{ fontSize: '3rem', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{stats.passed}</div>
                <div className="stat-label" style={{ fontSize: '1rem', fontWeight: 700 }}>PASSED</div>
              </div>
              <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <div className="stat-value" style={{ fontSize: '3rem', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{stats.failed}</div>
                <div className="stat-label" style={{ fontSize: '1rem', fontWeight: 700 }}>FAILED</div>
              </div>
            </div>

            {stats.toppers.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-light)' }}>🏆 Top Performers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stats.toppers.map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 0.9rem',
                      background: 'rgba(10,10,20,0.5)',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}>
                      <span>
                        <span style={{ marginRight: '0.5rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                        {t.name}
                      </span>
                      <span className="badge badge-success">{t.score}/{t.total}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: '2.5rem' }}>
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/');
                }}
              >
                🏠 Leave Site & Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
