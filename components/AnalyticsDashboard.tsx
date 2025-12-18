
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Feedback, User, PROCESS_TYPES, UserRole, ApprovalStatus } from '../types';
import { PieChart, TrendingUp, AlertTriangle, BookOpen, UserX, Activity, BrainCircuit, XCircle, Sparkles, BarChart, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Button } from './Button';

interface AnalyticsDashboardProps {
  currentUser: User;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const fb = await storageService.getFeedbacks();
        const usr = await storageService.getUsers();
        setFeedbacks(fb);
        setUsers(usr);
        setLoading(false);
    };
    fetchData();
  }, []);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const handleGenerateInsight = async () => {
    setGeneratingInsight(true);
    // Filter for valid reports based on role to send to AI
    const dataToAnalyze = isManager ? feedbacks : feedbacks.filter(f => f.toUserId === currentUser.id);
    const insight = await geminiService.generateAnalyticsInsight(dataToAnalyze);
    setAiInsight(insight);
    setGeneratingInsight(false);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
        </div>
    );
  }

  // --- ANALYTICS LOGIC ---
  
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const reportsReceived = isManager 
    ? feedbacks 
    : feedbacks.filter(f => f.toUserId === currentUser.id);

  const reportsSent = isManager
    ? feedbacks
    : feedbacks.filter(f => f.fromUserId === currentUser.id);

  // Filter for APPROVED reports only for accurate diagnostics
  const validReports = reportsReceived.filter(f => f.approvalStatus === ApprovalStatus.APPROVED);
  
  // Rejection Rate Calculation (Based on reports sent for users)
  const sentRejected = reportsSent.filter(f => f.approvalStatus === ApprovalStatus.REJECTED);
  const sentTotal = reportsSent.length;
  const rejectionRate = sentTotal > 0 ? ((sentRejected.length / sentTotal) * 100).toFixed(1) : '0';

  const totalAnalyzed = validReports.length;

  // --- TREND ANALYSIS ---
  // Compare Last 7 days vs Previous 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const reportsLast7 = validReports.filter(f => new Date(f.timestamp) >= sevenDaysAgo);
  const reportsPrev7 = validReports.filter(f => new Date(f.timestamp) >= fourteenDaysAgo && new Date(f.timestamp) < sevenDaysAgo);
  
  const trendCountCurrent = reportsLast7.length;
  const trendCountPrev = reportsPrev7.length;
  const trendDiff = trendCountCurrent - trendCountPrev;
  const trendDirection = trendDiff > 0 ? 'up' : trendDiff < 0 ? 'down' : 'flat';

  // Group trend by type for the current week
  const trendByType: Record<string, number> = {};
  reportsLast7.forEach(f => {
      trendByType[f.processType] = (trendByType[f.processType] || 0) + 1;
  });
  const sortedTrends = Object.entries(trendByType).sort(([,a], [,b]) => b - a).slice(0, 3);


  if (totalAnalyzed === 0 && sentTotal === 0) {
      return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <PieChart className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No Data Available</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                {isManager ? "No reports have been submitted yet." : "You haven't received any approved feedback reports yet, nor have you submitted any reports."}
            </p>
        </div>
      );
  }

  // 1. Root Cause Analysis (Categorization) - Using ONLY VALID reports RECEIVED
  let trainingCount = 0; // Wrong Process, Wrong Dept, First Point -> Knowledge Gap
  let executionCount = 0; // Investigation, RTS, Replacement -> Skill/Attention Gap
  let behaviorCount = 0; // Behavior -> Conduct Issue

  validReports.forEach(f => {
      const type = f.processType;
      if (['Wrong Process', 'Wrong Department', 'First Point Resolution'].includes(type)) {
          trainingCount++;
      } else if (['Behavior'].includes(type)) {
          behaviorCount++;
      } else {
          // 'Investigation', 'Replacement & Refund', 'Return To Sender', 'Process/Pending Status'
          // These are usually execution errors or skill gaps
          executionCount++;
      }
  });

  const trainingPct = totalAnalyzed > 0 ? ((trainingCount / totalAnalyzed) * 100).toFixed(1) : '0';
  const executionPct = totalAnalyzed > 0 ? ((executionCount / totalAnalyzed) * 100).toFixed(1) : '0';
  const behaviorPct = totalAnalyzed > 0 ? ((behaviorCount / totalAnalyzed) * 100).toFixed(1) : '0';

  // 2. Specific Scenario Hotspots (Where is the confusion?)
  const scenarioCounts: Record<string, number> = {};
  validReports.forEach(f => {
      if(f.scenarioTag) scenarioCounts[f.scenarioTag] = (scenarioCounts[f.scenarioTag] || 0) + 1;
  });
  const topScenarios = Object.entries(scenarioCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // 3. Colleague Impact (Who needs help?) - MANAGER ONLY
  let topReceivers: { id: string, name: string, total: number, primaryIssue: string }[] = [];
  
  if (isManager) {
      const userStats: Record<string, { count: number; types: Record<string, number> }> = {};
      
      validReports.forEach(f => {
          if (!userStats[f.toUserId]) {
              userStats[f.toUserId] = { count: 0, types: {} };
          }
          userStats[f.toUserId].count++;
          
          const type = f.processType;
          userStats[f.toUserId].types[type] = (userStats[f.toUserId].types[type] || 0) + 1;
      });

      // Sort users by number of reports received
      topReceivers = Object.entries(userStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5) // Top 5
        .map(([id, stats]) => {
            // Find most common issue for this user
            const topIssue = Object.entries(stats.types).sort(([, a], [, b]) => b - a)[0];
            return {
                id,
                name: getUserName(id),
                total: stats.count,
                primaryIssue: topIssue ? topIssue[0] : 'N/A'
            };
        });
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
               <PieChart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {isManager 
                  ? `Analysis based on ${totalAnalyzed} Approved Reports across the team.` 
                  : `Analysis based on ${totalAnalyzed} approved reports about your work.`}
              </p>
            </div>
        </div>
      </div>

      {/* FEATURE #1: AI INSIGHTS */}
      <div className="mb-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">AI Manager Insight</h3>
                        <p className="text-indigo-200 text-sm">Automated Root Cause Analysis</p>
                    </div>
                 </div>
                 <Button 
                    onClick={handleGenerateInsight} 
                    isLoading={generatingInsight}
                    className="bg-white text-indigo-900 hover:bg-indigo-50 border-none shadow-none"
                 >
                    {aiInsight ? 'Refresh Analysis' : 'Generate Insight'}
                 </Button>
             </div>
             
             {aiInsight ? (
                 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-lg leading-relaxed font-medium">"{aiInsight}"</p>
                 </div>
             ) : (
                 <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/5 border-dashed text-center text-indigo-200/60">
                     Click "Generate Insight" to have AI analyze recent reports and suggest actions.
                 </div>
             )}
         </div>
         {/* Decor */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl -ml-16 -mb-16"></div>
      </div>

      {/* FEATURE #2: TREND ANALYSIS */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                 <TrendingUp className="w-4 h-4" /> 7-Day Trend
             </div>
             <div className="flex items-end gap-3 mb-2">
                 <span className="text-4xl font-bold text-slate-900 dark:text-white">{trendCountCurrent}</span>
                 <span className="text-sm text-slate-400 mb-1">reports this week</span>
             </div>
             <div className={`flex items-center text-sm font-bold ${
                 trendDirection === 'up' ? 'text-red-500' : trendDirection === 'down' ? 'text-green-500' : 'text-slate-500'
             }`}>
                 {trendDirection === 'up' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                 {trendDirection === 'down' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                 {trendDirection === 'flat' && <Minus className="w-4 h-4 mr-1" />}
                 {trendDiff > 0 ? `+${trendDiff}` : trendDiff} vs previous 7 days
             </div>
             <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-xs text-slate-400 mb-3 uppercase font-bold">Driving Factors</p>
                 {sortedTrends.length > 0 ? sortedTrends.map(([type, count]) => (
                     <div key={type} className="flex justify-between text-sm mb-2 last:mb-0">
                         <span className="text-slate-600 dark:text-slate-300 truncate pr-2">{type}</span>
                         <span className="font-mono font-bold text-slate-900 dark:text-white">{count}</span>
                     </div>
                 )) : <div className="text-xs text-slate-400 italic">No data</div>}
             </div>
         </div>

         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-indigo-500" />
                    Category Breakdown
                </h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Training */}
                 <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                     <div className="flex justify-between items-start mb-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{trainingPct}%</span>
                     </div>
                     <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Knowledge Gaps</p>
                     <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Wrong Process, Dept</p>
                 </div>
                 {/* Execution */}
                 <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800">
                     <div className="flex justify-between items-start mb-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        <span className="text-xl font-bold text-orange-700 dark:text-orange-300">{executionPct}%</span>
                     </div>
                     <p className="text-sm font-bold text-orange-900 dark:text-blue-100">Execution</p>
                     <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Errors, SLAs</p>
                 </div>
                 {/* Behavior */}
                 <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                     <div className="flex justify-between items-start mb-2">
                        <UserX className="w-5 h-5 text-purple-500" />
                        <span className="text-xl font-bold text-purple-700 dark:text-purple-300">{behaviorPct}%</span>
                     </div>
                     <p className="text-sm font-bold text-purple-900 dark:text-blue-100">Behavior</p>
                     <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Conduct Issues</p>
                 </div>
             </div>
         </div>
      </div>

      <div className={`grid grid-cols-1 ${isManager ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 mb-8`}>
          
          {/* CHART: Top Training Opportunities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isManager ? "Top 5 Recurring Issues" : "My Recurring Issues"}
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {isManager 
                    ? "These represent the specific scenarios causing the most friction team-wide." 
                    : "These are the specific scenarios where you have received the most feedback."}
              </p>

              <div className="space-y-5">
                  {topScenarios.map(([tag, count], index) => {
                      const pct = totalAnalyzed > 0 ? ((count / totalAnalyzed) * 100).toFixed(0) : '0';
                      return (
                        <div key={tag}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {index + 1}. {tag}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 font-mono">{count} reports</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-indigo-500 h-2.5 rounded-full" 
                                    style={{ width: `${pct}%` }}
                                ></div>
                            </div>
                        </div>
                      );
                  })}
                  {topScenarios.length === 0 && <p className="text-slate-400 italic">No scenario data available.</p>}
              </div>
          </div>

          {/* TABLE: Colleague Support Focus (MANAGERS ONLY) */}
          {isManager && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                   <AlertTriangle className="w-5 h-5 text-red-500" />
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Colleague Support Focus</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Users receiving the most feedback. This highlights who needs immediate support or intervention.
                </p>

                <div className="overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="pb-3 font-semibold text-slate-500 dark:text-slate-400">Name</th>
                                <th className="pb-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Reports Received</th>
                                <th className="pb-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Primary Struggle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {topReceivers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{user.name}</td>
                                    <td className="py-3 text-center">
                                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                                            {user.total}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className={`text-xs px-2 py-1 rounded border ${
                                            user.primaryIssue.includes('Behavior') ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                            user.primaryIssue.includes('Wrong') ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                            'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                                        }`}>
                                            {user.primaryIssue}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {topReceivers.length === 0 && <p className="text-slate-400 italic mt-4">No user data available.</p>}
                </div>
            </div>
          )}
      </div>
    </div>
  );
};
