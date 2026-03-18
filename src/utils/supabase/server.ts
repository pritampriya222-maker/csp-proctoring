import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
      global: {
        fetch: (url, options) => {
          if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            // Intercept the fetch to return a clear JSON error instead of crashing Node with `fetch failed`
            return Promise.resolve(new Response(
              JSON.stringify({ error: 'Supabase Environment Variables missing in Vercel!', error_description: 'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel project settings.' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ));
          }
          return fetch(url, options);
        }
      }
    }
  )
}
