import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog } from '../types';

// Minimal seed data - Only Admin to prevent lockout
const SEED_USERS: User[] = [
  { id: '1', username: 'root', name: 'Super User', role: UserRole.ADMIN, password: 'password' },
  { id: '2', username: 'manager', name: 'Team Manager', role: UserRole.MANAGER, password: 'password' },
  { id: '3', username: 'bob', name: 'Bob Smith', role: UserRole.USER, password: 'password' }
];

// Helper for local storage to ensure logs work even without DB table
const LOCAL_LOGS_KEY = 'audit_logs_backup';

export const storageService = {
  initialize: async () => {
    try {
      // Check if data exists. Using a simple query to check connection and table existence.
      const { data, count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      
      if (error) {
        // If table doesn't exist (404) or other connection error
        console.error('Database Check Error:', JSON.stringify(error, null, 2));
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
      console.warn('Could not fetch DB logs (table might be missing), checking local backup.', error);
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
      if (error) console.warn('DB Log insert failed, relying on local backup:', error.message);
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
  }
};

// Start init (async)
storageService.initialize();