
import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note, Announcement, ApprovalStatus, Notification, NotificationType, Article } from '../types';

// --- DATA SEEDING UTILITIES ---
const createId = (name: string) => name.toLowerCase().replace(/\s+/g, '.').trim();
const createUsername = (name: string) => name.toLowerCase().replace(/\s+/g, '.').trim();

const MANAGERS_LIST = [
  "Achraf Moujahid", "Ahmed El Ghezlani", "Assiya FERKOUSSI", "Hakim Ziyady",
  "Houda Benmessaoud", "Imane Khouader", "Mohammed Khaladi", "Nour El houda LARHRIB",
  "Omar Mzaouri", "Rihab Lasri", "Salah Eddine Ajlil", "Salma Azouz"
];

const managers: User[] = MANAGERS_LIST.map(name => ({
  id: createId(name),
  username: createUsername(name),
  name: name,
  role: UserRole.MANAGER,
  password: 'password',
  isApproved: true
}));

const RAW_ASSOCIATE_DATA = [
    ["Abdelghafour Chabakh", "Achraf Moujahid"], ["Abdelmalek Belkhir", "Achraf Moujahid"], ["Amine Hsina", "Achraf Moujahid"],
    ["Aymane Essalhi", "Achraf Moujahid"], ["Fatima Zahra Laouani", "Achraf Moujahid"], ["Fatima Zahrae El Gode", "Achraf Moujahid"],
    ["Hamza Miloudi", "Achraf Moujahid"], ["Lamyae Boukoukou", "Achraf Moujahid"], ["Marouane Et Tayeby", "Achraf Moujahid"],
    ["Mehdi Bouanane", "Achraf Moujahid"], ["Mohamed Er Rahmouny", "Achraf Moujahid"], ["Mohammed El Mardy", "Achraf Moujahid"],
    ["Mohammed Jai", "Achraf Moujahid"], ["Oumayma Dakkoune", "Achraf Moujahid"], ["Oussama Zaite", "Achraf Moujahid"],
    ["Zakaria El Yaagoubi", "Achraf Moujahid"], ["Abdelhak Er Rkabi", "Ahmed El Ghezlani"], ["Amina Azzouzi", "Ahmed El Ghezlani"],
    ["Bilal El Masmoudy", "Ahmed El Ghezlani"], ["Hamza Khaldi", "Ahmed El Ghezlani"], ["Hamza Zouichi", "Ahmed El Ghezlani"],
    ["Haytham El Bahi", "Ahmed El Bahi"], ["Manar Doua", "Ahmed El Ghezlani"], ["Mounir Ec Sabery", "Ahmed El Ghezlani"],
    ["Nouhayla Aouine", "Ahmed El Ghezlani"], ["Oussama Lakhal", "Ahmed El ghezlani"], ["Oussama Majait", "Ahmed El Ghezlani"],
    ["Rhita Tazi", "Ahmed El Ghezlani"], ["Yassine Hida", "Ahmed El Ghezlani"], ["Youssef Kerroumi", "Ahmed El Ghezlani"],
    ["Adnane Ait Karroum", "Assiya FERKOUSSI"], ["Ayoub Eddbiri", "Assiya FERKOUSSI"], ["Fatima Zahra Belmir", "Assiya FERKOUSSI"],
    ["Khalil Ouchaou", "Assiya FERKOUSSI"], ["Malak Oumouss", "Assiya FERKOUSSI"], ["Maroua Tahiri", "Assiya FERKOUSSI"],
    ["Mehdi Frej", "Assiya FERKOUSSI"], ["Saad Maissour", "Assiya FERKOUSSI"], ["Souhaila Khatouri", "Assiya FERKOUSSI"],
    ["Wissal Abdelghani", "Assiya FERKOUSSI"], ["Ali Ibn El Hachimy", "Assiya FERKOUSSI"], ["Hafsa Lafkih", "Assiya FERKOUSSI"],
    ["Houssam Bahhou", "Assiya FERKOUSSI"], ["Mahmoud Alizou", "Assiya FERKOUSSI"], ["Mohamed Tacherifine", "Assiya FERKOUSSI"],
    ["Oussama Boujnah", "Assiya FERKOUSSI"], ["Sanae El Markadi", "Assiya FERKOUSSI"], ["Zakariya Ezzarouali", "Assiya FERKOUSSI"],
    ["Abderrazaq Essadraty", "Hakim Ziyady"], ["Anass Boudra", "Hakim Ziyady"], ["Anouar Rahhal", "Hakim Ziyady"],
    ["Awatif Ben Zakour", "Hakim Ziyady"], ["Fayza Chrigui", "Hakim Ziyady"], ["Ghita El Azhary", "Hakim Ziyady"],
    ["Hanane Hajli", "Hakim Ziyady"], ["Hiba Ben Zakour", "Hakim Ziyady"], ["Mohammed Ben Tahra", "Hakim Ziyady"],
    ["Radouane Ed Daouy", "Hakim Ziyady"], ["Salma Nfissi", "Hakim Ziyady"], ["Samira Morchid", "Hakim Ziyady"],
    ["Youssef Damen", "Hakim Ziyady"], ["Zakaria Laachari", "Hakim Ziyady"], ["Zineb Jrhal", "Hakim Ziyady"],
    ["Asmae Fatih", "Houda Benmessaoud"], ["Ayoub Benyamna", "Houda Benmessaoud"], ["Chaymae Ait Raho", "Houda Benmessaoud"],
    ["El Mehdi Er Rasfi", "Houda Benmessaoud"], ["Hafsa El Idrissi", "Houda Benmessaoud"], ["Ikrame Zayer", "Houda Benmessaoud"],
    ["Imane El Yaagoubi", "Houda Benmessaoud"], ["Islam Ben Et Taleb", "Houda Benmessaoud"], ["Meryem Benhamed", "Houda Benmessaoud"],
    ["Mohammed Labrouzy", "Houda Benmessaoud"], ["Mohammed Rabeh", "Houda Benmessaoud"], ["Nihal Nfissi", "Houda Benmessaoud"],
    ["Nouhaila Kaddouri", "Houda Benmessaoud"], ["Saad Lasfar", "Houda Benmessaoud"], ["Taha El Alami", "Houda Benmessaoud"],
    ["Yassmine Fakir", "Houda Benmessaoud"], ["Abdeljalil Mochreq", "Imane Khouader"], ["Abdessamad Mouchrif", "Imane Khouader"],
    ["Aya El Boukhari", "Imane Khouader"], ["Chadi Karim", "Imane Khouader"], ["Hafsa Lahsaini", "Imane Khouader"],
    ["Redouane Ait Daoud", "Imane Khouader"], ["Souhail Daoufa", "Imane Khouader"], ["Taha Daki", "Imane Khouader"],
    ["Ziad Maizya", "Imane Khouader"], ["ALAE BOUCHOUK", "Imane Khouader"], ["ASMAE LAABIDI", "Imane Khouader"],
    ["AYMAN BOUHADDIOUI", "Imane Khouader"], ["AYMANE ELMAIZI", "Imane Khouader"], ["DOHA ELBAKKALI", "Imane Khouader"],
    ["KHAOULA EL HACHIMI", "Imane Khouader"], ["MAJDA AIT JENNEK", "Imane Khouader"], ["MARWA TRIBKOU", "Imane Khouader"],
    ["MEHDI NADBOUR", "Imane Khouader"], ["MOAD DRISSI", "Imane Khouader"], ["MOHAMED REDA MAHSSOUNE", "Imane Khouader"],
    ["MOHAMMED CHAFIK ELHADDUN", "Imane Khouader"], ["NASR-EDDINE KERROUMI", "Imane Khouader"], ["SAFAE BELLAMINE", "Imane Khouader"],
    ["SIMAN SAFLAL", "Imane Khouader"], ["WIJDANE BOUAOIAD", "Imane Khouader"], ["Ahmed Sadoq", "Mohammed Khaladi"],
    ["Amal El Oumrani", "Mohammed Khaladi"], ["Anass Janah", "Mohammed Khaladi"], ["Anouar Kharchoufa", "Mohammed Khaladi"],
    ["Bilal El Mejahedy", "Mohammed Khaladi"], ["Hassan Khouaja", "Mohammed Khaladi"], ["Hicham Moujahid", "Mohammed Khaladi"],
    ["Houda Yousf Ibrahim", "Mohammed Khaladi"], ["Khadija El Hajjaji", "Mohammed Khaladi"], ["Khalid Zouar", "Mohammed Khaladi"],
    ["Mohammed Sayyad", "Mohammed Khaladi"], ["Oumaima Es Sahli", "Mohammed Khaladi"], ["Oussama Cherbak", "Mohammed Khaladi"],
    ["Wadie Kouidi", "Mohammed Khaladi"], ["Yassine Tanhim", "Mohammed Khaladi"], ["Ayman El Adnany", "Nour El houda LARHRIB"],
    ["Ayyoub Rahmoun", "Nour El houda LARHRIB"], ["Douae Alkhir Afouraou", "Nour El houda LARHRIB"], ["Houda Echarkaoui", "Nour El houda LARHRIB"],
    ["Ikram Elahadi", "Nour El houda LARHRIB"], ["Ismail El Ouali Alami", "Nour El houda LARHRIB"], ["Kawtar Farai", "Nour El houda LARHRIB"],
    ["Manar Nhaili", "Nour El houda LARHRIB"], ["Meryem Maizi", "Nour El houda LARHRIB"], ["Mouad Essalki", "Nour El houda LARHRIB"],
    ["Sara Lahsaini", "Nour El houda LARHRIB"], ["Taha Salim", "Nour El houda LARHRIB"], ["Yassine El Asraoui", "Nour El houda LARHRIB"],
    ["Yassine Soudani", "Nour El houda LARHRIB"], ["Yassir Benzakour", "Nour El houda LARHRIB"], ["Youssef El Hilali", "Nour El houda LARHRIB"],
    ["Iman Bel Hadri", "Omar Mzaouri"], ["Hasnae El Belghiti", "Omar Mzaouri"], ["Aziza El Omri", "Omar Mzaouri"],
    ["Hamza Foullani", "Omar Mzaouri"], ["Salma Ben Mallouk", "Omar Mzaouri"], ["Yousra Rachd", "Omar Mzaouri"],
    ["Malika Echamah", "Omar Mzaouri"], ["Abdelmalek Iazzaoui", "Omar Mzaouri"], ["Nassime Aourir", "Omar Mzaouri"],
    ["Zakaria Es Samadi", "Omar Mzaouri"], ["Achouak Etarari", "Omar Mzaouri"], ["Badr Eddine Cherkaoui", "Omar Mzaouri"],
    ["Fadi Ouahbi", "Omar Mzaouri"], ["Hajar Idsaid", "Omar Mzaouri"], ["Hassan Bjtit", "Omar Mzaouri"],
    ["Hiba Khalil", "Omar Mzaouri"], ["Marouane El Houss", "Omar Mzaouri"], ["Meryem Habbass", "Omar Mzaouri"],
    ["Mohcine Rabah", "Omar Mzaouri"], ["Nada Fars", "Omar Mzaouri"], ["Oumaima Ouamou", "Omar Mzaouri"],
    ["Oussama Laajel", "Omar Mzaouri"], ["Rayane Hamama", "Omar Mzaouri"], ["Younous Belfkih", "Omar Mzaouri"],
    ["Abdessamad Nahid", "Rihab Lasri"], ["Amine Ouaziz", "Rihab Lasri"], ["Doha Wahdani", "Rihab Lasri"],
    ["Ferdaous Agourari", "Rihab Lasri"], ["Hamza Joorane", "Rihab Lasri"], ["Hassan El Idrissi", "Rihab Lasri"],
    ["Ismail Gaiz", "Rihab Lasri"], ["Meryem Alami", "Rihab Lasri"], ["Meryem Bousseta", "Rihab Lasri"],
    ["Nouamane Alizou", "Rihab Lasri"], ["Oussama Chatir", "Rihab Lasri"], ["Rachad Hatri", "Rihab Lasri"],
    ["Rania El Khattabi", "Rihab Lasri"], ["Reda El Haidouri", "Rihab Lasri"], ["Rime Abdellaoui", "Rihab Lasri"],
    ["Samah Ait Salah", "Rihab Lasri"], ["Walid Ouardi", "Rihab Lasri"], ["Abdessamad El Hamraoui", "Salah Eddine Ajlil"],
    ["Achraf Hamyouy", "Salah Eddine Ajlil"], ["Asma El Fahim", "Salah Eddine Ajlil"], ["Fatima Zahra El Azhary", "Salah Eddine Ajlil"],
    ["Haytam Brada", "Salah Eddine Ajlil"], ["Hiba Mrani Alaoui", "Salah Eddine Ajlil"], ["Houria Rhanimi", "Salah Eddine Ajlil"],
    ["Houssam Aboubi", "Salah Eddine Ajlil"], ["Houssam Tiabi", "Salah Eddine Ajlil"], ["Jihane Riyani", "Salah Eddine Ajlil"],
    ["Mohamed El Khayar", "Salah Eddine Ajlil"], ["Nora Ouahib", "Salah Eddine Ajlil"], ["Safaa El Haim", "Salah Eddine Ajlil"],
    ["Taha Yassine Abouabdellah", "Salah Eddine Ajlil"], ["Ayoub Benellouti", "Salma Azouz"], ["Azzeddine Raiss", "Salma Azouz"],
    ["Fatima Zahra El Jabiri", "Salma Azouz"], ["Hiba Boudrafte", "Salma Azouz"], ["Hiba Mzannah", "Salma Azouz"],
    ["Houda Khouya", "Salma Azouz"], ["Kawtar Attia", "Salma Azouz"], ["Khadija Hamza", "Salma Azouz"],
    ["Mehdi Touab", "Salma Azouz"], ["Mohamed Mhaouch", "Salma Azouz"], ["Mouad Oubelahcen", "Salma Azouz"],
    ["Mouad Oulahyane", "Salma Azouz"], ["Nabil El Meguioui", "Salma Azouz"], ["Nossaiba Nouini", "Salma Azouz"],
    ["Oumaima Aboutahir", "Salma Azouz"], ["Oumaima Touil", "Salma Azouz"], ["Oumayma Ami", "Salma Azouz"],
    ["Oussama Filali", "Salma Azouz"], ["Salma Bennani", "Salma Azouz"], ["Soufiane Hissi", "Salma Azouz"],
    ["Soukaina El Hammoudani", "Salma Azouz"], ["Abdelhak Ibn El Ahmar", "Achraf Moujahid"], ["Abderrahman Mouilly", "TBD"],
    ["Adam Ettabib", "Achraf Moujahid"], ["Alaa Laknaoui", "TBD"], ["Amal Hadday", "Achraf Moujahid"],
    ["Amina Makdouf", "Achraf Moujahid"], ["Ayman Zrif", "Achraf Moujahid"], ["Dounia El KHATTABI", "TBD"],
    ["Fatene Hajar", "Mohammed Khaladi"], ["FATIMA EZZAHRAA ATIF", "TBD"], ["FATIMA ZAHRAE MOUSSAID", "TBD"],
    ["Hatim Daghouj", "Mohammed Khaladi"], ["HOUSSAME DAHAK", "TBD"], ["INTISSAR EL MAKAOUI", "TBD"],
    ["Kaoutar Benhelli", "Achraf Moujahid"], ["Kaoutar Essaissi", "Achraf Moujahid"], ["Khalil Nassoukhi", "TBD"],
    ["Laila Arrache", "TBD"], ["MOHAMED HATIM ESSAADAOUI", "TBD"], ["Mohammed Taha Snah", "TBD"],
    ["Mustapha Badih", "TBD"], ["Nacer Es Soujaa El Hassan", "TBD"], ["Nada Ben Fares", "TBD"],
    ["Nada Benichou", "TBD"], ["Nassim Taous", "TBD"], ["NOUHAILA ZEMRANI", "TBD"], ["OTHMAN BELBENNAR", "TBD"],
    ["RAJAE CHERKAOUI EL MAATAOUI", "TBD"], ["Seif Eddine Boukhchen", "TBD"], ["TAHA YASSINE KARIM", "TBD"],
    ["Yasser Hayah", "TBD"], ["YASSINE EL HILALI", "TBD"], ["YOUSSEF EL BOUCHTAOUI", "TBD"], ["Loubna Sttaf", "TBD"]
];

