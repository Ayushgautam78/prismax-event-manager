import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import HostEvent from './pages/HostEvent';
import AdminDashboard from './pages/AdminDashboard';
import { ShieldAlert } from 'lucide-react';

function Navigation() {
  const navigate = useNavigate();
  return (
    <nav className="nav">
      <div className="container nav-container">
        <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="PrismaX" className="logo-img" />
        </Link>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/login')}>
            <ShieldAlert size={16} style={{ marginRight: '8px' }} /> Admin
          </button>
        </div>
      </div>
    </nav>
  );
}

function AdminLogin() {
  const navigate = useNavigate();

  // Auto-redirect to dashboard if valid session is already saved
  useEffect(() => {
    const sessionStr = localStorage.getItem('adminSession');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.token && session.expiry && Date.now() < session.expiry) {
          navigate('/admin/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('adminSession');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: e.target.username.value,
          password: e.target.password.value
        })
      });
      
      const responseText = await res.text();
      let data = {};
      let isJson = false;
      try {
        data = JSON.parse(responseText);
        isJson = true;
      } catch (e) {}
      
      if (res.ok && data.success) {
        // Save session valid for 7 days in localStorage
        const session = {
          token: data.token,
          expiry: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        };
        localStorage.setItem('adminSession', JSON.stringify(session));
        navigate('/admin/dashboard');
      } else {
        if (isJson) {
          alert(data.message || 'Invalid credentials');
        } else {
          alert(`Error during login: ${res.status} ${res.statusText} - ${responseText.substring(0, 150)}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Error during login: ${err.message}`);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Admin Access</h2>
      <form onSubmit={handleLogin} className="card">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input name="username" className="form-control" required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input name="password" type="password" className="form-control" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host-event" element={<HostEvent />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
