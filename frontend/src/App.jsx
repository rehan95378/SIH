import './styles/tokens.css';
import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('demo-password');
  const [message, setMessage] = useState('');
  const { signIn, user } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage('Signing in...');
    try {
      await signIn(email, password);
      setMessage('Signed in successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="welcome-card">
        <p className="eyebrow">CRIME NETWORK INTELLIGENCE</p>
        <h1>Understand the connections hidden in your evidence.</h1>
        <p className="welcome-copy">
          Upload a report, call log, financial file, or social report to begin
          an investigation.
        </p>
        {user ? (
          <p className="status-message">Signed in as {user.email}</p>
        ) : <form onSubmit={handleLogin}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit">Sign in</button>
        </form>}
        {message && <p className="status-message">{message}</p>}
      </section>
    </main>
  );
}

export default App;
