import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Form from "react-bootstrap/Form";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import "../styles/welcome.css";

export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, sessionChecked } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionChecked && isAuthenticated)
      navigate("/dashboard", { replace: true });
  }, [isAuthenticated, sessionChecked, navigate]);

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setError(
        location.state.message || "Session expired. Please sign in again.",
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!navigator.onLine) {
      const message = "Network offline. Please connect to the internet to sign in.";
      setError(message);
      showToast(message, "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      login(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      showToast(message, "danger");
    } finally {
      setLoading(false);
    }
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
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3 password-input-wrapper">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              <i className={passwordVisible ? "bi bi-eye-slash" : "bi bi-eye"} />
            </button>
          </Form.Group>
          {error && (
            <div className="alert alert-danger py-2 welcome-error">{error}</div>
          )}
          <button type="submit" className="welcome-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </Form>
        <div className="demo-credentials">
          <div className="demo-credentials-header">
            <i className="bi bi-info-circle" />
            <span>Demo credentials to see the application in action</span>
          </div>
          <div className="demo-credentials-body">
            <div className="credential-item">
              <span className="credential-label">Username</span>
              <code className="credential-value">storegust</code>
            </div>
            <div className="credential-item">
              <span className="credential-label">Password</span>
              <code className="credential-value">hussuguest</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
