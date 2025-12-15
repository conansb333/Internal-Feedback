
import React, { useState, useEffect } from 'react';
import { User, Feedback, UserRole, ResolutionStatus, ApprovalStatus, Priority, PROCESS_TYPES } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { Check, Eye, Search, FileText, Calendar, Tag, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, ShieldAlert, FileSpreadsheet, Archive, ChevronDown, ChevronRight, Hash, AlertOctagon, User as UserIcon, Filter, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FeedbackListProps {
  currentUser: User;
  mode: 'all' | 'mine';
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ currentUser, mode }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters for "All Reports" mode
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [currentUser, mode]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const now = Date.now();

    const filtered = feedbacks.filter(f => {
      // 1. Text Search
      const uName = getUserName(f.toUserId).toLowerCase();
      const fName = getUserName(f.fromUserId).toLowerCase();
      const desc = f.faultDescription.toLowerCase();
      const order = f.orderNumber?.toLowerCase() || '';
      const matchesSearch = uName.includes(term) || fName.includes(term) || desc.includes(term) || order.includes(term);

      if (!matchesSearch) return false;

      // 2. Mode-specific Filters (Only for "All Reports")
      if (mode === 'all') {
        // Date Filter
        if (dateFilter === '7d') {
            const cutoff = now - (7 * 24 * 60 * 60 * 1000);
            if (f.timestamp < cutoff) return false;
        } else if (dateFilter === '30d') {
            const cutoff = now - (30 * 24 * 60 * 60 * 1000);
            if (f.timestamp < cutoff) return false;
        }

        // Type Filter
        if (typeFilter !== 'all') {
            if (f.processType !== typeFilter) return false;
        }
      }

      return true;
    });
    setFilteredFeedbacks(filtered);
  }, [searchTerm, feedbacks, dateFilter, typeFilter, mode]);

  const loadData = async () => {
    const allUsers = await storageService.getUsers();
    setUsers(allUsers);
    let allFeedbacks = await storageService.getFeedbacks();
    
    if (mode === 'mine') {
      allFeedbacks = allFeedbacks.filter(
        f => f.fromUserId === currentUser.id || (f.toUserId === currentUser.id && f.approvalStatus === ApprovalStatus.APPROVED)
      );
    }
    const sorted = allFeedbacks.sort((a, b) => b.timestamp - a.timestamp);
    setFeedbacks(sorted);
    setFilteredFeedbacks(sorted);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  
  const isManagerOrAdmin = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
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
    await storageService.saveFeedback({ 
      ...feedback, 
      approvalStatus: status,
      managerName: currentUser.name
    });
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

  // --- EXPORT FUNCTIONALITY ---
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'From', 'To', 'Type', 'Description', 'Priority', 'Approval', 'Status', 'Order #', 'Case #'];
    const rows = filteredFeedbacks.map(f => [
      f.id,
      f.reportDate,
      getUserName(f.fromUserId),
      getUserName(f.toUserId),
      f.processType,
      `"${f.faultDescription.replace(/"/g, '""')}"`,
      f.priority,
      f.approvalStatus,
      f.resolutionStatus,
      f.orderNumber || '',
      f.caseNumber || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(mode === 'all' ? 'All Feedback Reports' : 'My Feedback Reports', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Count: ${filteredFeedbacks.length}`, 14, 28);
    const tableColumn = ["Date", "From", "To", "Type", "Priority", "Status", "Description"];
    const tableRows = filteredFeedbacks.map(f => [
      f.reportDate,
      getUserName(f.fromUserId),
      getUserName(f.toUserId),
      f.processType,
      f.priority,
      f.approvalStatus,
      f.faultDescription.substring(0, 50) + (f.faultDescription.length > 50 ? '...' : '')
    ]);
    // @ts-ignore
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`feedback_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const PriorityBadge = ({ p }: { p: Priority }) => {
    const styles = {
      [Priority.HIGH]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50',
      [Priority.MEDIUM]: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50',
      [Priority.LOW]: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[p]}`}>
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
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[s]}`}>
        {s}
      </span>
    );
  };

  const ApprovalBadge = ({ s }: { s: ApprovalStatus }) => {
      if (s === ApprovalStatus.APPROVED) {
        return <span className="inline-flex items-center text-green-600 dark:text-green-400 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved</span>;
      }
      if (s === ApprovalStatus.PENDING) {
          return (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-900/50 dark:text-amber-400">
                  Pending
              </span>
          );
      }
      if (s === ApprovalStatus.REJECTED) {
          return (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  Rejected
              </span>
          );
      }
      return null;
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             {mode === 'all' ? (
               <ShieldAlert className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
             ) : (
               <Archive className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
             )}
             {mode === 'all' ? 'All Reports' : 'My Reports'}
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             Detailed view of all feedback records and statuses.
           </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <div className="relative flex-1 md:w-64">
                <input 
                    type="text" 
                    placeholder="Search all columns..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            {/* FILTERS: Only visible in 'All Reports' mode */}
            {mode === 'all' && (
                <>
                    <div className="relative md:w-40">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Any Date</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative md:w-48">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            {PROCESS_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </>
            )}
            
            <div className="flex gap-2">
                <Button 
                  onClick={handleExportCSV} 
                  variant="secondary" 
                  className="whitespace-nowrap h-[38px] px-4 py-2 text-sm !rounded-xl" 
                  title="Export CSV"
                >
                    <FileSpreadsheet className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">CSV</span>
                </Button>
                <Button 
                  onClick={handleExportPDF} 
                  variant="secondary" 
                  className="whitespace-nowrap h-[38px] px-4 py-2 text-sm !rounded-xl" 
                  title="Export PDF"
                >
                    <FileText className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">PDF</span>
                </Button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-4 w-10 text-center">#</th>
                <th className="px-4 py-4 whitespace-nowrap">Date</th>
                <th className="px-4 py-4 whitespace-nowrap">Entities</th>
                <th className="px-4 py-4 whitespace-nowrap">Reference</th>
                <th className="px-4 py-4">Context</th>
                <th className="px-4 py-4 whitespace-nowrap text-center">Priority</th>
                <th className="px-4 py-4 whitespace-nowrap text-center">Approval</th>
                <th className="px-4 py-4 whitespace-nowrap text-center">Status</th>
                <th className="px-4 py-4 whitespace-nowrap text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                     No reports found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredFeedbacks.map((item) => {
                  const isSender = item.fromUserId === currentUser.id;
                  let fromName = getUserName(item.fromUserId);
                  if (!isManagerOrAdmin && !isSender) fromName = "Anonymous";
                  const toName = getUserName(item.toUserId);
                  const isExpanded = expandedId === item.id;
                  const isRejected = item.approvalStatus === ApprovalStatus.REJECTED;

                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <td className="px-4 py-4 text-center">
                           <button className="text-slate-400 hover:text-indigo-500 transition-colors pointer-events-none">
                             {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                           </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                           {item.reportDate}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 w-8">From:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{fromName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 w-8">To:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{toName}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="flex flex-col gap-1">
                             {item.orderNumber && (
                               <div className="flex items-center gap-1.5" title="Order Number">
                                 <Hash className="w-3 h-3 text-slate-400" />
                                 <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{item.orderNumber}</span>
                               </div>
                             )}
                             {item.caseNumber && (
                               <div className="flex items-center gap-1.5" title="Case Number">
                                 <Briefcase className="w-3 h-3 text-slate-400" />
                                 <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.caseNumber}</span>
                               </div>
                             )}
                             {!item.orderNumber && !item.caseNumber && <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>}
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex flex-col gap-1.5">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{item.processType}</span>
                              {item.scenarioTag && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700 w-fit">
                                   <Tag className="w-3 h-3" /> {item.scenarioTag}
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                           <PriorityBadge p={item.priority} />
                        </td>
                        <td className="px-4 py-4 text-center">
                           <ApprovalBadge s={item.approvalStatus} />
                        </td>
                        <td className="px-4 py-4 text-center">
                           {item.approvalStatus === ApprovalStatus.APPROVED ? (
                              <StatusBadge s={item.resolutionStatus} />
                           ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                           )}
                        </td>
                        <td className="px-4 py-4 text-right">
                           <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              Details
                           </span>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS CARD */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                          <td colSpan={9} className="px-0 py-0 border-b border-slate-200 dark:border-slate-800">
                             <div className="p-6 md:p-8 bg-slate-50 dark:bg-black/20">
                                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    
                                    {/* Column 1: Incident Report */}
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                <AlertOctagon className="w-4 h-4 text-slate-500" />
                                                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Original Fault</h4>
                                            </div>
                                            <div className="p-5 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                                                {item.faultDescription}
                                            </div>
                                        </div>

                                        {(item.feedbackContent || item.additionalNotes) && (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                                {item.feedbackContent && (
                                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <FileText className="w-4 h-4 text-indigo-500" />
                                                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Constructive Feedback</h4>
                                                        </div>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{item.feedbackContent}</p>
                                                    </div>
                                                )}
                                                {item.additionalNotes && (
                                                    <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Tag className="w-3 h-3 text-slate-400" />
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advice & Suggestions</h4>
                                                        </div>
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm italic">{item.additionalNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 2: Management & Status */}
                                    <div className="space-y-6">
                                        
                                        {/* Manager Notes Card */}
                                        {(item.managerNoteToReporter || item.managerNoteToReceiver) ? (
                                             <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${isRejected ? 'border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30' : 'border-green-100 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/30'}`}>
                                                 <div className={`px-4 py-3 border-b flex items-center justify-between ${isRejected ? 'border-red-100 dark:border-red-900/30' : 'border-green-100 dark:border-green-900/30'}`}>
                                                     <h4 className={`text-sm font-bold flex items-center gap-2 ${isRejected ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                                         <MessageSquare className="w-4 h-4" />
                                                         {isRejected ? 'Rejection Details' : 'Manager Coaching'}
                                                     </h4>
                                                     <span className="text-[10px] uppercase font-bold text-slate-400">{item.managerName}</span>
                                                 </div>
                                                 
                                                 <div className="p-5 space-y-4">
                                                     {item.managerNoteToReporter && (isManagerOrAdmin || isSender) && (
                                                         <div>
                                                             <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Note to Reporter</span>
                                                             <p className="text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                 {item.managerNoteToReporter}
                                                             </p>
                                                         </div>
                                                     )}
                                                     {item.managerNoteToReceiver && (isManagerOrAdmin || !isSender) && (
                                                         <div>
                                                             <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Coaching for Subject</span>
                                                             <p className="text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                 {item.managerNoteToReceiver}
                                                             </p>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center text-slate-400 h-32 border-dashed">
                                                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                                                <span className="text-xs">No manager notes added yet.</span>
                                            </div>
                                        )}

                                        {/* Action Buttons (Manager Only) */}
                                        {isManagerOrAdmin && mode === 'all' && (
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Management Actions</h4>
                                                
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <Button 
                                                    onClick={() => updateApproval(item, ApprovalStatus.APPROVED)} 
                                                    disabled={item.approvalStatus === ApprovalStatus.APPROVED} 
                                                    className={`w-full justify-center text-xs ${item.approvalStatus === ApprovalStatus.APPROVED ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                                    >
                                                        <ThumbsUp className="w-3.5 h-3.5 mr-2" /> Approve
                                                    </Button>
                                                    <Button 
                                                    onClick={() => updateApproval(item, ApprovalStatus.REJECTED)} 
                                                    disabled={item.approvalStatus === ApprovalStatus.REJECTED} 
                                                    variant="danger"
                                                    className={`w-full justify-center text-xs ${item.approvalStatus === ApprovalStatus.REJECTED ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <ThumbsDown className="w-3.5 h-3.5 mr-2" /> Reject
                                                    </Button>
                                                </div>

                                                {item.approvalStatus === ApprovalStatus.APPROVED && (
                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                        {item.resolutionStatus !== ResolutionStatus.CLOSED_RESOLVED ? (
                                                            <Button onClick={() => updateStatus(item, ResolutionStatus.CLOSED_RESOLVED)} className="w-full justify-center text-xs bg-indigo-600 hover:bg-indigo-700">
                                                                <Check className="w-3.5 h-3.5 mr-2" /> Mark Resolved
                                                            </Button>
                                                        ) : (
                                                            <Button onClick={() => updateStatus(item, ResolutionStatus.IN_PROGRESS)} variant="secondary" className="w-full justify-center text-xs">
                                                                <Eye className="w-3.5 h-3.5 mr-2" /> Re-open
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
