
export enum UserRole {
  USER = 'USER',       // Colleague
  MANAGER = 'MANAGER', // Previously Admin/Manager
  ADMIN = 'ADMIN',     // Previously Superuser/Root
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // In a real app, this would be hashed. Mocking here.
}

export const PROCESS_TYPES = [
  'Wrong Process',
  'First Point Resolution',
  'Wrong Department',
  'Investigation',
  'Behavior',
  'Replacement & Refund',
  'Return To Sender',
  'Process/Pending Status'
] as const;

export type ProcessType = typeof PROCESS_TYPES[number];

export const SCENARIO_TAGS = [
  'SUPPLIER REFERRAL (OSO)',
  'SLA BREACH (FULL R/R & RTS)',
  'SLA COMPLIANCE (REQUIRED WAIT)',
  'SLA BREACH (IMMINENT DELIVERY)',
  'MISSING ITEM (OH REVIEW)',
  'SHIPPING ERROR (FAILED LABEL)',
  'TRANSFER TO R/R DEPT',
  'PARCEL DAMAGED',
  'COLLECTION FAILURE (NRBD2)',
  'APPLE NRBD2 ESCALATION',
  'CARRIER RE-ATTEMPT ARRANGED',
  'PENDING ORDER (CARD ISSUE)',
  'DELIVERY DISPUTE (INVESTIGATION)',
  'RTS FOLLOW-UP (R/R)',
  'SLA BREACH (END-OF-DAY ATTEMPT)',
  'NRBD2 (MANUAL CONFIRM)',
  'ITEM DAMAGED (EXCHANGE)',
  'DELIVERY MONITOR (24H WAIT)',
  'SHIPMENT STALLED (3 DAYS NO UPDATE)',
  'LOST IN TRANSIT (RTS REQUIRED)',
  'PRE-SHIPMENT LOSS (NO RTS)'
] as const;

export type ScenarioTag = typeof SCENARIO_TAGS[number];

export enum ResolutionStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  CLOSED_RESOLVED = 'Closed/Resolved',
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface Feedback {
  id: string;
  fromUserId: string;
  toUserId: string;
  
  // New Fields
  reportDate: string; // YYYY-MM-DD
  orderNumber: string;
  caseNumber: string;
  faultDescription: string;
  
  processType: ProcessType;
  scenarioTag: ScenarioTag | '';
  resolutionStatus: ResolutionStatus;
  approvalStatus: ApprovalStatus; // New Field for Manager Triage
  priority: Priority;
  
  feedbackContent: string; // The "Feedback" text area
  additionalNotes: string;
  resolutionDate: string; // YYYY-MM-DD
  
  managerNotes?: string; // New: Reason for Rejection or Coaching for Approval

  timestamp: number;
  aiAnalysis?: string;
}

export type AnnouncementType = 'GENERAL' | 'ALERT' | 'SUCCESS' | 'MAINTENANCE' | 'POLICY';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  isImportant: boolean;
  type: AnnouncementType;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: number;
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
export type NoteFontSize = 'sm' | 'base' | 'lg' | 'xl';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: NoteColor;
  fontSize: NoteFontSize;
  orderIndex: number;
  timestamp: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
