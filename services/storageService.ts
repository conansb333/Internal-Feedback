
import { supabase } from './supabaseClient';
import { User, Feedback, UserRole, AuditLog, Note, Announcement, ApprovalStatus, Notification, NotificationType } from '../types';

// --- DATA SEEDING UTILITIES ---

const createId = (name: string) => name.toLowerCase().replace(/\s+/g, '.');
const createUsername = (name: string) => name.toLowerCase().replace(/\s+/g, '.');

// 1. Define Managers First
const MANAGERS_LIST = [
  "Achraf Moujahid",
  "Ahmed El Ghezlani",
  "Assiya Ferkoussi",
  "Hakim Ziyady",
  "Houda Benmessaoud",
  "Imane Khouader",
  "Mohammed Khaladi",
  "Nour El Houda Larhrib",
  "Omar Mzaouri",
  "Rihab Lasri",
  "Salah Eddine Ajlil",
  "Salma Azouz"
];

const managers: User[] = MANAGERS_LIST.map(name => ({
  id: createId(name),
  username: createUsername(name),
  name: name,
  role: UserRole.MANAGER,
  password: 'password', // Default password
  isApproved: true
}));

// 2. Define Associates and link to Managers
// Format: [Associate Name, Manager Name]
const RAW_ASSOCIATE_DATA = [
    ["Abdelghafour Chabakh", "Achraf Moujahid"],
    ["Abdelmalek Belkhir", "Achraf Moujahid"],
    ["Amine Hsina", "Achraf Moujahid"],
    ["Aymane Essalhi", "Achraf Moujahid"],
    ["Fatima Zahra Laouani", "Achraf Moujahid"],
    ["Fatima Zahrae El Gode", "Achraf Moujahid"],
    ["Hamza Miloudi", "Achraf Moujahid"],
    ["Lamyae Boukoukou", "Achraf Moujahid"],
    ["Marouane Et Tayeby", "Achraf Moujahid"],
    ["Mehdi Bouanane", "Achraf Moujahid"],
    ["Mohamed Er Rahmouny", "Achraf Moujahid"],
    ["Mohammed El Mardy", "Achraf Moujahid"],
    ["Mohammed Jai", "Achraf Moujahid"],
    ["Oumayma Dakkoune", "Achraf Moujahid"],
    ["Oussama Zaite", "Achraf Moujahid"],
    ["Zakaria El Yaagoubi", "Achraf Moujahid"],
    ["Abdelhak Er Rkabi", "Ahmed El Ghezlani"],
    ["Amina Azzouzi", "Ahmed El Ghezlani"],
    ["Bilal El Masmoudy", "Ahmed El Ghezlani"],
    ["Hamza Khaldi", "Ahmed El Ghezlani"],
    ["Hamza Zouichi", "Ahmed El Ghezlani"],
    ["Haytham El Bahi", "Ahmed El Ghezlani"],
    ["Manar Doua", "Ahmed El Ghezlani"],
    ["Mounir Ec Sabery", "Ahmed El Ghezlani"],
    ["Nouhayla Aouine", "Ahmed El Ghezlani"],
    ["Oussama Lakhal", "Ahmed El Ghezlani"],
    ["Oussama Majait", "Ahmed El Ghezlani"],
    ["Rhita Tazi", "Ahmed El Ghezlani"],
    ["Yassine Hida", "Ahmed El Ghezlani"],
    ["Youssef Kerroumi", "Ahmed El Ghezlani"],
    ["Adnane Ait Karroum", "Assiya Ferkoussi"],
    ["Ayoub Eddbiri", "Assiya Ferkoussi"],
    ["Fatima Zahra Belmir", "Assiya Ferkoussi"],
    ["Khalil Ouchaou", "Assiya Ferkoussi"],
    ["Malak Oumouss", "Assiya Ferkoussi"],
    ["Maroua Tahiri", "Assiya Ferkoussi"],
    ["Mehdi Frej", "Assiya Ferkoussi"],
    ["Saad Maissour", "Assiya Ferkoussi"],
    ["Souhaila Khatouri", "Assiya Ferkoussi"],
    ["Wissal Abdelghani", "Assiya Ferkoussi"],
    ["Ali Ibn El Hachimy", "Assiya Ferkoussi"],
    ["Hafsa Lafkih", "Assiya Ferkoussi"],
    ["Houssam Bahhou", "Assiya Ferkoussi"],
    ["Mahmoud Alizou", "Assiya Ferkoussi"],
    ["Mohamed Tacherifine", "Assiya Ferkoussi"],
    ["Oussama Boujnah", "Assiya Ferkoussi"],
    ["Sanae El Markadi", "Assiya Ferkoussi"],
    ["Zakariya Ezzarouali", "Assiya Ferkoussi"],
    ["Abderrazaq Essadraty", "Hakim Ziyady"],
    ["Anass Boudra", "Hakim Ziyady"],
    ["Anouar Rahhal", "Hakim Ziyady"],
    ["Awatif Ben Zakour", "Hakim Ziyady"],
    ["Fayza Chrigui", "Hakim Ziyady"],
    ["Ghita El Azhary", "Hakim Ziyady"],
    ["Hanane Hajli", "Hakim Ziyady"],
    ["Hiba Ben Zakour", "Hakim Ziyady"],
    ["Mohammed Ben Tahra", "Hakim Ziyady"],
    ["Radouane Ed Daouy", "Hakim Ziyady"],
    ["Salma Nfissi", "Hakim Ziyady"],
    ["Samira Morchid", "Hakim Ziyady"],
    ["Youssef Damen", "Hakim Ziyady"],
    ["Zakaria Laachari", "Hakim Ziyady"],
    ["Zineb Jrhal", "Hakim Ziyady"],
    ["Asmae Fatih", "Houda Benmessaoud"],
    ["Ayoub Benyamna", "Houda Benmessaoud"],
    ["Chaymae Ait Raho", "Houda Benmessaoud"],
    ["El Mehdi Er Rasfi", "Houda Benmessaoud"],
    ["Hafsa El Idrissi", "Houda Benmessaoud"],
    ["Ikrame Zayer", "Houda Benmessaoud"],
    ["Imane El Yaagoubi", "Houda Benmessaoud"],
    ["Islam Ben Et Taleb", "Houda Benmessaoud"],
    ["Meryem Benhamed", "Houda Benmessaoud"],
    ["Mohammed Labrouzy", "Houda Benmessaoud"],
    ["Mohammed Rabeh", "Houda Benmessaoud"],
    ["Nihal Nfissi", "Houda Benmessaoud"],
    ["Nouhaila Kaddouri", "Houda Benmessaoud"],
    ["Saad Lasfar", "Houda Benmessaoud"],
    ["Taha El Alami", "Houda Benmessaoud"],
    ["Yassmine Fakir", "Houda Benmessaoud"],
    ["Abdeljalil Mochreq", "Imane Khouader"],
    ["Abdessamad Mouchrif", "Imane Khouader"],
    ["Aya El Boukhari", "Imane Khouader"],
    ["Chadi Karim", "Imane Khouader"],
    ["Hafsa Lahsaini", "Imane Khouader"],
    ["Redouane Ait Daoud", "Imane Khouader"],
    ["Souhail Daoufa", "Imane Khouader"],
    ["Taha Daki", "Imane Khouader"],
    ["Ziad Maizya", "Imane Khouader"],
    ["Alae Bouchouk", "Imane Khouader"],
    ["Asmae Laabidi", "Imane Khouader"],
    ["Ayman Bouhaddioui", "Imane Khouader"],
    ["Aymane Elmaizi", "Imane Khouader"],
    ["Doha Elbakkali", "Imane Khouader"],
    ["Khaoula El Hachimi", "Imane Khouader"],
    ["Majda Ait Jennek", "Imane Khouader"],
    ["Marwa Tribkou", "Imane Khouader"],
    ["Mehdi Nadbour", "Imane Khouader"],
    ["Moad Drissi", "Imane Khouader"],
    ["Mohamed Reda Mahssoune", "Imane Khouader"],
    ["Mohammed Chafik Elhaddun", "Imane Khouader"],
    ["Nasr-Eddine Kerroumi", "Imane Khouader"],
    ["Safae Bellamine", "Imane Khouader"],
    ["Siman Saflal", "Imane Khouader"],
    ["Wijdane Bouaoiad", "Imane Khouader"],
    ["Ahmed Sadoq", "Mohammed Khaladi"],
    ["Amal El Oumrani", "Mohammed Khaladi"],
    ["Anass Janah", "Mohammed Khaladi"],
    ["Anouar Kharchoufa", "Mohammed Khaladi"],
    ["Bilal El Mejahedy", "Mohammed Khaladi"],
    ["Hassan Khouaja", "Mohammed Khaladi"],
    ["Hicham Moujahid", "Mohammed Khaladi"],
    ["Houda Yousf Ibrahim", "Mohammed Khaladi"],
    ["Khadija El Hajjaji", "Mohammed Khaladi"],
    ["Khalid Zouar", "Mohammed Khaladi"],
    ["Mohammed Sayyad", "Mohammed Khaladi"],
    ["Oumaima Es Sahli", "Mohammed Khaladi"],
    ["Oussama Cherbak", "Mohammed Khaladi"],
    ["Wadie Kouidi", "Mohammed Khaladi"],
    ["Yassine Tanhim", "Mohammed Khaladi"],
    ["Ayman El Adnany", "Nour El Houda Larhrib"],
    ["Ayyoub Rahmoun", "Nour El Houda Larhrib"],
    ["Douae Alkhir Afouraou", "Nour El Houda Larhrib"],
    ["Houda Echarkaoui", "Nour El Houda Larhrib"],
    ["Ikram Elahadi", "Nour El Houda Larhrib"],
    ["Ismail El Ouali Alami", "Nour El Houda Larhrib"],
    ["Kawtar Farai", "Nour El Houda Larhrib"],
    ["Manar Nhaili", "Nour El Houda Larhrib"],
    ["Meryem Maizi", "Nour El Houda Larhrib"],
    ["Mouad Essalki", "Nour El Houda Larhrib"],
    ["Sara Lahsaini", "Nour El Houda Larhrib"],
    ["Taha Salim", "Nour El Houda Larhrib"],
    ["Yassine El Asraoui", "Nour El Houda Larhrib"],
    ["Yassine Soudani", "Nour El Houda Larhrib"],
    ["Yassir Benzakour", "Nour El Houda Larhrib"],
    ["Youssef El Hilali", "Nour El Houda Larhrib"],
    ["Iman Bel Hadri", "Omar Mzaouri"],
    ["Hasnae El Belghiti", "Omar Mzaouri"],
    ["Aziza El Omri", "Omar Mzaouri"],
    ["Hamza Foullani", "Omar Mzaouri"],
    ["Salma Ben Mallouk", "Omar Mzaouri"],
    ["Yousra Rachd", "Omar Mzaouri"],
    ["Malika Echamah", "Omar Mzaouri"],
    ["Abdelmalek Iazzaoui", "Omar Mzaouri"],
    ["Nassime Aourir", "Omar Mzaouri"],
    ["Zakaria Es Samadi", "Omar Mzaouri"],
    ["Achouak Etarari", "Omar Mzaouri"],
    ["Badr Eddine Cherkaoui", "Omar Mzaouri"],
    ["Fadi Ouahbi", "Omar Mzaouri"],
    ["Hajar Idsaid", "Omar Mzaouri"],
    ["Hassan Bjtit", "Omar Mzaouri"],
    ["Hiba Khalil", "Omar Mzaouri"],
    ["Marouane El Houss", "Omar Mzaouri"],
    ["Meryem Habbass", "Omar Mzaouri"],
    ["Mohcine Rabah", "Omar Mzaouri"],
    ["Nada Fars", "Omar Mzaouri"],
    ["Oumaima Ouamou", "Omar Mzaouri"],
    ["Oussama Laajel", "Omar Mzaouri"],
    ["Rayane Hamama", "Omar Mzaouri"],
    ["Younous Belfkih", "Omar Mzaouri"],
    ["Amine Ouaziz", "Rihab Lasri"],
    ["Doha Wahdani", "Rihab Lasri"],
    ["Ferdaous Agourari", "Rihab Lasri"],
    ["Hamza Joorane", "Rihab Lasri"],
    ["Hassan El Idrissi", "Rihab Lasri"],
    ["Ismail Gaiz", "Rihab Lasri"],
    ["Meryem Alami", "Rihab Lasri"],
    ["Meryem Bousseta", "Rihab Lasri"],
    ["Nouamane Alizou", "Rihab Lasri"],
    ["Oussama Chatir", "Rihab Lasri"],
    ["Rachad Hatri", "Rihab Lasri"],
    ["Rania El Khattabi", "Rihab Lasri"],
    ["Reda El Haidouri", "Rihab Lasri"],
    ["Rime Abdellaoui", "Rihab Lasri"],
    ["Samah Ait Salah", "Rihab Lasri"],
    ["Walid Ouardi", "Rihab Lasri"],
    ["Abdessamad El Hamraoui", "Salah Eddine Ajlil"],
    ["Achraf Hamyouy", "Salah Eddine Ajlil"],
    ["Asma El Fahim", "Salah Eddine Ajlil"],
    ["Fatima Zahra El Azhary", "Salah Eddine Ajlil"],
    ["Haytam Brada", "Salah Eddine Ajlil"],
    ["Hiba Mrani Alaoui", "Salah Eddine Ajlil"],
    ["Houria Rhanimi", "Salah Eddine Ajlil"],
    ["Houssam Aboubi", "Salah Eddine Ajlil"],
    ["Houssam Tiabi", "Salah Eddine Ajlil"],
    ["Jihane Riyani", "Salah Eddine Ajlil"],
    ["Mohamed El Khayar", "Salah Eddine Ajlil"],
    ["Nora Ouahib", "Salah Eddine Ajlil"],
    ["Safaa El Haim", "Salah Eddine Ajlil"],
    ["Taha Yassine Abouabdellah", "Salah Eddine Ajlil"],
    ["Ayoub Benellouti", "Salma Azouz"],
    ["Azzeddine Raiss", "Salma Azouz"],
    ["Fatima Zahra El Jabiri", "Salma Azouz"],
    ["Hiba Boudrafte", "Salma Azouz"],
    ["Hiba Mzannah", "Salma Azouz"],
    ["Houda Khouya", "Salma Azouz"],
    ["Kawtar Attia", "Salma Azouz"],
    ["Khadija Hamza", "Salma Azouz"],
    ["Mehdi Touab", "Salma Azouz"],
    ["Mohamed Mhaouch", "Salma Azouz"],
    ["Mouad Oubelahcen", "Salma Azouz"],
    ["Mouad Oulahyane", "Salma Azouz"],
    ["Nabil El Meguioui", "Salma Azouz"],
    ["Nossaiba Nouini", "Salma Azouz"],
    ["Oumaima Aboutahir", "Salma Azouz"],
    ["Oumaima Touil", "Salma Azouz"],
    ["Oumayma Ami", "Salma Azouz"],
    ["Oussama Filali", "Salma Azouz"],
    ["Salma Bennani", "Salma Azouz"],
    ["Soufiane Hissi", "Salma Azouz"],
    ["Soukaina El Hammoudani", "Salma Azouz"],
    ["Abdelhak Ibn El Ahmar", "Achraf Moujahid"],
    ["Abderrahman Mouilly", "TBD"],
    ["Adam Ettabib", "Achraf Moujahid"],
    ["Alaa Laknaoui", "TBD"],
    ["Amal Hadday", "Achraf Moujahid"],
    ["Amina Makdouf", "Achraf Moujahid"],
    ["Ayman Zrif", "Achraf Moujahid"],
    ["Dounia El Khattabi", "TBD"],
    ["Fatene Hajar", "Mohammed Khaladi"],
    ["Fatima Ezzahraa Atif", "TBD"],
    ["Fatima Zahrae Moussaid", "TBD"],
    ["Hatim Daghouj", "Mohammed Khaladi"],
    ["Houssame Dahak", "TBD"],
    ["Intissar El Makaoui", "TBD"],
    ["Kaoutar Benhelli", "Achraf Moujahid"],
    ["Kaoutar Essaissi", "Achraf Moujahid"],
    ["Khalil Nassoukhi", "TBD"],
    ["Laila Arrache", "TBD"],
    ["Mohamed Hatim Essaadaoui", "TBD"],
    ["Mohammed Taha Snah", "TBD"],
    ["Mustapha Badih", "TBD"],
    ["Nacer Es Soujaa El Hassan", "TBD"],
    ["Nada Ben Fares", "TBD"],
    ["Nada Benichou", "TBD"],
    ["Nassim Taous", "TBD"],
    ["Nouhaila Zemrani", "TBD"],
    ["Othman Belbennar", "TBD"],
    ["Rajae Cherkaoui El Maataoui", "TBD"],
    ["Seif Eddine Boukhchen", "TBD"],
    ["Taha Yassine Karim", "TBD"],
    ["Yasser Hayah", "TBD"],
    ["Yassine El Hilali", "TBD"],
    ["Youssef El Bouchtaoui", "TBD"],
    ["Loubna Sttaf", "TBD"]
];

