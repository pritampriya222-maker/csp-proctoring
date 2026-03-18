import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
      global: {
        fetch: (url, options) => {
          if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            return Promise.resolve(new Response(
              JSON.stringify({ error: 'Supabase Environment Variables missing in Vercel!', error_description: 'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel project settings.' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ));
          }
          return fetch(url, options);
        }
      }
    }
  );
}
