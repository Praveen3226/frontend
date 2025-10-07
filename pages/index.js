import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { AuthContext } from '../src/context/AuthContext';

export default function AuthPage() {
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (isLogin) {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          email: form.email,
          password: form.password
        });
        login(res.data.token);
        router.push('/dashboard');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, form);
        setMsg('Account created successfully! Please login.');
        setIsLogin(true);
        setForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      setMsg(err.response?.data?.msg || err.message || 'Operation failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-theme-toggle">
          <span className="theme-label">{theme === "light" ? "Light" : "Dark"}</span>
          <div className="theme-switch" onClick={toggleTheme}>
            <input type="checkbox" checked={theme === "dark"} readOnly />
            <span className="slider"></span>
          </div>
        </div>

        <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
        {msg && <p className="msg">{msg}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setMsg(''); }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

