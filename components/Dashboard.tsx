import React, { useState, useEffect } from 'react';
import { User, Feedback, UserRole, ResolutionStatus, ApprovalStatus, Priority } from '../types';
import { storageService } from '../services/storageService';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  FileText,
  Activity,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  user: User;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setActiveTab }) => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    critical: 0,
    resolved: 0,
    pendingApproval: 0,
    myReportsSent: 0,
    myReportsReceived: 0
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<{day: string, count: number}[]>([]);
  const [topIssue, setTopIssue] = useState<{type: string, count: number} | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
        const allFeedbacks = await storageService.getFeedbacks();
        const allUsers = await storageService.getUsers();
        setTotalUsers(allUsers.length);
        
        // 1. Filter relevant data based on Role
        const relevantFeedbacks = user.role === UserRole.USER
          ? allFeedbacks.filter(f => f.fromUserId === user.id || f.toUserId === user.id)
          : allFeedbacks;

        // 2. Calculate Stats
        setStats({
          total: relevantFeedbacks.length,
          open: relevantFeedbacks.filter(f => f.resolutionStatus === ResolutionStatus.OPEN && f.approvalStatus === ApprovalStatus.APPROVED).length,
          critical: relevantFeedbacks.filter(f => f.priority === Priority.HIGH && f.approvalStatus === ApprovalStatus.APPROVED).length,
          resolved: relevantFeedbacks.filter(f => f.resolutionStatus === ResolutionStatus.CLOSED_RESOLVED).length,
          pendingApproval: allFeedbacks.filter(f => f.approvalStatus === ApprovalStatus.PENDING).length, // Managers see ALL pending
          myReportsSent: allFeedbacks.filter(f => f.fromUserId === user.id).length,
          myReportsReceived: allFeedbacks.filter(f => f.toUserId === user.id).length,
        });

        // 3. Recent Activity (Last 5)
        setRecentFeedbacks(relevantFeedbacks.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));

        // 4. Weekly Volume Chart Data (Last 7 days)
        const volumeData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split('T')[0];
          const count = relevantFeedbacks.filter(f => f.reportDate === dayStr).length;
          volumeData.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
        }
        setWeeklyVolume(volumeData);

        // 5. Top Issue Identification
        const typeCounts: Record<string, number> = {};
        relevantFeedbacks.forEach(f => {
          typeCounts[f.processType] = (typeCounts[f.processType] || 0) + 1;
        });
        const sortedTypes = Object.entries(typeCounts).sort(([,a], [,b]) => b - a);
        if (sortedTypes.length > 0) {
          setTopIssue({ type: sortedTypes[0][0], count: sortedTypes[0][1] });
        }
    };
    
    loadDashboardData();
  }, [user]);

  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isManager 
              ? "Track team performance, approvals, and critical incidents." 
              : "Monitor your feedback status and reports."}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
             {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
           </div>
           <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 pr-2">
             Week {Math.ceil(new Date().getDate() / 7)}
           </span>
        </div>
      </div>

      {/* MANAGER ACTION CENTER */}
      {isManager && stats.pendingApproval > 0 && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Action Required
            </h3>
            <p className="text-amber-800 dark:text-amber-200/80 mt-1">
              You have <span className="font-bold">{stats.pendingApproval} reports</span> waiting for approval.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('latest-reports')}
            className="relative z-10 px-4 py-2 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-xl shadow-sm border border-amber-100 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors"
          >
            Review Now
          </button>
          {/* Decor */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Active" 
          value={stats.total} 
          icon={Activity} 
          trend="+12%" 
          trendUp={true}
          color="indigo" 
        />
        <StatsCard 
          title="Open Issues" 
          value={stats.open} 
          icon={Clock} 
          subtext={`${stats.resolved} resolved this week`}
          color="blue" 
        />
        <StatsCard 
          title="Critical Priority" 
          value={stats.critical} 
          icon={AlertTriangle} 
          color="red"
          alert={stats.critical > 0} 
        />
        <StatsCard 
          title={isManager ? "Team Size" : "My Reports"} 
          value={isManager ? totalUsers : stats.myReportsSent} 
          icon={isManager ? Users : FileText} 
          subtext={isManager ? "Active Accounts" : "Submitted"}
          color="slate" 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column: Charts & Analysis */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Weekly Volume Chart */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-indigo-500" />
                 Weekly Activity
               </h3>
               <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Last 7 Days</span>
             </div>
             
             <div className="h-48 flex items-end justify-between gap-2">
               {weeklyVolume.map((item, idx) => (
                 <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative h-32 overflow-hidden">
                       <div 
                         className="absolute bottom-0 left-0 right-0 bg-indigo-500 group-hover:bg-indigo-600 transition-all rounded-t-lg min-h-[4px]"
                         style={{ height: `${Math.max((item.count / (Math.max(...weeklyVolume.map(v => v.count)) || 1)) * 100, 5)}%` }}
                       ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.day}</span>
                 </div>
               ))}
             </div>
           </div>

           {/* Top Issue Focus */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white">Primary Focus Area</h3>
                 {topIssue && <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">High Frequency</span>}
              </div>
              
              {topIssue ? (
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{topIssue.type}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      This issue accounts for <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round((topIssue.count / stats.total) * 100)}%</span> of all reports.
                      Consider reviewing process documentation.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">Not enough data to determine focus area.</p>
              )}
           </div>

        </div>

        {/* Right Column: Recent Feed */}
        <div className="lg:col-span-1">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 dark:text-white">Recent Feed</h3>
                 <button onClick={() => setActiveTab('latest-reports')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
              </div>
              <div className="p-4 space-y-4">
                 {recentFeedbacks.length === 0 ? (
                   <div className="text-center py-8 text-slate-400 text-sm">No recent activity.</div>
                 ) : (
                   recentFeedbacks.map(item => (
                     <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-default">
                        <div className="flex justify-between items-start mb-1">
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                             item.priority === Priority.HIGH ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                             'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                           }`}>
                             {item.priority}
                           </span>
                           <span className="text-[10px] text-slate-400">{item.reportDate}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">{item.processType}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.faultDescription}</p>
                     </div>
                   ))
                 )}
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setActiveTab('submit-feedback')}
                  className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  Create New Report
                </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// Helper Component for Stats Cards
const StatsCard = ({ title, value, icon: Icon, trend, trendUp, subtext, color, alert }: any) => {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  };

  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border ${alert ? 'border-red-300 dark:border-red-900 animate-pulse' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color as keyof typeof colorStyles]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(trend || subtext) && (
        <div className="flex items-center text-xs">
          {trend && (
            <span className={`flex items-center font-bold mr-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};