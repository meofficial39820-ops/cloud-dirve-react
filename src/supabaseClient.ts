import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvcbbodmfpltdcbafyiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y2Jib2RtZnBsdGRjYmFmeWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTE4ODcsImV4cCI6MjA4NDIyNzg4N30.D9WeYwDe-fY2HuAJG2aG5Imr3HXfq2DllKljQ2vY6f0';

export const supabase = createClient(supabaseUrl, supabaseKey);