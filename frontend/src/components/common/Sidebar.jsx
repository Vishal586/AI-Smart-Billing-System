import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    MdDashboard, MdReceipt, MdPeople, MdAssignmentReturn,
    MdLogout, MdStorefront, MdSettings, MdClose
} from 'react-icons/md';

const navItems = [
    { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { to: '/bills', icon: MdReceipt, label: 'Bills' },
    { to: '/bills/new', icon: MdReceipt, label: 'New Bill' },
    { to: '/customers', icon: MdPeople, label: 'Customers' },
    { to: '/returns', icon: MdAssignmentReturn, label: 'Returns' },
    { to: '/settings', icon: MdSettings, label: 'Settings' },
];

const Sidebar = ({ open, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <>
            {/* Overlay */}
            {open && (
                <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
            )}

            <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700
        transition-transform duration-300 w-64
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <MdStorefront className="text-white text-xl" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white leading-none">{user?.shopName || 'My Shop'}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[120px]">{user?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <MdClose size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                                }
              `}
                        >
                            <Icon size={20} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all"
                    >
                        <MdLogout size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;