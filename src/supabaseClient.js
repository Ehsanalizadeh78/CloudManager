import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://focaqgkpphkuezccvvaz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvY2FxZ2twcGhrdWV6Y2N2dmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjk2NDIsImV4cCI6MjA2NzkwNTY0Mn0.5cHOZTI96P7iqCwY60mIu5cERsNnBAZwyxflYHLN5EA";

export const supabase = createClient(supabaseUrl, supabaseKey);
const { data: userData } = await supabase.auth.getUser();
console.log("User ID:", userData.user.id);

const { data, error } = await supabase.storage
  .from("uploads")

if (error) {
  console.error("Upload error:", error.message);
} else {
  console.log("Upload success:", data);
}

