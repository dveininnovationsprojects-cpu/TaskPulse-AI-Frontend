import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, role } = response.data;
      
      localStorage.setItem('token', accessToken);
      if (role) {
        localStorage.setItem('role', role);
      }
      
      // Navigate based on role returned from server. Fallback to developer if undefined.
      const userRole = role ? role.toLowerCase() : 'developer';
      navigate(`/dashboard/${userRole}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="bg-elements">
        <div className="ribbon-container-left">
          <div className="ribbon-bar bar-1"></div>
          <div className="ribbon-bar bar-2"></div>
          <div className="ribbon-bar bar-3"></div>
          <div className="ribbon-bar bar-4"></div>
        </div>
        <svg className="background-svg" viewBox="0 0 1440 1024" preserveAspectRatio="none">
          <defs>
            <filter id="wave-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="10" dy="10" stdDeviation="20" floodColor="#11b1c6" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Back Wave (Cyan Translucent Ribbon) */}
          <path d="M 280,0 C 410,180 510,300 380,550 C 250,800 330,920 510,1024 L 130, 1024 C 280,900 210,800 80,550 C -20,300 110,150 80,0 Z" fill="rgba(141, 227, 242, 0.4)" />

          {/* Front Wave (White Ribbon) */}
          <path d="M 250,0 C 380,180 480,300 350,550 C 220,800 300,920 480,1024 L 100,1024 C 250,900 180,800 50,550 C -50,300 80,150 50,0 Z" fill="#ffffff" filter="url(#wave-shadow)" />
        </svg>
        <div className="ribbon-container-right">
          <div className="ribbon-bar bar-r1"></div>
          <div className="ribbon-bar bar-r2"></div>
          <div className="ribbon-bar bar-r3"></div>
        </div>
      </div>

      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-dot"></div>
          TaskPulse AI
        </div>
      </header>

      <main className="content-wrapper">
        <div className="auth-section">
          <div className="auth-title">
            <span className="light">MEMBER</span>
            <span className="bold">LOGIN</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#11b1c6',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <button type="submit" className="btn-pill" disabled={isLoading}>
              {isLoading ? 'PLEASE WAIT...' : 'LOGIN NOW!'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Request Access</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
