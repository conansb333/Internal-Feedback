
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Feedback, User, ResolutionStatus, Priority, ApprovalStatus } from '../types';
import { Button } from './Button';
import { Clock, User as UserIcon, ArrowRight, Tag, X, Calendar, FileText, BrainCircuit, Check, Eye, ThumbsUp, ThumbsDown, ShieldAlert, AlertOctagon, Filter, Hash, MessageSquare } from 'lucide-react';

export const LatestReports: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedReport, setSelectedReport] = useState<Feedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Action State for Manager Notes
  const [actionData, setActionData] = useState<{ type: 'APPROVE' | 'REJECT', report: Feedback } | null>(null);
  const [managerNote, setManagerNote] = useState('');

  // Filter State
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'high_priority'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = feedbacks;
    if (filterMode === 'pending') {
      result = feedbacks.filter(f => f.approvalStatus === ApprovalStatus.PENDING);
    } else if (filterMode === 'high_priority') {
      result = feedbacks.filter(f => f.priority === Priority.HIGH);
    }
    setFilteredFeedbacks(result);
  }, [filterMode, feedbacks]);

  const loadData = async () => {
    const rawFeedbacks = await storageService.getFeedbacks();
    const sorted = rawFeedbacks.sort((a, b) => b.timestamp - a.timestamp);
    setFeedbacks(sorted);
    setFilteredFeedbacks(sorted);
    
    const rawUsers = await storageService.getUsers();
    setUsers(rawUsers);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayLabel = (timestamp: number) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString();
  };

  const handleAnalyze = async (feedback: Feedback) => {
    setIsAnalyzing(true);
    const fullText = `Fault: ${feedback.faultDescription}\nFeedback: ${feedback.feedbackContent}`;
    const analysis = await geminiService.analyzeFeedback(fullText);
    const updatedFeedback = { ...feedback, aiAnalysis: analysis };
    
    await storageService.saveFeedback(updatedFeedback);
    
    // Update local state
    setFeedbacks(prev => prev.map(f => f.id === feedback.id ? updatedFeedback : f));
    setSelectedReport(updatedFeedback);
    setIsAnalyzing(false);
  };

  const updateResolutionStatus = async (feedback: Feedback, newStatus: ResolutionStatus) => {
    const updated = { ...feedback, resolutionStatus: newStatus };
    await storageService.saveFeedback(updated);
    setFeedbacks(prev => prev.map(f => f.id === feedback.id ? updated : f));
    setSelectedReport(updated);
  };

  // Initiate Approval/Rejection Flow
  const initiateAction = (report: Feedback, type: 'APPROVE' | 'REJECT') => {
    setActionData({ type, report });
    setManagerNote('');
  };

  // Confirm Action
  const confirmAction = async () => {
    if (!actionData) return;
    
    const newStatus = actionData.type === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    const updated = { 
        ...actionData.report, 
        approvalStatus: newStatus,
        managerNotes: managerNote 
    };

    await storageService.saveFeedback(updated);
    
    // Log
    const actionLog = actionData.type === 'APPROVE' ? 'APPROVE_REPORT' : 'REJECT_REPORT';
    storageService.saveLog({
        id: Date.now().toString(),
        userId: 'MANAGER', // Context handled by service if not passed, but we'd ideally pass current user here.
        userName: 'Manager',
        userRole: 'MANAGER' as any,
        action: actionLog,
        details: `Report ${actionData.report.id} ${newStatus}. Note: ${managerNote}`,
        timestamp: Date.now()
    });

    setFeedbacks(prev => prev.map(f => f.id === actionData.report.id ? updated : f));
    setSelectedReport(updated);
    setActionData(null);
    setManagerNote('');
  };

  // Group by day
  const groupedFeedbacks: Record<string, Feedback[]> = {};
  filteredFeedbacks.slice(0, 50).forEach(f => {
      const day = getDayLabel(f.timestamp);
      if (!groupedFeedbacks[day]) groupedFeedbacks[day] = [];
      groupedFeedbacks[day].push(f);
  });

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               Latest Activity
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time timeline. Triage pending approvals here.</p>
        </div>
        
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-slate-400" />
           <select 
             value={filterMode}
             onChange={(e) => setFilterMode(e.target.value as any)}
             className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
           >
             <option value="all">Show All</option>
             <option value="pending">Pending Approval</option>
             <option value="high_priority">High Priority Only</option>
           </select>
        </div>
      </div>

      <div className="w-full pb-20">
        {Object.entries(groupedFeedbacks).map(([day, items]) => (
            <div key={day} className="mb-0">
                <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 py-3 z-20 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 flex items-center gap-4 border-b border-transparent">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-4">
                        {day}
                    </h3>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>
                
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pt-6 pb-10">
                    {items.map((item) => (
                        <div key={item.id} className="ml-8 relative group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[39px] top-6 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 z-10 shadow-sm ${
                                item.approvalStatus === ApprovalStatus.REJECTED ? 'bg-slate-300 dark:bg-slate-700' :
                                item.approvalStatus === ApprovalStatus.PENDING ? 'bg-yellow-400 animate-pulse' :
                                item.priority === Priority.HIGH ? 'bg-red-500' : 
                                item.priority === Priority.MEDIUM ? 'bg-orange-500' : 'bg-green-500'
                            }`}></div>

                            {/* Card */}
                            <div 
                                onClick={() => setSelectedReport(item)}
                                className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${
                                    item.approvalStatus === ApprovalStatus.REJECTED ? 'border-slate-200 dark:border-slate-800 opacity-75' :
                                    item.approvalStatus === ApprovalStatus.PENDING ? 'border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-400 bg-yellow-50/10' :
                                    'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                }`}
                            >
                                {/* Card Header Row */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs text-slate-400">{formatTime(item.timestamp)}</span>
                                        
                                        {/* Status Badge */}
                                        {item.approvalStatus === ApprovalStatus.PENDING ? (
                                           <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                               Review Needed
                                           </span>
                                        ) : item.approvalStatus === ApprovalStatus.REJECTED ? (
                                           <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                               Rejected
                                           </span>
                                        ) : (
                                            <div className="flex gap-2">
                                               <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                                   item.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                                                   item.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                                                   'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                               }`}>
                                                   {item.priority}
                                               </span>
                                               <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                                   item.resolutionStatus === ResolutionStatus.OPEN ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900' :
                                                   item.resolutionStatus === ResolutionStatus.IN_PROGRESS ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900' :
                                                   'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                               }`}>
                                                   {item.resolutionStatus}
                                               </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order / Case Info */}
                                    {(item.orderNumber || item.caseNumber) && (
                                      <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                         {item.orderNumber && <span>{item.orderNumber}</span>}
                                         {item.orderNumber && item.caseNumber && <span className="text-slate-300">|</span>}
                                         {item.caseNumber && <span>{item.caseNumber}</span>}
                                      </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="mb-3">
                                   <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-bold mb-1">
                                      <span className="text-indigo-600 dark:text-indigo-400">{getUserName(item.fromUserId)}</span>
                                      <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                                      <span>{getUserName(item.toUserId)}</span>
                                   </div>
                                   <div className="text-xs text-slate-500 mb-2 font-medium bg-slate-50 dark:bg-slate-800/50 inline-block px-2 py-0.5 rounded">
                                      {item.processType}
                                   </div>
                                   <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2">
                                      {item.faultDescription}
                                   </p>
                                </div>

                                {/* Footer */}
                                {item.scenarioTag && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-2 mt-2">
                                        <Tag className="w-3 h-3" />
                                        {item.scenarioTag}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}

        {filteredFeedbacks.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Clock className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">No reports found matching criteria.</p>
            </div>
        )}
      </div>

      {/* REPORT DETAIL MODAL */}
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
                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                                {actionData.type === 'APPROVE' 
                                  ? "Provide coaching notes for the reported user (optional but recommended)." 
                                  : "Explain why this report is invalid (required for the reporter)."
                                }
                            </p>
                            <textarea
                                autoFocus
                                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                                rows={4}
                                placeholder={actionData.type === 'APPROVE' ? "Enter coaching steps..." : "Enter reason for rejection..."}
                                value={managerNote}
                                onChange={e => setManagerNote(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setActionData(null)}>Cancel</Button>
                                <Button 
                                    onClick={confirmAction}
                                    variant={actionData.type === 'APPROVE' ? 'primary' : 'danger'}
                                    disabled={actionData.type === 'REJECT' && !managerNote.trim()}
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

                      {/* Display Manager Notes if present */}
                      {selectedReport.managerNotes && (
                          <div className={`p-4 rounded-xl border ${
                              selectedReport.approvalStatus === ApprovalStatus.APPROVED 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                          }`}>
                             <h4 className={`text-sm font-bold mb-1 flex items-center gap-2 ${
                                  selectedReport.approvalStatus === ApprovalStatus.APPROVED ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                             }`}>
                                <MessageSquare className="w-4 h-4" />
                                {selectedReport.approvalStatus === ApprovalStatus.APPROVED ? 'Manager Coaching' : 'Reason for Rejection'}
                             </h4>
                             <p className="text-sm text-slate-700 dark:text-slate-300">
                                {selectedReport.managerNotes}
                             </p>
                          </div>
                      )}

                      {/* From/To Section */}
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex-1">
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporter</span>
                              <div className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">
                                    {getUserName(selectedReport.fromUserId).charAt(0)}
                                  </div>
                                  {getUserName(selectedReport.fromUserId)}
                              </div>
                          </div>
                          <ArrowRight className="text-slate-300 dark:text-slate-600" />
                          <div className="flex-1 text-right">
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</span>
                              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 justify-end">
                                  {getUserName(selectedReport.toUserId)}
                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                                    {getUserName(selectedReport.toUserId).charAt(0)}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Main Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Process Type</span>
                            <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {selectedReport.processType}
                            </span>
                         </div>
                         <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scenario</span>
                            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                {selectedReport.scenarioTag ? (
                                    <><Tag className="w-3.5 h-3.5" /> {selectedReport.scenarioTag}</>
                                ) : <span className="text-slate-400 italic">None</span>}
                            </span>
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
                          
                          {selectedReport.additionalNotes && (
                              <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Additional Notes</h4>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                                      {selectedReport.additionalNotes}
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* Metadata Grid */}
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

                      {/* AI Analysis Section */}
                      {selectedReport.approvalStatus !== ApprovalStatus.REJECTED && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                      <BrainCircuit className="w-4 h-4" /> AI Analysis
                                  </h4>
                                  {!selectedReport.aiAnalysis && (
                                      <Button 
                                          variant="ghost" 
                                          onClick={() => handleAnalyze(selectedReport)}
                                          isLoading={isAnalyzing}
                                          className="text-xs py-1 h-auto"
                                      >
                                          Generate
                                      </Button>
                                  )}
                              </div>
                              {selectedReport.aiAnalysis ? (
                                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed border border-indigo-100 dark:border-indigo-900/30">
                                      {selectedReport.aiAnalysis}
                                  </div>
                              ) : (
                                  <p className="text-xs text-slate-400 italic">No analysis generated yet.</p>
                              )}
                          </div>
                      )}
                  </div>

                  {/* Modal Footer / Actions */}
                  {selectedReport.approvalStatus === ApprovalStatus.APPROVED && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center sticky bottom-0 z-10">
                        <div className="text-xs text-slate-400">
                            ID: {selectedReport.id}
                        </div>
                        <div className="flex gap-3">
                            {selectedReport.resolutionStatus === ResolutionStatus.CLOSED_RESOLVED ? (
                                <Button 
                                    variant="secondary" 
                                    onClick={() => updateResolutionStatus(selectedReport, ResolutionStatus.IN_PROGRESS)}
                                    className="text-xs"
                                >
                                    <Eye className="w-3.5 h-3.5 mr-2" />
                                    Re-open Case
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => updateResolutionStatus(selectedReport, ResolutionStatus.CLOSED_RESOLVED)}
                                    className="text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    <Check className="w-3.5 h-3.5 mr-2" />
                                    Mark as Resolved
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
