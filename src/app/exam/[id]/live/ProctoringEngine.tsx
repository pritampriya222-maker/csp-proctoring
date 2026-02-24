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
  onWarning
}: {
  sessionId: string
  onWarning: (msg: string) => void
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
    let cameraStream: MediaStream | null = null
    let screenStream: MediaStream | null = null
    let audioLoopId: number

    const startCapturing = async () => {
      if (isCaptureStarting.current) return
      isCaptureStarting.current = true

      try {
        // 1. Start Camera & Mic
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
        }

        // 2. Setup Audio Analysis (Voice Activity Detection)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.minDecibels = -60 // Sensitivity to trigger speaking
        analyserRef.current = analyser

        const source = audioCtx.createMediaStreamSource(cStream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        let speakingStreak = 0

        const analyzeAudio = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          
          // Calculate average volume
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const averageVolume = sum / bufferLength

          // Threshold for "speaking"
          if (averageVolume > 20) {
            speakingStreak++
            if (speakingStreak === 15) { // Needs to be sustained sound (roughly 1.5s based on 100ms interval)
               onWarning("Speaking detected!")
               // In a real app, send ProctoringEvent to API
            }
          } else {
            speakingStreak = 0
          }
        }

        audioLoopId = window.setInterval(analyzeAudio, 100)

        // 3. Start Screen Capture (Hidden)
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' }
        })

        if (isShuttingDown.current) {
          sStream.getTracks().forEach(t => t.stop())
          return
        }

        screenStreamRef.current = sStream
        if (screenRef.current) {
          screenRef.current.srcObject = sStream
        }
        
        // Listen if they stop sharing screen via the browser generic "Stop Sharing" button
        sStream.getVideoTracks()[0].onended = () => {
           onWarning("Screen sharing stopped! Return to exam immediately.")
           // Restart request...
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

    // 4. Setup MediaPipe AI Vision
    let faceLandmarker: FaceLandmarker | null = null
    let visionLoopId: number
    
    const initVision = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        )
        if (isShuttingDown.current) return

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 2 // Detect up to 2 faces to catch cheating
        })

        // Start processing frames
        let lastWarningTime = 0
        let lastVideoTime = -1
        let lastDetectTime = 0

        const processVideo = async () => {
           if (isShuttingDown.current) return

           if (videoRef.current && videoRef.current.readyState >= 2 && faceLandmarker) {
             try {
               const currentTime = videoRef.current.currentTime
               if (currentTime !== lastVideoTime) {
                 lastVideoTime = currentTime
                 
                 const now = Date.now()
                 if (now - lastDetectTime > 500) { // Throttle AI to ~2 FPS to fix lag
                   lastDetectTime = now
                   
                   // CRITICAL: Double check we didn't start shutting down during the throttle delay
                   if (isShuttingDown.current) return

                   const startTimeMs = performance.now()
                   try {
                     const results = faceLandmarker.detectForVideo(videoRef.current, startTimeMs)
                     
                     if (now - lastWarningTime > 3000) { // Only warn once every 3 seconds max
                       if (results.faceBlendshapes.length === 0) {
                          onWarning("Face not detected! Please look at the camera.")
                          lastWarningTime = now
                       } else if (results.faceBlendshapes.length > 1) {
                          onWarning("Multiple faces detected! You must be alone in the room.")
                          lastWarningTime = now
                       }
                     }
                   } catch (e) {
                      console.warn("WASM execution aborted", e)
                   }
                 }
               }
             } catch (err) {
               // MediaPipe can throw if the video element is unmounted midway
               console.warn("Vision processing skipped a frame", err)
             }
           }
           if (!isShuttingDown.current) {
             visionLoopId = window.requestAnimationFrame(processVideo)
           }
        }
        processVideo()
      } catch (e) {
        console.error("Vision AI failed to load", e)
      }
    }
    
    initVision()

    // Cleanup
    return () => {
      isShuttingDown.current = true
      window.clearInterval(audioLoopId)
      window.cancelAnimationFrame(visionLoopId)
      
      if (faceLandmarker) {
        // Let any pending detectForVideo finish before pulling the rug
        setTimeout(() => {
           try { faceLandmarker?.close() } catch (e) {}
        }, 100)
      }
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
      
      // Forcefully stop all media tracks using the latest refs
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop())
      }

      // Clear video refs
      if (videoRef.current) {
         videoRef.current.srcObject = null
      }
      if (screenRef.current) {
         screenRef.current.srcObject = null
      }
    }
  }, [onWarning])

  // We render the videos but keep them very small/absolute or hidden via CSS
  // Need the video element in DOM for MediaPipe to process later
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white p-2 rounded shadow-lg border pointer-events-none opacity-80 flex gap-2">
      <div className="relative">
         <p className="text-[10px] text-gray-500 font-medium pb-1">Webcam (AI Active)</p>
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted 
           className="w-32 h-24 bg-black object-cover rounded" 
         />
      </div>
      {/* Keeping screen hidden, we don't need to show it back to them, just capture it */}
      <video ref={screenRef} autoPlay playsInline muted className="hidden" />
    </div>
  )
}
