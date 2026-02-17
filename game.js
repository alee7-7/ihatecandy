let video;
let bugImages = [];
let bugs = [];
let totalBugs = 12;
let defeatedCount = 0;
let customFont; // Variable to store the Tiny5 font

// Variables to track actual visible camera area
let visibleX = 0;
let visibleY = 0;
let visibleWidth = 0;
let visibleHeight = 0;

// ===== CUSTOMIZABLE SETTINGS =====
// Adjust these values to change bug behavior:

// Bug spawn timing (in milliseconds)
const SPAWN_DELAY_MIN = 500;  // Minimum delay between bug spawns
const SPAWN_DELAY_MAX = 2000; // Maximum delay between bug spawns

// Bug movement duration (in seconds) - how long it takes bugs to travel to their target
const BUG_MOVE_DURATION_MIN = 3;  // Minimum seconds to reach target (slow Space Invaders style)
const BUG_MOVE_DURATION_MAX = 8; // Maximum seconds to reach target (slow Space Invaders style)

// Bug size range (in pixels)
const BUG_SIZE_MIN = 800;
const BUG_SIZE_MAX = 1000;

// Bug fade-in speed
const FADE_SPEED = 1; // How fast bugs fade in (higher = faster)

// Bug spawn margins (distance from screen edge where bugs can appear)
const MARGIN_TOP = 0;      // pixels from top edge
const MARGIN_BOTTOM = 0;   // pixels from bottom edge
const MARGIN_LEFT = 0;     // pixels from left edge
const MARGIN_RIGHT = 0;    // pixels from right edge

// Target position margins (where bugs will move to on screen)
const TARGET_MARGIN = 50;  // pixels from edges where bugs will move to

// ===== END CUSTOMIZABLE SETTINGS =====

function preload() {
  // Load the local Tiny5 font file
  customFont = loadFont('Tiny5-Regular.ttf');
  
  // Load all bug images
  for (let i = 0; i < totalBugs; i++) {
    bugImages[i] = loadImage(`bug${i + 1}.png`);
  }
}

function setup() {
  // Create canvas at full viewport size
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  cnv.style('display', 'block');
  cnv.style('position', 'fixed');
  cnv.style('top', '0px');
  cnv.style('left', '0px');
  cnv.style('margin', '0');
  cnv.style('padding', '0');
  
  // Setup camera
  video = createCapture({
    video: { facingMode: { ideal: "environment" } },
    audio: false
  });
  video.hide();
  
  spawnBugs();
}

function draw() {
  background(0);
  drawCameraCover();
  
  // Update and draw all bugs
  for (let bug of bugs) {
    bug.update();
    bug.draw();
  }
  
  // Draw counter at top of screen
  drawCounter();
}

/* ===============================
   Draw bug counter
=============================== */
function drawCounter() {
  push(); // Save drawing state
  
  // Set text properties
  textFont(customFont); // Use Tiny5 font
  textAlign(CENTER, TOP);
  textSize(300);
  fill(255); // White text
  // stroke(0); // Black outline
  // strokeWeight(4);
  
  // Draw counter text
  text(`${defeatedCount}/${totalBugs}`, width / 2, 20);
  
  pop(); // Restore drawing state
}

/* ===============================
   Camera: object-fit cover
=============================== */
function drawCameraCover() {
  if (video.width === 0 || video.height === 0) return;
  
  let camW = video.width;
  let camH = video.height;
  let canvasW = width;
  let canvasH = height;
  let camRatio = camW / camH;
  let canvasRatio = canvasW / canvasH;
  
  let sx, sy, sw, sh;
  
  // Calculate what area of the camera fits in the canvas
  if (camRatio > canvasRatio) {
    // Camera is wider - crop sides of camera, show full height
    visibleWidth = canvasW;
    visibleHeight = canvasH;
    visibleX = 0;
    visibleY = 0;
    
    sh = camH;
    sw = camH * canvasRatio;
    sx = (camW - sw) / 2;
    sy = 0;
  } else {
    // Camera is taller - crop top/bottom of camera, show full width
    visibleWidth = canvasW;
    visibleHeight = canvasH;
    visibleX = 0;
    visibleY = 0;
    
    sw = camW;
    sh = camW / canvasRatio;
    sx = 0;
    sy = (camH - sh) / 2;
  }
  
  // Draw using the correct p5.js image() syntax for cropping
  // image(img, dx, dy, dw, dh, sx, sy, sw, sh)
  image(video, 0, 0, canvasW, canvasH, sx, sy, sw, sh);
}

/* ===============================
   Spawn bugs with staggered entrance
=============================== */
function spawnBugs() {
  for (let i = 0; i < totalBugs; i++) {
    setTimeout(() => {
      bugs.push(new Bug(bugImages[i]));
    }, i * random(SPAWN_DELAY_MIN, SPAWN_DELAY_MAX));
  }
}

