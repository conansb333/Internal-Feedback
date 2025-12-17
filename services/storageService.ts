
import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note, Announcement, ApprovalStatus, Notification, NotificationType, Article } from '../types';

// --- DATA SEEDING UTILITIES ---
const createId = (name: string) => name.toLowerCase().replace(/\s+/g, '.');
const createUsername = (name: string) => name.toLowerCase().replace(/\s+/g, '.');

const MANAGERS_LIST = [
  "Achraf Moujahid", "Ahmed El Ghezlani", "Assiya Ferkoussi", "Hakim Ziyady",
  "Houda Benmessaoud", "Imane Khouader", "Mohammed Khaladi", "Nour El Houda Larhrib",
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
    ["Haytham El Bahi", "Ahmed El Ghezlani"], ["Manar Doua", "Ahmed El Ghezlani"], ["Mounir Ec Sabery", "Ahmed El Ghezlani"],
    ["Nouhayla Aouine", "Ahmed El Ghezlani"], ["Oussama Lakhal", "Ahmed El Ghezlani"], ["Oussama Majait", "Ahmed El Ghezlani"],
    ["Rhita Tazi", "Ahmed El Ghezlani"], ["Yassine Hida", "Ahmed El Ghezlani"], ["Youssef Kerroumi", "Ahmed El Ghezlani"],
    ["Adnane Ait Karroum", "Assiya Ferkoussi"], ["Ayoub Eddbiri", "Assiya Ferkoussi"], ["Fatima Zahra Belmir", "Assiya Ferkoussi"],
    ["Khalil Ouchaou", "Assiya Ferkoussi"], ["Malak Oumouss", "Assiya Ferkoussi"], ["Maroua Tahiri", "Assiya Ferkoussi"],
    ["Mehdi Frej", "Assiya Ferkoussi"], ["Saad Maissour", "Assiya Ferkoussi"], ["Souhaila Khatouri", "Assiya Ferkoussi"],
    ["Wissal Abdelghani", "Assiya Ferkoussi"], ["Ali Ibn El Hachimy", "Assiya Ferkoussi"], ["Hafsa Lafkih", "Assiya Ferkoussi"],
    ["Houssam Bahhou", "Assiya Ferkoussi"], ["Mahmoud Alizou", "Assiya Ferkoussi"], ["Mohamed Tacherifine", "Assiya Ferkoussi"],
    ["Oussama Boujnah", "Assiya Ferkoussi"], ["Sanae El Markadi", "Assiya Ferkoussi"], ["Zakariya Ezzarouali", "Assiya Ferkoussi"],
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
    ["Ziad Maizya", "Imane Khouader"], ["Alae Bouchouk", "Imane Khouader"], ["Asmae Laabidi", "Imane Khouader"],
    ["Ayman Bouhaddioui", "Imane Khouader"], ["Aymane Elmaizi", "Imane Khouader"], ["Doha Elbakkali", "Imane Khouader"],
    ["Khaoula El Hachimi", "Imane Khouader"], ["Majda Ait Jennek", "Imane Khouader"], ["Marwa Tribkou", "Imane Khouader"],
    ["Mehdi Nadbour", "Imane Khouader"], ["Moad Drissi", "Imane Khouader"], ["Mohamed Reda Mahssoune", "Imane Khouader"],
    ["Mohammed Chafik Elhaddun", "Imane Khouader"], ["Nasr-Eddine Kerroumi", "Imane Khouader"], ["Safae Bellamine", "Imane Khouader"],
    ["Siman Saflal", "Imane Khouader"], ["Wijdane Bouaoiad", "Imane Khouader"], ["Ahmed Sadoq", "Mohammed Khaladi"],
    ["Amal El Oumrani", "Mohammed Khaladi"], ["Anass Janah", "Mohammed Khaladi"], ["Anouar Kharchoufa", "Mohammed Khaladi"],
    ["Bilal El Mejahedy", "Mohammed Khaladi"], ["Hassan Khouaja", "Mohammed Khaladi"], ["Hicham Moujahid", "Mohammed Khaladi"],
    ["Houda Yousf Ibrahim", "Mohammed Khaladi"], ["Khadija El Hajjaji", "Mohammed Khaladi"], ["Khalid Zouar", "Mohammed Khaladi"],
    ["Mohammed Sayyad", "Mohammed Khaladi"], ["Oumaima Es Sahli", "Mohammed Khaladi"], ["Oussama Cherbak", "Mohammed Khaladi"],
    ["Wadie Kouidi", "Mohammed Khaladi"], ["Yassine Tanhim", "Mohammed Khaladi"], ["Ayman El Adnany", "Nour El Houda Larhrib"],
    ["Ayyoub Rahmoun", "Nour El Houda Larhrib"], ["Douae Alkhir Afouraou", "Nour El Houda Larhrib"], ["Houda Echarkaoui", "Nour El Houda Larhrib"],
    ["Ikram Elahadi", "Nour El Houda Larhrib"], ["Ismail El Ouali Alami", "Nour El Houda Larhrib"], ["Kawtar Farai", "Nour El Houda Larhrib"],
    ["Manar Nhaili", "Nour El Houda Larhrib"], ["Meryem Maizi", "Nour El Houda Larhrib"], ["Mouad Essalki", "Nour El Houda Larhrib"],
    ["Sara Lahsaini", "Nour El Houda Larhrib"], ["Taha Salim", "Nour El Houda Larhrib"], ["Yassine El Asraoui", "Nour El Houda Larhrib"],
    ["Yassine Soudani", "Nour El Houda Larhrib"], ["Yassir Benzakour", "Nour El Houda Larhrib"], ["Youssef El Hilali", "Nour El Houda Larhrib"],
    ["Iman Bel Hadri", "Omar Mzaouri"], ["Hasnae El Belghiti", "Omar Mzaouri"], ["Aziza El Omri", "Omar Mzaouri"],
    ["Hamza Foullani", "Omar Mzaouri"], ["Salma Ben Mallouk", "Omar Mzaouri"], ["Yousra Rachd", "Omar Mzaouri"],
    ["Malika Echamah", "Omar Mzaouri"], ["Abdelmalek Iazzaoui", "Omar Mzaouri"], ["Nassime Aourir", "Omar Mzaouri"],
    ["Zakaria Es Samadi", "Omar Mzaouri"], ["Achouak Etarari", "Omar Mzaouri"], ["Badr Eddine Cherkaoui", "Omar Mzaouri"],
    ["Fadi Ouahbi", "Omar Mzaouri"], ["Hajar Idsaid", "Omar Mzaouri"], ["Hassan Bjtit", "Omar Mzaouri"],
    ["Hiba Khalil", "Omar Mzaouri"], ["Marouane El Houss", "Omar Mzaouri"], ["Meryem Habbass", "Omar Mzaouri"],
    ["Mohcine Rabah", "Omar Mzaouri"], ["Nada Fars", "Omar Mzaouri"], ["Oumaima Ouamou", "Omar Mzaouri"],
    ["Oussama Laajel", "Omar Mzaouri"], ["Rayane Hamama", "Omar Mzaouri"], ["Younous Belfkih", "Omar Mzaouri"],
    ["Amine Ouaziz", "Rihab Lasri"], ["Doha Wahdani", "Rihab Lasri"], ["Ferdaous Agourari", "Rihab Lasri"],
    ["Hamza Joorane", "Rihab Lasri"], ["Hassan El Idrissi", "Rihab Lasri"], ["Ismail Gaiz", "Rihab Lasri"],
    ["Meryem Alami", "Rihab Lasri"], ["Meryem Bousseta", "Rihab Lasri"], ["Nouamane Alizou", "Rihab Lasri"],
    ["Oussama Chatir", "Rihab Lasri"], ["Rachad Hatri", "Rihab Lasri"], ["Rania El Khattabi", "Rihab Lasri"],
    ["Reda El Haidouri", "Rihab Lasri"], ["Rime Abdellaoui", "Rihab Lasri"], ["Samah Ait Salah", "Rihab Lasri"],
    ["Walid Ouardi", "Rihab Lasri"], ["Abdessamad El Hamraoui", "Salah Eddine Ajlil"], ["Achraf Hamyouy", "Salah Eddine Ajlil"],
    ["Asma El Fahim", "Salah Eddine Ajlil"], ["Fatima Zahra El Azhary", "Salah Eddine Ajlil"], ["Haytam Brada", "Salah Eddine Ajlil"],
    ["Hiba Mrani Alaoui", "Salah Eddine Ajlil"], ["Houria Rhanimi", "Salah Eddine Ajlil"], ["Houssam Aboubi", "Salah Eddine Ajlil"],
    ["Houssam Tiabi", "Salah Eddine Ajlil"], ["Jihane Riyani", "Salah Eddine Ajlil"], ["Mohamed El Khayar", "Salah Eddine Ajlil"],
    ["Nora Ouahib", "Salah Eddine Ajlil"], ["Safaa El Haim", "Salah Eddine Ajlil"], ["Taha Yassine Abouabdellah", "Salah Eddine Ajlil"],
    ["Ayoub Benellouti", "Salma Azouz"], ["Azzeddine Raiss", "Salma Azouz"], ["Fatima Zahra El Jabiri", "Salma Azouz"],
    ["Hiba Boudrafte", "Salma Azouz"], ["Hiba Mzannah", "Salma Azouz"], ["Houda Khouya", "Salma Azouz"],
    ["Kawtar Attia", "Salma Azouz"], ["Khadija Hamza", "Salma Azouz"], ["Mehdi Touab", "Salma Azouz"],
    ["Mohamed Mhaouch", "Salma Azouz"], ["Mouad Oubelahcen", "Salma Azouz"], ["Mouad Oulahyane", "Salma Azouz"],
    ["Nabil El Meguioui", "Salma Azouz"], ["Nossaiba Nouini", "Salma Azouz"], ["Oumaima Aboutahir", "Salma Azouz"],
    ["Oumaima Touil", "Salma Azouz"], ["Oumayma Ami", "Salma Azouz"], ["Oussama Filali", "Salma Azouz"],
    ["Salma Bennani", "Salma Azouz"], ["Soufiane Hissi", "Salma Azouz"], ["Soukaina El Hammoudani", "Salma Azouz"],
    ["Abdelhak Ibn El Ahmar", "Achraf Moujahid"], ["Abderrahman Mouilly", "TBD"], ["Adam Ettabib", "Achraf Moujahid"],
    ["Alaa Laknaoui", "TBD"], ["Amal Hadday", "Achraf Moujahid"], ["Amina Makdouf", "Achraf Moujahid"],
    ["Ayman Zrif", "Achraf Moujahid"], ["Dounia El Khattabi", "TBD"], ["Fatene Hajar", "Mohammed Khaladi"],
    ["Fatima Ezzahraa Atif", "TBD"], ["Fatima Zahrae Moussaid", "TBD"], ["Hatim Daghouj", "Mohammed Khaladi"],
    ["Houssame Dahak", "TBD"], ["Intissar El Makaoui", "TBD"], ["Kaoutar Benhelli", "Achraf Moujahid"],
    ["Kaoutar Essaissi", "Achraf Moujahid"], ["Khalil Nassoukhi", "TBD"], ["Laila Arrache", "TBD"],
    ["Mohamed Hatim Essaadaoui", "TBD"], ["Mohammed Taha Snah", "TBD"], ["Mustapha Badih", "TBD"],
    ["Nacer Es Soujaa El Hassan", "TBD"], ["Nada Ben Fares", "TBD"], ["Nada Benichou", "TBD"],
    ["Nassim Taous", "TBD"], ["Nouhaila Zemrani", "TBD"], ["Othman Belbennar", "TBD"],
    ["Rajae Cherkaoui El Maataoui", "TBD"], ["Seif Eddine Boukhchen", "TBD"], ["Taha Yassine Karim", "TBD"],
    ["Yasser Hayah", "TBD"], ["Yassine El Hilali", "TBD"], ["Youssef El Bouchtaoui", "TBD"], ["Loubna Sttaf", "TBD"]
];

