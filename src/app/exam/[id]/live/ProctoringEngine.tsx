'use client'

import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export interface ProctoringEvent {
  type: 'face_missing' | 'multiple_faces' | 'looking_away' | 'speaking' | 'screen_changed'
  timestamp: string
  details?: string
}

export default function ProctoringEngine({
  sessionId,
  onWarning,
  onStreamAcquired,
  onAiStatus
}: {
  sessionId: string
  onWarning: (msg: string) => void
  onStreamAcquired?: (stream: MediaStream) => void
  onAiStatus?: (status: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const isCaptureStarting = useRef(false)
  const isShuttingDown = useRef(false)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    isShuttingDown.current = false
    let audioLoopId: number
    let visionLoopId: number

    const startCapturing = async () => {
      if (isCaptureStarting.current) return
      isCaptureStarting.current = true

      try {
        console.log("ProctoringEngine: Requesting camera...")
        const cStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true
        })

        if (isShuttingDown.current) {
          cStream.getTracks().forEach(t => t.stop())
          return
        }
        
        cameraStreamRef.current = cStream
        if (videoRef.current) {
          videoRef.current.srcObject = cStream
          videoRef.current.play().catch(e => console.warn("Video auto-play failed", e))
        }
        
        console.log("ProctoringEngine: Camera stream acquired.")
        onStreamAcquired?.(cStream)

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.minDecibels = -60
        analyserRef.current = analyser

        const source = audioCtx.createMediaStreamSource(cStream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        let speakingStreak = 0

        const analyzeAudio = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i]
          const averageVolume = sum / bufferLength

          if (averageVolume > 20) {
            speakingStreak++
            if (speakingStreak === 15) onWarning("Speaking detected!")
          } else {
            speakingStreak = 0
          }
        }

        audioLoopId = window.setInterval(analyzeAudio, 100)

        console.log("ProctoringEngine: Requesting screen share...")
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' }
        })

        if (isShuttingDown.current) {
          sStream.getTracks().forEach(t => t.stop())
          return
        }

        screenStreamRef.current = sStream
        if (screenRef.current) screenRef.current.srcObject = sStream
        
        sStream.getVideoTracks()[0].onended = () => {
           onWarning("Screen sharing stopped! Return to exam immediately.")
        }

        setIsCapturing(true)
      } catch (err) {
        console.error("Proctoring setup failed", err)
        onWarning("Proctoring connection lost. Please allow permissions.")
      } finally {
        isCaptureStarting.current = false
      }
    }

    startCapturing()

    let faceLandmarker: FaceLandmarker | null = null
    let lastWarningTime = 0
    let lastVideoTime = -1
    let lastDetectTime = 0

    const processVideo = async () => {
      if (isShuttingDown.current) return

      if (videoRef.current && videoRef.current.readyState >= 2) {
        // Force play just in case autoPlay was blocked
        if (videoRef.current.paused) {
          videoRef.current.play().catch(e => console.error("Video play failed:", e))
        }

        const canvas = document.getElementById('proctoring-canvas') as HTMLCanvasElement
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            if (canvas.width !== videoRef.current.videoWidth) {
              console.log("ProctoringEngine: Setting canvas size", videoRef.current.videoWidth, videoRef.current.videoHeight)
              canvas.width = videoRef.current.videoWidth
              canvas.height = videoRef.current.videoHeight
            }
            ctx.save()
            ctx.scale(-1, 1)
            ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height)
            ctx.restore()
            
            const placeholder = document.getElementById('self-view-placeholder')
            if (placeholder) placeholder.style.display = 'none'
          }
        }

        if (faceLandmarker) {
          try {
            const currentTime = videoRef.current.currentTime
            if (currentTime !== lastVideoTime) {
              lastVideoTime = currentTime
              const now = Date.now()
              if (now - lastDetectTime > 500) { 
                lastDetectTime = now
                if (isShuttingDown.current) return
                
                // Use video timestamp for better sync with detection
                const timestampMs = performance.now() 
                const results = faceLandmarker.detectForVideo(videoRef.current, timestampMs)
                
                if (now - lastWarningTime > 3000) { 
                  if (results.faceBlendshapes.length === 0) {
                     onWarning("Face not detected! Please look at the camera.")
                     lastWarningTime = now
                  } else if (results.faceBlendshapes.length > 1) {
                     onWarning("Multiple faces detected! You must be alone in the room.")
                     lastWarningTime = now
                  } else {
                     // Face detected - no action needed
                  }
                }
              }
            }
          } catch (err) {
            console.warn("Detection failed", err)
          }
        }
      }
      
      if (!isShuttingDown.current) {
        visionLoopId = window.requestAnimationFrame(processVideo)
      }
    }

    const initVision = async () => {
      try {
        console.log("ProctoringEngine: Initializing AI engine...")
        onAiStatus?.("Loading AI Models...")
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        )
        if (isShuttingDown.current) return

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 2
        })
        
        console.log("ProctoringEngine: AI engine ready.")
        onAiStatus?.("AI Monitoring Active")
      } catch (e) {
        console.error("Vision AI failed to load", e)
        onAiStatus?.("AI Initialization Failed")
      }
    }
    
    initVision()
    processVideo() // Start rendering immediately

    return () => {
      isShuttingDown.current = true
      window.clearInterval(audioLoopId)
      window.cancelAnimationFrame(visionLoopId)
      
      if (faceLandmarker) {
        setTimeout(() => {
           try { faceLandmarker?.close() } catch (e) {}
        }, 100)
      }
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
      
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop())
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())

      if (videoRef.current) videoRef.current.srcObject = null
      if (screenRef.current) screenRef.current.srcObject = null
    }
  }, [onWarning])

  return (
    <div className="hidden">
       <video ref={videoRef} autoPlay playsInline muted />
       <video ref={screenRef} autoPlay playsInline muted />
    </div>
  )
}
