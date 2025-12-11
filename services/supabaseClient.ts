import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytltxdpyphlzfqmawtgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bHR4ZHB5cGhsemZxbWF3dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Nzc1ODMsImV4cCI6MjA4MTA1MzU4M30.F4XT7xQKM_2WaX8ysITRMH1bKHJ_dTfsJDJ9LBrPQl0';

export const supabase = createClient(supabaseUrl, supabaseKey);