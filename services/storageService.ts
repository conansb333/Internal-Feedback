
import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note, Announcement, ApprovalStatus } from '../types';

// Minimal seed data - Only Admin to prevent lockout
const SEED_USERS: User[] = [
  { id: '1', username: 'root', name: 'Super User', role: UserRole.ADMIN, password: 'password' },
  { id: '2', username: 'manager', name: 'Team Manager', role: UserRole.MANAGER, password: 'password' },
  { id: '3', username: 'bob', name: 'Bob Smith', role: UserRole.USER, password: 'password' }
];

// Helper for local storage
const LOCAL_USERS_KEY = 'app_users_backup';
const LOCAL_FEEDBACKS_KEY = 'app_feedbacks_backup';
const LOCAL_LOGS_KEY = 'audit_logs_backup';
const LOCAL_NOTES_KEY = 'user_notes_backup';
const LOCAL_ANNOUNCEMENTS_KEY = 'app_announcements_backup';

// SQL Scripts for Developer Reference / Console Logging
const CREATE_NOTES_SQL = `create table if not exists notes ( id text primary key, "userId" text not null, title text, content text, color text, "fontSize" text, "orderIndex" numeric, timestamp bigint );`;
const CREATE_LOGS_SQL = `create table if not exists audit_logs ( id text primary key, "userId" text not null, "userName" text, "userRole" text, action text, details text, timestamp bigint );`;
const CREATE_ANNOUNCEMENTS_SQL = `create table if not exists announcements ( id text primary key, title text, content text, "authorId" text, "authorName" text, timestamp bigint, "isImportant" boolean, type text );`;

