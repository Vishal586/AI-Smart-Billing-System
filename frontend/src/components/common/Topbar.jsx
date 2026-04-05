import { MdMenu, MdDarkMode, MdLightMode, MdNotifications } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onMenuClick }) => {
    const { user, darkMode, setDarkMode } = useAuth();

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700
                       flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <MdMenu size={22} />
                </button>
                <h1 className="text-sm font-semibold text-slate-400 dark:text-slate-500 hidden sm:block">
                    Welcome back, <span className="text-slate-700 dark:text-slate-200">{user?.name?.split(' ')[0]} 👋</span>
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                    {darkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
                </button>
                <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <MdNotifications size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-1">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
            </div>
        </header>
    );
};

export default Topbar;