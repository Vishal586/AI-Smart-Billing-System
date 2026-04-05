import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdStorefront } from 'react-icons/md';
import toast from 'react-hot-toast';

const Register = () => {
    const [form, setForm] = useState({
        name: '', email: '', password: '', shopName: '', phone: '', gstNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const Field = ({ label, name, type = 'text', placeholder, required }) => (
        <div>
            <label className="label">{label}</label>
            <input
                type={type}
                className="input"
                placeholder={placeholder}
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                required={required}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/40 mb-4">
                        <MdStorefront size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Create Your Shop</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Set up your smart billing account</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Your Name" name="name" placeholder="John Doe" required />
                            <Field label="Shop Name" name="shopName" placeholder="My Super Store" required />
                        </div>
                        <Field label="Email Address" name="email" type="email" placeholder="you@example.com" required />
                        <Field label="Password" name="password" type="password" placeholder="Min. 6 characters" required />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Phone Number" name="phone" placeholder="+91 98765 43210" />
                            <Field label="GST Number (Optional)" name="gstNumber" placeholder="22AAAAA0000A1Z5" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;