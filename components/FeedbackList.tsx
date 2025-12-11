import React, { useState, useEffect } from 'react';
import { User, Feedback, UserRole, ResolutionStatus, ApprovalStatus, Priority } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Button } from './Button';
import { BrainCircuit, Check, Eye, Search, AlertCircle, FileText, Calendar, Tag, User as UserIcon, ShieldAlert, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackListProps {
  currentUser: User;
  mode: 'all' | 'mine';
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ currentUser, mode }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [currentUser, mode]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = feedbacks.filter(f => {
      // Note: We search based on real names here, but display anonymized names in render. 
      // Ideally search should also respect anonymity but for simplicity we keep search broad 
      // or we can restrict it. Let's keep broad search but anonymize display.
      const uName = getUserName(f.toUserId).toLowerCase();
      const fName = getUserName(f.fromUserId).toLowerCase();
      const desc = f.faultDescription.toLowerCase();
      const order = f.orderNumber?.toLowerCase() || '';
      return uName.includes(term) || fName.includes(term) || desc.includes(term) || order.includes(term);
    });
    setFilteredFeedbacks(filtered);
  }, [searchTerm, feedbacks]);

  const loadData = async () => {
    const allUsers = await storageService.getUsers();
    setUsers(allUsers);
    let allFeedbacks = await storageService.getFeedbacks();
    
    if (mode === 'mine') {
      // Filter logic:
      // 1. If I am the SENDER, I can see everything I sent (Pending, Approved, Rejected)
      // 2. If I am the RECEIVER, I should ONLY see Approved reports (verified).
      allFeedbacks = allFeedbacks.filter(
        f => f.fromUserId === currentUser.id || (f.toUserId === currentUser.id && f.approvalStatus === ApprovalStatus.APPROVED)
      );
    }
    const sorted = allFeedbacks.sort((a, b) => b.timestamp - a.timestamp);
    setFeedbacks(sorted);
    setFilteredFeedbacks(sorted);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  
  // Can view all / manage reports: Manager and Admin
  const isManagerOrAdmin = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const handleAnalyze = async (feedback: Feedback) => {
    setAnalyzingIds(prev => new Set(prev).add(feedback.id));
    const fullText = `Fault: ${feedback.faultDescription}\nFeedback: ${feedback.feedbackContent}`;
    const analysis = await geminiService.analyzeFeedback(fullText);
    const updatedFeedback = { ...feedback, aiAnalysis: analysis };
    
    await storageService.saveFeedback(updatedFeedback);
    await loadData(); // Reload to refresh
    
    setAnalyzingIds(prev => {
       const next = new Set(prev);
       next.delete(feedback.id);
       return next;
    });
  };

  const updateStatus = async (feedback: Feedback, newStatus: ResolutionStatus) => {
    await storageService.saveFeedback({ ...feedback, resolutionStatus: newStatus });
    
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATE_STATUS',
        details: `Updated report status to ${newStatus} (ID: ${feedback.id})`,
        timestamp: Date.now()
    });

    loadData();
  };

  const updateApproval = async (feedback: Feedback, status: ApprovalStatus) => {
    await storageService.saveFeedback({ ...feedback, approvalStatus: status });
    
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: status === ApprovalStatus.APPROVED ? 'APPROVE_REPORT' : 'REJECT_REPORT',
        details: `Marked report as ${status} (ID: ${feedback.id})`,
        timestamp: Date.now()
    });

    loadData();
  };

  const PriorityBadge = ({ p }: { p: Priority }) => {
    const styles = {
      [Priority.HIGH]: 'bg-red-50 text-red-700 border-red-200 ring-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50 dark:ring-red-900/20',
      [Priority.MEDIUM]: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50 dark:ring-orange-900/20',
      [Priority.LOW]: 'bg-green-50 text-green-700 border-green-200 ring-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50 dark:ring-green-900/20',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ring-2 ring-opacity-50 ${styles[p]}`}>
        {p}
      </span>
    );
  };

  const StatusBadge = ({ s }: { s: ResolutionStatus }) => {
    const styles = {
      [ResolutionStatus.OPEN]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50',
      [ResolutionStatus.IN_PROGRESS]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50',
      [ResolutionStatus.CLOSED_RESOLVED]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[s]}`}>
        {s}
      </span>
    );
  };

  const ApprovalBadge = ({ s }: { s: ApprovalStatus }) => {
      if (s === ApprovalStatus.APPROVED) return null; // Don't show badge if normal
      if (s === ApprovalStatus.PENDING) {
          return (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-900/60 dark:text-yellow-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Review Pending
              </span>
          );
      }
      if (s === ApprovalStatus.REJECTED) {
          return (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-slate-200 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  Rejected
              </span>
          );
      }
      return null;
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{mode === 'all' ? 'All Reports' : 'My Reports'}</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage and track feedback progress.</p>
        </div>
        
        <div className="relative w-full md:w-72">
           <input 
             type="text" 
             placeholder="Search reports..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
           />
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search filters.</p>
          </div>
        )}
        
        {filteredFeedbacks.map(item => {
          const isSender = item.fromUserId === currentUser.id;
          
          // Anonymization Logic:
          // If current user is NOT a manager/admin AND they are NOT the sender (meaning they are the receiver),
          // hide the sender's name.
          let fromName = getUserName(item.fromUserId);
          if (!isManagerOrAdmin && !isSender) {
             fromName = "Anonymous";
          }
          
          const toName = getUserName(item.toUserId);

          return (
            <div key={item.id} className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow duration-200 ${item.approvalStatus === ApprovalStatus.REJECTED ? 'opacity-70' : ''}`}>
              
              {/* Header Strip */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-2">
                      <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-xs font-bold ring-1 ring-slate-100 dark:ring-slate-700 ${!isManagerOrAdmin && !isSender ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`} title={`From: ${fromName}`}>
                         {fromName.charAt(0)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 ring-1 ring-slate-100 dark:ring-slate-700" title={`To: ${toName}`}>
                         {toName.charAt(0)}
                      </div>
                   </div>
                   <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                         {isManagerOrAdmin ? (
                             <span>
                               <span className="text-indigo-600 dark:text-indigo-400">{fromName}</span>
                               <span className="text-slate-400 dark:text-slate-500 font-normal mx-1">reported</span>
                               <span>{toName}</span>
                             </span>
                         ) : isSender ? (
                            <span>
                               <span className="text-slate-500 dark:text-slate-400 font-normal">To </span> {toName}
                            </span>
                         ) : (
                            <span>
                               <span className="text-slate-500 dark:text-slate-400 font-normal">From </span> {fromName}
                            </span>
                         )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                         <Calendar className="w-3 h-3" /> {item.reportDate}
                         {item.orderNumber && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-mono">{item.orderNumber}</span>}
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <ApprovalBadge s={item.approvalStatus} />
                  {item.approvalStatus === ApprovalStatus.APPROVED && (
                    <>
                        <PriorityBadge p={item.priority} />
                        <StatusBadge s={item.resolutionStatus} />
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fault Description</h4>
                      <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed">{item.faultDescription}</p>
                   </div>
                   
                   {(item.feedbackContent || item.additionalNotes) && (
                     <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        {item.feedbackContent && (
                          <div className="mb-3">
                             <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Feedback</h4>
                             <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{item.feedbackContent}</p>
                          </div>
                        )}
                        {item.additionalNotes && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/50">
                             <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Notes</h4>
                             <p className="text-slate-500 dark:text-slate-400 text-xs italic">{item.additionalNotes}</p>
                          </div>
                        )}
                     </div>
                   )}
                   
                   {/* AI Analysis Block - Only for Approved */}
                   {(isManagerOrAdmin || (item.aiAnalysis && item.approvalStatus === ApprovalStatus.APPROVED)) && (
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 p-4">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                               <BrainCircuit className="w-3.5 h-3.5" />
                               AI Executive Summary
                            </h4>
                            {isManagerOrAdmin && !item.aiAnalysis && item.approvalStatus !== ApprovalStatus.REJECTED && (
                               <Button 
                                 variant="ghost" 
                                 onClick={() => handleAnalyze(item)}
                                 isLoading={analyzingIds.has(item.id)}
                                 className="text-xs py-1 h-auto bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                               >
                                 Generate Analysis
                               </Button>
                            )}
                         </div>
                         {item.aiAnalysis ? (
                            <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed italic">{item.aiAnalysis}</p>
                         ) : (
                            isManagerOrAdmin && <p className="text-xs text-indigo-300 dark:text-indigo-500">No analysis generated yet.</p>
                         )}
                      </div>
                   )}
                </div>

                {/* Sidebar Metadata */}
                <div className="lg:col-span-1 border-l border-slate-100 dark:border-slate-800 pl-0 lg:pl-6 space-y-5">
                   <div>
                      <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Process Type</span>
                      <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700">
                         {item.processType}
                      </span>
                   </div>
                   
                   {item.scenarioTag && (
                     <div>
                        <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Scenario</span>
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                          <Tag className="w-3.5 h-3.5 mt-0.5 text-slate-400 dark:text-slate-500 shrink-0" /> 
                          {item.scenarioTag}
                        </div>
                     </div>
                   )}

                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Reference Info</span>
                      <div className="space-y-2 text-xs">
                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Case #</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{item.caseNumber || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Resolved Date</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{item.resolutionDate || 'Pending'}</span>
                         </div>
                      </div>
                   </div>

                   {/* Admin Controls */}
                   {isManagerOrAdmin && mode === 'all' && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                         {/* Approval Controls */}
                         <div className="flex gap-2 mb-2">
                             <Button
                                onClick={() => updateApproval(item, ApprovalStatus.APPROVED)}
                                disabled={item.approvalStatus === ApprovalStatus.APPROVED}
                                className={`flex-1 text-xs justify-center ${item.approvalStatus === ApprovalStatus.APPROVED ? 'opacity-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                             >
                                <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                             </Button>
                             <Button
                                onClick={() => updateApproval(item, ApprovalStatus.REJECTED)}
                                disabled={item.approvalStatus === ApprovalStatus.REJECTED}
                                variant="secondary"
                                className={`flex-1 text-xs justify-center ${item.approvalStatus === ApprovalStatus.REJECTED ? 'opacity-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                             >
                                <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
                             </Button>
                         </div>

                         {/* Resolution Controls - Only if Approved */}
                         {item.approvalStatus === ApprovalStatus.APPROVED && (
                            <>
                                {item.resolutionStatus !== ResolutionStatus.CLOSED_RESOLVED ? (
                                    <Button 
                                       onClick={() => updateStatus(item, ResolutionStatus.CLOSED_RESOLVED)}
                                       className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                       <Check className="w-3.5 h-3.5 mr-1.5" /> Mark Resolved
                                    </Button>
                                ) : (
                                    <Button 
                                       onClick={() => updateStatus(item, ResolutionStatus.IN_PROGRESS)}
                                       variant="secondary"
                                       className="w-full text-xs justify-center"
                                    >
                                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Re-open Case
                                    </Button>
                                )}
                            </>
                         )}
                      </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};