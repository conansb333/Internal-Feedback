
import React, { useState, useEffect } from 'react';
import { User, Feedback, ResolutionStatus, ApprovalStatus, Priority, PROCESS_TYPES, SCENARIO_TAGS, ProcessType, ScenarioTag } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './Button';
import { Send, CheckCircle2, User as UserIcon, Calendar, FileText, AlertOctagon, Hash } from 'lucide-react';

interface SubmitFeedbackProps {
  currentUser: User;
  onSubmitted: () => void;
}

export const SubmitFeedback: React.FC<SubmitFeedbackProps> = ({ currentUser, onSubmitted }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [toUserId, setToUserId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [processType, setProcessType] = useState<ProcessType>(PROCESS_TYPES[0]);
  const [scenarioTag, setScenarioTag] = useState<ScenarioTag | ''>('');
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>(ResolutionStatus.OPEN);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');

  useEffect(() => {
    // Filter out current user
    const loadUsers = async () => {
        const allUsers = await storageService.getUsers();
        setUsers(allUsers.filter(u => u.id !== currentUser.id));
    };
    loadUsers();
  }, [currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newFeedback: Feedback = {
      id: Date.now().toString(),
      fromUserId: currentUser.id,
      toUserId,
      reportDate,
      orderNumber,
      caseNumber,
      faultDescription,
      processType,
      scenarioTag,
      resolutionStatus,
      approvalStatus: ApprovalStatus.PENDING, // Reports require Manager approval
      priority,
      feedbackContent,
      additionalNotes,
      resolutionDate,
      timestamp: Date.now(),
    };
    
    await storageService.saveFeedback(newFeedback);
    
    // Log Action
    const toUser = users.find(u => u.id === toUserId);
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SUBMIT_REPORT',
        details: `Submitted report regarding ${toUser?.name || 'Unknown'}. Type: ${processType}`,
        timestamp: Date.now()
    });

    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
        setIsSuccess(false);
        // Reset form
        setToUserId('');
        setOrderNumber('');
        setCaseNumber('');
        setFaultDescription('');
        setFeedbackContent('');
        setAdditionalNotes('');
        setResolutionDate('');
        setScenarioTag('');
        onSubmitted();
    }, 2000);
  };

  if (isSuccess) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">Report Submitted</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Your feedback has been sent for manager approval.</p>
          </div>
      )
  }

  // Helper styles for inputs
  const inputLabel = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";
  const inputClass = "block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm";
  const sectionClass = "bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6";
  const sectionHeaderClass = "text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Send className="w-6 h-6 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400" />
              Create Report
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Document process issues or colleague feedback.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
            
            {/* Section 1: Context */}
            <div className={sectionClass}>
              <h3 className={sectionHeaderClass}>
                <UserIcon className="w-5 h-5 text-indigo-500" />
                Subject & Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={inputLabel}>Colleague Name *</label>
                  <div className="relative">
                    <select 
                      required
                      value={toUserId}
                      onChange={(e) => setToUserId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select a colleague...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={inputLabel}>Report Date *</label>
                  <div className="relative">
                    <input 
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className={inputClass}
                    />
                    <Calendar className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Case Details */}
            <div className={sectionClass}>
              <h3 className={sectionHeaderClass}>
                <Hash className="w-5 h-5 text-indigo-500" />
                Case Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={inputLabel}>Order Number</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 10239455"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={inputLabel}>Case Number</label>
                  <input 
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g. CASE-9928"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={inputLabel}>Fault Description *</label>
                <textarea
                  required
                  rows={2}
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder="Briefly describe the error or issue encountered..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Section 3: Classification */}
            <div className={sectionClass}>
              <h3 className={sectionHeaderClass}>
                <AlertOctagon className="w-5 h-5 text-indigo-500" />
                Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={inputLabel}>Process Type *</label>
                  <select 
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value as ProcessType)}
                    className={inputClass}
                  >
                    {PROCESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={inputLabel}>Scenario Tag</label>
                  <select 
                    value={scenarioTag}
                    onChange={(e) => setScenarioTag(e.target.value as ScenarioTag)}
                    className={inputClass}
                  >
                    <option value="">-- None --</option>
                    {SCENARIO_TAGS.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={inputLabel}>Initial Status</label>
                  <select 
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as ResolutionStatus)}
                    className={inputClass}
                  >
                    {Object.values(ResolutionStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={inputLabel}>Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(Priority).map(p => (
                       <button
                         key={p}
                         type="button"
                         onClick={() => setPriority(p)}
                         className={`py-2 px-2 text-sm rounded-lg border transition-all ${
                           priority === p 
                             ? p === Priority.HIGH ? 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm dark:bg-red-900/30 dark:border-red-500 dark:text-red-300' 
                             : p === Priority.MEDIUM ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold shadow-sm dark:bg-orange-900/30 dark:border-orange-500 dark:text-orange-300'
                             : 'bg-green-50 border-green-500 text-green-700 font-bold shadow-sm dark:bg-green-900/30 dark:border-green-500 dark:text-green-300'
                             : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                         }`}
                       >
                         {p}
                       </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Detailed Feedback */}
            <div className={sectionClass}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-50 dark:border-slate-800 pb-2 gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Detailed Feedback
                </h3>
              </div>
              
              <div className="mb-6 relative">
                 <textarea
                  rows={6}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Draft your thoughts here (e.g., 'John didn't follow the return process')."
                  className={`${inputClass} leading-relaxed`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className={inputLabel}>Any Advice?</label>
                     <input 
                        type="text"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Advice or suggestions..."
                        className={inputClass}
                      />
                  </div>
                  <div>
                     <label className={inputLabel}>Resolution Date (Optional)</label>
                     <input 
                        type="date"
                        value={resolutionDate}
                        onChange={(e) => setResolutionDate(e.target.value)}
                        className={inputClass}
                      />
                  </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className={`${sectionClass} flex items-center justify-end gap-3 sticky bottom-0 z-20 border-t-2 border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]`}>
               <Button type="button" variant="secondary" onClick={() => onSubmitted()} className="w-full md:w-auto">Cancel</Button>
               <Button type="submit" disabled={!toUserId || !faultDescription || isSubmitting} isLoading={isSubmitting} className="w-full md:w-auto shadow-lg shadow-indigo-200 dark:shadow-none">
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            </div>
        </form>
      </div>
    </div>
  );
};
