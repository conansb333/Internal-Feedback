
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { 
  Trash2, 
  UserPlus, 
  X, 
  Clock, 
  AlertTriangle, 
  Users, 
  Network, 
  ChevronDown, 
  CloudDownload, 
  Loader2,
  List,
  ChevronUp,
  CheckCircle,
  Search,
  AlertCircle
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

// --- HIERARCHY RENDERER (Adaptive Theme & Refined Sizing) ---
interface UserNodeProps {
  user: User;
  currentUser: User;
  activeUsers: User[];
  canManageUser: (target: User) => boolean;
  setUserToDelete: (user: User) => void;
}

const UserNode: React.FC<UserNodeProps> = ({ 
  user, 
  currentUser, 
  activeUsers, 
  canManageUser, 
  setUserToDelete 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const subordinates = activeUsers.filter(u => u.managerId === user.id);
  const hasSubordinates = subordinates.length > 0;
  const isMe = user.id === currentUser.id;

  return (
    <div className="flex flex-col items-center w-full mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Manager Card - Typography & Sizing Aligned with Notes Feature */}
      <div className={`
        relative group w-full max-w-2xl p-6 rounded-2xl border transition-all duration-300
        ${isMe 
          ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-500/50 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20' 
          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl'
        }
      `}>
        <div className="flex items-center gap-6">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0
            ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}
          `}>
            {user.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`text-xl font-bold truncate ${isMe ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-slate-100'}`}>
              {user.name}
              {isMe && <span className="ml-3 text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">Me</span>}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'}`}>
                {user.role}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {subordinates.length} Reports
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">@{user.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {canManageUser(user) && (
                <button 
                  onClick={() => setUserToDelete(user)} 
                  className={`p-2 transition-colors md:opacity-0 group-hover:opacity-100 ${isMe ? 'text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {hasSubordinates && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`p-2 rounded-xl transition-colors ${isMe ? 'hover:bg-indigo-100 dark:hover:bg-indigo-600 text-indigo-600 dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}
                >
                  {isCollapsed ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
                </button>
              )}
          </div>
        </div>
      </div>

      {!isCollapsed && hasSubordinates && (
        <div className="w-full flex flex-col items-center">
          {/* Connector Line Grid System */}
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
          
          <div className="relative w-full flex justify-center">
             <div className="absolute top-0 h-px bg-slate-200 dark:bg-slate-800 w-[calc(100%-10rem)]" />
          </div>

          {/* Subordinates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-10 px-4">
            {subordinates.map((sub, idx) => (
              <div key={sub.id} className="relative flex flex-col items-center group animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="absolute top-[-2.5rem] w-px h-10 bg-slate-200 dark:bg-slate-800" />
                
                <div className={`
                    w-full p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300
                    bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/90 shadow-md group-hover:-translate-y-1
                `}>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{sub.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">@{sub.username}</p>
                    </div>
                    {canManageUser(sub) && (
                      <button onClick={() => setUserToDelete(sub)} className="text-slate-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100 p-2 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async (isCloudSync = false) => {
    setLoading(true);
    try {
      const data = await storageService.getUsers(isCloudSync);
      const sorted = data.sort((a, b) => {
          if (!a.isApproved && b.isApproved) return -1;
          if (a.isApproved && !b.isApproved) return 1;
          return a.name.localeCompare(b.name);
      });
      setUsers(sorted);
    } catch (err) {
      console.error("User list fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isValidUsername = (u: string) => {
    return /^PY\d+$/i.test(u) || u === 'conan.sb3';
  };

  const isManagerOrAdmin = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const visibleUsers = useMemo(() => {
      let filtered = users;
      if (!isManagerOrAdmin) {
          const myManagerId = currentUser.managerId;
          filtered = users.filter(u => {
              const isSelf = u.id === currentUser.id;
              const iMyManager = u.id === myManagerId;
              const isMyColleague = myManagerId && u.managerId === myManagerId;
              const isUnassigned = !u.managerId;
              return isSelf || iMyManager || isMyColleague || isUnassigned;
          });
      }
      
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(u => 
              u.name.toLowerCase().includes(term) || 
              u.username.toLowerCase().includes(term)
          );
      }
      return filtered;
  }, [users, currentUser, isManagerOrAdmin, searchTerm]);

  const canManageUser = (target: User) => {
      if (currentUser.role === UserRole.ADMIN) return target.role !== UserRole.ADMIN || target.id === currentUser.id;
      if (currentUser.role === UserRole.MANAGER) {
          if (!target.isApproved) return true;
          return target.managerId === currentUser.id;
      }
      return false;
  };

  const getUserManagerName = (managerId?: string) => {
      if (!managerId) return 'N/A';
      const m = users.find(u => u.id === managerId);
      return m ? m.name : 'Unknown';
  };

  const pendingUsers = visibleUsers.filter(u => !u.isApproved);
  const activeUsers = visibleUsers.filter(u => u.isApproved);

  const handleApprove = async (user: User) => {
      setLoading(true);
      try {
          await storageService.saveUser({ ...user, isApproved: true });
          storageService.saveLog({
              id: Date.now().toString(),
              userId: currentUser.id,
              userName: currentUser.name,
              userRole: currentUser.role,
              action: 'APPROVE_USER',
              details: `Approved access for user: ${user.name}`,
              timestamp: Date.now()
          });
          await loadUsers(true);
      } catch (e) {
          console.error("Approval failed", e);
      } finally {
          setLoading(false);
      }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUsername(formData.username)) {
      alert('Username must follow "PY" format.');
      return;
    }

    setLoading(true);
    try {
        const newUser: User = { 
          id: Date.now().toString(), 
          ...formData, 
          username: formData.username.toUpperCase().trim(),
          managerId: formData.managerId || undefined, 
          isApproved: true 
        };
        await storageService.saveUser(newUser);
        await loadUsers(true);
        setIsModalOpen(false);
        setFormData({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
    } catch (err) {
        alert("Creation failed.");
    } finally {
        setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    await storageService.deleteUser(userToDelete.id);
    await loadUsers(true);
    setUserToDelete(null);
    setLoading(false);
  };

  const rootUsers = useMemo(() => {
      const activeIds = activeUsers.map(u => u.id);
      if (isManagerOrAdmin) {
          return activeUsers.filter(u => (u.role !== UserRole.USER || activeUsers.some(sub => sub.managerId === u.id)) && (!u.managerId || !activeIds.includes(u.managerId)));
      } else {
          const myManager = activeUsers.find(u => u.id === currentUser.managerId);
          return myManager ? [myManager] : activeUsers.filter(u => u.id === currentUser.id);
      }
  }, [activeUsers, isManagerOrAdmin, currentUser]);

  const unassignedUsers = useMemo(() => {
      const activeIds = activeUsers.map(u => u.id);
      return activeUsers.filter(u => !u.managerId && u.role === UserRole.USER && !activeUsers.some(sub => sub.managerId === u.id));
  }, [activeUsers]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
               <Users className="w-8 h-8 text-white" />
           </div>
           <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Organization Management</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Explore team structure and manage roles.</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search directory..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'hierarchy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  <Network className="w-4 h-4" />
                </button>
            </div>

            <button onClick={() => loadUsers(true)} disabled={loading} className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
            </button>
            
            {isManagerOrAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 whitespace-nowrap text-sm font-bold"
              >
                <UserPlus className="w-4 h-4" /> New Member
              </button>
            )}
        </div>
      </div>

      {pendingUsers.length > 0 && isManagerOrAdmin && (
          <div className="mb-16 p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-500 flex items-center gap-3 mb-6 uppercase tracking-widest">
                  <Clock className="w-6 h-6" />
                  Access Queue ({pendingUsers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pendingUsers.map(user => (
                      <div key={user.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/20 flex items-center justify-between gap-4 shadow-md">
                          <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-xl">{user.name.charAt(0)}</div>
                              <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{user.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">@{user.username}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleApprove(user)} disabled={loading} className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20 rounded-xl transition-all" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                             <button onClick={() => setUserToDelete(user)} disabled={loading} className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 rounded-xl transition-all" title="Reject"><X className="w-5 h-5" /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {viewMode === 'hierarchy' ? (
        <div className="w-full space-y-12 pb-24 max-w-7xl mx-auto">
            {rootUsers.length > 0 && rootUsers.map(root => (
              <UserNode 
                key={root.id} 
                user={root} 
                currentUser={currentUser}
                activeUsers={activeUsers}
                canManageUser={canManageUser}
                setUserToDelete={setUserToDelete}
              />
            ))}

            {isManagerOrAdmin && unassignedUsers.length > 0 && (
              <div className="w-full bg-white dark:bg-slate-900/40 p-6 md:p-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 mt-12 shadow-inner">
                  <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                          <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Floating Entities</h3>
                        <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">{unassignedUsers.length}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {unassignedUsers.map(user => (
                          <div key={user.id} className="group relative bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-lg">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 dark:text-slate-500 shrink-0">
                                  {user.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">{user.name}</p>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate">@{user.username}</p>
                              </div>
                              {canManageUser(user) && (
                                <button 
                                  onClick={() => setUserToDelete(user)} 
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all absolute right-1 top-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl max-w-7xl mx-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Employee Identifier</th>
                        <th className="px-8 py-6">Reporting To</th>
                        <th className="px-8 py-6">Security Level</th>
                        <th className="px-8 py-6 text-right">Operations</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {activeUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group transition-all">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-indigo-600 dark:text-indigo-400">{user.name.charAt(0)}</div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        {user.name}
                                        {user.id === currentUser.id && <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase font-bold">Identity</span>}
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">@{user.username}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{getUserManagerName(user.managerId)}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
                                user.role === UserRole.ADMIN ? 'bg-indigo-600 text-white border-transparent' :
                                user.role === UserRole.MANAGER ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' :
                                'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                {canManageUser(user) && (
                                    <button onClick={() => setUserToDelete(user)} className="p-3 text-slate-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Onboard New Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">Legal Name</label>
                <input required className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="Johnathan Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">Internal ID (PY)</label>
                <input required className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="PY1234" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">Clearance</label>
                  <select className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">Supervisor</label>
                  <select className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}>
                      <option value="">None</option>
                      {users.filter(u => u.role !== UserRole.USER).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-xl px-6 font-bold">Provision</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - Perfectly matched with My Notes */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle className="w-6 h-6" />
             </div>
             
             <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Member?</h3>
             
             <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
               Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{userToDelete.name}</strong>? This action cannot be undone.
             </p>
             
             <div className="flex gap-3">
               <Button 
                 variant="secondary" 
                 onClick={() => setUserToDelete(null)}
                 className="flex-1"
               >
                 Cancel
               </Button>
               <Button 
                 variant="danger" 
                 onClick={confirmDelete}
                 className="flex-1"
               >
                 Delete
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