const adminUser: User = { 
  id: createId('Abdessamad Nahid'), 
  username: 'conan.sb3', 
  name: 'Abdessamad Nahid', 
  role: UserRole.ADMIN, 
  password: 'password', 
  isApproved: true,
  managerId: createId('Rihab Lasri')
};

const associates: User[] = RAW_ASSOCIATE_DATA
  .filter(([assocName]) => createId(assocName) !== adminUser.id) // Filter out duplicates of Admin
  .map(([assocName, managerName]) => {
    const mgrId = managerName === "TBD" ? null : createId(managerName);
    return {
      id: createId(assocName),
      username: createUsername(assocName),
      name: assocName,
      role: UserRole.USER,
      password: 'password',
      isApproved: true,
      managerId: mgrId
    };
  });

export const SEED_USERS: User[] = [adminUser, ...managers, ...associates];

const LOCAL_KEYS = {
  USERS: 'app_users_backup_v2',
  FEEDBACKS: 'app_feedbacks_backup_v2',
  LOGS: 'audit_logs_backup_v2'
};

// Helper to sanitize object for Supabase
const sanitizeForSupabase = (obj: any) => {
    const sanitized = { ...obj };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined) {
            sanitized[key] = null;
        }
    });
    return sanitized;
};

// Map database errors to friendly messages
const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return JSON.stringify(error);
};

