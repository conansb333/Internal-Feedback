import React, { useState, useEffect } from 'react';
import { User, Note, NoteColor, NoteFontSize } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Search, PenLine, GripHorizontal, Type } from 'lucide-react';

interface StickyNotesProps {
  currentUser: User;
}

const COLORS: { [key in NoteColor]: string } = {
  yellow: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-500/80 dark:text-yellow-950',
  blue: 'bg-blue-200 text-blue-900 dark:bg-blue-400/80 dark:text-blue-950',
  green: 'bg-green-200 text-green-900 dark:bg-green-400/80 dark:text-green-950',
  pink: 'bg-pink-200 text-pink-900 dark:bg-pink-400/80 dark:text-pink-950',
  purple: 'bg-purple-200 text-purple-900 dark:bg-purple-400/80 dark:text-purple-950',
  orange: 'bg-orange-200 text-orange-900 dark:bg-orange-400/80 dark:text-orange-950',
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

  useEffect(() => {
    loadNotes();
  }, [currentUser]);

  const loadNotes = async () => {
    setIsLoading(true);
    const data = await storageService.getNotes(currentUser.id);
    setNotes(data);
    setIsLoading(false);
  };

  const addNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: '',
      content: '',
      color: 'yellow',
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
    
    // Debounce save in real app, but here we save immediately on control interaction
    // For text inputs, it's better to debounce but we'll trust the user isn't spamming edits too fast
    const noteToSave = updatedNotes.find(n => n.id === id);
    if (noteToSave) {
        await storageService.saveNote(noteToSave);
    }
  };

  const deleteNote = async (id: string) => {
    await storageService.deleteNote(id);
    setNotes(notes.filter(n => n.id !== id));
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image hack if needed, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetId) return;

    const oldIndex = notes.findIndex(n => n.id === draggedNoteId);
    const newIndex = notes.findIndex(n => n.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newNotes = [...notes];
    const [movedItem] = newNotes.splice(oldIndex, 1);
    newNotes.splice(newIndex, 0, movedItem);

    // Reassign order indices
    const updatedNotes = newNotes.map((n, idx) => ({ ...n, orderIndex: idx }));
    setNotes(updatedNotes);
    setDraggedNoteId(null);

    // Persist new order
    // In production, use a batch update. Here we loop.
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
                         <GripHorizontal className="w-4 h-4 text-black/40" />
                         <div className="flex gap-1">
                            {(['sm', 'base', 'lg', 'xl'] as NoteFontSize[]).map(size => (
                                <button
                                  key={size}
                                  onClick={() => updateNote(note.id, { fontSize: size })}
                                  className={`p-1 rounded hover:bg-black/10 text-[10px] font-bold text-black/60 ${note.fontSize === size ? 'bg-black/10 ring-1 ring-black/20' : ''}`}
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
                          onChange={(e) => updateNote(note.id, { title: e.target.value })}
                          className="bg-transparent border-none text-lg font-bold placeholder-current/50 focus:ring-0 w-full mb-2 p-0 focus:outline-none"
                          placeholder="Title..."
                        />
                        
                        {/* Content Input */}
                        <textarea 
                          value={note.content}
                          onChange={(e) => updateNote(note.id, { content: e.target.value })}
                          className={`bg-transparent border-none flex-1 resize-none focus:ring-0 p-0 placeholder-current/50 leading-relaxed focus:outline-none ${FONT_SIZES[note.fontSize || 'base']}`}
                          placeholder="Type your note here..."
                        />
                      </div>

                      {/* Footer Controls (Visible on Hover/Focus) */}
                      <div className="px-5 pb-4 pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1.5">
                              {(Object.keys(COLORS) as NoteColor[]).map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateNote(note.id, { color: c })}
                                    className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 ${COLORS[c].split(' ')[0]} ${note.color === c ? 'ring-2 ring-black/20 scale-110' : ''}`}
                                    title={c}
                                  />
                              ))}
                          </div>
                          <button 
                            onClick={() => deleteNote(note.id)}
                            className="p-2 bg-black/5 hover:bg-black/10 rounded-full text-current transition-colors"
                            title="Delete"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                      
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/10 to-transparent rounded-bl-xl pointer-events-none opacity-50"></div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};