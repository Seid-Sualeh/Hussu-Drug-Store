import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Handles session expiry via event (no hard redirect in api client).
 * React Router navigation preserves a clean logout without blocking the UI thread.
 */
export default function AuthSessionHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onExpired = (event) => {
      logout();
      navigate('/welcome', {
        replace: true,
        state: {
          sessionExpired: true,
          message: event.detail?.message || 'Session expired. Please sign in again.',
        },
      });
    };

    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, [navigate, logout]);

  return null;
}
