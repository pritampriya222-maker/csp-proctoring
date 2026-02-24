'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Mic, Monitor, CheckCircle, AlertCircle, ArrowRight, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function ExamSetupClient({ examId, examTitle }: { examId: string, examTitle: string }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [mobileStream, setMobileStream] = useState<MediaStream | null>(null)
  const [pairingId, setPairingId] = useState('')
  
  const [checks, setChecks] = useState({
    camera: { status: 'pending', error: '' },
    mic: { status: 'pending', error: '' },
    screen: { status: 'pending', error: '' },
    mobile: { status: 'pending', error: 'Waiting for phone connection...' }
  })

  // Start Camera and Mic
  const requestMediaPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      
      setChecks(prev => ({
        ...prev,
        camera: { status: 'success', error: '' },
        mic: { status: 'success', error: '' }
      }))
    } catch (err: any) {
      console.error('Media permission error:', err)
      setChecks(prev => ({
        ...prev,
        camera: { status: 'error', error: 'Camera access denied' },
        mic: { status: 'error', error: 'Microphone access denied' }
      }))
    }
  }

  // Request Screen Share
  const requestScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' // Request entire screen
        }
      })
      
      // We don't actually need to show the screen share, we just need permission to grab it later
      // Optional: enforce that it's the full screen
      const track = displayStream.getVideoTracks()[0]
      const settings = track.getSettings()
      
      if (settings.displaySurface !== 'monitor') {
        track.stop()
        setChecks(prev => ({
          ...prev,
          screen: { status: 'error', error: 'You must share your ENTIRE SCREEN, not a window/tab' }
        }))
        return
      }

      // Keep it active but don't show it in the UI here to avoid infinite mirror effect
      track.onended = () => {
        // If they stop sharing early
        setChecks(prev => ({
          ...prev,
          screen: { status: 'error', error: 'Screen sharing was stopped' }
        }))
        setScreenStream(null)
      }

      setScreenStream(displayStream)

      setChecks(prev => ({
        ...prev,
        screen: { status: 'success', error: '' }
      }))

    } catch (err: any) {
      console.error('Screen share error:', err)
      setChecks(prev => ({
        ...prev,
        screen: { status: 'error', error: 'Screen share access denied' }
      }))
    }
  }

  useEffect(() => {
    // Generate a unique pairing ID purely on the client side
    const id = crypto.randomUUID()
    setPairingId(id)
  }, [])

  // Ref to hold streams for cleanup on unmount without triggering effect re-runs
  const streamsRef = useRef<{
    stream: MediaStream | null,
    screenStream: MediaStream | null,
    mobileStream: MediaStream | null
  }>({ stream: null, screenStream: null, mobileStream: null })

  // Keep refs up to date
  useEffect(() => {
    streamsRef.current = { stream, screenStream, mobileStream }
  }, [stream, screenStream, mobileStream])

  useEffect(() => {
    if (!pairingId) return
    
    let peerInstance: any = null

    // Dynamically load PeerJS (client-side only)
    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer(pairingId)
      peerInstance = peer

      peer.on('open', () => {
        console.log('Desktop Peer open with ID:', pairingId)
      })

      // Accept data connections so the mobile client's `dataConn.on('open')` triggers
      peer.on('connection', (conn: any) => {
        conn.on('data', () => {}) // just acknowledge
      })

      // When the mobile phone makes the WebRTC call to us
      peer.on('call', (call: any) => {
        // Answer without providing our own stream (we just want to receive theirs)
        call.answer()
        
        call.on('stream', (remoteStream: MediaStream) => {
          setMobileStream(remoteStream)
          if (mobileVideoRef.current) {
            mobileVideoRef.current.srcObject = remoteStream
          }
           setChecks(prev => ({
            ...prev,
            mobile: { status: 'success', error: '' }
          }))
        })

        call.on('close', () => {
           setMobileStream(null)
           if (mobileVideoRef.current) mobileVideoRef.current.srcObject = null
           setChecks(prev => ({
            ...prev,
            mobile: { status: 'pending', error: 'Phone disconnected. Please reconnect.' }
          }))
        })
      })
      
      peer.on('error', (err: any) => {
        console.error('PeerJS error in Setup:', err)
      })
    })

    return () => {
      if (peerInstance) {
        peerInstance.destroy()
      }
    }
  }, [pairingId])

  // Component Unmount Cleanup
  useEffect(() => {
    return () => {
      const current = streamsRef.current
      if (current.stream) current.stream.getTracks().forEach(t => t.stop())
      if (current.screenStream) current.screenStream.getTracks().forEach(t => t.stop())
      if (current.mobileStream) current.mobileStream.getTracks().forEach(t => t.stop())
    }
  }, [])

  const allChecksPassed = 
    checks.camera.status === 'success' && 
    checks.mic.status === 'success' && 
    checks.screen.status === 'success' &&
    checks.mobile.status === 'success'

  const mobilePairingUrl = pairingId ? `${window.location.origin}/mobile-camera/${pairingId}` : ''

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-xl font-bold">System Check: {examTitle}</h1>
          <p className="text-blue-100 text-sm mt-1">
            You must grant necessary permissions before entering the secure exam environment.
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Mandatory Checks</h3>
            
            {/* Camera & Mic Check */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Video size={20} className={checks.camera.status === 'success' ? 'text-green-600' : 'text-gray-500'} />
                  <Mic size={20} className={checks.mic.status === 'success' ? 'text-green-600' : 'text-gray-500'} />
                  <span className="font-medium">Camera & Microphone</span>
                </div>
                {checks.camera.status === 'success' ? (
                   <CheckCircle className="text-green-500" size={20} />
                ) : checks.camera.status === 'error' ? (
                   <AlertCircle className="text-red-500" size={20} />
                ) : null}
              </div>
              
              {checks.camera.status === 'error' && (
                <p className="text-sm text-red-600 mt-2">{checks.camera.error}</p>
              )}
              
              {checks.camera.status !== 'success' && (
                <button 
                  onClick={requestMediaPermissions}
                  className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                >
                  Enable Camera & Mic
                </button>
              )}
            </div>

            {/* Screen Share Check */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Monitor size={20} className={checks.screen.status === 'success' ? 'text-green-600' : 'text-gray-500'} />
                  <span className="font-medium">Screen Share (Entire Screen)</span>
                </div>
                {checks.screen.status === 'success' ? (
                   <CheckCircle className="text-green-500" size={20} />
                ) : checks.screen.status === 'error' ? (
                   <AlertCircle className="text-red-500" size={20} />
                ) : null}
              </div>
              
              {checks.screen.status === 'error' && (
                <p className="text-sm text-red-600 mt-2">{checks.screen.error}</p>
              )}
              
              {checks.screen.status !== 'success' && (
                <button 
                  onClick={requestScreenShare}
                  className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                >
                  Share Screen
                </button>
              )}
            </div>

            {/* Mobile View Check */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className={checks.mobile.status === 'success' ? 'text-green-600' : 'text-gray-500'} />
                  <span className="font-medium">Secondary Mobile Camera</span>
                </div>
                {checks.mobile.status === 'success' ? (
                   <CheckCircle className="text-green-500" size={20} />
                ) : (
                   <AlertCircle className="text-orange-500" size={20} />
                )}
              </div>
              
              {checks.mobile.status !== 'success' && mobilePairingUrl && (
                <div className="mt-4 flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded border">
                  <div className="bg-white p-2 shrink-0">
                    <QRCodeSVG value={mobilePairingUrl} size={100} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="font-medium text-gray-900">Scan this QR code with your smartphone.</p>
                    <p>1. Keep your phone browser open during the exam.</p>
                    <p>2. Position the phone to show your desk and hands to prevent cheating flags.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">Front Camera Preview</h3>
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${checks.camera.status === 'success' ? 'block' : 'hidden'}`}
                 />
                 {checks.camera.status !== 'success' && (
                   <p className="text-gray-400 text-sm">Camera preview will appear here</p>
                 )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">Mobile Camera Preview</h3>
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                 <video 
                    ref={mobileVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${checks.mobile.status === 'success' ? 'block' : 'hidden'}`}
                 />
                 {checks.mobile.status !== 'success' && (
                   <p className="text-gray-400 text-sm">Scan QR code to connect mobile view</p>
                 )}
              </div>
            </div>
          </div>
        </div>


        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-600">
            By proceeding, you agree to continuous AI monitoring including video, audio, and screen recording.
          </p>
          <button
            disabled={!allChecksPassed}
            onClick={() => router.push(`/exam/${examId}/live?pairingId=${pairingId}`)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              allChecksPassed 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Exam</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