export const storageService = {
  initialize: async () => {
    try {
      if (!localStorage.getItem(LOCAL_KEYS.USERS)) {
          localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(SEED_USERS));
      }

      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
          console.error('Supabase Init Error:', getErrorMessage(error));
          throw error;
      }
      console.log('Supabase Connection: Active');
    } catch (err) {
      console.warn('Supabase Offline: Operating in Cache Mode.');
    }
  },

  testConnection: async () => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch { return false; }
  },

  getUsers: async (forceCloud = false): Promise<User[]> => {
    try {
      const finalDirectory = [...SEED_USERS];
      const { data: cloudUsers, error } = await supabase.from('users').select('*');
      
      if (!error && cloudUsers && cloudUsers.length > 0) {
          cloudUsers.forEach(cloudUser => {
              const idx = finalDirectory.findIndex(u => u.id === cloudUser.id);
              if (idx > -1) {
                  finalDirectory[idx] = { ...finalDirectory[idx], ...cloudUser };
              } else {
                  finalDirectory.push(cloudUser);
              }
          });
          localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(finalDirectory));
          return finalDirectory;
      }
      
      return JSON.parse(localStorage.getItem(LOCAL_KEYS.USERS) || JSON.stringify(SEED_USERS));
    } catch (e) {
      return JSON.parse(localStorage.getItem(LOCAL_KEYS.USERS) || JSON.stringify(SEED_USERS));
    }
  },

  saveUser: async (user: User) => {
    console.log('Initiating sync for:', user.username);
    const sanitizedUser = sanitizeForSupabase(user);
    
    // Recursive save attempt to handle missing columns gracefully
    const attemptSave = async (data: any): Promise<void> => {
        const { error } = await supabase.from('users').upsert(data, { onConflict: 'id' });
        
        if (error) {
            console.error('Supabase save error:', error.code, error.message);
            
            // Handle Missing Columns (PGRST204) via regex extraction
            const missingColumnMatch = error.message?.match(/Could not find the '(.+?)' column/);
            
            if ((error.code === 'PGRST204' || error.message?.includes('column')) && missingColumnMatch) {
                const missingCol = missingColumnMatch[1];
                console.warn(`CRITICAL: Table is missing column '${missingCol}'. Stripping and retrying...`);
                
                const { [missingCol]: _, ...reducedData } = data;
                
                // Safety check: Don't strip primary keys or critical auth fields
                if (missingCol === 'id' || missingCol === 'username') {
                    throw new Error(`Database is missing required column: ${missingCol}`);
                }

                // Recursively call attemptSave with reduced data
                return attemptSave(reducedData);
            }
            
            // Fallback for generic PostgREST error without specific column match
            if (error.code === 'PGRST204' && data.managerId !== undefined) {
                console.warn('PostgREST 204 error encountered. Blind-stripping managerId as last resort.');
                const { managerId, ...fallbackData } = data;
                return attemptSave(fallbackData);
            }

            throw error;
        }
    };

    try {
      await attemptSave(sanitizedUser);
      console.log('Sync Successful:', user.username);
    } catch (e: any) {
      const errMsg = getErrorMessage(e);
      console.error('CRITICAL: Sync Failed.', errMsg);
      throw new Error(errMsg);
    } finally {
        // Always update local cache for robustness
        const localRaw = localStorage.getItem(LOCAL_KEYS.USERS);
        const local = localRaw ? JSON.parse(localRaw) : [...SEED_USERS];
        const idx = local.findIndex((u: any) => u.id === user.id);
        if (idx >= 0) {
            local[idx] = { ...local[idx], ...user }; 
        } else {
            local.push(user);
        }
        localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(local));
    }
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    try {
      const { data, error } = await supabase.from('feedbacks').select('*');
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  saveFeedback: async (feedback: Feedback) => {
    try { 
        const sanitized = sanitizeForSupabase(feedback);
        const { error } = await supabase.from('feedbacks').upsert(sanitized, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {}
  },

  getLogs: async (): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  saveLog: async (log: AuditLog) => {
    try { 
        const sanitized = sanitizeForSupabase(log);
        await supabase.from('audit_logs').insert(sanitized); 
    } catch (e) {}
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId).order('timestamp', { ascending: false });
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  markNotificationRead: async (id: string) => {
    try { await supabase.from('notifications').update({ isRead: true }).eq('id', id); } catch (e) {}
  },

  markAllNotificationsRead: async (userId: string) => {
    try { await supabase.from('notifications').update({ isRead: true }).eq('userId', userId); } catch (e) {}
  },

  getArticles: async (): Promise<Article[]> => {
    try {
      const { data, error } = await supabase.from('articles').select('*');
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  getNotes: async (userId: string): Promise<Note[]> => {
    try {
      const { data, error } = await supabase.from('notes').select('*').eq('userId', userId);
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  saveNote: async (note: Note) => {
    try { 
        const sanitized = sanitizeForSupabase(note);
        await supabase.from('notes').upsert(sanitized, { onConflict: 'id' }); 
    } catch (e) {}
  },

  deleteNote: async (id: string) => {
    try { await supabase.from('notes').delete().eq('id', id); } catch (e) {}
  },

  saveAnnouncement: async (a: Announcement) => {
    try { 
        const sanitized = sanitizeForSupabase(a);
        await supabase.from('announcements').insert(sanitized); 
    } catch (e) {}
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const { data, error } = await supabase.from('announcements').select('*');
      if (!error && data) return data;
      return [];
    } catch (e) { return []; }
  },

  deleteAnnouncement: async (id: string) => {
    try { await supabase.from('announcements').delete().eq('id', id); } catch (e) {}
  },

  saveArticle: async (a: Article) => {
    try { 
        const sanitized = sanitizeForSupabase(a);
        await supabase.from('articles').upsert(sanitized, { onConflict: 'id' }); 
    } catch (e) {}
  },

  deleteArticle: async (id: string) => {
    try { await supabase.from('articles').delete().eq('id', id); } catch (e) {}
  },

  deleteUser: async (id: string) => {
    try {
      await supabase.from('users').delete().eq('id', id);
      return true;
    } catch { return false; }
  }
};

storageService.initialize();
