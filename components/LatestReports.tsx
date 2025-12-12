
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Feedback, User, ResolutionStatus, Priority, ApprovalStatus } from '../types';
import { Button } from './Button';
import { Clock, Check, X, Calendar, FileText, Eye, ThumbsUp, ThumbsDown, AlertOctagon, Filter, MessageSquare, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface LatestReportsProps {
  currentUser?: User;
}

export const LatestReports: React.FC<LatestReportsProps> = ({ currentUser }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedReport, setSelectedReport] = useState<Feedback | null>(null);
  
  // Action State for Manager Notes
  const [actionData, setActionData] = useState<{ type: 'APPROVE' | 'REJECT', report: Feedback } | null>(null);
  const [noteToReporter, setNoteToReporter] = useState('');
  const [noteToReceiver, setNoteToReceiver] = useState('');

  // Filter State
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = feedbacks;
    if (filterMode !== 'all') {
      result = feedbacks.filter(f => f.approvalStatus.toLowerCase() === filterMode);
    }
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(f => 
            f.faultDescription.toLowerCase().includes(lowerQ) ||
            getUserName(f.fromUserId).toLowerCase().includes(lowerQ) ||
            getUserName(f.toUserId).toLowerCase().includes(lowerQ)
        );
    }
    setFilteredFeedbacks(result);
  }, [filterMode, searchQuery, feedbacks]);

  const loadData = async () => {
    const rawFeedbacks = await storageService.getFeedbacks();
    const sorted = rawFeedbacks.sort((a, b) => b.timestamp - a.timestamp);
    setFeedbacks(sorted);
    setFilteredFeedbacks(sorted);
    
    const rawUsers = await storageService.getUsers();
    setUsers(rawUsers);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const formatTimeCompact = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const updateResolutionStatus = async (feedback: Feedback, newStatus: ResolutionStatus) => {
    const updated = { ...feedback, resolutionStatus: newStatus };
    await storageService.saveFeedback(updated);
    setFeedbacks(prev => prev.map(f => f.id === feedback.id ? updated : f));
    setSelectedReport(updated);
  };

  const initiateAction = (report: Feedback, type: 'APPROVE' | 'REJECT') => {
    setActionData({ type, report });
    setNoteToReporter('');
    setNoteToReceiver('');
  };

  const confirmAction = async () => {
    if (!actionData) return;
    
    const newStatus = actionData.type === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    const updated: Feedback = { 
        ...actionData.report, 
        approvalStatus: newStatus,
        managerNoteToReporter: noteToReporter,
        managerNoteToReceiver: noteToReceiver,
        managerName: currentUser?.name || 'Manager' 
    };

    await storageService.saveFeedback(updated);
    
    const actionLog = actionData.type === 'APPROVE' ? 'APPROVE_REPORT' : 'REJECT_REPORT';
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser?.id || 'MANAGER', 
        userName: currentUser?.name || 'Manager',
        userRole: currentUser?.role || 'MANAGER' as any,
        action: actionLog,
        details: `Report ${actionData.report.id} ${newStatus}.`,
        timestamp: Date.now()
    });

    setFeedbacks(prev => prev.map(f => f.id === actionData.report.id ? updated : f));
    setSelectedReport(updated);
    setActionData(null);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               Latest Activity
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time triage queue. Review and approve reports efficiently.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search activity..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
           </div>
           
           <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
             {(['all', 'pending', 'approved', 'rejected'] as const).map(mode => (
                 <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${
                        filterMode === mode 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                 >
                    {mode}
                 </button>
             ))}
           </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Reporter</th>
                          <th className="px-6 py-4">Receiver</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Priority</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFeedbacks.map(item => (
                          <tr 
                            key={item.id} 
                            onClick={() => setSelectedReport(item)}
                            className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                          >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">
                                  {formatTimeCompact(item.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                                          {getUserName(item.fromUserId).charAt(0)}
                                      </div>
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{getUserName(item.fromUserId)}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                          {getUserName(item.toUserId).charAt(0)}
                                      </div>
                                      <span className="text-sm text-slate-600 dark:text-slate-300">{getUserName(item.toUserId)}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-block max-w-[150px] truncate text-sm text-slate-600 dark:text-slate-300" title={item.processType}>
                                      {item.processType}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      item.priority === Priority.HIGH ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50' :
                                      item.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/50' :
                                      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50'
                                  }`}>
                                      {item.priority}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  {item.approvalStatus === ApprovalStatus.PENDING ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50 animate-pulse">
                                          Review Needed
                                      </span>
                                  ) : item.approvalStatus === ApprovalStatus.APPROVED ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
                                          Approved
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                          Rejected
                                      </span>
                                  )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                      View Details &rarr;
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {filteredFeedbacks.length === 0 && (
                          <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                  No reports found matching your filters.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* REPORT DETAIL MODAL (Reused Logic) */}
      {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div 
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Action Modal Overlay (Nested) */}
                  {actionData && (
                    <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 flex items-center justify-center p-8 backdrop-blur-sm rounded-2xl">
                        <div className="w-full max-w-md">
                            <h4 className={`text-xl font-bold mb-2 flex items-center gap-2 ${actionData.type === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                                {actionData.type === 'APPROVE' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                {actionData.type === 'APPROVE' ? 'Approve Report' : 'Reject Report'}
                            </h4>
                            
                            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                                {actionData.type === 'APPROVE' 
                                  ? "You are approving this report. Provide specific feedback for each party." 
                                  : "You are rejecting this report. Explain why to the reporter."
                                }
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Note to Reporter {actionData.type === 'APPROVE' ? '(Optional)' : '(Required)'}
                                    </label>
                                    <textarea
                                        autoFocus
                                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        rows={3}
                                        placeholder={actionData.type === 'APPROVE' ? "e.g. Thanks for flagging this..." : "e.g. This is not a valid process error because..."}
                                        value={noteToReporter}
                                        onChange={e => setNoteToReporter(e.target.value)}
                                    />
                                </div>

                                {actionData.type === 'APPROVE' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Note to Reported User (Coaching)
                                        </label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            rows={3}
                                            placeholder="e.g. Please ensure you check the SLA next time..."
                                            value={noteToReceiver}
                                            onChange={e => setNoteToReceiver(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setActionData(null)}>Cancel</Button>
                                <Button 
                                    onClick={confirmAction}
                                    variant={actionData.type === 'APPROVE' ? 'primary' : 'danger'}
                                    disabled={actionData.type === 'REJECT' && !noteToReporter.trim()}
                                >
                                    Confirm {actionData.type === 'APPROVE' ? 'Approval' : 'Rejection'}
                                </Button>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur sticky top-0 z-10">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          Report Details
                      </h3>
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                      
                      {/* PERMANENT MANAGER TRIAGE PANEL */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                  selectedReport.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  selectedReport.approvalStatus === ApprovalStatus.REJECTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                  {selectedReport.approvalStatus === ApprovalStatus.APPROVED ? <Check className="w-5 h-5" /> :
                                   selectedReport.approvalStatus === ApprovalStatus.REJECTED ? <X className="w-5 h-5" /> :
                                   <AlertOctagon className="w-5 h-5" />}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">Approval Status</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Current: <span className="font-semibold uppercase">{selectedReport.approvalStatus}</span>
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                              <button 
                                onClick={() => initiateAction(selectedReport, 'REJECT')}
                                disabled={selectedReport.approvalStatus === ApprovalStatus.REJECTED}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
                                    selectedReport.approvalStatus === ApprovalStatus.REJECTED 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                    : 'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                              >
                                  <ThumbsDown className="w-3 h-3" /> Decline
                              </button>
                              <button 
                                onClick={() => initiateAction(selectedReport, 'APPROVE')}
                                disabled={selectedReport.approvalStatus === ApprovalStatus.APPROVED}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
                                    selectedReport.approvalStatus === ApprovalStatus.APPROVED
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                }`}
                              >
                                  <ThumbsUp className="w-3 h-3" /> Approve
                              </button>
                          </div>
                      </div>

                      {/* Info Sections */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporter</span>
                            <span className="font-medium text-slate-900 dark:text-white">{getUserName(selectedReport.fromUserId)}</span>
                         </div>
                         <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</span>
                            <span className="font-medium text-slate-900 dark:text-white">{getUserName(selectedReport.toUserId)}</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Fault Description</h4>
                              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {selectedReport.faultDescription}
                              </p>
                          </div>
                          {selectedReport.feedbackContent && (
                              <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Feedback Provided</h4>
                                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                      {selectedReport.feedbackContent}
                                  </p>
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div>
                              <span className="block text-xs text-slate-400 mb-1">Order #</span>
                              <span className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded inline-block">
                                  {selectedReport.orderNumber || '-'}
                              </span>
                          </div>
                          <div>
                              <span className="block text-xs text-slate-400 mb-1">Case #</span>
                              <span className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded inline-block">
                                  {selectedReport.caseNumber || '-'}
                              </span>
                          </div>
                          <div>
                              <span className="block text-xs text-slate-400 mb-1">Report Date</span>
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {selectedReport.reportDate}
                              </div>
                          </div>
                      </div>
                  </div>

                  {selectedReport.approvalStatus === ApprovalStatus.APPROVED && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center sticky bottom-0 z-10">
                        <div className="text-xs text-slate-400">ID: {selectedReport.id}</div>
                        <div className="flex gap-3">
                            {selectedReport.resolutionStatus === ResolutionStatus.CLOSED_RESOLVED ? (
                                <Button variant="secondary" onClick={() => updateResolutionStatus(selectedReport, ResolutionStatus.IN_PROGRESS)} className="text-xs">
                                    <Eye className="w-3.5 h-3.5 mr-2" /> Re-open Case
                                </Button>
                            ) : (
                                <Button onClick={() => updateResolutionStatus(selectedReport, ResolutionStatus.CLOSED_RESOLVED)} className="text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                                    <Check className="w-3.5 h-3.5 mr-2" /> Mark as Resolved
                                </Button>
                            )}
                        </div>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
