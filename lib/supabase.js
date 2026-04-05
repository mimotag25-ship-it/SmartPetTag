import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wrvgguyaerfyvgnigrky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydmdndXlhZXJmeXZnbmlncmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDY0MDQsImV4cCI6MjA5MDkyMjQwNH0.OUhAEEhMTgCm7KxZVDeVm0-ftSV_g8GdQuvyN8wJKVw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);