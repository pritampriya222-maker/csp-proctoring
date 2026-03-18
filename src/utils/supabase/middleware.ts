import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback gracefully without hanging if vars are totally missing
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return supabaseResponse
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if the route is publicly accessible, skip the potentially slow DB network
    // request if it's not strictly necessary. Note that client-side JS still refreshes tokens.
    const isPublic = 
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/_next')

    if (isPublic) {
      return supabaseResponse
    }

    // Wrap the getUser() request in a reasonable timeout so we never hit 
    // Vercel's global Gateway Timeout limit (Code: MIDDLEWARE_INVOCATION_TIMEOUT)
    const { data: { user } } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) => 
        setTimeout(() => resolve({ data: { user: null } }), 3000)
      )
    ]);

    if (!user) {
      // no user found or request timed out, redirect to login for protected routes
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    return supabaseResponse
  } catch (err) {
    // If Supabase URL is completely missing or there's an error, just let the page render loosely
    return supabaseResponse
  }
}