/* ===============================
   Touch/Click handler - works for both mobile and desktop
=============================== */
function touchStarted() {
  handleInteraction();
  return false; // prevent default behavior
}

function mousePressed() {
  handleInteraction();
  return false; // prevent default behavior
}

function handleInteraction() {
  // Get the touch/mouse position
  let px = mouseX;
  let py = mouseY;
  
  // Check if we hit any bugs
  for (let i = bugs.length - 1; i >= 0; i--) {
    if (bugs[i].isTouched(px, py)) {
      bugs.splice(i, 1);
      defeatedCount++;
      break;
    }
  }
  
  // All bugs defeated → go to next page
  if (defeatedCount === totalBugs) {
    window.location.href = "end.html";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* ===============================
   BUG CLASS
=============================== */
class Bug {
  constructor(img) {
    this.img = img;
    this.size = random(BUG_SIZE_MIN, BUG_SIZE_MAX);
    this.alpha = 0; // start transparent
    
    // Store starting position
    this.startX = 0;
    this.startY = 0;
    
    // Rotation angle based on direction
    this.rotation = 0;
    
    // Movement timing
    this.moveDuration = random(BUG_MOVE_DURATION_MIN, BUG_MOVE_DURATION_MAX) * 60; // Convert seconds to frames (60fps)
    this.moveProgress = 0; // 0 to moveDuration
    
    // Calculate 90% play area (centered)
    let playWidth = width * 0.9;
    let playHeight = height * 0.9;
    let playLeft = (width - playWidth) / 2;
    let playTop = (height - playHeight) / 2;
    let playRight = playLeft + playWidth;
    let playBottom = playTop + playHeight;
    
    // Random side: 0=left, 1=right, 2=top, 3=bottom
    this.side = floor(random(4));
    
    if (this.side === 0) { // left
      this.startX = playLeft - this.size - MARGIN_LEFT;
      this.startY = random(playTop + MARGIN_TOP, playBottom - MARGIN_BOTTOM - this.size);
      // Subtract this.size so the RIGHT edge of bug stays within margin
      this.targetX = random(playLeft + TARGET_MARGIN, playRight - TARGET_MARGIN - this.size);
      this.targetY = this.startY;
      this.rotation = 90; // 90 degrees clockwise
    } else if (this.side === 1) { // right
      this.startX = playRight + this.size + MARGIN_RIGHT;
      this.startY = random(playTop + MARGIN_TOP, playBottom - MARGIN_BOTTOM - this.size);
      // Subtract this.size so the RIGHT edge of bug stays within margin
      this.targetX = random(playLeft + TARGET_MARGIN, playRight - TARGET_MARGIN - this.size);
      this.targetY = this.startY;
      this.rotation = 270; // 270 degrees (or -90, top towards left)
    } else if (this.side === 2) { // top
      this.startX = random(playLeft + MARGIN_LEFT, playRight - MARGIN_RIGHT - this.size);
      this.startY = playTop - this.size - MARGIN_TOP;
      this.targetX = this.startX;
      // Subtract this.size so the BOTTOM edge of bug stays within margin
      this.targetY = random(playTop + TARGET_MARGIN, playBottom - TARGET_MARGIN - this.size);
      this.rotation = 180; // 180 degrees
    } else { // bottom
      this.startX = random(playLeft + MARGIN_LEFT, playRight - MARGIN_RIGHT - this.size);
      this.startY = playBottom + this.size + MARGIN_BOTTOM;
      this.targetX = this.startX;
      // Subtract this.size so the BOTTOM edge of bug stays within margin
      this.targetY = random(playTop + TARGET_MARGIN, playBottom - TARGET_MARGIN - this.size);
      this.rotation = 0; // 0 degrees (no rotation)
    }
    
    // Set current position to start position
    this.x = this.startX;
    this.y = this.startY;
  }

  update() {
    // Increment movement progress
    if (this.moveProgress < this.moveDuration) {
      this.moveProgress++;
    }
    
    // Calculate progress percentage (0 to 1)
    let progress = this.moveProgress / this.moveDuration;
    if (progress > 1) progress = 1;
    
    // Linear interpolation from start to target based on progress
    this.x = this.startX + (this.targetX - this.startX) * progress;
    this.y = this.startY + (this.targetY - this.startY) * progress;
    
    // Fade in
    this.alpha += FADE_SPEED;
    if (this.alpha > 255) this.alpha = 255;
  }
  
  draw() {
    push(); // Save current drawing state
    
    // Move to bug position and rotate around center
    translate(this.x + this.size / 2, this.y + this.size / 2);
    rotate(radians(this.rotation));
    
    // Draw bug centered on rotation point
    tint(255, this.alpha);
    image(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
    noTint();
    
    pop(); // Restore drawing state
  }
  
  isTouched(px, py) {
    return px > this.x && px < this.x + this.size &&
           py > this.y && py < this.y + this.size;
  }
}