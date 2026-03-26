import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) setError(err);
    else navigate('/app/properties');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F7F8' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: '#1A3C4A' }}>
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1A3C4A' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#3A6878' }}>Sign in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm px-3 py-2 rounded" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#D0DDE2' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#D0DDE2' }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs" style={{ color: '#3A6878' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#2E6E82' }}>Create one</Link>
          </div>
          <div className="mt-2 text-center text-xs" style={{ color: '#3A6878' }}>
            Just browsing?{' '}
            <Link to="/demo/weekly" className="font-medium" style={{ color: '#C86848' }}>Try the demo</Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs" style={{ color: '#3A6878' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