export const storageService = {
  initialize: async () => {
    // 1. Initialize Local Storage with Seed Data if empty
    if (!localStorage.getItem(LOCAL_USERS_KEY)) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(LOCAL_FEEDBACKS_KEY)) {
      localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify([]));
    }

    // 2. Try Database Connection
    try {
      // Check if data exists. Using a simple query to check connection and table existence.
      const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      
      if (error) {
        console.warn('Database Connection Warning:', error.message || error);
        console.info('Switching to Offline/Local Storage Mode.');
        return;
      }
      
      // Only seed DB if the table is completely empty and connection worked
      if (count === 0) {
        console.log('Database empty. Seeding initial users...');
        await supabase.from('users').insert(SEED_USERS);
      }
    } catch (error) {
      console.warn('Database Connection Exception (Offline Mode):', error);
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      // Try DB first
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        // Sync to local backup on successful fetch
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      // Ignore network errors
    }
    // Fallback to local
    const local = localStorage.getItem(LOCAL_USERS_KEY);
    return local ? JSON.parse(local) : SEED_USERS;
  },

  saveUser: async (user: User) => {
    // 1. Save Local (Optimistic update)
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const index = localUsers.findIndex((u: User) => u.id === user.id);
    if (index >= 0) localUsers[index] = user;
    else localUsers.push(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

    // 2. Try DB
    try { await supabase.from('users').upsert(user); } catch (e) { console.warn('DB Save failed, saved locally'); }
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    // 1. Delete Local
    try {
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      const filtered = localUsers.filter((u: User) => u.id !== userId);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(filtered));
      
      // Clean up related local data
      const localFeedbacks = JSON.parse(localStorage.getItem(LOCAL_FEEDBACKS_KEY) || '[]');
      const cleanFeedbacks = localFeedbacks.filter((f: Feedback) => f.fromUserId !== userId && f.toUserId !== userId);
      localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(cleanFeedbacks));
    } catch (e) { console.error('Local delete failed', e); }

    // 2. Try DB
    try {
      await supabase.from('feedbacks').delete().eq('fromUserId', userId);
      await supabase.from('feedbacks').delete().eq('toUserId', userId);
      await supabase.from('audit_logs').delete().eq('userId', userId);
      await supabase.from('notes').delete().eq('userId', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('DB delete failed (likely offline):', err);
      return true; // Return true as local succeeded
    }
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    let dbData: Feedback[] = [];
    
    // 1. Try Fetch from DB
    try {
      const { data, error } = await supabase.from('feedbacks').select('*');
      if (!error && data) dbData = data;
    } catch (e) {}
    
    // 2. Get Local Data
    const localStr = localStorage.getItem(LOCAL_FEEDBACKS_KEY);
    const localData: Feedback[] = localStr ? JSON.parse(localStr) : [];

    // 3. Smart Merge Strategy
    // The goal is to preserve local changes (like Approval Status) if the DB write failed 
    // or if the DB schema is missing the new columns.
    
    const localMap = new Map(localData.map(item => [item.id, item]));
    const mergedMap = new Map<string, Feedback>();

    // Process DB items first
    dbData.forEach(remoteItem => {
        const localItem = localMap.get(remoteItem.id);
        
        if (localItem) {
            // Conflict Resolution:
            // If local has a meaningful status (Approved/Rejected) and remote is still 'Pending' (or missing),
            // it implies the remote didn't accept the update. Trust Local.
            const remotePending = !remoteItem.approvalStatus || remoteItem.approvalStatus === ApprovalStatus.PENDING;
            const localDecided = localItem.approvalStatus === ApprovalStatus.APPROVED || localItem.approvalStatus === ApprovalStatus.REJECTED;

            if (localDecided && remotePending) {
                mergedMap.set(remoteItem.id, localItem);
            } else {
                // Otherwise, perform a shallow merge, prioritizing remote values for basic fields, 
                // but keeping local fields if remote is missing them.
                mergedMap.set(remoteItem.id, { ...localItem, ...remoteItem });
            }
        } else {
            // New item from DB (not in local)
            mergedMap.set(remoteItem.id, remoteItem);
        }
        localMap.delete(remoteItem.id);
    });

    // Add remaining local-only items (not synced to DB yet)
    localMap.forEach((val, key) => {
        mergedMap.set(key, val);
    });

    const merged = Array.from(mergedMap.values());
    
    // 4. Update Local Storage with the merged result to stay in sync
    localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(merged));
    
    return merged;
  },

  saveFeedback: async (feedback: Feedback) => {
    // 1. Save Local
    const localData = JSON.parse(localStorage.getItem(LOCAL_FEEDBACKS_KEY) || '[]');
    const index = localData.findIndex((f: Feedback) => f.id === feedback.id);
    if (index >= 0) localData[index] = feedback;
    else localData.push(feedback);
    localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(localData));

    // 2. Try DB
    try { await supabase.from('feedbacks').upsert(feedback); } catch (e) { console.warn('DB Feedback save failed'); }
  },

  // Audit Log Methods
  getLogs: async (): Promise<AuditLog[]> => {
    let dbLogs: AuditLog[] = [];
    let localLogs: AuditLog[] = [];

    // 1. Try DB
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);
        
      if (!error && data) {
        dbLogs = data;
      } else if (error?.code === '42P01') {
        console.warn('MISSING TABLE "audit_logs". Run SQL:', CREATE_LOGS_SQL);
      }
    } catch (e) {}

    // 2. Try Local
    try {
      const stored = localStorage.getItem(LOCAL_LOGS_KEY);
      if (stored) {
        localLogs = JSON.parse(stored);
      }
    } catch (e) {}

    // 3. Merge and Sort
    const allLogs = [...dbLogs, ...localLogs];
    const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
    
    return uniqueLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 500);
  },

  saveLog: async (log: AuditLog) => {
    // 1. Save Local (Primary for offline robustness)
    try {
        const stored = localStorage.getItem(LOCAL_LOGS_KEY);
        let logs: AuditLog[] = stored ? JSON.parse(stored) : [];
        logs.unshift(log); 
        if (logs.length > 500) logs = logs.slice(0, 500);
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to save log locally', e);
    }

    // 2. Try DB
    try {
      supabase.from('audit_logs').insert(log).then(({ error }) => {
        if (error && error.code === '42P01') {
             console.warn('MISSING TABLE "audit_logs". Run SQL:', CREATE_LOGS_SQL);
        }
      });
    } catch (e) {}
  },

  // Notes Methods
  getNotes: async (userId: string): Promise<Note[]> => {
    let dbNotes: Note[] = [];
    let localNotes: Note[] = [];

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('userId', userId);
      
      if (!error && data) {
        dbNotes = data;
      } else if (error?.code === '42P01') {
          console.warn('MISSING TABLE "notes". Run SQL:', CREATE_NOTES_SQL);
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Note[];
        localNotes = parsed.filter(n => n.userId === userId);
      }
    } catch (e) {}

    const allNotes = [...dbNotes, ...localNotes];
    const uniqueNotes = Array.from(new Map(allNotes.map(item => [item.id, item])).values());
    
    return uniqueNotes.sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return b.timestamp - a.timestamp;
    });
  },

  saveNote: async (note: Note) => {
    // 1. Save Local
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      let notes: Note[] = stored ? JSON.parse(stored) : [];
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) {
        notes[idx] = note;
      } else {
        notes.push(note);
      }
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {}

    // 2. Try DB
    try {
      const { error } = await supabase.from('notes').upsert(note);
      if (error?.code === '42P01') {
          console.warn('MISSING TABLE "notes". Run SQL:', CREATE_NOTES_SQL);
      }
    } catch(e) {}
  },

  deleteNote: async (noteId: string) => {
    // 1. Local
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      if (stored) {
        let notes: Note[] = JSON.parse(stored);
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
      }
    } catch (e) {}

    // 2. DB
    try { await supabase.from('notes').delete().eq('id', noteId); } catch(e) {}
  },

  // Announcement Methods
  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const { data, error } = await supabase.from('announcements').select('*');
      if (!error && data) {
        localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(data));
        return data;
      }
    } catch(e) {}

    const local = localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
    return local ? JSON.parse(local) : [];
  },

  saveAnnouncement: async (announcement: Announcement) => {
     // 1. Local
     const stored = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
     stored.push(announcement);
     localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(stored));

     // 2. DB
     try {
       const { error } = await supabase.from('announcements').insert(announcement);
       if (error && error.code === '42P01') {
          console.warn('MISSING TABLE "announcements". Run SQL:', CREATE_ANNOUNCEMENTS_SQL);
       }
     } catch(e) {}
  },

  deleteAnnouncement: async (id: string) => {
     // 1. Local
     const stored = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
     const filtered = stored.filter((a: Announcement) => a.id !== id);
     localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(filtered));

     // 2. DB
     try { await supabase.from('announcements').delete().eq('id', id); } catch(e) {}
  }
};

// Start init (async)
storageService.initialize();
