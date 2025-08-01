import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://wbubzpuswvmrehcpixsv.supabase.co';
const supabaseKey = 'sb_publishable_OHL1pbL3-j4C2YjpCBBqWQ_qiHvebEG';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };