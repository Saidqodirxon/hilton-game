## Packages
phaser | Game engine for the stacking mechanic
@mediapipe/hands | Hand tracking for gesture control
@mediapipe/camera_utils | Webcam utilities for gesture control
@mediapipe/drawing_utils | Debug drawing for hand landmarks
react-webcam | Webcam component for React
framer-motion | UI animations for overlays and menus

## Notes
Phaser 3 will be used for the game canvas.
MediaPipe Hands will run in a separate layer for gesture detection.
Game logic:
- Stack 6 blocks.
- Calculate overlap percentage.
- Max discount 50%.
- Send score to API on win/loss.
