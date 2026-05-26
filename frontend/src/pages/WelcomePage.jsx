import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/welcome.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, sessionChecked } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionChecked && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, sessionChecked, navigate]);

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setError(location.state.message || 'Session expired. Please sign in again.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      login(data.token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        <div className="welcome-brand">
          <div className="moon-icon">
            <i className="bi bi-moon-stars-fill" />
          </div>
          <h1>Welcome</h1>
          <p>Sign in to Hussu Drug Store inventory system</p>
        </div>

        <Form className="welcome-form" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin or guest"
              autoComplete="username"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </Form.Group>
          {error && <div className="alert alert-danger py-2 welcome-error">{error}</div>}
          <button type="submit" className="welcome-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </Form>

        <div className="welcome-roles">
          <h3>Demo accounts</h3>
          <div
            className="role-hint admin"
            role="button"
            tabIndex={0}
            onClick={() => fillDemo('admin', 'admin123')}
            onKeyDown={(e) => e.key === 'Enter' && fillDemo('admin', 'admin123')}
          >
            <div>
              <strong>Admin</strong>
              Full access — add, edit, delete, stock, sales, settings
              <code className="d-block mt-1">admin / admin123</code>
            </div>
          </div>
          <div
            className="role-hint guest"
            role="button"
            tabIndex={0}
            onClick={() => fillDemo('guest', 'guest123')}
            onKeyDown={(e) => e.key === 'Enter' && fillDemo('guest', 'guest123')}
          >
            <div>
              <strong>Guest</strong>
              View only — browse dashboard &amp; reports, no changes
              <code className="d-block mt-1">guest / guest123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
