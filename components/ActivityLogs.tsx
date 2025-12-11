import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog } from '../types';
import { storageService } from '../services/storageService';
import { History, Search, Filter, User as UserIcon, Shield, RefreshCw } from 'lucide-react';

interface ActivityLogsProps {
  currentUser: User;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, [currentUser]);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterAction, logs]);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await storageService.getLogs();
    
    // Permission Logic
    // Admin: See all
    // Manager: See only actions performed by USER role
    let visibleData = data;
    if (currentUser.role === UserRole.MANAGER) {
      visibleData = data.filter(log => log.userRole === UserRole.USER);
    }
    
    setLogs(visibleData);
    setFilteredLogs(visibleData);
    setIsLoading(false);
  };

  const filterData = () => {
    let result = logs;

    if (filterAction !== 'ALL') {
      result = result.filter(log => log.action === filterAction);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.userName.toLowerCase().includes(term) || 
        log.details.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(result);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (action.includes('APPROVE') || action.includes('RESOLVE')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               Audit Logs
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             {currentUser.role === UserRole.ADMIN 
               ? "Full system audit trail. Monitoring Manager and User activities." 
               : "Team activity log. Monitoring User activities."}
           </p>
        </div>
        <button 
          onClick={loadLogs} 
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search user, action or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
         </div>
         <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">User</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Action</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 w-full">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No logs found matching your criteria.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{log.userName}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};