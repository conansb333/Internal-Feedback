import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note } from '../types';

// Minimal seed data - Only Admin to prevent lockout
const SEED_USERS: User[] = [
  { id: '1', username: 'root', name: 'Super User', role: UserRole.ADMIN, password: 'password' },
  { id: '2', username: 'manager', name: 'Team Manager', role: UserRole.MANAGER, password: 'password' },
  { id: '3', username: 'bob', name: 'Bob Smith', role: UserRole.USER, password: 'password' }
];

// Helper for local storage to ensure logs work even without DB table
const LOCAL_LOGS_KEY = 'audit_logs_backup';
const LOCAL_NOTES_KEY = 'user_notes_backup';

// SQL Scripts for Developer Reference / Console Logging
const CREATE_NOTES_SQL = `create table if not exists notes ( id text primary key, "userId" text not null, title text, content text, color text, "fontSize" text, "orderIndex" numeric, timestamp bigint );`;
const CREATE_LOGS_SQL = `create table if not exists audit_logs ( id text primary key, "userId" text not null, "userName" text, "userRole" text, action text, details text, timestamp bigint );`;

export const storageService = {
  initialize: async () => {
    try {
      // Check if data exists. Using a simple query to check connection and table existence.
      const { data, count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      
      if (error) {
        // If table doesn't exist (404) or other connection error
        console.error('Database Check Error:', JSON.stringify(error, null, 2));
        if (error.code === '42P01') {
            console.info('Tip: It looks like the "users" table is missing.');
        }
        return;
      }
      
      // Only seed if the table is completely empty
      if (count === 0) {
        console.log('Database empty. Seeding initial users...');
        const { error: usersError } = await supabase.from('users').insert(SEED_USERS);
        if (usersError) {
          console.error('Error seeding users:', JSON.stringify(usersError, null, 2));
        } else {
          console.log('Users seeded successfully.');
        }
      }
    } catch (error) {
      console.error('Initialization exception:', error);
    }
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', JSON.stringify(error, null, 2));
      return [];
    }
    return data || [];
  },

  saveUser: async (user: User) => {
    const { error } = await supabase.from('users').upsert(user);
    if (error) console.error('Error saving user:', JSON.stringify(error, null, 2));
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      // Manual Cascade: Delete feedbacks where this user is sender OR receiver
      await supabase.from('feedbacks').delete().eq('fromUserId', userId);
      await supabase.from('feedbacks').delete().eq('toUserId', userId);
      // Delete logs for this user to keep it clean (optional, but good for privacy)
      await supabase.from('audit_logs').delete().eq('userId', userId);
      // Delete notes
      await supabase.from('notes').delete().eq('userId', userId);

      // Finally delete the user
      const { error } = await supabase.from('users').delete().eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception during user deletion:', err);
      return false;
    }
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    const { data, error } = await supabase.from('feedbacks').select('*');
    if (error) {
      console.error('Error fetching feedbacks:', JSON.stringify(error, null, 2));
      return [];
    }
    return data || [];
  },

  saveFeedback: async (feedback: Feedback) => {
    const { error } = await supabase.from('feedbacks').upsert(feedback);
    if (error) console.error('Error saving feedback:', JSON.stringify(error, null, 2));
  },

  // Audit Log Methods
  getLogs: async (): Promise<AuditLog[]> => {
    let dbLogs: AuditLog[] = [];
    let localLogs: AuditLog[] = [];

    // 1. Try DB
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500); // Limit to recent 500 actions
      
    if (!error && data) {
      dbLogs = data;
    } else {
      if (error?.code === '42P01') {
          console.warn('MISSING TABLE "audit_logs". Run this SQL in Supabase:', CREATE_LOGS_SQL);
      }
      console.warn('Could not fetch DB logs (table might be missing), checking local backup.', error?.message);
    }

    // 2. Try Local
    try {
      const stored = localStorage.getItem(LOCAL_LOGS_KEY);
      if (stored) {
        localLogs = JSON.parse(stored);
      }
    } catch (e) { console.error('Local log parse error', e); }

    // 3. Merge and Sort
    const allLogs = [...dbLogs, ...localLogs];
    // Remove duplicates based on ID
    const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
    
    return uniqueLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 500);
  },

  saveLog: async (log: AuditLog) => {
    // 1. Try DB (Fire and Forget)
    supabase.from('audit_logs').insert(log).then(({ error }) => {
      if (error) {
          if (error.code === '42P01') {
             console.warn('MISSING TABLE "audit_logs". Cannot save log to DB. Run SQL:', CREATE_LOGS_SQL);
          } else {
             console.warn('DB Log insert failed, relying on local backup:', error.message);
          }
      }
    });

    // 2. Save Local (Backup)
    try {
        const stored = localStorage.getItem(LOCAL_LOGS_KEY);
        let logs: AuditLog[] = stored ? JSON.parse(stored) : [];
        logs.unshift(log); // Add to beginning
        if (logs.length > 500) logs = logs.slice(0, 500); // Limit local storage
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to save log locally', e);
    }
  },

  // Notes Methods
  getNotes: async (userId: string): Promise<Note[]> => {
    let dbNotes: Note[] = [];
    let localNotes: Note[] = [];

    // 1. Try DB
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('userId', userId);
    
    if (!error && data) {
      dbNotes = data;
    } else if (error) {
        if (error.code === '42P01') {
            console.warn('MISSING TABLE "notes". Run this SQL in Supabase:', CREATE_NOTES_SQL);
        }
    }

    // 2. Try Local
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Note[];
        localNotes = parsed.filter(n => n.userId === userId);
      }
    } catch (e) {}

    // Merge: Prefer DB if available, else local.
    const allNotes = [...dbNotes, ...localNotes];
    const uniqueNotes = Array.from(new Map(allNotes.map(item => [item.id, item])).values());
    
    // Sort by orderIndex if present, otherwise by timestamp
    return uniqueNotes.sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return b.timestamp - a.timestamp;
    });
  },

  saveNote: async (note: Note) => {
    // 1. Try DB
    const { error } = await supabase.from('notes').upsert(note);
    if (error) {
        if (error.code === '42P01') {
            console.warn('MISSING TABLE "notes". Run this SQL:', CREATE_NOTES_SQL);
        } else {
            console.warn('DB Note insert failed, using local backup', error);
        }
    }

    // 2. Save Local
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      let notes: Note[] = stored ? JSON.parse(stored) : [];
      // Update or insert
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) {
        notes[idx] = note;
      } else {
        notes.push(note);
      }
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
    } catch (e) { console.error('Local note save failed', e); }
  },

  deleteNote: async (noteId: string) => {
    // 1. Try DB
    await supabase.from('notes').delete().eq('id', noteId);

    // 2. Local
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      if (stored) {
        let notes: Note[] = JSON.parse(stored);
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
      }
    } catch (e) {}
  }
};

// Start init (async)
storageService.initialize();