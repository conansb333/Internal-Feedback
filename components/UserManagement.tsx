
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, Check, X, Clock, RefreshCw, AlertTriangle, Users, GitMerge, LayoutList, Network, ChevronDown, ChevronRight, CloudDownload, Loader2 } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
  const [viewMode, setViewMode] = useState<'list' | 'org'>('list');

  const loadUsers = useCallback(async (isCloudSync = false) => {
    setLoading(true);
    try {
      console.log(`Refreshing directory (Sync: ${isCloudSync})...`);
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

  // VISIBILITY LOGIC:
  // 1. ADMIN sees everyone.
  // 2. MANAGER sees everyone WHO IS PENDING (global triage) + their own team.
  // 3. USER sees self and manager.
  const visibleUsers = users.filter(u => {
      if (currentUser.role === UserRole.ADMIN) return true;
      
      if (currentUser.role === UserRole.MANAGER) {
          // Managers see ALL pending requests to help triage
          if (!u.isApproved) return true;
          // Managers also see their own team and manager
          return u.managerId === currentUser.managerId || u.id === currentUser.managerId || u.managerId === currentUser.id;
      }
      
      return u.id === currentUser.id || u.id === currentUser.managerId;
  });

  const canManageUser = (target: User) => {
      if (currentUser.role === UserRole.ADMIN) return target.role !== UserRole.ADMIN;
      if (currentUser.role === UserRole.MANAGER) {
          // Managers can approve ANY pending user, or manage their own team
          if (!target.isApproved) return true;
          return target.managerId === currentUser.id;
      }
      return false;
  };

  const getUserManagerName = (managerId?: string) => {
      if (!managerId) return '-';
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
          alert("Approval failed: Cloud sync issue. See console for details.");
      } finally {
          setLoading(false);
      }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const newUser: User = { id: Date.now().toString(), ...formData, managerId: formData.managerId || undefined, isApproved: true };
        await storageService.saveUser(newUser);
        await loadUsers(true);
        setIsModalOpen(false);
        setFormData({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
    } catch (err) {
        alert("Creation failed. Database might be unreachable.");
    } finally {
        setLoading(false);
    }
  };

  const initiateDelete = (user: User) => setUserToDelete(user);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    await storageService.deleteUser(userToDelete.id);
    await loadUsers(true);
    setUserToDelete(null);
    setLoading(false);
  };

  const OrgTeamCard: React.FC<{ manager: User; reports: User[] }> = ({ manager, reports }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">{manager.name.charAt(0)}</div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{manager.name}{manager.id === currentUser.id && <span className="text-[10px] text-indigo-500 font-bold uppercase">(You)</span>}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{reports.length} Reports</span>
                    </div>
                </div>
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-slate-400 hover:text-indigo-500">{isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
            </div>
            {!isCollapsed && (
                <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">{report.name.charAt(0)}</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{report.name}</p>
                                    <p className="text-[10px] text-slate-500">@{report.username}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Users className="w-8 h-8 text-indigo-600" /> {currentUser.role === UserRole.USER ? 'Team Directory' : 'User Management'}</h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Manage colleague access and organization hierarchy.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => loadUsers(true)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                Sync Database
            </button>
            <Button onClick={() => setIsModalOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Add Member</Button>
        </div>
      </div>

      {pendingUsers.length > 0 && (
          <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm animate-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Requests Awaiting Approval ({pendingUsers.length})
              </h3>
              <div className="space-y-3">
                  {pendingUsers.map(user => (
                      <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">{user.name.charAt(0)}</div>
                              <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-slate-500">@{user.username} • Reported to: {getUserManagerName(user.managerId)}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              {canManageUser(user) && (
                                <>
                                    <button onClick={() => handleApprove(user)} disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50">Approve</button>
                                    <button onClick={() => initiateDelete(user)} disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50">Reject</button>
                                </>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {viewMode === 'org' ? (
          <div className="space-y-6">
             {activeUsers.filter(u => u.role !== UserRole.USER).map(mgr => (
                 <OrgTeamCard key={mgr.id} manager={mgr} reports={activeUsers.filter(u => u.managerId === mgr.id)} />
             ))}
          </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Manager</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                                    <div><p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p><p className="text-[10px] text-slate-500 font-mono">@{user.username}</p></div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">{getUserManagerName(user.managerId)}</td>
                            <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">{user.role}</span></td>
                            <td className="px-6 py-4 text-right">
                                {canManageUser(user) && (
                                    <button onClick={() => initiateDelete(user)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Create New Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input required className="w-full rounded-xl border p-3 text-sm bg-slate-50" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required className="w-full rounded-xl border p-3 text-sm bg-slate-50" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              <input required type="password" className="w-full rounded-xl border p-3 text-sm bg-slate-50" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <select className="w-full rounded-xl border p-3 text-sm bg-slate-50" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.USER}>User (Colleague)</option>
                  <option value={UserRole.MANAGER}>Manager</option>
              </select>
              <select className="w-full rounded-xl border p-3 text-sm bg-slate-50" value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}>
                  <option value="">-- Select Manager --</option>
                  {users.filter(u => u.role !== UserRole.USER).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit">Create User</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
