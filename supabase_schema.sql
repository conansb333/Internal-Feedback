-- 1. CLEANUP: Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS users;

-- 2. CREATE USERS TABLE
-- We use double quotes around column names (e.g., "fromUserId") to force PostgreSQL 
-- to respect the camelCase used in your TypeScript code.
CREATE TABLE users (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "password" TEXT NOT NULL
);

-- 3. CREATE FEEDBACKS TABLE
CREATE TABLE feedbacks (
  "id" TEXT PRIMARY KEY,
  "fromUserId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "toUserId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "reportDate" TEXT,
  "orderNumber" TEXT,
  "caseNumber" TEXT,
  "faultDescription" TEXT,
  "processType" TEXT,
  "scenarioTag" TEXT,
  "resolutionStatus" TEXT,
  "approvalStatus" TEXT,
  "priority" TEXT,
  "feedbackContent" TEXT,
  "additionalNotes" TEXT,
  "resolutionDate" TEXT,
  "timestamp" BIGINT,
  "aiAnalysis" TEXT
);

-- 4. ENABLE PERMISSIONS (Row Level Security)
-- Since we are using a custom auth implementation in the frontend for this demo,
-- we create public policies to allow the app to Read/Write without Supabase Auth tokens.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Feedbacks" ON feedbacks FOR ALL USING (true) WITH CHECK (true);

-- 5. SEED DATA: USERS
INSERT INTO users ("id", "username", "name", "role", "password") VALUES
('1', 'root', 'Super User', 'ADMIN', 'password'),
('2', 'manager', 'Sarah Connors', 'MANAGER', 'password'),
('3', 'bob', 'Bob Smith', 'USER', 'password'),
('4', 'alice', 'Alice Johnson', 'USER', 'password'),
('5', 'david', 'David Miller', 'USER', 'password'),
('6', 'emily', 'Emily Davis', 'USER', 'password');

-- 6. SEED DATA: FEEDBACK REPORTS
INSERT INTO feedbacks (
  "id", "fromUserId", "toUserId", "reportDate", "orderNumber", "caseNumber", 
  "faultDescription", "processType", "scenarioTag", "resolutionStatus", 
  "approvalStatus", "priority", "feedbackContent", "additionalNotes", 
  "resolutionDate", "timestamp", "aiAnalysis"
) VALUES
(
  'f1', '3', '4', '2024-05-10', 'ORD-9921', 'CASE-101', 
  'Incorrect refund amount processed for customer return.', 
  'Wrong Process', 'TRANSFER TO R/R DEPT', 'Closed/Resolved', 
  'Approved', 'Medium', 
  'Alice, I noticed the refund for order #ORD-9921 was short by $10. It looks like shipping wasn''t refunded manually as per the new policy.', 
  'Resolved after chat with Alice.', '2024-05-11', 1715328000000, 
  'Positive Tone. Issue: Minor process error regarding shipping refunds. Fixed quickly.'
),
(
  'f2', '4', '3', '2024-05-12', 'ORD-9950', 'CASE-105', 
  'Customer complained about rude tone in email response.', 
  'Behavior', 'SLA BREACH (FULL R/R & RTS)', 'Open', 
  'Approved', 'High', 
  'Bob, the customer forwarded me your email. While the policy explanation was correct, the phrasing "It is not our problem" was too harsh.', 
  'Need manager to review email templates.', '', 1715500800000, 
  'Negative Sentiment. Issue: Unprofessional communication tone. Needs coaching.'
),
(
  'f3', '5', '3', '2024-05-14', 'ORD-9988', 'CASE-110', 
  'Forgot to log the return tracking number in CRM.', 
  'Wrong Process', 'MISSING ITEM (OH REVIEW)', 'In Progress', 
  'Approved', 'Low', 
  'Hey Bob, just a heads up, the tracking for case 110 was missing. I added it for you this time.', 
  '', '', 1715673600000, 
  'Neutral. Issue: Data entry oversight. Peer correction.'
),
(
  'f4', '3', '5', '2024-05-15', 'ORD-1001', 'CASE-200', 
  'Excellent handling of the difficult fraud investigation.', 
  'Investigation', 'DELIVERY DISPUTE (INVESTIGATION)', 'Closed/Resolved', 
  'Approved', 'Medium', 
  'David, great job on the fraud case yesterday. You spotted the address mismatch that everyone else missed.', 
  'Kudos', '2024-05-15', 1715760000000, 
  'Positive. Praise for attention to detail in fraud detection.'
),
(
  'f5', '3', '4', '2024-05-16', 'ORD-1022', 'CASE-220', 
  'Sent replacement item without collecting payment for upgrade.', 
  'Replacement & Refund', 'TRANSFER TO R/R DEPT', 'Open', 
  'Pending', 'High', 
  'The customer received the Pro model but only paid for the Base model. We need to recover the cost.', 
  'Escalated to Finance.', '', 1715846400000, 
  NULL
),
(
  'f6', '4', '5', '2024-05-16', 'ORD-1045', 'CASE-245', 
  'Ticket escalated to wrong department (IT instead of Logistics).', 
  'Wrong Department', 'TRANSFER TO R/R DEPT', 'Closed/Resolved', 
  'Rejected', 'Low', 
  'This should have gone to logistics.', 
  'Rejection Note: Actually, IT was correct because it was a system glitch, not a shipping error. - Manager', '', 1715846400000, 
  NULL
);