const associates: User[] = RAW_ASSOCIATE_DATA.map(([assocName, managerName]) => {
  // If TBD, we don't assign a manager ID, or we leave it undefined
  const mgrId = managerName === "TBD" ? undefined : createId(managerName);
  
  return {
    id: createId(assocName),
    username: createUsername(assocName),
    name: assocName,
    role: UserRole.USER,
    password: 'password', // Default password
    isApproved: true,
    managerId: mgrId
  };
});

// 3. Admin User - Single Source of Truth for Abdessamad
const adminUser: User = { 
  id: createId('Abdessamad Nahid'), 
  username: 'conan.sb3', 
  name: 'Abdessamad Nahid', 
  role: UserRole.ADMIN, 
  password: 'password', 
  isApproved: true,
  managerId: createId('Rihab Lasri') // Linked to Rihab Lasri
};

// 4. Final Seed Array
const SEED_USERS: User[] = [adminUser, ...managers, ...associates];

// Helper for local storage
const LOCAL_USERS_KEY = 'app_users_backup';
const LOCAL_FEEDBACKS_KEY = 'app_feedbacks_backup';
const LOCAL_LOGS_KEY = 'audit_logs_backup';
const LOCAL_NOTES_KEY = 'user_notes_backup';
const LOCAL_ANNOUNCEMENTS_KEY = 'app_announcements_backup';
const LOCAL_NOTIFICATIONS_KEY = 'user_notifications_backup';

