import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Hand, ThumbsUp } from 'lucide-react';

interface GestureControllerProps {
  onDrop: () => void;
  enabled: boolean;
}

export function GestureController({ onDrop, enabled }: GestureControllerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gestureStatus, setGestureStatus] = useState<'IDLE' | 'DROP_DETECTED'>('IDLE');
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Throttle drops to prevent double triggers
  const lastDropTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    let camera: Camera | null = null;

    if (webcamRef.current && webcamRef.current.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 320,
        height: 240,
      });
      camera.start().then(() => setIsCameraReady(true));
    }

    return () => {
      camera?.stop();
      hands.close();
    };
  }, [enabled]);

  const onResults = (results: Results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    // Draw video + landmarks overlay
    const { width, height } = canvasRef.current;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2,
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3,
        });

        // Simple Gesture Logic: Check if index finger tip y is significantly lower than wrist
        // Or check for "Pinch" / "Close Fist" to drop?
        // Let's go with: "Fist Clench" drops the block.
        // Open Hand = Idle. Fist = Drop.
        
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const thumbTip = landmarks[4];

        // Basic "Fist" detection: Fingertips are close to the palm (wrist)
        // A simple heuristic: if index tip is below the mid-knuckle
        // For simplicity: Check if index tip is lower (higher Y value) than index PIP (knuckle)
        // But better: Distance from wrist to tips is small.
        
        const isFist = 
            distance(wrist, indexTip) < 0.3 && 
            distance(wrist, middleTip) < 0.3 &&
            distance(wrist, ringTip) < 0.3 &&
            distance(wrist, pinkyTip) < 0.3;

        if (isFist) {
           const now = Date.now();
           if (now - lastDropTime.current > 1000) { // 1 sec cooldown
             onDrop();
             lastDropTime.current = now;
             setGestureStatus('DROP_DETECTED');
             setTimeout(() => setGestureStatus('IDLE'), 500);
           }
        }
      }
    }
    canvasCtx.restore();
  };

  const distance = (p1: any, p2: any) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  if (!enabled) return null;

  return (
    <div className="relative rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg bg-black w-[160px] h-[120px]">
      <Webcam
        ref={webcamRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        mirrored
        width={320}
        height={240}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        width={320}
        height={240}
      />
      
      {/* Status Indicator */}
      <div className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
        gestureStatus === 'DROP_DETECTED' ? 'bg-green-500' : 'bg-primary'
      }`}>
         {gestureStatus === 'DROP_DETECTED' ? <ThumbsUp className="w-4 h-4 text-white" /> : <Hand className="w-4 h-4 text-white" />}
      </div>
      
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-xs">
          Starting Camera...
        </div>
      )}
    </div>
  );
}
