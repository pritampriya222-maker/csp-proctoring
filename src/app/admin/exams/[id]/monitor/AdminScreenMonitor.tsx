'use client'

import { useState, useEffect } from 'react'
import { LiveKitRoom, useTracks, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Loader2 } from 'lucide-react'

// The core wrapper that fetches the token and connects to the room
export default function AdminScreenMonitor({ sessionId, studentName }: { sessionId: string, studentName: string }) {
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${sessionId}&username=admin-viewer`)
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
        } else {
          setError(data.error || 'Failed to get token')
        }
      } catch (e) {
        setError('Network error getting token')
      }
    }
    fetchToken()
  }, [sessionId])

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">Error connecting to live stream: {error}</div>
  }

  // Only render the wrapper UI when loading or token missing
  if (!token || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg animate-pulse h-64 border border-gray-200 border-dashed">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
        <p>Connecting securely to {studentName}&apos;s Live Screen...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-black min-h-[300px] relative shadow-inner">
       {/* We connect as a subscriber (no video/audio publishing from admin) */}
       <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
       >
         <ScreenView />
       </LiveKitRoom>
    </div>
  )
}

// Inner component that extracts and renders the remote screen track
function ScreenView() {
  // Find any published ScreenShare tracks in this room
  // Setting updateOnlyOn to an empty array makes it re-evaluate whenever ANY track changes
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }], 
    { onlySubscribed: false }
  )
  
  if (tracks.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
        <MonitorOffIcon size={48} className="mb-4 opacity-50" />
        <p className="font-medium text-lg">No Active Screen Stream</p>
        <p className="text-sm mt-2 opacity-75">The student has not started sharing their screen yet, or their connection dropped.</p>
      </div>
    )
  }

  // Render the first screen track found
  const trackRef = tracks[0] as any

  return (
    <div className="w-full h-full">
      <VideoTrack 
        trackRef={trackRef} 
        className="w-full h-full object-contain bg-black" 
      />
    </div>
  )
}

// Simple icon for when screen is entirely missing
function MonitorOffIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17 17H5a2 2 0 0 1-2-2V5c0-1.5 1-2 2-2h14c1.1 0 2 .5 2 2v10a2 2 0 0 1-2 2h-2m-4 0v4m-4-4v4m-2 0h8"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
