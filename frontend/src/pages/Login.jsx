import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdStorefront, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/40 mb-4">
                        <MdStorefront size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Smart Billing</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Sign in to your shop account</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Email Address</label>
                            <div className="relative">
                                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    className="input pl-10"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                            Create one
                        </Link>
                    </p>

                    {/* Demo credentials */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 text-center">
                        Demo: demo@shop.com / password123
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;