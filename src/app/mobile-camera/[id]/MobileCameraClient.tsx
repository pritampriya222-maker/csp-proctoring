'use client'

import { useState, useEffect, useRef } from 'react'
import { Video, ShieldCheck, WifiOff } from 'lucide-react'

export default function MobileCameraClient({ pairingId }: { pairingId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<'requesting' | 'connected' | 'disconnected' | 'error'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // 1. Request Camera Permission
    let localStream: MediaStream;
    let peerInstance: any;
    let retryTimeout: any;

    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // usually best for scanning desk
          audio: false // Desktop handles audio
        })
        setStream(localStream)
        if (videoRef.current) {
          videoRef.current.srcObject = localStream
        }
        
        // 2. Connect to Desktop via PeerJS
        import('peerjs').then(({ default: Peer }) => {
          // Anonymous peer for the mobile client
          peerInstance = new Peer()
          
          const connectToDesktop = () => {
             if (!peerInstance || peerInstance.destroyed) return
             
             // WE call the desktop (Desktop acts as the server listening on pairingId)
             const call = peerInstance.call(pairingId, localStream)
             
             // Desktop receives call but sends nothing back
             
             // Check connection health using a data channel
             const dataConn = peerInstance.connect(pairingId)
             dataConn.on('open', () => {
                setStatus('connected')
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
             console.log("PeerJS error", err)
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

    // Wake Lock to prevent screen sleep (if supported)
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    }
    requestWakeLock()
    
    // Also listen for visibility change to re-request WakeLock if user switches app and comes back
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

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col h-[80vh]">
      <div className="p-4 bg-black flex justify-between items-center border-b border-gray-800">
         <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-500" />
            <span className="text-white font-medium">Proctoring Cam</span>
         </div>
         {status === 'connected' ? (
           <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 animate-pulse">
             LIVE
           </span>
         ) : status === 'disconnected' ? (
           <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
             RECONNECTING
           </span>
         ) : status === 'requesting' ? (
           <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/30">
             WAITING
           </span>
         ) : null}
      </div>

      <div className="flex-1 relative bg-black">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
         />
         
         {status === 'disconnected' && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm z-10">
             <WifiOff size={48} className="text-orange-500 mb-4" />
             <p className="text-white font-medium mb-2">Connection Lost</p>
             <p className="text-gray-400 text-sm">Attempting to reconnect to exam desktop session...</p>
           </div>
         )}

         {status === 'error' && (
           <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 z-10">
             <Video size={48} className="text-red-500 mb-4" />
             <p className="text-white font-medium mb-2">Camera Error</p>
             <p className="text-red-400 text-sm">{errorMsg}</p>
             <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm cursor-pointer">
               Retry Camera
             </button>
           </div>
         )}
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <p className="text-gray-400 text-xs text-center">
          Place your phone so your desk and hands are clearly visible to the invigilator. Do not close this browser tab.
        </p>
      </div>
    </div>
  )
}
