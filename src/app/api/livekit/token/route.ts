import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room')
  const username = request.nextUrl.searchParams.get('username')
  
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 })
  }
  if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 })
  }

  // 1. Authenticate user via Supabase to ensure they're allowed
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
           // Readonly in Route Handlers
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Identify token privileges
  // Admin -> can subscribe to streams
  // Student -> can publish streams
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // 2. Generate LiveKit Token
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    // Add custom metadata (like role) if desired
    metadata: JSON.stringify({ role: profile?.role || 'student' }),
  })

  // Assign permissions based on role
  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: !isAdmin,       // Students publish, Admins just watch
    canSubscribe: true,         // Admins subscribe (and students technically can too if needed)
    canPublishData: true,      
  })

  return NextResponse.json({ token: await at.toJwt() })
}
