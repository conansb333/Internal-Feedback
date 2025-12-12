
import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, LayoutDashboard, Send, Archive, Users, ShieldAlert, ChevronRight, Moon, Sun, BarChart2, Activity, History, PenLine, Megaphone } from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, activeTab, setActiveTab, darkMode, toggleDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'announcements', label: 'News & Updates', icon: Megaphone, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'notes', label: 'My Notes', icon: PenLine, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'latest-reports', label: 'Latest Activity', icon: Activity, roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'submit-feedback', label: 'New Report', icon: Send, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'my-feedback', label: 'My Reports', icon: Archive, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'all-feedback', label: 'All Reports', icon: ShieldAlert, roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'users', label: 'Team Management', icon: Users, roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 shadow-xl shadow-slate-200/50 dark:shadow-none z-20 transition-colors duration-200">
      {/* Brand */}
      <div className="p-8 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          Internal Feedback
        </h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Menu</div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                {item.label}
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 m-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            {user.role !== UserRole.USER && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user.role.toLowerCase()}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
            <button
              onClick={toggleDarkMode}
              className="flex-1 flex items-center justify-center px-2 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onLogout}
              className="flex-[3] flex items-center justify-center px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </button>
        </div>
      </div>
    </div>
  );
};
