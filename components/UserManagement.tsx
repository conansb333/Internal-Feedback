
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
  LayoutList, 
  Network, 
  ChevronDown, 
  ChevronRight, 
  CloudDownload, 
  Loader2,
  GitBranch,
  List,
  ChevronUp,
  MoreVertical,
  UserX,
  UserCircle,
  // Added missing CheckCircle icon
  CheckCircle
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

// --- HIERARCHY RENDERER ---
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
    <div className="flex flex-col items-center w-full mb-12">
      {/* Manager Card */}
      <div className={`
        relative group w-full max-w-2xl p-4 rounded-xl border transition-all duration-300
        ${isMe 
          ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-200/20 dark:shadow-none' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
        }
      `}>
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0
            ${isMe ? 'bg-indigo-400/30 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}
          `}>
            {user.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-bold truncate ${isMe ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
              {user.name}
              {isMe && <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold">Me</span>}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {user.role}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className={`text-[10px] ${isMe ? 'text-indigo-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
                {subordinates.length} Reports
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
             {canManageUser(user) && (
                <button 
                  onClick={() => setUserToDelete(user)} 
                  className={`p-2 transition-colors opacity-0 group-hover:opacity-100 ${isMe ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {hasSubordinates && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`p-2 rounded-lg transition-colors ${isMe ? 'hover:bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                >
                  {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              )}
          </div>
        </div>
      </div>

      {!isCollapsed && hasSubordinates && (
        <div className="w-full flex flex-col items-center">
          {/* Trunk Line */}
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
          
          {/* Branch Line */}
          <div className="relative w-full flex justify-center">
             <div className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700 w-[calc(100%-2rem)]" />
          </div>

          {/* Subordinates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8 px-4">
            {subordinates.map((sub) => (
              <div key={sub.id} className="relative flex flex-col items-center group">
                {/* Stem Line */}
                <div className="absolute top-[-2rem] w-px h-8 bg-slate-300 dark:bg-slate-700" />
                
                {/* Child Card or New Subtree */}
                {activeUsers.some(u => u.managerId === sub.id) ? (
                  <div className="w-full scale-95 origin-top">
                    <UserNode 
                        user={sub} 
                        currentUser={currentUser} 
                        activeUsers={activeUsers} 
                        canManageUser={canManageUser} 
                        setUserToDelete={setUserToDelete} 
                    />
                  </div>
                ) : (
                  /* Simple User Card */
                  <div className={`
                    w-full p-4 rounded-xl border flex items-center gap-3 transition-all duration-200
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm
                  `}>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{sub.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">@{sub.username}</p>
                    </div>
                    {canManageUser(sub) && (
                      <button onClick={() => setUserToDelete(sub)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
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
    return /^PY\d+$/i.test(u);
  };

  const isManagerOrAdmin = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const visibleUsers = useMemo(() => {
      if (isManagerOrAdmin) return users;
      const myManagerId = currentUser.managerId;
      return users.filter(u => {
          const isSelf = u.id === currentUser.id;
          const isMyManager = u.id === myManagerId;
          const isMyColleague = myManagerId && u.managerId === myManagerId;
          const isUnassigned = !u.managerId;
          return isSelf || isMyManager || isMyColleague || isUnassigned;
      });
  }, [users, currentUser, isManagerOrAdmin]);

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

  // NEW: Logical split for hierarchy
  const rootUsers = useMemo(() => {
      const activeIds = activeUsers.map(u => u.id);
      if (isManagerOrAdmin) {
          // Only show users who ARE managers OR have children, but no manager above them
          return activeUsers.filter(u => (u.role !== UserRole.USER || activeUsers.some(sub => sub.managerId === u.id)) && (!u.managerId || !activeIds.includes(u.managerId)));
      } else {
          const myManager = activeUsers.find(u => u.id === currentUser.managerId);
          return myManager ? [myManager] : activeUsers.filter(u => u.id === currentUser.id && u.role !== UserRole.USER);
      }
  }, [activeUsers, isManagerOrAdmin, currentUser]);

  const unassignedUsers = useMemo(() => {
      const activeIds = activeUsers.map(u => u.id);
      return activeUsers.filter(u => !u.managerId && u.role === UserRole.USER && !activeUsers.some(sub => sub.managerId === u.id));
  }, [activeUsers]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
           <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
             <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> 
             User Management
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             Manage access and organization structure.
           </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button 
                  onClick={() => setViewMode('hierarchy')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'hierarchy' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Network className="w-3.5 h-3.5" /> Hierarchy
                </button>
            </div>

            <button onClick={() => loadUsers(true)} disabled={loading} className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
            </button>
            
            {isManagerOrAdmin && (
              <Button onClick={() => setIsModalOpen(true)} className="!rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"><UserPlus className="w-4 h-4 mr-2" /> Add Member</Button>
            )}
        </div>
      </div>

      {pendingUsers.length > 0 && isManagerOrAdmin && (
          <div className="mb-12 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-sm animate-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Access Requests ({pendingUsers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingUsers.map(user => (
                      <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex items-center justify-between gap-4 shadow-sm">
                          <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                              <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{user.name}</p>
                                  <p className="text-[10px] text-slate-500">@{user.username}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             {/* Fixed missing CheckCircle icon below */}
                             <button onClick={() => handleApprove(user)} disabled={loading} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 rounded-lg transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                             <button onClick={() => setUserToDelete(user)} disabled={loading} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Reject"><X className="w-4 h-4" /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {viewMode === 'hierarchy' ? (
        <div className="w-full space-y-12 pb-24">
            {/* Reporting Structures Section */}
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

            {/* Unassigned Users Section - Matches Provided Layout */}
            {unassignedUsers.length > 0 && (
              <div className="w-full bg-slate-100/50 dark:bg-slate-900/40 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-inner mt-12">
                  <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                          <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Unassigned Users
                        <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{unassignedUsers.length}</span>
                      </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {unassignedUsers.map(user => (
                          <div key={user.id} className="relative group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-900">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                  {user.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">No Manager</p>
                              </div>
                              {canManageUser(user) && (
                                <button 
                                  onClick={() => setUserToDelete(user)} 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-opacity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
            )}

            {rootUsers.length === 0 && unassignedUsers.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Users className="w-16 h-16 text-slate-200 dark:text-slate-800" />
                <p className="text-slate-400 dark:text-slate-500 italic font-medium">No organizational data found.</p>
              </div>
            )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Manager</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">{user.name.charAt(0)}</div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {user.name}
                                        {user.id === currentUser.id && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">Me</span>}
                                      </p>
                                      <p className="text-[10px] text-slate-500">@{user.username}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{getUserManagerName(user.managerId)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                user.role === UserRole.MANAGER ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' :
                                'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {canManageUser(user) && (
                                    <button onClick={() => setUserToDelete(user)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Add New Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                <input required className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">PY ID</label>
                <input required className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="PY1234" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
                <input required type="password" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="Initial Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Role</label>
                  <select className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Reports To</label>
                  <select className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}>
                      <option value="">No Manager</option>
                      {users.filter(u => u.role !== UserRole.USER).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>Create Member</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Confirm Removal</h3>
                  <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to remove <strong>{userToDelete.name}</strong> from the organization?</p>
                  <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setUserToDelete(null)}>Cancel</Button>
                      <Button variant="danger" className="flex-1" onClick={confirmDelete}>Remove</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
