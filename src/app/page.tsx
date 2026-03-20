'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'password' | 'details' | 'admin-details'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.role === 'admin') {
            if (!d.user.name) setStep('admin-details');
            else router.push('/admin');
          } else if (d.user.name && d.user.pin) {
            router.push('/waiting');
          } else {
            setStep('details');
          }
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.requirePassword) { setStep('password'); setLoading(false); return; }
      if (data.user.role === 'admin') {
        if (!data.user.name) setStep('admin-details');
        else router.push('/admin');
      } else if (data.user.name && data.user.pin) {
        router.push('/waiting');
      } else {
        setStep('details');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.user) {
        if (!data.user.name) setStep('admin-details');
        else router.push('/admin');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid password');
    }
    setLoading(false);
  };

  const handleAdminDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'ADMIN', name: adminName, branch: 'ADMIN', year: 'ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save details');
    }
    setLoading(false);
  };

  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, name, branch, year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/waiting');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save details');
    }
    setLoading(false);
  };

  if (checking) {
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
    <div style={{ minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>
        Updated by Kannaya 🔥
      </h2>
      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Big centered logo */}
        <img
          src="/feedex-logo.jpeg"
          alt="FEEDEX Logo"
          style={{
            width: 140,
            height: 140,
            borderRadius: 28,
            objectFit: 'cover',
            boxShadow: '0 12px 50px var(--accent-glow)',
            marginBottom: '1.75rem',
            animation: 'slideUp 0.8s ease-out',
          }}
        />

        {/* FEEDEX COMMUNITY */}
        <p style={{
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--accent-light)',
          marginBottom: '0.75rem',
          animation: 'fadeIn 1s ease-out 0.2s both',
        }}>
          FEEDEX Community
        </p>

        {/* Event Name - Big & Bold */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #15b6d6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'fadeIn 1s ease-out 0.4s both',
        }}>
          C Programming<br />Unplugged 2.0
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.05rem',
          marginBottom: '2.5rem',
          maxWidth: 400,
          lineHeight: 1.5,
          animation: 'fadeIn 1s ease-out 0.6s both',
        }}>
          Secure Online Quiz Assessment
        </p>

        {/* Scroll indicator */}
        <div style={{
          animation: 'fadeIn 1s ease-out 0.8s both',
          cursor: 'pointer',
        }}
          onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Scroll down to begin</p>
          <div style={{ fontSize: '1.5rem', animation: 'pulse 2s ease-in-out infinite' }}>↓</div>
        </div>
      </section>

      {/* ===== LOGIN SECTION ===== */}
      <section id="login-section" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
      }}>
        <div className="glass-card" style={{ maxWidth: 460, width: '100%' }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              padding: '0.875rem',
              marginBottom: '1.5rem',
              color: 'var(--danger)',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
                Welcome! 👋
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                Enter your email to get started
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Login →'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
                🔒 Admin Login
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                Enter the admin password to continue
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Unlock →'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setError(''); setPassword(''); }} style={{
                width: '100%', marginTop: '0.75rem', padding: '0.7rem',
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem'
              }}>
                ← Back
              </button>
            </form>
          )}

          {step === 'admin-details' && (
            <form onSubmit={handleAdminDetails}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                👤 Admin Details
              </h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Name</label>
                <input className="input-field" placeholder="Enter your name" value={adminName} onChange={e => setAdminName(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : 'Continue to Dashboard →'}
              </button>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetails}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                Fill Your Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Pin</label>
                  <input className="input-field" placeholder="Enter your Pin" value={pin} onChange={e => setPin(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Name</label>
                  <input className="input-field" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Branch</label>
                  <input className="input-field" placeholder="e.g. CSE, ECE, MECH..." value={branch} onChange={e => setBranch(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Year</label>
                  <select className="input-field" value={year} onChange={e => setYear(e.target.value)} required>
                    <option value="">Select Year</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : 'Continue to Quiz →'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
