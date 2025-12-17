
import React, { useState, useEffect } from 'react';
import { User, UserRole, Article } from '../types';
import { storageService } from '../services/storageService';
import { Book, Plus, Search, Tag, Calendar, Edit2, Trash2, ChevronRight, X, Save } from 'lucide-react';
import { Button } from './Button';

interface KnowledgeBaseProps {
  currentUser: User;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ currentUser }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Edit/Create Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Article>>({});

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, searchQuery]);

  const loadArticles = async () => {
    const data = await storageService.getArticles();
    setArticles(data);
    
    // Extract unique categories
    const cats = Array.from(new Set(data.map(a => a.category))).sort();
    setCategories(['All', ...cats]);
  };

  const filterArticles = () => {
    let result = articles;
    if (selectedCategory !== 'All') {
      result = result.filter(a => a.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q)
      );
    }
    setFilteredArticles(result);
  };

  const handleCreate = () => {
    setEditForm({
      category: 'General',
      title: '',
      content: ''
    });
    setSelectedArticle(null);
    setIsEditing(true);
  };

  const handleEdit = (article: Article) => {
    setEditForm({ ...article });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) return;

    const newArticle: Article = {
      id: editForm.id || Date.now().toString(),
      title: editForm.title,
      category: editForm.category || 'General',
      content: editForm.content,
      lastUpdated: Date.now(),
      authorId: editForm.authorId || currentUser.id,
      authorName: editForm.authorName || currentUser.name
    };

    await storageService.saveArticle(newArticle);
    
    // Log
    storageService.saveLog({
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: editForm.id ? 'UPDATE_ARTICLE' : 'CREATE_ARTICLE',
        details: `${editForm.id ? 'Updated' : 'Created'} article: ${newArticle.title}`,
        timestamp: Date.now()
    });

    await loadArticles();
    setIsEditing(false);
    setSelectedArticle(newArticle);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await storageService.deleteArticle(id);
      setSelectedArticle(null);
      loadArticles();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
               <Book className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
               Knowledge Hub
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             Delivery service guidelines, SLAs, and process documentation.
           </p>
        </div>
        
        {isManager && !isEditing && (
            <Button onClick={handleCreate} className="shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                New Article
            </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Sidebar / List - Fixed Mobile Visibility Logic */}
        <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-shrink-0 ${(selectedArticle || isEditing) ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search articles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                                selectedCategory === cat 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm italic">No articles found.</div>
                ) : (
                    filteredArticles.map(article => (
                        <button
                            key={article.id}
                            onClick={() => { setSelectedArticle(article); setIsEditing(false); }}
                            className={`w-full text-left p-3 rounded-xl transition-all border border-transparent ${
                                selectedArticle?.id === article.id 
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 shadow-sm' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <h4 className={`text-sm font-bold mb-1 ${selectedArticle?.id === article.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                {article.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {article.category}</span>
                                <ChevronRight className={`w-3 h-3 ${selectedArticle?.id === article.id ? 'text-indigo-400' : 'opacity-0'}`} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Article View / Editor */}
        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${(!selectedArticle && !isEditing) ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
            
            {!selectedArticle && !isEditing ? (
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Book className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Select an article to read</h3>
                    <p className="text-slate-400 text-sm">Or create a new one to document a process.</p>
                </div>
            ) : isEditing ? (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Edit2 className="w-4 h-4" /> {editForm.id ? 'Edit Article' : 'New Article'}
                        </h3>
                        <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input 
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                                placeholder="Article Title"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <input 
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.category}
                                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                                    placeholder="e.g. Processes"
                                    list="category-options"
                                />
                                <datalist id="category-options">
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
                            <textarea 
                                className="flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-mono text-sm min-h-[300px]"
                                value={editForm.content}
                                onChange={e => setEditForm({...editForm, content: e.target.value})}
                                placeholder="Write your documentation here..."
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" /> Save Article
                        </Button>
                    </div>
                </div>
            ) : selectedArticle ? (
                <div className="flex flex-col h-full relative">
                    {/* Article Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">
                                {selectedArticle.category}
                            </span>
                            <div className="flex items-center gap-2">
                                {isManager && (
                                    <>
                                        <button onClick={() => handleEdit(selectedArticle)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(selectedArticle.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedArticle(null)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {selectedArticle.title}
                        </h1>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Updated {formatTime(selectedArticle.lastUpdated)}
                            </span>
                            <span>•</span>
                            <span>Author: {selectedArticle.authorName}</span>
                        </div>
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-300">
                                {selectedArticle.content}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
};
