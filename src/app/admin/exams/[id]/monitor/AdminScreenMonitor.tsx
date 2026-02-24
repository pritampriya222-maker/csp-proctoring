'use client'

import { useState, useEffect } from 'react'
import { LiveKitRoom, useTracks, VideoTrack, useRoomContext } from '@livekit/components-react'
import { Track, RoomEvent } from 'livekit-client'
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

// Inner component that extracts and renders remote tracks
function ScreenView() {
  const room = useRoomContext()
  
  useEffect(() => {
    if (!room) return
    const handleTrackSubscribed = (track: Track) => console.log('Subscribed to track:', track.source)
    const handleTrackPublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare || publication.source === Track.Source.Camera) {
        publication.setSubscribed(true)
      }
    }

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    room.on(RoomEvent.TrackPublished, handleTrackPublished)
    
    room.remoteParticipants.forEach(p => {
      p.trackPublications.forEach(pub => {
        if (!pub.isSubscribed) pub.setSubscribed(true)
      })
    })

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.off(RoomEvent.TrackPublished, handleTrackPublished)
    }
  }, [room])

  // Track both ScreenShare and Camera
  const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }])
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }])
  
  if (screenTracks.length === 0 && cameraTracks.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-foreground p-6 text-center bg-[#0B0F14]">
        <div className="bg-destructive/10 p-5 rounded-full border border-destructive/20 mb-4 animate-pulse">
           <MonitorOffIcon size={40} className="text-destructive" />
        </div>
        <p className="font-black uppercase tracking-widest text-xs">Waiting for Data Stream</p>
        <p className="text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest max-w-[200px]">Candidate has not initialized media publishing protocols.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[400px] bg-black">
      {/* Primary View (Screen) */}
      <div className={`relative flex-1 bg-black ${cameraTracks.length > 0 ? 'h-2/3' : 'h-full'}`}>
        {screenTracks.length > 0 ? (
          <VideoTrack trackRef={screenTracks[0] as any} className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-20 text-foreground">Screen Stream Inactive</span>
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10">Primary Display</div>
      </div>

      {/* Secondary View (Cameras) */}
      {cameraTracks.length > 0 && (
        <div className={`h-1/3 border-t border-border bg-card/10 grid ${cameraTracks.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 p-1`}>
           {cameraTracks.map((track, idx) => {
             const trackName = track.publication?.trackName || ''
             const isCandidateCamera = trackName === 'candidate-camera'
             const isMobile = track.participant.identity.includes('mobile')
             
             return (
               <div key={track.participant.identity + idx} className="relative group bg-black rounded-lg overflow-hidden border border-white/5">
                  <VideoTrack 
                     trackRef={track as any} 
                     className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[7px] font-black text-white uppercase tracking-widest border border-white/10">
                     {isCandidateCamera ? 'Direct Candidate Feed' : isMobile ? 'Lateral View' : `Auxiliary Feed (${idx + 1})`}
                  </div>
               </div>
             )
           })}
        </div>
      )}
    </div>
  )
}

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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
