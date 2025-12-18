
import React, { useState, useEffect } from 'react';
import { User, UserRole, Announcement, AnnouncementType } from '../types';
import { storageService } from '../services/storageService';
import { Megaphone, Plus, Trash2, Calendar, AlertCircle, Info, Trophy, Wrench, Shield, X, Type, LayoutList, LayoutGrid, Rows } from 'lucide-react';
import { Button } from './Button';

interface AnnouncementsProps {
  currentUser: User;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string, icon: any, color: string, bg: string, border: string }> = {
  GENERAL: { 
    label: 'General', 
    icon: Info, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  ALERT: { 
    label: 'Alert', 
    icon: AlertCircle, 
    color: 'text-red-600 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  },
  SUCCESS: { 
    label: 'Success', 
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
    label: 'Policy', 
    icon: Shield, 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800'
  }
};

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red', value: 'text-red-600 dark:text-red-400' },
  { label: 'Blue', value: 'text-blue-600 dark:text-blue-400' },
  { label: 'Green', value: 'text-green-600 dark:text-green-400' },
  { label: 'Purple', value: 'text-purple-600 dark:text-purple-400' },
];

type ViewMode = 'list' | 'grid' | 'details';

export const Announcements: React.FC<AnnouncementsProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [isImportant, setIsImportant] = useState(false);
  
  const [textColor, setTextColor] = useState('');
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg'>('base');

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    loadAnnouncements();
    const savedView = localStorage.getItem('announcements_view_mode');
    if (savedView) {
        setViewMode(savedView as ViewMode);
    }
  }, []);

  const changeViewMode = (mode: ViewMode) => {
      setViewMode(mode);
      localStorage.setItem('announcements_view_mode', mode);
  }

  const loadAnnouncements = async () => {
    const data = await storageService.getAnnouncements();
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
      type,
      textColor,
      textSize
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

    setIsCreating(false);
    setTitle('');
    setContent('');
    setType('GENERAL');
    setIsImportant(false);
    setTextColor('');
    setTextSize('base');
    
    loadAnnouncements();
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setAnnouncements(prev => prev.filter(a => a.id !== deleteId));
    await storageService.deleteAnnouncement(deleteId);
    setDeleteId(null);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
               <Megaphone className="w-8 h-8 text-white" />
           </div>
           <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">News & Updates</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Keep the team aligned with the latest information.</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={() => changeViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  title="List View"
                >
                    <LayoutList className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => changeViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  title="Grid View (Icons)"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => changeViewMode('details')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'details' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  title="Details View"
                >
                    <Rows className="w-4 h-4" />
                </button>
            </div>

            {isManager && !isCreating && (
              <button 
                onClick={() => setIsCreating(true)} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 whitespace-nowrap text-sm font-black uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Post Update
              </button>
            )}
        </div>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
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
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-1">
                 <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Style</label>
                 <div className="flex flex-wrap gap-2">
                    {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map((t) => {
                       const cfg = TYPE_CONFIG[t];
                       const Icon = cfg.icon;
                       const isSelected = type === t;
                       return (
                         <button
                           key={t}
                           type="button"
                           onClick={() => setType(t)}
                           className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                              isSelected 
                                ? `bg-indigo-600 text-white shadow-md` 
                                : `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`
                           }`}
                         >
                           <Icon className="w-3 h-3" />
                           {cfg.label}
                         </button>
                       );
                    })}
                 </div>
              </div>
              <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isImportant} 
                        onChange={e => setIsImportant(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Mark Important</span>
                  </label>
              </div>
            </div>

            <div className="mb-6">
               <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Headline</label>
               <input 
                 type="text" 
                 value={title} 
                 onChange={e => setTitle(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="Title of update..."
                 required
               />
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-t-xl border border-slate-200 dark:border-slate-700 border-b-0">
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Text Tint</span>
                 <div className="flex gap-1">
                   {TEXT_COLORS.map((c) => (
                     <button
                       key={c.label}
                       type="button"
                       onClick={() => setTextColor(c.value)}
                       className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 ${c.value ? c.value.split(' ')[0].replace('text-', 'bg-') : 'bg-slate-800 dark:bg-slate-200'} ${textColor === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                       title={c.label}
                     />
                   ))}
                 </div>
               </div>
               <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Type Size</span>
                  <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {(['sm', 'base', 'lg'] as const).map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setTextSize(size)}
                          className={`px-3 py-1 text-xs font-black border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${textSize === size ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                           {size === 'sm' ? 'S' : size === 'base' ? 'M' : 'L'}
                        </button>
                      ))}
                  </div>
               </div>
            </div>

            <div className="mb-6 relative">
               <textarea 
                 rows={6}
                 value={content} 
                 onChange={e => setContent(e.target.value)}
                 className={`w-full px-4 py-3 rounded-b-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed ${textColor} ${textSize === 'lg' ? 'text-lg' : textSize === 'sm' ? 'text-sm' : 'text-base'}`}
                 placeholder="Write your update details here..."
                 required
               />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="px-8 rounded-xl font-black uppercase text-xs tracking-widest">Publish</Button>
            </div>
          </form>
        </div>
      )}

      <div className={`w-full ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
         {announcements.length === 0 ? (
           <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
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
             
             if (viewMode === 'list') {
                 return (
                    <div 
                        key={item.id}
                        className="group bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                        {item.isImportant && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse"></div>
                        )}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
                            <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</h3>
                                {item.isImportant && (
                                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded">Urgent</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-4">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">{config.label}:</span>
                                {item.content}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                             <div className="hidden sm:flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                    {item.authorName.charAt(0)}
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{item.authorName}</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span>{formatTime(item.timestamp)}</span>
                             </div>
                             {isManager && (
                               <button onClick={(e) => confirmDelete(e, item.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
                             )}
                        </div>
                    </div>
                 );
             }

             if (viewMode === 'grid') {
                 return (
                    <div key={item.id} className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all flex flex-col relative">
                        {item.isImportant && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${config.bg} ${config.color}`}><TypeIcon className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 h-12 leading-tight">{item.title}</h3>
                        <p className={`text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1 ${item.textColor}`}>{item.content}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">{item.authorName.charAt(0)}</div>
                                <div className="flex flex-col">
                                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.authorName}</span>
                                     <span className="text-[10px] text-slate-400">{formatTime(item.timestamp)}</span>
                                </div>
                            </div>
                            {isManager && (
                               <button onClick={(e) => confirmDelete(e, item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             )}
                        </div>
                    </div>
                 );
             }

             return (
               <div key={item.id} className={`group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col`}>
                  <div className="p-6 md:p-8 relative">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-transparent ${config.bg} ${config.color}`}>
                               <TypeIcon className="w-3.5 h-3.5" /> {config.label}
                            </span>
                            {item.isImportant && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-900">
                                <AlertCircle className="w-3 h-3" /> Urgent
                              </span>
                            )}
                         </div>
                         {isManager && (
                           <button onClick={(e) => confirmDelete(e, item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete Announcement"><Trash2 className="w-5 h-5" /></button>
                         )}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-4">{item.title}</h3>
                      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mb-6">
                        <p className={`whitespace-pre-wrap leading-relaxed ${item.textColor || 'text-slate-600 dark:text-slate-300'} ${item.textSize === 'lg' ? 'text-lg' : item.textSize === 'sm' ? 'text-sm' : 'text-base'}`}>{item.content}</p>
                      </div>
                      <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-600 shadow-sm">{item.authorName.charAt(0)}</div>
                             <div>
                               <span className="block font-bold text-slate-900 dark:text-white">{item.authorName}</span>
                               <span className="block text-[10px] opacity-70">Author</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatTime(item.timestamp)}
                         </div>
                      </div>
                  </div>
               </div>
             );
           })
         )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto"><Trash2 className="w-6 h-6" /></div>
             <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Delete Announcement?</h3>
             <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to remove this update? This action cannot be undone.</p>
             <div className="flex gap-3">
               <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1 rounded-xl">Cancel</Button>
               <Button variant="danger" onClick={handleDelete} className="flex-1 rounded-xl">Delete</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
