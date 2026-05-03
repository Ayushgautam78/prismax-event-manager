import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import HostEvent from './pages/HostEvent';
import AdminDashboard from './pages/AdminDashboard';
import { Calendar, ShieldAlert } from 'lucide-react';

function Navigation() {
  const navigate = useNavigate();
  return (
    <nav className="nav">
      <div className="container nav-container">
        <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="PrismaX" style={{ height: '180px', mixBlendMode: 'lighten' }} />
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
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: e.target.username.value, password: e.target.password.value })
    });
    if (res.ok) {
      navigate('/admin/dashboard');
    } else {
      alert('Invalid credentials');
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
