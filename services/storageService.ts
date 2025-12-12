
import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note, Announcement, ApprovalStatus, Notification, NotificationType } from '../types';

// Minimal seed data - Only Admin to prevent lockout
// NOTE: Seed users are auto-approved
const SEED_USERS: User[] = [
  { id: '1', username: 'root', name: 'Super User', role: UserRole.ADMIN, password: 'password', isApproved: true },
  { id: '2', username: 'manager', name: 'Team Manager', role: UserRole.MANAGER, password: 'password', isApproved: true },
  { id: '3', username: 'bob', name: 'Bob Smith', role: UserRole.USER, password: 'password', isApproved: true }
];

// Helper for local storage
const LOCAL_USERS_KEY = 'app_users_backup';
const LOCAL_FEEDBACKS_KEY = 'app_feedbacks_backup';
const LOCAL_LOGS_KEY = 'audit_logs_backup';
const LOCAL_NOTES_KEY = 'user_notes_backup';
const LOCAL_ANNOUNCEMENTS_KEY = 'app_announcements_backup';
const LOCAL_NOTIFICATIONS_KEY = 'user_notifications_backup';

// SQL Scripts for Developer Reference / Console Logging
// Run these in your Supabase SQL Editor to ensure your database matches the app features.
// NOTE: "create policy if not exists" is not standard SQL, so we drop then create.
const SQL_SETUP_SCRIPT = `
-- 1. USERS TABLE
create table if not exists users (
  id text primary key,
  username text unique,
  name text,
  role text,
  password text,
  "isApproved" boolean default false
);
alter table users add column if not exists "isApproved" boolean default true;
alter table users enable row level security;
drop policy if exists "Public Access Users" on users;
create policy "Public Access Users" on users for all using (true);

-- 2. FEEDBACKS TABLE
create table if not exists feedbacks (
  id text primary key,
  "fromUserId" text,
  "toUserId" text,
  "reportDate" text,
  "processType" text,
  "faultDescription" text,
  "resolutionStatus" text,
  "approvalStatus" text default 'Pending',
  priority text,
  "feedbackContent" text,
  "additionalNotes" text,
  "resolutionDate" text,
  "managerNoteToReporter" text,
  "managerNoteToReceiver" text,
  "managerName" text,
  "scenarioTag" text,
  "orderNumber" text,
  "caseNumber" text,
  timestamp bigint
);
alter table feedbacks add column if not exists "approvalStatus" text default 'Pending';
alter table feedbacks add column if not exists "managerNoteToReporter" text;
alter table feedbacks add column if not exists "managerNoteToReceiver" text;
alter table feedbacks add column if not exists "managerName" text;
alter table feedbacks add column if not exists "scenarioTag" text;
alter table feedbacks add column if not exists "orderNumber" text;
alter table feedbacks add column if not exists "caseNumber" text;
alter table feedbacks enable row level security;
drop policy if exists "Public Access Feedbacks" on feedbacks;
create policy "Public Access Feedbacks" on feedbacks for all using (true);

-- 3. NOTES TABLE
create table if not exists notes (
  id text primary key,
  "userId" text not null,
  title text,
  content text,
  color text,
  "fontSize" text,
  "orderIndex" numeric,
  timestamp bigint
);
alter table notes enable row level security;
drop policy if exists "Public Access Notes" on notes;
create policy "Public Access Notes" on notes for all using (true);

-- 4. AUDIT LOGS TABLE
create table if not exists audit_logs (
  id text primary key,
  "userId" text not null,
  "userName" text,
  "userRole" text,
  action text,
  details text,
  timestamp bigint
);
alter table audit_logs enable row level security;
drop policy if exists "Public Access Logs" on audit_logs;
create policy "Public Access Logs" on audit_logs for all using (true);

-- 5. ANNOUNCEMENTS TABLE
create table if not exists announcements (
  id text primary key,
  title text,
  content text,
  "authorId" text,
  "authorName" text,
  timestamp bigint,
  "isImportant" boolean,
  type text,
  "textColor" text,
  "textSize" text
);
alter table announcements add column if not exists "textColor" text;
alter table announcements add column if not exists "textSize" text;
alter table announcements enable row level security;
drop policy if exists "Public Access Announcements" on announcements;
create policy "Public Access Announcements" on announcements for all using (true);

-- 6. NOTIFICATIONS TABLE
create table if not exists notifications (
  id text primary key,
  "userId" text not null,
  type text,
  title text,
  message text,
  "isRead" boolean default false,
  timestamp bigint
);
alter table notifications enable row level security;
drop policy if exists "Public Access Notifications" on notifications;
create policy "Public Access Notifications" on notifications for all using (true);
`;

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
        // Help developer by logging the SQL script if tables are missing
        if (error.code === '42P01') { // undefined_table
            console.log('%c RUN THIS SQL IN SUPABASE:', 'color: green; font-weight: bold;');
            console.log(SQL_SETUP_SCRIPT);
        }
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
    let dbUsers: User[] = [];
    let usedDB = false;
    
    // 1. Try DB first
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        dbUsers = data;
        usedDB = true;
      }
    } catch (e) {
      // Ignore network errors
    }

    // 2. Get Local Users for merging
    const localUsersStr = localStorage.getItem(LOCAL_USERS_KEY);
    const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : SEED_USERS;

    let finalUsers: User[] = [];

    if (usedDB) {
        // MERGE STRATEGY:
        // Use DB as source of truth, BUT if DB is missing 'isApproved' (undefined),
        // check if LocalStorage has that specific user marked as false.
        // This handles cases where DB schema hasn't been updated with the new column yet.
        finalUsers = dbUsers.map(dbUser => {
            const localMatch = localUsers.find(l => l.id === dbUser.id);
            if (dbUser.isApproved === undefined || dbUser.isApproved === null) {
                if (localMatch && localMatch.isApproved === false) {
                    return { ...dbUser, isApproved: false }; // Keep it pending if local says so
                }
            }
            return dbUser;
        });

        // Add any local users that aren't in DB yet (failed writes)
        const dbIds = new Set(dbUsers.map(u => u.id));
        const localOnly = localUsers.filter(u => !dbIds.has(u.id));
        finalUsers = [...finalUsers, ...localOnly];

        // Sync back to local
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(finalUsers));
    } else {
        finalUsers = localUsers;
    }

    // 3. RUNTIME MIGRATION & SAFETY
    return finalUsers.map((u: User) => {
        // Force approval for Admins and Managers
        if (u.role === UserRole.ADMIN || u.role === UserRole.MANAGER) {
            return { ...u, isApproved: true };
        }
        // For standard users, ONLY default to true if it is truly undefined/null AND we couldn't resolve it from local
        if (u.isApproved === undefined || u.isApproved === null) {
             return { ...u, isApproved: true };
        }
        return u;
    });
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
    const localMap = new Map(localData.map(item => [item.id, item]));
    const mergedMap = new Map<string, Feedback>();

    // Process DB items first
    dbData.forEach(remoteItem => {
        const localItem = localMap.get(remoteItem.id);
        
        if (localItem) {
            const remotePending = !remoteItem.approvalStatus || remoteItem.approvalStatus === ApprovalStatus.PENDING;
            const localDecided = localItem.approvalStatus === ApprovalStatus.APPROVED || localItem.approvalStatus === ApprovalStatus.REJECTED;

            if (localDecided && remotePending) {
                mergedMap.set(remoteItem.id, localItem);
            } else {
                mergedMap.set(remoteItem.id, { ...localItem, ...remoteItem });
            }
        } else {
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
    // 1. Logic to Check for State Changes (For Notifications)
    const existingFeedbacks: Feedback[] = JSON.parse(localStorage.getItem(LOCAL_FEEDBACKS_KEY) || '[]');
    const previous = existingFeedbacks.find(f => f.id === feedback.id);
    
    const isNew = !previous;
    const approvalChanged = previous && previous.approvalStatus !== feedback.approvalStatus;

    // 2. Save Local
    const index = existingFeedbacks.findIndex((f: Feedback) => f.id === feedback.id);
    if (index >= 0) existingFeedbacks[index] = feedback;
    else existingFeedbacks.push(feedback);
    localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(existingFeedbacks));

    // 3. Try DB
    try { await supabase.from('feedbacks').upsert(feedback); } catch (e) { console.warn('DB Feedback save failed'); }

    // 4. Generate Notifications
    try {
        if (isNew) {
            // Notify Managers
            const allUsers = await storageService.getUsers();
            const managers = allUsers.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
            
            for (const mgr of managers) {
                // Don't notify self if manager submits report
                if (mgr.id !== feedback.fromUserId) {
                    await storageService.saveNotification({
                        id: Date.now().toString() + Math.random().toString().slice(2, 6),
                        userId: mgr.id,
                        type: NotificationType.NEW_REPORT,
                        title: 'New Report Submitted',
                        message: `A new report regarding ${feedback.processType} requires review.`,
                        isRead: false,
                        timestamp: Date.now()
                    });
                }
            }
        } else if (approvalChanged) {
            // Notify Reporter
            await storageService.saveNotification({
                id: Date.now().toString() + Math.random().toString().slice(2, 6),
                userId: feedback.fromUserId,
                type: NotificationType.REPORT_STATUS,
                title: `Report ${feedback.approvalStatus}`,
                message: `Your report regarding ${feedback.processType} has been ${feedback.approvalStatus.toLowerCase()}.`,
                isRead: false,
                timestamp: Date.now()
            });

            // Notify Receiver (Only if Approved)
            if (feedback.approvalStatus === ApprovalStatus.APPROVED) {
                 await storageService.saveNotification({
                    id: Date.now().toString() + Math.random().toString().slice(2, 6),
                    userId: feedback.toUserId,
                    type: NotificationType.FEEDBACK_RECEIVED,
                    title: 'New Feedback Received',
                    message: `You have received verified feedback regarding ${feedback.processType}.`,
                    isRead: false,
                    timestamp: Date.now()
                });
            }
        }
    } catch (err) {
        console.error("Failed to generate notifications", err);
    }
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
        console.warn('MISSING TABLE "audit_logs"');
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
             console.warn('MISSING TABLE "audit_logs"');
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
          console.warn('MISSING TABLE "notes"');
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
          console.warn('MISSING TABLE "notes"');
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
          console.warn('MISSING TABLE "announcements"');
       }
     } catch(e) {}
     
     // 3. Generate Notifications (Notify everyone except author)
     try {
        const allUsers = await storageService.getUsers();
        for (const u of allUsers) {
             if (u.id !== announcement.authorId) {
                 await storageService.saveNotification({
                     id: Date.now().toString() + Math.random().toString().slice(2, 6),
                     userId: u.id,
                     type: NotificationType.NEW_ANNOUNCEMENT,
                     title: announcement.isImportant ? 'URGENT: ' + announcement.title : announcement.title,
                     message: `New announcement posted by ${announcement.authorName}`,
                     isRead: false,
                     timestamp: Date.now()
                 });
             }
        }
     } catch (err) { console.error("Failed to generate announcement notifications", err); }
  },

  deleteAnnouncement: async (id: string) => {
     // 1. Local
     const stored = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
     const filtered = stored.filter((a: Announcement) => a.id !== id);
     localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(filtered));

     // 2. DB
     try { await supabase.from('announcements').delete().eq('id', id); } catch(e) {}
  },

  // Notification Methods
  getNotifications: async (userId: string): Promise<Notification[]> => {
    let dbData: Notification[] = [];
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId);
      if (!error && data) dbData = data;
      else if (error?.code === '42P01') {
          console.warn('MISSING TABLE "notifications"');
      }
    } catch (e) {}

    let localData: Notification[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        localData = parsed.filter(n => n.userId === userId);
      }
    } catch (e) {}

    const all = [...dbData, ...localData];
    const uniqueMap = new Map<string, Notification>();
    all.forEach(n => uniqueMap.set(n.id, n));
    
    return Array.from(uniqueMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  },

  saveNotification: async (notification: Notification) => {
     // Local
     try {
       const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
       const notes: Notification[] = stored ? JSON.parse(stored) : [];
       notes.push(notification);
       // Limit local storage size
       if(notes.length > 200) notes.shift(); 
       localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notes));
     } catch(e) {}

     // DB
     try {
       const { error } = await supabase.from('notifications').insert(notification);
       if (error && error.code === '42P01') {
           console.warn('MISSING TABLE "notifications"');
       }
     } catch(e) {}
  },

  markNotificationRead: async (id: string) => {
     // Local
     try {
       const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
       if (stored) {
         const notes: Notification[] = JSON.parse(stored);
         const idx = notes.findIndex(n => n.id === id);
         if (idx >= 0) {
           notes[idx].isRead = true;
           localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notes));
         }
       }
     } catch(e) {}

     // DB
     try {
       await supabase.from('notifications').update({ isRead: true }).eq('id', id);
     } catch(e) {}
  },

  markAllNotificationsRead: async (userId: string) => {
     // Local
     try {
       const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
       if (stored) {
         let notes: Notification[] = JSON.parse(stored);
         notes = notes.map(n => n.userId === userId ? { ...n, isRead: true } : n);
         localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notes));
       }
     } catch(e) {}

     // DB
     try {
       await supabase.from('notifications').update({ isRead: true }).eq('userId', userId);
     } catch(e) {}
  }
};

// Start init (async)
storageService.initialize();
