import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MdSave, MdStore, MdSecurity, MdTune } from 'react-icons/md';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user, updateUser, darkMode, setDarkMode } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        shopName: user?.shopName || '',
        phone: user?.phone || '',
        address: user?.address || '',
        gstNumber: user?.gstNumber || '',
    });
    const [settings, setSettings] = useState({
        gstEnabled: user?.settings?.gstEnabled || false,
        gstRate: user?.settings?.gstRate || 18,
        currency: user?.settings?.currency || 'INR',
    });
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [saving, setSaving] = useState(false);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put('/auth/profile', { ...profile, settings });
            updateUser(data.user);
            toast.success('Settings saved!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const Section = ({ icon: Icon, title, children }) => (
        <div className="card p-6">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-5">
                <Icon className="text-blue-500" size={20} />
                {title}
            </h2>
            {children}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage your shop and account preferences</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
                {/* Shop Profile */}
                <Section icon={MdStore} title="Shop Profile">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Your Name', key: 'name' },
                            { label: 'Shop Name', key: 'shopName' },
                            { label: 'Phone', key: 'phone' },
                            { label: 'GST Number', key: 'gstNumber' },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="label">{label}</label>
                                <input className="input" value={profile[key] || ''}
                                    onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
                            </div>
                        ))}
                        <div className="col-span-2">
                            <label className="label">Address</label>
                            <input className="input" value={profile.address || ''}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                        </div>
                    </div>
                </Section>

                {/* Billing Preferences */}
                <Section icon={MdTune} title="Billing Preferences">
                    <div className="space-y-5">
                        {/* Dark mode */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
                                <p className="text-xs text-slate-400">Switch between light and dark theme</p>
                            </div>
                            <button type="button" onClick={() => setDarkMode(!darkMode)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* GST */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable GST by Default</p>
                                <p className="text-xs text-slate-400">Auto-enable GST on new bills</p>
                            </div>
                            <button type="button" onClick={() => setSettings({ ...settings, gstEnabled: !settings.gstEnabled })}
                                className={`relative w-11 h-6 rounded-full transition-colors ${settings.gstEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.gstEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {settings.gstEnabled && (
                            <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-700">
                                <label className="label">Default GST Rate (%)</label>
                                <input type="number" className="input w-28" value={settings.gstRate}
                                    onChange={(e) => setSettings({ ...settings, gstRate: parseFloat(e.target.value) || 0 })}
                                    min="0" max="100" />
                            </div>
                        )}

                        {/* Currency */}
                        <div>
                            <label className="label">Currency</label>
                            <select className="input w-40" value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>
                </Section>

                {/* Account Info */}
                <Section icon={MdSecurity} title="Account">
                    <div className="space-y-3">
                        <div>
                            <label className="label">Email Address</label>
                            <input className="input bg-slate-50 dark:bg-slate-700/50 cursor-not-allowed"
                                value={user?.email || ''} readOnly />
                            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label className="label">Role</label>
                            <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </Section>

                <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 text-base">
                    {saving
                        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <MdSave size={20} />}
                    Save All Settings
                </button>
            </form>
        </div>
    );
};

export default Settings;