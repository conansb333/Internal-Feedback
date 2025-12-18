
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthState, User, UserRole, Feedback, ResolutionStatus, AuditLog } from './types';
import { storageService, SEED_USERS } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { FeedbackList } from './components/FeedbackList';
import { SubmitFeedback } from './components/SubmitFeedback';
import { UserManagement } from './components/UserManagement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LatestReports } from './components/LatestReports';
import { ActivityLogs } from './components/ActivityLogs';
import { StickyNotes } from './components/StickyNotes';
import { Announcements } from './components/Announcements';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Dashboard } from './components/Dashboard';
import { Lock, BarChart3, Clock, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, Shield, Menu, Search, User as UserIcon, HelpCircle, Loader2, RefreshCw } from 'lucide-react';

const createUsername = (name: string) => name.toLowerCase().replace(/\s+/g, '.');

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Claim/Register Specific State
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newName, setNewName] = useState('');
  const [newManagerId, setNewManagerId] = useState('');

  // Session Restoration
  useEffect(() => {
    const savedUser = localStorage.getItem('feedback_app_session');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuth({ user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('feedback_app_session');
      }
    }

    const savedTheme = localStorage.getItem('feedback_app_theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('feedback_app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('feedback_app_theme', 'light');
    }
  }, [darkMode]);

  const loadDirectory = useCallback(async (forceCloud = false) => {
    setIsLoading(true);
    try {
      const users = await storageService.getUsers(forceCloud);
      const team = users.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableUsers(team);
    } catch (err) {
      console.error("Directory fetch failed", err);
      setAvailableUsers(SEED_USERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSigningUp) {
      loadDirectory();
    }
  }, [isSigningUp, loadDirectory]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const users = await storageService.getUsers();
      let user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
      
      // Admin Access Emergency Fallback
      if (!user && username.toLowerCase().trim() === 'conan.sb3' && password === 'password') {
          user = SEED_USERS.find(u => u.username === 'conan.sb3');
      }

      if (user) {
        if (!user.isApproved) {
            setError('Access pending approval. Please contact your manager.');
            setIsLoading(false);
            return;
        }

        localStorage.setItem('feedback_app_session', JSON.stringify(user));
        setAuth({ user, isAuthenticated: true });
        setActiveTab('dashboard');
        storageService.saveLog({
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'LOGIN',
          details: 'User signed in',
          timestamp: Date.now()
        });
      } else {
        setError('Incorrect username or password.');
      }
    } catch (err: any) {
      setError(`Login failed: ${err?.message || 'Connection error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      let updatedUser: User;

      if (isRegisteringNew) {
        if (!newName.trim() || !username.trim() || !password.trim()) {
          setError('Required fields missing.');
          setIsLoading(false);
          return;
        }
        
        const allUsers = await storageService.getUsers();
        if (allUsers.some(u => u.username.toLowerCase() === username.toLowerCase().trim())) {
          setError('Username is already active.');
          setIsLoading(false);
          return;
        }

        updatedUser = {
          id: Date.now().toString(),
          username: username.trim(),
          name: newName.trim(),
          role: UserRole.USER,
          password,
          isApproved: false,
          managerId: newManagerId || null
        };
      } else {
        if (!selectedUserId) {
          setError('Identify your name first.');
          setIsLoading(false);
          return;
        }

        const targetUser = availableUsers.find(u => u.id === selectedUserId);
        if (!targetUser) {
          setError('Profile mapping error.');
          setIsLoading(false);
          return;
        }

        updatedUser = {
          ...targetUser,
          username: username.trim(),
          password: password, 
          isApproved: false // Explicitly require approval after setup
        };
      }

      // Try cloud sync
      await storageService.saveUser(updatedUser);
      
      // Global Log
      storageService.saveLog({
        id: Date.now().toString(),
        userId: 'SYSTEM',
        userName: updatedUser.name,
        userRole: updatedUser.role,
        action: 'ACCESS_REQUEST',
        details: `Account request: ${updatedUser.username} (${updatedUser.name})`,
        timestamp: Date.now()
      });

      setSuccessMsg(`Done! Request sent for ${updatedUser.name}.`);
      
      setTimeout(() => {
          setIsSigningUp(false);
          setIsRegisteringNew(false);
          setPassword('');
          setUserSearch('');
          setSelectedUserId('');
          setNewName('');
          setUsername(updatedUser.username);
          setIsLoading(false);
          setSuccessMsg('');
      }, 2500);

    } catch (err: any) {
      console.error("Signup failed debug:", err);
      const message = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      setError(`Request failed: ${message}`);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('feedback_app_session');
    setAuth({ user: null, isAuthenticated: false });
    setUsername('');
    setPassword('');
    setIsSigningUp(false);
    setError('');
  };

  const filteredAvailableUsers = useMemo(() => {
    if (!userSearch) return [];
    const search = userSearch.toLowerCase();
    return availableUsers.filter(u => 
        u.name.toLowerCase().includes(search) || u.username.toLowerCase().includes(search)
    ).slice(0, 12);
  }, [availableUsers, userSearch]);

  const getManagers = () => {
    const managers = availableUsers.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
    return managers.length > 0 ? managers : SEED_USERS.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
  };

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-2xl shadow-2xl w-full max-w-4xl grid md:grid-cols-2 overflow-hidden z-10 border border-white/20 dark:border-slate-800 transition-all duration-300">
          <div className="bg-indigo-600 dark:bg-indigo-900 p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-950 dark:to-slate-900 opacity-90"></div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Team Feedback</h1>
                <p className="text-indigo-100 text-lg opacity-90">Enterprise reporting and process compliance engine.</p>
             </div>
             <div className="relative z-10 text-xs text-indigo-300/60 font-mono">Build v2.1.3-patch</div>
          </div>

          <div className="p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="text-center md:text-left mb-6">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                 {isSigningUp ? (isRegisteringNew ? 'New Account' : 'Setup Profile') : 'Member Login'}
               </h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                 {isSigningUp 
                    ? 'Connect your name to a new login ID.' 
                    : 'Sign in to your reporting console.'}
               </p>
            </div>
            
            <form onSubmit={isSigningUp ? handleSignup : handleLogin} className="space-y-4">
              {isSigningUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                   {!isRegisteringNew ? (
                     <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Find Your Name</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => loadDirectory(true)} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1">
                                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Sync
                                </button>
                                <button type="button" onClick={() => setIsRegisteringNew(true)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manual entry</button>
                            </div>
                        </div>
                        <div className="relative">
                           <input 
                              type="text"
                              autoFocus
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="e.g. Abdelghafour..."
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-2 text-sm"
                           />
                           <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner">
                           {isLoading ? (
                               <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /><span className="text-[10px] text-slate-500">Syncing...</span></div>
                           ) : filteredAvailableUsers.length === 0 ? (
                               <div className="p-8 text-center text-xs text-slate-400 italic">Type to search names...</div>
                           ) : (
                               filteredAvailableUsers.map(u => (
                                   <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => { setSelectedUserId(u.id); setUserSearch(u.name); setUsername(u.username); }}
                                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b last:border-0 border-slate-100 dark:border-slate-700 ${selectedUserId === u.id ? 'bg-indigo-50 dark:bg-indigo-900/30 font-bold text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}
                                   >
                                       <span className="truncate">{u.name}</span>
                                       {selectedUserId === u.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                   </button>
                               ))
                           )}
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4 animate-in slide-in-from-right-2">
                        <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Your Full Name" />
                        <select required value={newManagerId} onChange={e => setNewManagerId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                           <option value="">Select Manager...</option>
                           {getManagers().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                     </div>
                   )}

                   {(selectedUserId || isRegisteringNew) && (
                        <div className="animate-in fade-in space-y-4 pt-2">
                          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="New Username" />
                          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="New Password" />
                        </div>
                   )}
                </div>
              )}
              
              {!isSigningUp && (
                <>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Username (e.g. conan.sb3)" />
                    <div className="relative">
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Password" />
                        <Lock className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                </>
              )}

              {error && <div className="text-red-500 text-[10px] bg-red-50 dark:bg-red-900/20 p-2 rounded-lg flex items-start gap-2 max-h-24 overflow-y-auto"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /><span>{error}</span></div>}
              {successMsg && <div className="text-green-500 text-[10px] bg-green-50 dark:bg-green-900/20 p-2 rounded-lg flex items-center gap-2"><CheckCircle2 className="w-3 h-3 shrink-0" />{successMsg}</div>}

              <button type="submit" disabled={isLoading || (isSigningUp && !selectedUserId && !isRegisteringNew)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSigningUp ? 'Request Access' : 'Sign In')}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <button onClick={() => { setIsSigningUp(!isSigningUp); setIsRegisteringNew(false); setError(''); setSuccessMsg(''); setUsername(''); setPassword(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {isSigningUp ? "Back to Login" : "First time? Claim Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-200 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <h1 className="text-lg font-bold flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><BarChart3 className="w-5 h-5" /></div> Feedback</h1>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300"><Menu className="w-6 h-6" /></button>
      </div>
      <Sidebar user={auth.user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false); }} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-hidden relative flex flex-col pt-16 md:pt-0">
        {activeTab === 'dashboard' && <Dashboard user={auth.user} setActiveTab={setActiveTab} />}
        {activeTab === 'announcements' && <Announcements currentUser={auth.user} />}
        {activeTab === 'knowledge-hub' && <KnowledgeBase currentUser={auth.user} />}
        {activeTab === 'users' && <UserManagement currentUser={auth.user} />}
        {activeTab === 'my-feedback' && <FeedbackList currentUser={auth.user} mode="mine" />}
        {activeTab === 'submit-feedback' && <SubmitFeedback currentUser={auth.user} onSubmitted={() => setActiveTab('my-feedback')} />}
        {activeTab === 'all-feedback' && (auth.user.role !== UserRole.USER) && <FeedbackList currentUser={auth.user} mode="all" />}
        {activeTab === 'notes' && <StickyNotes currentUser={auth.user} />}
        {activeTab === 'analytics' && <AnalyticsDashboard currentUser={auth.user} />}
        {activeTab === 'latest-reports' && (auth.user.role !== UserRole.USER) && <LatestReports currentUser={auth.user} />}
        {activeTab === 'audit-logs' && (auth.user.role !== UserRole.USER) && <ActivityLogs currentUser={auth.user} />}
      </main>
    </div>
  );
}
