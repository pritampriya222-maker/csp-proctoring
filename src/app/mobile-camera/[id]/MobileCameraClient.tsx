'use client'

import { useState, useEffect, useRef } from 'react'
import { Video, ShieldCheck, WifiOff, Camera } from 'lucide-react'
import { LiveKitRoom, useLocalParticipant, useConnectionState } from '@livekit/components-react'
import { Track, ConnectionState } from 'livekit-client'

function MobileAutoPublisher({ stream }: { stream: MediaStream | null }) {
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const isPublishedRef = useRef(false)

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || !localParticipant || !stream) return

    if (!isPublishedRef.current) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        console.log("Mobile: Publishing lateral video track...")
        localParticipant.publishTrack(videoTrack, { 
          source: Track.Source.Camera,
          name: 'mobile-camera' 
        }).then(() => {
          isPublishedRef.current = true
          console.log("Mobile: Lateral video track published.")
        }).catch(err => {
          console.error('Mobile: Failed to publish video track:', err)
        })
      }
    }
  }, [localParticipant, connectionState, stream])

  return null
}

export default function MobileCameraClient({ pairingId }: { pairingId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<'requesting' | 'connected' | 'disconnected' | 'error'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // 1. Request Camera Permission
    let localStream: MediaStream;
    let peerInstance: any;
    let retryTimeout: any;

    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, 
          audio: false 
        })
        setStream(localStream)
        if (videoRef.current) {
          videoRef.current.srcObject = localStream
        }
        
        // 2. Connect to Desktop via PeerJS
        import('peerjs').then(({ default: Peer }) => {
          peerInstance = new Peer()
          
          const connectToDesktop = () => {
             if (!peerInstance || peerInstance.destroyed) return
             
             peerInstance.call(pairingId, localStream)
             
             const dataConn = peerInstance.connect(pairingId)
             dataConn.on('open', () => {
                setStatus('connected')
             })
             dataConn.on('data', (data: any) => {
                if (data.sessionId) setSessionId(data.sessionId)
             })
             dataConn.on('close', () => {
                setStatus('disconnected')
                retryTimeout = setTimeout(connectToDesktop, 3000)
             })
             dataConn.on('error', () => {
                setStatus('disconnected')
                retryTimeout = setTimeout(connectToDesktop, 3000)
             })
          }

          peerInstance.on('open', () => {
             connectToDesktop()
          })

          peerInstance.on('error', (err: any) => {
             setStatus('disconnected')
             retryTimeout = setTimeout(connectToDesktop, 3000)
          })
        })

      } catch (err: any) {
        setStatus('error')
        setErrorMsg('Camera access denied or unavailable.')
      }
    }

    start()

    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    }
    requestWakeLock()
    
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (localStream) localStream.getTracks().forEach(t => t.stop())
      if (peerInstance) peerInstance.destroy()
      if (retryTimeout) clearTimeout(retryTimeout)
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [pairingId])

  // 3. Fetch LiveKit Token
  useEffect(() => {
    if (!sessionId) return
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${sessionId}&username=mobile-${pairingId.slice(0, 8)}`)
        const data = await res.json()
        if (data.token) setToken(data.token)
      } catch (e) {
        console.error('Failed to fetch token for mobile cam', e)
      }
    }
    fetchToken()
  }, [sessionId, pairingId])

  return (
    <div className="w-full max-w-sm bg-[#0B0F14] rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col h-[85vh]">
      <div className="p-5 bg-card/50 backdrop-blur-xl flex justify-between items-center border-b border-border">
         <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
               <ShieldCheck size={18} className="text-primary" />
            </div>
            <span className="text-foreground tracking-tight font-black uppercase text-xs">Lateral Monitor</span>
         </div>
         {status === 'connected' ? (
           <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-success text-[10px] font-black uppercase tracking-widest">Live Feed</span>
           </div>
         ) : (
           <div className="flex items-center gap-2 px-3 py-1 bg-warning/10 border border-warning/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-warning" />
              <span className="text-warning text-[10px] font-black uppercase tracking-widest">Syncing</span>
           </div>
         )}
      </div>

      <div className="flex-1 relative bg-black overflow-hidden">
         {/* Internal HUD Display */}
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-80"
         />
         
         {/* LiveKit Shadow Publisher */}
         {token && process.env.NEXT_PUBLIC_LIVEKIT_URL && (
           <LiveKitRoom
             video={false} // Avoid hardware conflict
             audio={false}
             token={token}
             serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
             connect={true}
           >
             <MobileAutoPublisher stream={stream} />
           </LiveKitRoom>
         )}

         <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl text-white">
               <Camera size={16} />
            </div>
         </div>

         {status === 'disconnected' && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md z-30">
             <WifiOff size={48} className="text-warning mb-6 animate-bounce" />
             <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Relay Interrupted</h3>
             <p className="text-secondary-foreground text-xs font-bold uppercase tracking-widest leading-relaxed opacity-60">
               Connection to exam workstation lost. Attempting auto-recovery...
             </p>
           </div>
         )}

         {status === 'error' && (
           <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-8 z-30">
             <Video size={48} className="text-destructive mb-6" />
             <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Media Critical</h3>
             <p className="text-destructive text-xs font-bold uppercase tracking-widest leading-relaxed opacity-80 mb-6">
               {errorMsg}
             </p>
             <button onClick={() => window.location.reload()} className="bg-primary text-white font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
               Initialize Media
             </button>
           </div>
         )}
      </div>

      <div className="p-8 bg-card/20 border-t border-border">
        <p className="text-secondary-foreground text-[10px] font-bold text-center uppercase tracking-[0.2em] leading-relaxed opacity-40">
          SECURE PROTOCOL ACTIVE. POSITION SENSOR TO COVER DESK RADIUS AND MANUAL INPUTS. DO NOT EXIT BROWSER.
        </p>
      </div>
    </div>
  )
}
