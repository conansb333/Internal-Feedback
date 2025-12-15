
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { Trash2, UserPlus, Shield, Check, X, Clock, RefreshCw, AlertTriangle, Users, GitMerge, LayoutList, Network, ChevronDown, ChevronRight } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
  
  // New State for View Mode
  const [viewMode, setViewMode] = useState<'list' | 'org'>('list');

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

  const visibleUsers = users.filter(u => {
      if (currentUser.role === UserRole.ADMIN) return true;
      if (currentUser.role === UserRole.MANAGER) return true;
      
      // USER logic: Show only team members and manager
      if (currentUser.role === UserRole.USER) {
          if (!u.isApproved) return false; // Hide pending users from normal users
          
          // If manager exists, show manager and teammates
          if (currentUser.managerId) {
              return u.id === currentUser.managerId || u.managerId === currentUser.managerId;
          }
          // If no manager, show self only
          return u.id === currentUser.id;
      }
      return false;
  });

  const getManagers = () => users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);

  const canManageUser = (target: User) => {
      if (currentUser.role === UserRole.ADMIN) return target.role !== UserRole.ADMIN;
      if (currentUser.role === UserRole.MANAGER) {
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

  // --- Actions ---
  const handleApprove = async (user: User) => {
      if (!canManageUser(user)) return;
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

  const initiateDelete = (user: User) => {
    if (!canManageUser(user)) return;
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const success = await storageService.deleteUser(userToDelete.id);
    if (success) {
      storageService.saveLog({
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'DELETE_USER',
          details: `Deleted user: ${userToDelete.name} (${userToDelete.username})`,
          timestamp: Date.now()
      });
      loadUsers();
    } else {
      alert('Failed to delete user.');
    }
    setUserToDelete(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === UserRole.USER) return; // Guard

    const newUser: User = {
      id: Date.now().toString(),
      ...formData,
      managerId: formData.managerId || undefined,
      isApproved: true
    };
    await storageService.saveUser(newUser);
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
    setFormData({ name: '', username: '', password: '', role: UserRole.USER, managerId: '' });
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (currentUser.role !== UserRole.ADMIN) return;
    const user = users.find(u => u.id === userId);
    if (user) {
      await storageService.saveUser({ ...user, role: newRole });
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

  // --- ORG CHART COMPONENT ---
  const OrgTeamCard: React.FC<{ manager: User; reports: User[] }> = ({ manager, reports }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Manager Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border-2 border-white dark:border-slate-700 shadow-sm">
                        {manager.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {manager.name}
                          {manager.id === currentUser.id && <span className="text-xs text-indigo-500">(You)</span>}
                        </h4>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded uppercase">
                               {manager.role === UserRole.ADMIN ? 'Admin' : 'Manager'}
                             </span>
                             <span className="text-xs text-slate-400">• {reports.length} Reports</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                   {canManageUser(manager) && (
                        <button onClick={() => initiateDelete(manager)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                   )}
                   <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                   </button>
                </div>
            </div>

            {/* Tree Structure */}
            {!isCollapsed && (
                <div className="p-6 bg-slate-50/30 dark:bg-slate-900/30">
                     <div className="flex flex-col items-center">
                         {/* Connector to Manager */}
                         <div className="h-6 w-px bg-indigo-200 dark:bg-slate-700 -mt-6 mb-4 relative z-0"></div>
                         
                         {reports.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                                {reports.map(report => (
                                    <div key={report.id} className="relative group">
                                        {/* Top Connector for Node */}
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-indigo-200 dark:bg-slate-700"></div>
                                        
                                        <div className={`bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors ${report.id === currentUser.id ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                    {report.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                                      {report.name} {report.id === currentUser.id && '(You)'}
                                                      {(report.role === UserRole.ADMIN || report.role === UserRole.MANAGER) && (
                                                          <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1 py-0.5 rounded uppercase font-bold ml-1">
                                                              {report.role === UserRole.ADMIN ? 'Admin' : 'Lead'}
                                                          </span>
                                                      )}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate">@{report.username}</p>
                                                </div>
                                            </div>
                                            {canManageUser(report) && (
                                                <button 
                                                    onClick={() => initiateDelete(report)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                             </div>
                         ) : (
                             <div className="text-sm text-slate-400 italic py-2">No direct reports assigned.</div>
                         )}
                     </div>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
             {currentUser.role === UserRole.USER ? 'Team Directory' : 'User Management'}
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             {currentUser.role === UserRole.USER ? 'View your team structure and colleagues.' : 'Manage access and organization structure.'}
           </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
                </button>
                <button 
                  onClick={() => setViewMode('org')}
                  className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${viewMode === 'org' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Network className="w-4 h-4" /> <span className="hidden sm:inline">Hierarchy</span>
                </button>
            </div>
            
            <button 
                onClick={loadUsers} 
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
                title="Refresh List"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            )}
        </div>
      </div>

      {/* 1. PENDING APPROVALS SECTION (Always visible if exists) */}
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
                                        <Button variant="danger" onClick={() => initiateDelete(user)} className="w-full sm:w-auto text-sm py-2">
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

      {/* 2. VIEW MODES */}
      
      {/* ORG CHART VIEW */}
      {viewMode === 'org' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             {activeUsers
                .filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN)
                .filter(manager => {
                    // Exclude Abdessamad Nahid (Admin) from being a top-level card
                    // Use ID check for robustness, fallback to name
                    const isAbdessamad = manager.id === 'abdessamad.nahid' || manager.name === 'Abdessamad Nahid';
                    if (isAbdessamad) return false;
                    
                    // Standard logic: Hide managers who report to someone else in this list
                    return !manager.managerId || !activeUsers.some(u => u.id === manager.managerId);
                })
                .map(manager => {
                 let reports = activeUsers.filter(u => u.managerId === manager.id);
                 
                 // Inject Abdessamad into Rihab Lasri's team
                 const isRihab = manager.id === 'rihab.lasri' || manager.name === 'Rihab Lasri';
                 if (isRihab) {
                     const abdessamad = activeUsers.find(u => u.id === 'abdessamad.nahid' || u.name === 'Abdessamad Nahid');
                     if (abdessamad && !reports.some(r => r.id === abdessamad.id)) {
                         // Add him to the list
                         reports = [...reports, abdessamad];
                     }
                 }
                 
                 reports.sort((a, b) => a.name.localeCompare(b.name));

                 return (
                     <OrgTeamCard key={manager.id} manager={manager} reports={reports} />
                 );
             })}
             
             {/* Unassigned Users Section */}
             {activeUsers.filter(u => u.role === UserRole.USER && !u.managerId).length > 0 && (
                 <div className="bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6">
                     <h4 className="font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                         <AlertTriangle className="w-5 h-5" /> Unassigned Users
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                         {activeUsers.filter(u => u.role === UserRole.USER && !u.managerId).map(u => (
                             <div key={u.id} className={`bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 ${u.id === currentUser.id ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : 'opacity-75'}`}>
                                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                    {u.name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{u.name} {u.id === currentUser.id && '(You)'}</p>
                                     <p className="text-[10px] text-slate-400">No Manager</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
          </div>
      )}

      {/* LIST VIEW (Table) */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Active Team Members ({activeUsers.length})</h3>
            </div>
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Reports To</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeUsers.map(user => (
                <tr key={user.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${user.id === currentUser.id ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-6 py-4">
                    <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold mr-3 border border-slate-200 dark:border-slate-700">
                        {user.name.charAt(0)}
                        </div>
                        <div>
                        <div className="font-medium text-slate-900 dark:text-white">{user.name} {user.id === currentUser.id && '(You)'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
                        </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        <div className="flex items-center gap-1.5">
                            <GitMerge className="w-3.5 h-3.5 text-slate-300" />
                            {getUserManagerName(user.managerId)}
                        </div>
                    </td>
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
                    {canManageUser(user) ? (
                        <div className="flex items-center justify-end gap-3">
                        {/* Only Admins can change roles arbitrarily */}
                        {currentUser.role === UserRole.ADMIN && (
                            <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className="text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1.5"
                            >
                            <option value={UserRole.USER}>User</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            </select>
                        )}
                        
                        <button 
                            onClick={() => initiateDelete(user)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Read Only</span>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
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
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Reports To (Manager)</label>
                <select 
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.managerId} 
                  onChange={e => setFormData({...formData, managerId: e.target.value})}
                >
                  <option value="">-- No Specific Manager --</option>
                  {getManagers().map(mgr => (
                      <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                  ))}
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

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle className="w-6 h-6" />
             </div>
             
             <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Team Member?</h3>
             
             <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
               You are about to delete <span className="font-bold text-slate-800 dark:text-white">{userToDelete.name}</span>. 
               This will effectively remove their access and all associated activity logs. This action cannot be undone.
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
                 Delete Member
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