// SQL Scripts for Developer Reference
const SQL_SETUP_SCRIPT = `
-- (omitted for brevity, same as before)
`;

export const storageService = {
  initialize: async () => {
    // 1. Initialize Local Storage with Seed Data if empty
    const currentLocal = localStorage.getItem(LOCAL_USERS_KEY);
    let currentUsers: User[] = currentLocal ? JSON.parse(currentLocal) : [];
    
    // --- SPECIAL FIX: CLEANUP DUPLICATE AND ENFORCE HIERARCHY FOR ABDESSAMAD NAHID ---
    // Ensure Abdessamad Nahid is present, single, and reports to Rihab Lasri.
    if (currentUsers.length > 0) {
        const targetManagerId = createId('Rihab Lasri');
        // Check if correct user already exists
        const correctUser = currentUsers.find(u => u.name === 'Abdessamad Nahid' && u.username === 'conan.sb3' && u.managerId === targetManagerId);
        // Check if duplicates exist
        const abdessamadCount = currentUsers.filter(u => u.name === 'Abdessamad Nahid').length;
        
        // Needs fix if: duplicate count is wrong OR the correct user structure (with managerId) is not found
        const needsFix = abdessamadCount !== 1 || !correctUser;

        if (needsFix) {
             console.log('Correcting Abdessamad Nahid user data and hierarchy...');
             
             // Preserve password if possible from an existing entry
             const existing = currentUsers.find(u => u.name === 'Abdessamad Nahid');
             const passwordToUse = existing ? existing.password : adminUser.password;

             // Remove ALL instances of Abdessamad
             currentUsers = currentUsers.filter(u => u.name !== 'Abdessamad Nahid');
             
             // Add the SINGLE correct instance with the correct managerId from adminUser
             currentUsers.push({
                 ...adminUser,
                 password: passwordToUse
             });
             
             // Save back immediately
             localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(currentUsers));
        }
    }
    
    // Standard Seed Logic for new devices
    if (!currentLocal || currentUsers.length < SEED_USERS.length - 10) {
      console.log('Seeding full staff list...');
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_USERS));
    }
    
    if (!localStorage.getItem(LOCAL_FEEDBACKS_KEY)) {
      localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify([]));
    }

    // 2. Try Database Connection
    try {
      const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      if (error) {
         // Offline mode logic
         return;
      }
      if (count === 0) {
        // Seed DB if empty
        const chunkSize = 50;
        for (let i = 0; i < SEED_USERS.length; i += chunkSize) {
            const chunk = SEED_USERS.slice(i, i + chunkSize);
            await supabase.from('users').insert(chunk);
        }
      }
    } catch (error) {
      console.warn('Database Connection Exception (Offline Mode):', error);
    }
  },

  getUsers: async (): Promise<User[]> => {
    let dbUsers: User[] = [];
    let usedDB = false;
    
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        dbUsers = data;
        usedDB = true;
      }
    } catch (e) {}

    const localUsersStr = localStorage.getItem(LOCAL_USERS_KEY);
    const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : SEED_USERS;

    let finalUsers: User[] = [];

    if (usedDB) {
        finalUsers = dbUsers.map(dbUser => {
            const localMatch = localUsers.find(l => l.id === dbUser.id);
            if (dbUser.managerId === undefined && localMatch?.managerId) {
                return { ...dbUser, managerId: localMatch.managerId };
            }
            return dbUser;
        });
        const dbIds = new Set(dbUsers.map(u => u.id));
        const localOnly = localUsers.filter(u => !dbIds.has(u.id));
        finalUsers = [...finalUsers, ...localOnly];
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(finalUsers));
    } else {
        finalUsers = localUsers;
    }
    
    // Double check on read (Runtime protection against duplicates showing in UI)
    const abdessamadEntries = finalUsers.filter(u => u.name === 'Abdessamad Nahid');
    if (abdessamadEntries.length > 1) {
        // Keep only the one with username 'conan.sb3' or the last one
        const correctOne = abdessamadEntries.find(u => u.username === 'conan.sb3') || abdessamadEntries[abdessamadEntries.length - 1];
        finalUsers = finalUsers.filter(u => u.name !== 'Abdessamad Nahid');
        finalUsers.push(correctOne);
    }

    return finalUsers;
  },

  // ... (rest of methods remain unchanged) ...
  saveUser: async (user: User) => {
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const index = localUsers.findIndex((u: User) => u.id === user.id);
    if (index >= 0) localUsers[index] = user;
    else localUsers.push(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    try { await supabase.from('users').upsert(user); } catch (e) { console.warn('DB Save failed'); }
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      const filtered = localUsers.filter((u: User) => u.id !== userId);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(filtered));
      
      const localFeedbacks = JSON.parse(localStorage.getItem(LOCAL_FEEDBACKS_KEY) || '[]');
      const cleanFeedbacks = localFeedbacks.filter((f: Feedback) => f.fromUserId !== userId && f.toUserId !== userId);
      localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(cleanFeedbacks));
    } catch (e) { }

    try {
      await supabase.from('feedbacks').delete().eq('fromUserId', userId);
      await supabase.from('feedbacks').delete().eq('toUserId', userId);
      await supabase.from('audit_logs').delete().eq('userId', userId);
      await supabase.from('notes').delete().eq('userId', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      return true; 
    }
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    let dbData: Feedback[] = [];
    try {
      const { data, error } = await supabase.from('feedbacks').select('*');
      if (!error && data) dbData = data;
    } catch (e) {}
    
    const localStr = localStorage.getItem(LOCAL_FEEDBACKS_KEY);
    const localData: Feedback[] = localStr ? JSON.parse(localStr) : [];

    const localMap = new Map(localData.map(item => [item.id, item]));
    const mergedMap = new Map<string, Feedback>();

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

    localMap.forEach((val, key) => {
        mergedMap.set(key, val);
    });

    const merged = Array.from(mergedMap.values());
    localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(merged));
    return merged;
  },

  saveFeedback: async (feedback: Feedback) => {
    const existingFeedbacks: Feedback[] = JSON.parse(localStorage.getItem(LOCAL_FEEDBACKS_KEY) || '[]');
    const previous = existingFeedbacks.find(f => f.id === feedback.id);
    const isNew = !previous;
    const approvalChanged = previous && previous.approvalStatus !== feedback.approvalStatus;

    const index = existingFeedbacks.findIndex((f: Feedback) => f.id === feedback.id);
    if (index >= 0) existingFeedbacks[index] = feedback;
    else existingFeedbacks.push(feedback);
    localStorage.setItem(LOCAL_FEEDBACKS_KEY, JSON.stringify(existingFeedbacks));

    try { await supabase.from('feedbacks').upsert(feedback); } catch (e) {}

    try {
        if (isNew) {
            const allUsers = await storageService.getUsers();
            const managers = allUsers.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
            for (const mgr of managers) {
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
            await storageService.saveNotification({
                id: Date.now().toString() + Math.random().toString().slice(2, 6),
                userId: feedback.fromUserId,
                type: NotificationType.REPORT_STATUS,
                title: `Report ${feedback.approvalStatus}`,
                message: `Your report regarding ${feedback.processType} has been ${feedback.approvalStatus.toLowerCase()}.`,
                isRead: false,
                timestamp: Date.now()
            });
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
    } catch (err) {}
  },

  getLogs: async (): Promise<AuditLog[]> => {
    let dbLogs: AuditLog[] = [];
    let localLogs: AuditLog[] = [];
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
      if (!error && data) dbLogs = data;
    } catch (e) {}
    try {
      const stored = localStorage.getItem(LOCAL_LOGS_KEY);
      if (stored) localLogs = JSON.parse(stored);
    } catch (e) {}
    const allLogs = [...dbLogs, ...localLogs];
    const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
    return uniqueLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 500);
  },

  saveLog: async (log: AuditLog) => {
    try {
        const stored = localStorage.getItem(LOCAL_LOGS_KEY);
        let logs: AuditLog[] = stored ? JSON.parse(stored) : [];
        logs.unshift(log); 
        if (logs.length > 500) logs = logs.slice(0, 500);
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {}
    try { supabase.from('audit_logs').insert(log).then(() => {}); } catch (e) {}
  },

  getNotes: async (userId: string): Promise<Note[]> => {
    let dbNotes: Note[] = [];
    let localNotes: Note[] = [];
    try {
      const { data, error } = await supabase.from('notes').select('*').eq('userId', userId);
      if (!error && data) dbNotes = data;
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
    return uniqueNotes.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  },

  saveNote: async (note: Note) => {
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      let notes: Note[] = stored ? JSON.parse(stored) : [];
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) notes[idx] = note;
      else notes.push(note);
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {}
    try { await supabase.from('notes').upsert(note); } catch(e) {}
  },

  deleteNote: async (noteId: string) => {
    try {
      const stored = localStorage.getItem(LOCAL_NOTES_KEY);
      if (stored) {
        let notes: Note[] = JSON.parse(stored);
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
      }
    } catch (e) {}
    try { await supabase.from('notes').delete().eq('id', noteId); } catch(e) {}
  },

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
     const stored = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
     stored.push(announcement);
     localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(stored));
     try { await supabase.from('announcements').insert(announcement); } catch(e) {}
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
     } catch (err) {}
  },

  deleteAnnouncement: async (id: string) => {
     const stored = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
     const filtered = stored.filter((a: Announcement) => a.id !== id);
     localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(filtered));
     try { await supabase.from('announcements').delete().eq('id', id); } catch(e) {}
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    let dbData: Notification[] = [];
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId);
      if (!error && data) dbData = data;
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
     try {
       const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
       const notes: Notification[] = stored ? JSON.parse(stored) : [];
       notes.push(notification);
       if(notes.length > 200) notes.shift(); 
       localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notes));
     } catch(e) {}
     try { await supabase.from('notifications').insert(notification); } catch(e) {}
  },

  markNotificationRead: async (id: string) => {
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
     try { await supabase.from('notifications').update({ isRead: true }).eq('id', id); } catch(e) {}
  },

  markAllNotificationsRead: async (userId: string) => {
     try {
       const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
       if (stored) {
         let notes: Notification[] = JSON.parse(stored);
         notes = notes.map(n => n.userId === userId ? { ...n, isRead: true } : n);
         localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notes));
       }
     } catch(e) {}
     try { await supabase.from('notifications').update({ isRead: true }).eq('userId', userId); } catch(e) {}
  }
};

storageService.initialize();
