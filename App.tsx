import React, { useState, useEffect } from 'react';
import { AuthState, User, UserRole, Feedback, ResolutionStatus, AuditLog } from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { FeedbackList } from './components/FeedbackList';
import { SubmitFeedback } from './components/SubmitFeedback';
import { UserManagement } from './components/UserManagement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LatestReports } from './components/LatestReports';
import { ActivityLogs } from './components/ActivityLogs';
import { StickyNotes } from './components/StickyNotes';
import { Dashboard } from './components/Dashboard';
import { Lock, BarChart3, Clock, CheckCircle2, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // For Signup
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const users = await storageService.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        setAuth({ user, isAuthenticated: true });
        setActiveTab('dashboard');
        // Log Login Action
        storageService.saveLog({
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'LOGIN',
          details: 'User signed in successfully',
          timestamp: Date.now()
        });
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const users = await storageService.getUsers();
      
      if (users.find(u => u.username === username)) {
        setError('Username already exists.');
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: fullName,
        username: username,
        password: password,
        role: UserRole.USER // Enforced Role
      };

      await storageService.saveUser(newUser);
      
      // Log Signup Action
      storageService.saveLog({
        id: Date.now().toString(),
        userId: newUser.id,
        userName: newUser.name,
        userRole: newUser.role,
        action: 'SIGNUP',
        details: 'New user account created',
        timestamp: Date.now()
      });

      setSuccessMsg('Account created successfully! Signing in...');
      setTimeout(() => {
        setAuth({ user: newUser, isAuthenticated: true });
        setActiveTab('dashboard');
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      setError('Failed to create account.');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (auth.user) {
      storageService.saveLog({
        id: Date.now().toString(),
        userId: auth.user.id,
        userName: auth.user.name,
        userRole: auth.user.role,
        action: 'LOGOUT',
        details: 'User signed out',
        timestamp: Date.now()
      });
    }
    setAuth({ user: null, isAuthenticated: false });
    setUsername('');
    setPassword('');
    setFullName('');
    setIsSigningUp(false);
    setError('');
    setSuccessMsg('');
  };

  // Login/Signup Screen
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute top-1/2 -right-1/4 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-2xl shadow-2xl w-full max-w-4xl grid md:grid-cols-2 overflow-hidden z-10 border border-white/20 dark:border-slate-800 transition-all duration-300">
          
          {/* Left Side: Brand & Info */}
          <div className="bg-indigo-600 dark:bg-indigo-900 p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 opacity-90"></div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Internal Feedback</h1>
                <p className="text-indigo-100 text-lg opacity-90">Elevate your team's performance with intelligent reporting.</p>
             </div>
             <div className="relative z-10 text-sm text-indigo-200">
               © {new Date().getFullYear()} Corporate Tools Inc.
             </div>
             
             {/* Decorative circles */}
             <div className="absolute bottom-0 right-0 transform translate-x-1/3 translate-y-1/3">
                <div className="w-64 h-64 border border-white/10 rounded-full"></div>
             </div>
             <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                <div className="w-48 h-48 border border-white/10 rounded-full"></div>
             </div>
          </div>

          {/* Right Side: Form */}
          <div className="p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
            <div className="text-center md:text-left mb-8">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                 {isSigningUp ? 'Create Account' : 'Welcome Back'}
               </h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                 {isSigningUp ? 'Enter your details to get started.' : 'Please enter your details to sign in.'}
               </p>
            </div>
            
            <form onSubmit={isSigningUp ? handleSignup : handleLogin} className="space-y-5">
              
              {isSigningUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. jdoe"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center border border-red-100 dark:border-red-900/30 animate-in fade-in">
                   <AlertTriangle className="w-4 h-4 mr-2" />
                   {error}
                </div>
              )}

              {successMsg && (
                <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex items-center border border-green-100 dark:border-green-900/30 animate-in fade-in">
                   <CheckCircle2 className="w-4 h-4 mr-2" />
                   {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (isSigningUp && !fullName)}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transform transition-all active:scale-[0.98] flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (isSigningUp ? 'Creating Account...' : 'Signing In...') : (isSigningUp ? 'Create Account' : 'Sign In')}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSigningUp ? "Already have an account?" : "Don't have an account?"}
              </p>
              <button 
                onClick={() => {
                  setIsSigningUp(!isSigningUp);
                  setError('');
                  setSuccessMsg('');
                  setFullName('');
                  setUsername('');
                  setPassword('');
                }}
                className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                {isSigningUp ? "Sign In instead" : "Create an account"}
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                 <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                 >
                   Switch to {darkMode ? 'Light' : 'Dark'} Mode
                 </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Layout
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar 
        user={auth.user} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'dashboard' && (
          <Dashboard user={auth.user} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'users' && auth.user.role === UserRole.ADMIN && (
          <UserManagement />
        )}

        {activeTab === 'my-feedback' && (
          <FeedbackList currentUser={auth.user} mode="mine" />
        )}

        {activeTab === 'submit-feedback' && (
          <SubmitFeedback 
            currentUser={auth.user} 
            onSubmitted={() => setActiveTab('my-feedback')} 
          />
        )}

        {activeTab === 'all-feedback' && (auth.user.role === UserRole.MANAGER || auth.user.role === UserRole.ADMIN) && (
          <FeedbackList currentUser={auth.user} mode="all" />
        )}

        {activeTab === 'notes' && (
          <StickyNotes currentUser={auth.user} />
        )}

        {activeTab === 'analytics' && (auth.user.role === UserRole.MANAGER || auth.user.role === UserRole.ADMIN) && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'latest-reports' && (auth.user.role === UserRole.MANAGER || auth.user.role === UserRole.ADMIN) && (
          <LatestReports />
        )}

        {activeTab === 'audit-logs' && (auth.user.role === UserRole.MANAGER || auth.user.role === UserRole.ADMIN) && (
          <ActivityLogs currentUser={auth.user} />
        )}
      </main>
    </div>
  );
}