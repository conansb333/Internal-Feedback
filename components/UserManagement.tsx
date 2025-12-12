
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, Check, X, Clock, RefreshCw } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: UserRole.USER });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await storageService.getUsers();
    
    // Sort: Pending approvals first, then alphabetical
    const sorted = data.sort((a, b) => {
        if (!a.isApproved && b.isApproved) return -1;
        if (a.isApproved && !b.isApproved) return 1;
        return a.name.localeCompare(b.name);
    });
    setUsers(sorted);
    setLoading(false);
  };

  const pendingUsers = users.filter(u => !u.isApproved);
  const activeUsers = users.filter(u => u.isApproved);

  const canManageUser = (target: User) => {
      // Admins can manage everyone except other Admins (or themselves via this UI generally)
      if (currentUser.role === UserRole.ADMIN) return target.role !== UserRole.ADMIN;
      // Managers can ONLY manage standard Users (Colleagues)
      if (currentUser.role === UserRole.MANAGER) return target.role === UserRole.USER;
      return false;
  };

  const handleApprove = async (user: User) => {
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
      loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This will also remove their associated activity.')) {
      const userToDelete = users.find(u => u.id === id);
      const success = await storageService.deleteUser(id);
      if (success) {
        // Log Deletion
        storageService.saveLog({
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            action: 'DELETE_USER',
            details: `Deleted user: ${userToDelete?.name || 'Unknown'} (${userToDelete?.username})`,
            timestamp: Date.now()
        });
        loadUsers();
      } else {
        alert('Failed to delete user. Please check database permissions or try again.');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Date.now().toString(),
      ...formData,
      isApproved: true // Manually created users are auto-approved
    };
    await storageService.saveUser(newUser);
    
    // Log Creation
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CREATE_USER',
        details: `Created new user: ${newUser.name} with role ${newUser.role}`,
        timestamp: Date.now()
    });

    loadUsers();
    setIsModalOpen(false);
    setFormData({ name: '', username: '', password: '', role: UserRole.USER });
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await storageService.saveUser({ ...user, role: newRole });
      
      // Log Role Change
      storageService.saveLog({
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'UPDATE_ROLE',
          details: `Changed role for ${user.name} to ${newRole}`,
          timestamp: Date.now()
      });

      loadUsers();
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage access and roles for your team.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={loadUsers} 
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
                title="Refresh List"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-200 dark:shadow-none">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
            </Button>
        </div>
      </div>

      {/* 1. PENDING APPROVALS SECTION (Prominent) */}
      {pendingUsers.length > 0 && (
          <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      Pending Access Requests ({pendingUsers.length})
                  </h3>
                  
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-800/50 overflow-hidden">
                      {pendingUsers.map(user => (
                          <div key={user.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
                                      {user.name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username} • Requesting User Access</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                  {canManageUser(user) && (
                                    <>
                                        <Button onClick={() => handleApprove(user)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm py-2">
                                            <Check className="w-4 h-4 mr-2" /> Approve
                                        </Button>
                                        <Button variant="danger" onClick={() => handleDelete(user.id)} className="w-full sm:w-auto text-sm py-2">
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                    </>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* 2. ACTIVE USERS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Active Team Members ({activeUsers.length})</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold mr-3 border border-slate-200 dark:border-slate-700">
                      {user.name.charAt(0)}
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 
                      user.role === UserRole.MANAGER ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 
                      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'}`}>
                    {user.role === UserRole.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {canManageUser(user) && (
                    <div className="flex items-center justify-end gap-3">
                      {/* Only Admins can change roles */}
                      {currentUser.role === UserRole.ADMIN && (
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1.5"
                        >
                          <option value={UserRole.USER}>User (Colleague)</option>
                          <option value={UserRole.MANAGER}>Manager</option>
                        </select>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete User"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {activeUsers.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 italic">No active users found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create Account</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input required className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input required className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="e.g. johnd" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input required type="password" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                <select className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.USER}>User (Colleague)</option>
                  {currentUser.role === UserRole.ADMIN && (
                    <option value={UserRole.MANAGER}>Manager</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
