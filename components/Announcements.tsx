
import React, { useState, useEffect } from 'react';
import { User, UserRole, Announcement, AnnouncementType } from '../types';
import { storageService } from '../services/storageService';
import { Megaphone, Plus, Trash2, Calendar, User as UserIcon, AlertCircle, Info, Trophy, Wrench, CheckCircle2, Shield, X } from 'lucide-react';
import { Button } from './Button';

interface AnnouncementsProps {
  currentUser: User;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string, icon: any, color: string, bg: string, border: string }> = {
  GENERAL: { 
    label: 'General Update', 
    icon: Info, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  ALERT: { 
    label: 'Critical Alert', 
    icon: AlertCircle, 
    color: 'text-red-600 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  },
  SUCCESS: { 
    label: 'Team Success', 
    icon: Trophy, 
    color: 'text-green-600 dark:text-green-400', 
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800'
  },
  MAINTENANCE: { 
    label: 'Maintenance', 
    icon: Wrench, 
    color: 'text-orange-600 dark:text-orange-400', 
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800'
  },
  POLICY: { 
    label: 'Policy Change', 
    icon: Shield, 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800'
  }
};

export const Announcements: React.FC<AnnouncementsProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [isImportant, setIsImportant] = useState(false);

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const data = await storageService.getAnnouncements();
    // Sort by newest first, prioritizing important ones
    setAnnouncements(data.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return b.timestamp - a.timestamp;
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: Date.now(),
      isImportant,
      type
    };

    await storageService.saveAnnouncement(newAnnouncement);
    
    storageService.saveLog({
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CREATE_ANNOUNCEMENT',
      details: `Posted ${type} update: ${title}`,
      timestamp: Date.now()
    });

    // Reset Form
    setIsCreating(false);
    setTitle('');
    setContent('');
    setType('GENERAL');
    setIsImportant(false);
    
    // Refresh List
    loadAnnouncements();
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Optimistic Update
    setAnnouncements(prev => prev.filter(a => a.id !== deleteId));
    
    // Perform Delete
    await storageService.deleteAnnouncement(deleteId);
    
    storageService.saveLog({
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DELETE_ANNOUNCEMENT',
      details: `Deleted announcement ID: ${deleteId}`,
      timestamp: Date.now()
    });

    setDeleteId(null);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' 
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <Megaphone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               News & Updates
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Keep the team aligned with the latest information.</p>
        </div>
        
        {isManager && !isCreating && (
          <Button onClick={() => setIsCreating(true)} className="shadow-lg shadow-indigo-200 dark:shadow-none">
            <Plus className="w-4 h-4 mr-2" />
            Post Update
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <Plus className="w-5 h-5 text-indigo-500" />
               New Announcement
             </h3>
             <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
               <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleCreate}>
            
            {/* Type Selector */}
            <div className="mb-6">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Announcement Style</label>
               <div className="flex flex-wrap gap-3">
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map((t) => {
                     const cfg = TYPE_CONFIG[t];
                     const Icon = cfg.icon;
                     const isSelected = type === t;
                     return (
                       <button
                         key={t}
                         type="button"
                         onClick={() => setType(t)}
                         className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            isSelected 
                              ? `bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md transform scale-105` 
                              : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700`
                         }`}
                       >
                         <Icon className={`w-4 h-4 ${isSelected ? 'text-current' : cfg.color}`} />
                         {cfg.label}
                       </button>
                     );
                  })}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
                   <input 
                     type="text" 
                     value={title} 
                     onChange={e => setTitle(e.target.value)}
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                     placeholder="e.g. New Process for Returns"
                     required
                   />
                </div>
                <div className="flex items-end mb-1">
                   <label className="flex items-center gap-3 p-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isImportant} 
                        onChange={e => setIsImportant(e.target.checked)}
                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <div>
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">Mark Important</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Pins to top & adds badge</span>
                      </div>
                   </label>
                </div>
            </div>

            <div className="mb-6">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Content</label>
               <textarea 
                 rows={5}
                 value={content} 
                 onChange={e => setContent(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                 placeholder="Write your announcement details here..."
                 required
               />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" className="px-8">Publish Update</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6 max-w-4xl mx-auto">
         {announcements.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No announcements yet</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Managers can post updates here to keep the team informed about processes, wins, and alerts.
             </p>
           </div>
         ) : (
           announcements.map(item => {
             const config = TYPE_CONFIG[item.type || 'GENERAL'];
             const TypeIcon = config.icon;
             
             return (
               <div 
                 key={item.id} 
                 className={`group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border overflow-hidden ${config.border}`}
               >
                  {/* Important Stripe */}
                  {item.isImportant && (
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 z-10"></div>
                  )}

                  <div className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-4 gap-4">
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-transparent ${config.bg} ${config.color}`}>
                                  <TypeIcon className="w-3.5 h-3.5" /> {config.label}
                               </span>
                               {item.isImportant && (
                                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                                   <AlertCircle className="w-3 h-3" /> Urgent
                                 </span>
                               )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                              {item.title}
                            </h3>
                         </div>
                         
                         {isManager && (
                           <button 
                             onClick={(e) => confirmDelete(e, item.id)} 
                             className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                             title="Delete Announcement"
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                         )}
                      </div>
                      
                      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300 text-base">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                 {item.authorName.charAt(0)}
                               </div>
                               <span className="font-medium">{item.authorName}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatTime(item.timestamp)}
                         </div>
                      </div>
                  </div>
               </div>
             );
           })
         )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <Trash2 className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Delete Announcement?</h3>
             <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
               Are you sure you want to remove this update? This action cannot be undone.
             </p>
             <div className="flex gap-3">
               <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
