// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qzrmrecfzbzhfbkeckau.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cm1yZWNmemJ6aGZia2Vja2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTMzMjYsImV4cCI6MjA2NzUyOTMyNn0.9pI9enDxhf7cVD9mpbfANjX5cDsGdJSiyQicKTdSQg0";

export const supabase = createClient(supabaseUrl, supabaseKey);
