import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="welcome-card">
        <p className="eyebrow">SECURE INVESTIGATOR ACCESS</p>
        <h1>{isRegister ? 'Create an account.' : 'Sign in to your intelligence workspace.'}</h1>
        <p className="welcome-copy">
          {isRegister
            ? 'Register a new investigator account to get started.'
            : 'Use your investigator account to upload evidence and review connected entities.'}
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            {busy ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in')}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            onClick={() => { setError(''); setIsRegister((prev) => !prev); }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </section>
    </main>
  );
}
