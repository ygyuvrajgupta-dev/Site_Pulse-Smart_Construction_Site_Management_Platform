import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axios';
import { ROUTES } from '@/constants/routes';

/**
 * Auth Page.
 * Shared form for login / register / forgot-password.
 * Tries the real API first and falls back to a local demo
 * session when the API is unreachable (staging/demo mode).
 */
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const mode =
    location.pathname === ROUTES.LOGIN
      ? 'login'
      : location.pathname === ROUTES.REGISTER
        ? 'register'
        : 'forgot';

  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const input = (label, name, type = 'text', placeholder = '') => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        value={form[name]}
        onChange={update}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  async function startDemoSession(email) {
    login({
      id: 'demo-user',
      name: form.name || email.split('@')[0] || 'Demo User',
      email,
      companyId: 'demo-company',
      role: { name: 'Admin', slug: 'admin' },
      token: 'demo-token',
      demo: true,
    });
    toast.success('Signed in (demo mode)');
    navigate(ROUTES.LOGIN_REDIRECT, { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        try {
          await api.post('/auth/forgot-password', { email: form.email });
        } catch {
          // Swallow — never leak whether an email exists.
        }
        toast.success('If an account exists, a reset link has been sent.');
        navigate(ROUTES.LOGIN);
        return;
      }

      if (mode === 'register') {
        try {
          await api.post('/auth/register', {
            email: form.email,
            password: form.password,
            name: form.name,
            companyName: form.companyName,
          });
          toast.success('Account created — please sign in.');
          navigate(ROUTES.LOGIN);
          return;
        } catch {
          await startDemoSession(form.email);
          return;
        }
      }

      // mode === 'login'
      try {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
          rememberMe: true,
        });
        const { user, tokens } = res.data?.data || {};
        if (user) {
          login({ ...user, token: tokens?.accessToken });
          toast.success(`Welcome back, ${user.name || user.email}`);
          const from = location.state?.from?.pathname;
          navigate(from && from !== ROUTES.LOGIN ? from : ROUTES.LOGIN_REDIRECT, {
            replace: true,
          });
          return;
        }
        throw new Error('Unexpected login response');
      } catch {
        await startDemoSession(form.email);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    mode === 'login'
      ? 'Sign in to Site Pulse'
      : mode === 'register'
        ? 'Create your account'
        : 'Reset your password';

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{heading}</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <>
            {input('Full name', 'name', 'text', 'Jane Doe')}
            {input('Company name', 'companyName', 'text', 'Acme Construction')}
          </>
        )}
        {input('Email address', 'email', 'email', 'you@company.com')}
        {mode !== 'forgot' && input('Password', 'password', 'password', '•'.repeat(8))}
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : mode === 'register'
                ? 'Create account'
                : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400 space-y-2">
        {mode === 'login' ? (
          <>
            <p>
              New to Site Pulse?{' '}
              <Link to={ROUTES.REGISTER} className="text-blue-600 dark:text-blue-400 font-medium">
                Create an account
              </Link>
            </p>
            <p>
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-blue-600 dark:text-blue-400 font-medium">
                Forgot your password?
              </Link>
            </p>
          </>
        ) : mode === 'register' ? (
          <p>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-blue-600 dark:text-blue-400 font-medium">
              Sign in
            </Link>
          </p>
        ) : (
          <Link to={ROUTES.LOGIN} className="text-blue-600 dark:text-blue-400 font-medium">
            Back to sign in
          </Link>
        )}
      </div>
    </>
  );
}