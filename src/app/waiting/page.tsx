'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';

interface Topper { name: string; score: number; total: number }

export default function WaitingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quizActive, setQuizActive] = useState(false);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<{ passed: number; failed: number; pending: number; toppers: Topper[] } | null>(null);

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
          <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 580, width: '100%' }}>
        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-container">
            <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', boxShadow: '0 8px 32px var(--accent-glow)' }} />
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                C Programming Unplugged 2.0
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                FEEDEX Community Quiz Event
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(21,182,214,0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Welcome, <strong style={{ color: 'var(--accent-light)' }}>{userName}</strong>!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Read the instructions carefully before starting.
            </p>
          </div>

          <div style={{
            textAlign: 'left',
            background: 'rgba(10, 10, 20, 0.5)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-light)' }}>
              📋 Instructions
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
              <li>Each question has <strong style={{ color: 'var(--text-primary)' }}>4 options</strong> and a <strong style={{ color: 'var(--danger)' }}>5-second timer</strong></li>
              <li>Click <strong style={{ color: 'var(--text-primary)' }}>&quot;Show Options&quot;</strong> to reveal answers and start the timer</li>
              <li>You must select an answer within the time limit</li>
              <li><strong style={{ color: 'var(--danger)' }}>DO NOT</strong> switch tabs, open other apps, or leave this page</li>
              <li>Any cheating attempt will <strong style={{ color: 'var(--danger)' }}>immediately block</strong> your account</li>
              <li>Results will be shown at the end with animations</li>
            </ul>
          </div>

          {quizActive ? (
            <button className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }} onClick={() => router.push('/quiz')}>
              🚀 Start Quiz Now
            </button>
          ) : (
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '14px',
              padding: '1.25rem',
              color: 'var(--warning)',
              fontSize: '0.95rem'
            }}>
              ⏳ Waiting for admin to start the quiz...
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                This page will auto-refresh. Stay here.
              </div>
            </div>
          )}
        </div>

        {/* QR Code Share */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📱 Share with friends</h3>
          <div style={{ display: 'inline-block', padding: '0.75rem', background: 'white', borderRadius: '12px' }}>
            <QRCodeCanvas value={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'} size={120} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Scan to join the quiz</p>
        </div>

        {/* Live Stats Section */}
        {stats && (stats.passed > 0 || stats.failed > 0) && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              📊 Live Results
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value" style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{stats.passed}</div>
                <div className="stat-label">Passed</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value" style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{stats.failed}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value" style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #f59e0b, #06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{stats.pending}</div>
                <div className="stat-label">Pending</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
