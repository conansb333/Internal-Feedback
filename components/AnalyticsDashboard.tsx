import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Feedback, User, PROCESS_TYPES, UserRole, ApprovalStatus } from '../types';
import { PieChart, TrendingUp, AlertTriangle, BookOpen, UserX, Activity, BrainCircuit, XCircle } from 'lucide-react';

interface AnalyticsDashboardProps {
  currentUser: User;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 1. Data Selection based on Role
  // For Managers: Use ALL feedback.
  // For Users: 
  //   - Performance (Root Cause) Charts -> Based on Reports RECEIVED (How am I doing?)
  //   - Rejection Rate -> Based on Reports SENT (How good is my reporting?)
  
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <PieChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            {isManager ? "Team Diagnostics" : "My Performance Analytics"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isManager 
              ? `Analysis based on ${totalAnalyzed} Approved Reports across the team.` 
              : `Analysis based on ${totalAnalyzed} approved reports about your work.`}
        </p>
      </div>

      {/* CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1: Training Needs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-l-4 border-blue-500 border-y border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{trainingPct}%</span>
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Knowledge Gaps</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">Wrong Process, Wrong Dept</p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {isManager ? "Rec: Process Training" : "Review Process Docs"}
              </div>
          </div>

          {/* Card 2: Skill/Execution */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-l-4 border-orange-500 border-y border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                      <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{executionPct}%</span>
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Execution & Skill</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">SLA Breaches, Errors</p>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  {isManager ? "Rec: QA & Upskilling" : "Double Check Work"}
              </div>
          </div>

          {/* Card 3: Behavior */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-l-4 border-purple-500 border-y border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                      <UserX className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{behaviorPct}%</span>
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Behavioral Issues</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">Attitude, Conduct</p>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  {isManager ? "Rec: 1:1 Coaching" : "Self-Reflection"}
              </div>
          </div>

          {/* Card 4: Rejection Rate */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-l-4 border-slate-400 border-y border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                      <XCircle className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{rejectionRate}%</span>
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Rejection Rate</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">{isManager ? "Team Reports Declined" : "Your Reports Declined"}</p>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Invalid/Wrong Claims
              </div>
          </div>
      </div>

      <div className={`grid grid-cols-1 ${isManager ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 mb-8`}>
          
          {/* CHART: Top Training Opportunities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isManager ? "Top 5 Training Opportunities" : "My Recurring Issues"}
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