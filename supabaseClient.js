import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// import { createClient } from "@supabase/supabase-js";
// const supabaseUrl = "https://vjhmhyikyllvpirsjpen.supabase.co";
//   const supabaseRol =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqaG1oeWlreWxsdnBpcnNqcGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTk3OTQ1MiwiZXhwIjoyMDU1NTU1NDUyfQ.XiY1kqhz3gXKPyqWcpJkCY739opjWSURhsOZlSU6VIE";
//   const supabase = createClient(supabaseUrl, supabaseRol, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//     },
//   });
//   // Access auth admin api
//   const adminAuthClient = supabase.auth.admin;

//   const fun = async () => {
//     const {
//       data: { users },
//       error,
//     } = await supabase.auth.admin.listUsers({
//       page: 1,
//       perPage: 10,
//     });
//     console.log(users, error);
//   };
//   fun();
