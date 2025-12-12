
import React, { useState, useEffect } from 'react';
import { User, Note, NoteColor, NoteFontSize } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Search, PenLine, GripHorizontal, Type, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface StickyNotesProps {
  currentUser: User;
}

const COLORS: { [key in NoteColor]: string } = {
  yellow: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700',
  blue: 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700',
  green: 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100 border border-green-300 dark:border-green-700',
  pink: 'bg-pink-200 text-pink-900 dark:bg-pink-900 dark:text-pink-100 border border-pink-300 dark:border-pink-700',
  purple: 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-700',
  orange: 'bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-700',
};

const FONT_SIZES: { [key in NoteFontSize]: string } = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const StickyNotes: React.FC<StickyNotesProps> = ({ currentUser }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  
  // Modal State
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [currentUser]);

  const loadNotes = async () => {
    setIsLoading(true);
    const data = await storageService.getNotes(currentUser.id);
    setNotes(data.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    setIsLoading(false);
  };

  const getRandomColor = (): NoteColor => {
    const colors = Object.keys(COLORS) as NoteColor[];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: '',
      content: '',
      color: getRandomColor(),
      fontSize: 'base',
      orderIndex: notes.length,
      timestamp: Date.now()
    };
    await storageService.saveNote(newNote);
    setNotes([...notes, newNote]);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotes(updatedNotes);
    
    const noteToSave = updatedNotes.find(n => n.id === id);
    if (noteToSave) {
        await storageService.saveNote({ ...noteToSave, ...updates });
    }
  };

  const initiateDelete = (note: Note) => {
    setNoteToDelete(note);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    await storageService.deleteNote(noteToDelete.id);
    setNotes(notes.filter(n => n.id !== noteToDelete.id));
    setNoteToDelete(null);
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetId) return;

    const currentNotes = [...notes];
    const oldIndex = currentNotes.findIndex(n => n.id === draggedNoteId);
    const newIndex = currentNotes.findIndex(n => n.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const [movedItem] = currentNotes.splice(oldIndex, 1);
    currentNotes.splice(newIndex, 0, movedItem);

    // Reassign order indices
    const updatedNotes = currentNotes.map((n, idx) => ({ ...n, orderIndex: idx }));
    setNotes(updatedNotes);
    setDraggedNoteId(null);

    // Persist new order
    updatedNotes.forEach(n => storageService.saveNote(n));
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <PenLine className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               My Notes
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             Drag to reorder. Customize colors and size.
           </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
             </div>
             <button 
                onClick={addNote}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 whitespace-nowrap"
             >
                <Plus className="w-4 h-4" /> New Note
             </button>
        </div>
      </div>

      {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3].map(i => (
                  <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
              ))}
          </div>
      ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <PenLine className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No notes yet.</p>
              <button onClick={addNote} className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline">Create your first note</button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredNotes.map((note) => (
                  <div 
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, note.id)}
                    className={`relative group rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 min-h-[300px] flex flex-col ${COLORS[note.color]} ${draggedNoteId === note.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                  >
                      {/* Drag Handle & Header */}
                      <div className="flex items-center justify-between p-3 pb-0 cursor-move opacity-50 group-hover:opacity-100 transition-opacity">
                         <GripHorizontal className="w-4 h-4 opacity-50" />
                         <div className="flex gap-1">
                            {(['sm', 'base', 'lg', 'xl'] as NoteFontSize[]).map(size => (
                                <button
                                  key={size}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      updateNote(note.id, { fontSize: size });
                                  }}
                                  className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-bold opacity-60 hover:opacity-100 ${note.fontSize === size ? 'bg-black/10 dark:bg-white/10 ring-1 ring-black/20 dark:ring-white/20' : ''}`}
                                  title={`Size: ${size}`}
                                >
                                  {size === 'sm' ? 'A' : size === 'base' ? 'A+' : size === 'lg' ? 'A++' : 'A#'}
                                </button>
                            ))}
                         </div>
                      </div>

                      <div className="p-5 pt-2 flex-1 flex flex-col">
                        {/* Title Input */}
                        <input 
                          type="text" 
                          value={note.title}
                          onMouseDown={(e) => e.stopPropagation()} // Allow text selection without drag
                          onChange={(e) => updateNote(note.id, { title: e.target.value })}
                          className="bg-transparent border-none text-lg font-bold placeholder-current/50 focus:ring-0 w-full mb-2 p-0 focus:outline-none"
                          placeholder="Title..."
                        />
                        
                        {/* Content Input */}
                        <textarea 
                          value={note.content}
                          onMouseDown={(e) => e.stopPropagation()} // Allow text selection without drag
                          onChange={(e) => updateNote(note.id, { content: e.target.value })}
                          className={`bg-transparent border-none flex-1 resize-none focus:ring-0 p-0 placeholder-current/50 leading-relaxed focus:outline-none scrollbar-none ${FONT_SIZES[note.fontSize || 'base']}`}
                          placeholder="Type your note here..."
                        />
                      </div>

                      {/* Footer Controls (Visible on Hover/Focus) */}
                      <div className="px-5 pb-4 pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1.5">
                              {(Object.keys(COLORS) as NoteColor[]).map(c => (
                                  <button
                                    key={c}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateNote(note.id, { color: c });
                                    }}
                                    className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 ${COLORS[c].split(' ')[0]} ${note.color === c ? 'ring-2 ring-black/20 dark:ring-white/30 scale-110' : ''}`}
                                    title={c}
                                  />
                              ))}
                          </div>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                initiateDelete(note);
                            }}
                            className="p-2 bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-full text-current transition-colors"
                            title="Delete"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle className="w-6 h-6" />
             </div>
             
             <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Note?</h3>
             
             <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
               Are you sure you want to delete this note? This action cannot be undone.
             </p>
             
             <div className="flex gap-3">
               <Button 
                 variant="secondary" 
                 onClick={() => setNoteToDelete(null)}
                 className="flex-1"
               >
                 Cancel
               </Button>
               <Button 
                 variant="danger" 
                 onClick={confirmDelete}
                 className="flex-1"
               >
                 Delete
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
