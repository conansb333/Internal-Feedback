
import React, { useState, useEffect } from 'react';
import { User, Feedback, ResolutionStatus, ApprovalStatus, Priority, PROCESS_TYPES, SCENARIO_TAGS, ProcessType, ScenarioTag, Article } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Button } from './Button';
import { Send, CheckCircle2, User as UserIcon, Calendar, FileText, AlertOctagon, Hash, BookOpen, Sparkles, Lightbulb } from 'lucide-react';

interface SubmitFeedbackProps {
  currentUser: User;
  onSubmitted: () => void;
}

export const SubmitFeedback: React.FC<SubmitFeedbackProps> = ({ currentUser, onSubmitted }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachingTip, setCoachingTip] = useState<string | null>(null);

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
    const loadData = async () => {
        const allUsers = await storageService.getUsers();
        setUsers(allUsers.filter(u => u.id !== currentUser.id));
        const allArticles = await storageService.getArticles();
        setArticles(allArticles);
    };
    loadData();
  }, [currentUser.id]);

  // Derived: Relevant Articles based on Process Type
  const relevantArticles = articles.filter(a => 
      a.category.toLowerCase().includes(processType.toLowerCase()) || 
      a.title.toLowerCase().includes(processType.split(' ')[0].toLowerCase()) ||
      a.content.toLowerCase().includes(processType.toLowerCase())
  ).slice(0, 3);

  const handleAiCoach = async () => {
    if (!feedbackContent) return;
    setIsCoaching(true);
    const tip = await geminiService.coachFeedback(feedbackContent);
    setCoachingTip(tip);
    setIsCoaching(false);
  };

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
      approvalStatus: ApprovalStatus.PENDING, 
      priority,
      feedbackContent,
      additionalNotes,
      resolutionDate,
      timestamp: Date.now(),
    };
    
    await storageService.saveFeedback(newFeedback);
    
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
        setToUserId('');
        setOrderNumber('');
        setCaseNumber('');
        setFaultDescription('');
        setFeedbackContent('');
        setAdditionalNotes('');
        setResolutionDate('');
        setScenarioTag('');
        setCoachingTip(null);
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

  const inputLabel = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";
  const inputClass = "block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm";
  const sectionClass = "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6";
  const sectionHeaderClass = "text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
               <Send className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">New Report</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Document process issues or colleague feedback.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: FORM */}
            <div className="lg:col-span-2">
                <form onSubmit={handleSubmit}>
                    
                    {/* Subject & Time */}
                    <div className={sectionClass}>
                      <h3 className={sectionHeaderClass}>
                        <UserIcon className="w-5 h-5 text-indigo-500" />
                        Subject & Time
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={inputLabel}>Colleague Name *</label>
                          <select required value={toUserId} onChange={(e) => setToUserId(e.target.value)} className={inputClass}>
                            <option value="">Select a colleague...</option>
                            {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className={inputLabel}>Report Date *</label>
                          <div className="relative">
                            <input type="date" required value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputClass} />
                            <Calendar className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Case ID */}
                    <div className={sectionClass}>
                      <h3 className={sectionHeaderClass}>
                        <Hash className="w-5 h-5 text-indigo-500" />
                        Case Identification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className={inputLabel}>Order Number</label>
                          <input type="text" inputMode="numeric" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 10239455" className={inputClass} />
                        </div>
                        <div>
                          <label className={inputLabel}>Case Number</label>
                          <input type="text" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="e.g. CASE-9928" className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={inputLabel}>Fault Description *</label>
                        <textarea required rows={2} value={faultDescription} onChange={(e) => setFaultDescription(e.target.value)} placeholder="Briefly describe the error or issue encountered..." className={inputClass} />
                      </div>
                    </div>

                    {/* Classification */}
                    <div className={sectionClass}>
                      <h3 className={sectionHeaderClass}>
                        <AlertOctagon className="w-5 h-5 text-indigo-500" />
                        Classification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className={inputLabel}>Process Type *</label>
                          <select value={processType} onChange={(e) => setProcessType(e.target.value as ProcessType)} className={inputClass}>
                            {PROCESS_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className={inputLabel}>Scenario Tag</label>
                          <select value={scenarioTag} onChange={(e) => setScenarioTag(e.target.value as ScenarioTag)} className={inputClass}>
                            <option value="">-- None --</option>
                            {SCENARIO_TAGS.map(tag => (<option key={tag} value={tag}>{tag}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={inputLabel}>Initial Status</label>
                          <select value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value as ResolutionStatus)} className={inputClass}>
                            {Object.values(ResolutionStatus).map(status => (<option key={status} value={status}>{status}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className={inputLabel}>Priority Level</label>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.values(Priority).map(p => (
                              <button key={p} type="button" onClick={() => setPriority(p)} className={`py-2 px-2 text-sm rounded-lg border transition-all ${priority === p ? p === Priority.HIGH ? 'bg-red-50 border-red-500 text-red-700 font-bold' : p === Priority.MEDIUM ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'bg-green-50 border-green-500 text-green-700 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Feedback & Coaching */}
                    <div className={sectionClass}>
                      <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-800 pb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          Detailed Feedback
                        </h3>
                        <Button type="button" variant="secondary" onClick={handleAiCoach} disabled={!feedbackContent || isCoaching} className="text-xs h-8 px-3">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-500" />
                            {isCoaching ? 'Analyzing...' : 'Check Tone'}
                        </Button>
                      </div>
                      
                      {coachingTip && (
                          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                              <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                              <div className="text-sm text-purple-800 dark:text-purple-200">
                                  <span className="font-bold block mb-1">AI Suggestion:</span>
                                  {coachingTip}
                              </div>
                          </div>
                      )}

                      <div className="mb-6 relative">
                        <textarea rows={6} value={feedbackContent} onChange={(e) => setFeedbackContent(e.target.value)} placeholder="Draft your thoughts here (e.g., 'John didn't follow the return process')." className={`${inputClass} leading-relaxed`} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={inputLabel}>Any Advice?</label>
                            <input type="text" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Advice or suggestions..." className={inputClass} />
                          </div>
                          <div>
                            <label className={inputLabel}>Resolution Date (Optional)</label>
                            <input type="date" value={resolutionDate} onChange={(e) => setResolutionDate(e.target.value)} className={inputClass} />
                          </div>
                      </div>
                    </div>

                    <div className={`${sectionClass} flex items-center justify-end gap-3 sticky bottom-0 z-20 border-t-2 border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]`}>
                      <Button type="button" variant="secondary" onClick={() => onSubmitted()} className="w-full md:w-auto">Cancel</Button>
                      <Button type="submit" disabled={!toUserId || !faultDescription || isSubmitting} isLoading={isSubmitting} className="w-full md:w-auto shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Send className="w-4 h-4 mr-2" /> Submit Report
                      </Button>
                    </div>
                </form>
            </div>

            {/* RIGHT COLUMN: KNOWLEDGE CONTEXT */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
                <div className="sticky top-4">
                    <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden mb-6">
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" /> Knowledge Check
                            </h4>
                            <p className="text-indigo-200 text-sm mb-4">
                                Before submitting, verify the process for <span className="font-bold text-white">"{processType}"</span>.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    </div>

                    {relevantArticles.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Relevant Guides</h5>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {relevantArticles.map(article => (
                                    <div key={article.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <h6 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">{article.title}</h6>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-2">{article.content}</p>
                                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] rounded uppercase font-bold">
                                            {article.category}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-400 text-sm">
                            No specific articles found for this process type.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