const associates: User[] = RAW_ASSOCIATE_DATA.map(([assocName, managerName]) => {
  const mgrId = managerName === "TBD" ? undefined : createId(managerName);
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

const adminUser: User = { 
  id: createId('Abdessamad Nahid'), 
  username: 'conan.sb3', 
  name: 'Abdessamad Nahid', 
  role: UserRole.ADMIN, 
  password: 'password', 
  isApproved: true,
  managerId: createId('Rihab Lasri')
};

const SEED_USERS: User[] = [adminUser, ...managers, ...associates];

const SEED_ARTICLES: Article[] = [
    {
        id: 'delivery-slas',
        title: 'Delivery Service Level Agreements (SLAs)',
        category: 'Processes',
        content: `Standard Delivery:\n- 3-5 Business Days for mainland UK.\n- Orders must be placed before 8pm for same-day dispatch.\n\nNext Day Delivery:\n- Next working day delivery if ordered before 8pm.\n- Excludes Sundays and Bank Holidays.\n\nClick & Collect:\n- Available next day after 2pm at selected stores.\n- 7 days to collect before automatic return.`,
        lastUpdated: Date.now(),
        authorId: 'admin',
        authorName: 'System'
    },
    {
        id: 'returns-process',
        title: 'Returns & Refund Guidelines',
        category: 'Returns',
        content: `Standard Return Policy:\n- 35 days for unused items in original packaging.\n- Proof of purchase required (Receipt or Order Confirmation).\n\nDamaged Items:\n- Inspect immediately upon return.\n- Mark as "Damaged" in the system to trigger RTS (Return to Sender) flow.\n- Do not return damaged items to stock.\n\nRefund Timeline:\n- Processed within 24 hours of receipt.\n- Customer sees funds in 3-5 business days.`,
        lastUpdated: Date.now(),
        authorId: 'admin',
        authorName: 'System'
    }
];

const LOCAL_KEYS = {
  USERS: 'app_users_backup',
  FEEDBACKS: 'app_feedbacks_backup',
  LOGS: 'audit_logs_backup',
  NOTES: 'user_notes_backup',
  ANNOUNCEMENTS: 'app_announcements_backup',
  NOTIFICATIONS: 'user_notifications_backup',
  ARTICLES: 'app_articles_backup'
};

export const storageService = {
  initialize: async () => {
    try {
      const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      if (error) throw error;
      if (count === 0) {
        const chunkSize = 50;
        for (let i = 0; i < SEED_USERS.length; i += chunkSize) {
            await supabase.from('users').insert(SEED_USERS.slice(i, i + chunkSize));
        }
      }
    } catch (err) {
      console.warn('Supabase initialization failed, relying on local seed.', err);
      if (!localStorage.getItem(LOCAL_KEYS.USERS)) {
        localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(SEED_USERS));
      }
    }
    
    if (!localStorage.getItem(LOCAL_KEYS.ARTICLES)) {
      localStorage.setItem(LOCAL_KEYS.ARTICLES, JSON.stringify(SEED_ARTICLES));
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(data));
      return data;
    } catch (e) {
      const local = localStorage.getItem(LOCAL_KEYS.USERS);
      return local ? JSON.parse(local) : SEED_USERS;
    }
  },

  saveUser: async (user: User) => {
    try {
      await supabase.from('users').upsert(user);
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.USERS) || '[]');
    const idx = local.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) local[idx] = user; else local.push(user);
    localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(local));
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    try {
      const { data, error } = await supabase.from('feedbacks').select('*');
      if (error) throw error;
      localStorage.setItem(LOCAL_KEYS.FEEDBACKS, JSON.stringify(data));
      return data;
    } catch (e) {
      const local = localStorage.getItem(LOCAL_KEYS.FEEDBACKS);
      return local ? JSON.parse(local) : [];
    }
  },

  saveFeedback: async (feedback: Feedback) => {
    try {
      await supabase.from('feedbacks').upsert(feedback);
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.FEEDBACKS) || '[]');
    const idx = local.findIndex((f: any) => f.id === feedback.id);
    if (idx >= 0) local[idx] = feedback; else local.push(feedback);
    localStorage.setItem(LOCAL_KEYS.FEEDBACKS, JSON.stringify(local));
  },

  getLogs: async (): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    } catch (e) {
      const local = localStorage.getItem(LOCAL_KEYS.LOGS);
      return local ? JSON.parse(local) : [];
    }
  },

  saveLog: async (log: AuditLog) => {
    try { await supabase.from('audit_logs').insert(log); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.LOGS) || '[]');
    local.unshift(log);
    localStorage.setItem(LOCAL_KEYS.LOGS, JSON.stringify(local.slice(0, 500)));
  },

  getNotes: async (userId: string): Promise<Note[]> => {
    try {
      const { data, error } = await supabase.from('notes').select('*').eq('userId', userId);
      if (error) throw error;
      return data;
    } catch (e) {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTES) || '[]');
      return local.filter((n: any) => n.userId === userId);
    }
  },

  saveNote: async (note: Note) => {
    try { await supabase.from('notes').upsert(note); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTES) || '[]');
    const idx = local.findIndex((n: any) => n.id === note.id);
    if (idx >= 0) local[idx] = note; else local.push(note);
    localStorage.setItem(LOCAL_KEYS.NOTES, JSON.stringify(local));
  },

  deleteNote: async (noteId: string) => {
    try { await supabase.from('notes').delete().eq('id', noteId); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTES) || '[]');
    localStorage.setItem(LOCAL_KEYS.NOTES, JSON.stringify(local.filter((n: any) => n.id !== noteId)));
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const { data, error } = await supabase.from('announcements').select('*');
      if (error) throw error;
      return data;
    } catch (e) {
      const local = localStorage.getItem(LOCAL_KEYS.ANNOUNCEMENTS);
      return local ? JSON.parse(local) : [];
    }
  },

  saveAnnouncement: async (announcement: Announcement) => {
    try { await supabase.from('announcements').insert(announcement); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.ANNOUNCEMENTS) || '[]');
    local.push(announcement);
    localStorage.setItem(LOCAL_KEYS.ANNOUNCEMENTS, JSON.stringify(local));
  },

  deleteAnnouncement: async (id: string) => {
    try { await supabase.from('announcements').delete().eq('id', id); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.ANNOUNCEMENTS) || '[]');
    localStorage.setItem(LOCAL_KEYS.ANNOUNCEMENTS, JSON.stringify(local.filter((a: any) => a.id !== id)));
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId).order('timestamp', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
      return local.filter((n: any) => n.userId === userId).sort((a: any, b: any) => b.timestamp - a.timestamp);
    }
  },

  saveNotification: async (notification: Notification) => {
    try { await supabase.from('notifications').insert(notification); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
    local.unshift(notification);
    localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify(local.slice(0, 100)));
  },

  markNotificationRead: async (id: string) => {
    try { await supabase.from('notifications').update({ isRead: true }).eq('id', id); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
    const idx = local.findIndex((n: any) => n.id === id);
    if (idx >= 0) local[idx].isRead = true;
    localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify(local));
  },

  markAllNotificationsRead: async (userId: string) => {
    try { await supabase.from('notifications').update({ isRead: true }).eq('userId', userId); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
    const updated = local.map((n: any) => n.userId === userId ? { ...n, isRead: true } : n);
    localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  getArticles: async (): Promise<Article[]> => {
    try {
      const { data, error } = await supabase.from('articles').select('*');
      if (error) throw error;
      return data;
    } catch (e) {
      const local = localStorage.getItem(LOCAL_KEYS.ARTICLES);
      return local ? JSON.parse(local) : SEED_ARTICLES;
    }
  },

  saveArticle: async (article: Article) => {
    try { await supabase.from('articles').upsert(article); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.ARTICLES) || '[]');
    const idx = local.findIndex((a: any) => a.id === article.id);
    if (idx >= 0) local[idx] = article; else local.push(article);
    localStorage.setItem(LOCAL_KEYS.ARTICLES, JSON.stringify(local));
  },

  deleteArticle: async (id: string) => {
    try { await supabase.from('articles').delete().eq('id', id); } catch (e) {}
    const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.ARTICLES) || '[]');
    localStorage.setItem(LOCAL_KEYS.ARTICLES, JSON.stringify(local.filter((a: any) => a.id !== id)));
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      await supabase.from('users').delete().eq('id', userId);
      const local = JSON.parse(localStorage.getItem(LOCAL_KEYS.USERS) || '[]');
      localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(local.filter((u: any) => u.id !== userId)));
      return true;
    } catch (e) { return false; }
  }
};

storageService.initialize();
