let nativeVideo;   // Native HTML video element
let videoReady = false;
let bugImages = [];
let bugs = [];
let totalBugs = 12;
let defeatedCount = 0;
let customFont;

// Variables to track actual visible camera area
let visibleX = 0;
let visibleY = 0;
let visibleWidth = 0;
let visibleHeight = 0;

// ===== CUSTOMIZABLE SETTINGS =====

const SPAWN_DELAY_MIN = 500;
const SPAWN_DELAY_MAX = 2000;

const BUG_MOVE_DURATION_MIN = 3;
const BUG_MOVE_DURATION_MAX = 8;

const BUG_SIZE_MIN = 5;
const BUG_SIZE_MAX = 15;

const FADE_SPEED = 3;

const MARGIN_TOP = 0;
const MARGIN_BOTTOM = 0;
const MARGIN_LEFT = 0;
const MARGIN_RIGHT = 0;

const TARGET_MARGIN = 50;

// ===== END CUSTOMIZABLE SETTINGS =====

function preload() {
  customFont = loadFont('Tiny5-Regular.ttf');
  for (let i = 0; i < totalBugs; i++) {
    bugImages[i] = loadImage(`bug${i + 1}.png`);
  }
}

function setup() {
  pixelDensity(1); // Prevent size doubling on high-DPI/Retina screens
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  cnv.style('display', 'block');
  cnv.style('position', 'fixed');
  cnv.style('top', '0px');
  cnv.style('left', '0px');
  cnv.style('margin', '0');
  cnv.style('padding', '0');

  // Create a native HTML video element — more reliable than p5's createCapture on iOS/Android
  nativeVideo = document.createElement('video');
  nativeVideo.setAttribute('playsinline', ''); // CRITICAL for iOS — prevents fullscreen takeover
  nativeVideo.setAttribute('autoplay', '');
  nativeVideo.setAttribute('muted', '');
  nativeVideo.style.display = 'none';
  document.body.appendChild(nativeVideo);

  // Request camera access
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }, // Prefer rear camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    .then(function(stream) {
      nativeVideo.srcObject = stream;
      nativeVideo.play();
      nativeVideo.onloadedmetadata = function() {
        videoReady = true;
      };
    })
    .catch(function(err) {
      console.warn('Camera error:', err);
      videoReady = false;
    });
  } else {
    console.warn('getUserMedia not supported on this browser.');
  }

  spawnBugs();
}

function draw() {
  background(0);
  drawCameraCover();

  for (let bug of bugs) {
    bug.update();
    bug.draw();
  }

  drawCounter();
}

/* ===============================
   Draw bug counter
=============================== */
function drawCounter() {
  push();
  textFont(customFont);
  textAlign(CENTER, TOP);
  textSize(10);
  fill(255);
  text(`${defeatedCount}/${totalBugs}`, width / 2, 20);
  pop();
}

/* ===============================
   Camera: draw native video element cover-fit onto canvas
=============================== */
function drawCameraCover() {
  if (!videoReady || !nativeVideo || nativeVideo.readyState < 2) return;

  let camW = nativeVideo.videoWidth;
  let camH = nativeVideo.videoHeight;
  if (camW === 0 || camH === 0) return;

  let canvasW = width;
  let canvasH = height;
  let camRatio = camW / camH;
  let canvasRatio = canvasW / canvasH;

  let sx, sy, sw, sh;

  if (camRatio > canvasRatio) {
    // Camera is wider — crop sides
    sh = camH;
    sw = camH * canvasRatio;
    sx = (camW - sw) / 2;
    sy = 0;
  } else {
    // Camera is taller — crop top/bottom
    sw = camW;
    sh = camW / canvasRatio;
    sx = 0;
    sy = (camH - sh) / 2;
  }

  // Draw the native video element directly onto the p5 canvas
  drawingContext.drawImage(nativeVideo, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

/* ===============================
   Spawn bugs with staggered entrance
=============================== */
function spawnBugs() {
  for (let i = 0; i < totalBugs; i++) {
    let delay = i * (Math.random() * (SPAWN_DELAY_MAX - SPAWN_DELAY_MIN) + SPAWN_DELAY_MIN);
    setTimeout(() => {
      bugs.push(new Bug(bugImages[i]));
    }, delay);
  }
}

/* ===============================
   Touch/Click handlers
=============================== */
function touchStarted() {
  let px = touches.length > 0 ? touches[0].x : mouseX;
  let py = touches.length > 0 ? touches[0].y : mouseY;
  handleInteraction(px, py);
  return false;
}

function mousePressed() {
  handleInteraction(mouseX, mouseY);
  return false;
}

function handleInteraction(px, py) {
  for (let i = bugs.length - 1; i >= 0; i--) {
    if (bugs[i].isTouched(px, py)) {
      bugs.splice(i, 1);
      defeatedCount++;
      break;
    }
  }

  if (defeatedCount === totalBugs) {
    window.location.href = 'end.html';
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
    this.size = Math.random() * (BUG_SIZE_MAX - BUG_SIZE_MIN) + BUG_SIZE_MIN;
    this.alpha = 0;

    this.startX = 0;
    this.startY = 0;
    this.rotation = 0;

    this.moveDuration = (Math.random() * (BUG_MOVE_DURATION_MAX - BUG_MOVE_DURATION_MIN) + BUG_MOVE_DURATION_MIN) * 60;
    this.moveProgress = 0;

    let playWidth = width * 0.9;
    let playHeight = height * 0.9;
    let playLeft = (width - playWidth) / 2;
    let playTop = (height - playHeight) / 2;
    let playRight = playLeft + playWidth;
    let playBottom = playTop + playHeight;

    this.side = Math.floor(Math.random() * 4);

    if (this.side === 0) { // left
      this.startX = playLeft - this.size - MARGIN_LEFT;
      this.startY = Math.random() * (playBottom - MARGIN_BOTTOM - this.size - (playTop + MARGIN_TOP)) + playTop + MARGIN_TOP;
      this.targetX = Math.random() * (playRight - TARGET_MARGIN - this.size - (playLeft + TARGET_MARGIN)) + playLeft + TARGET_MARGIN;
      this.targetY = this.startY;
      this.rotation = 90;
    } else if (this.side === 1) { // right
      this.startX = playRight + this.size + MARGIN_RIGHT;
      this.startY = Math.random() * (playBottom - MARGIN_BOTTOM - this.size - (playTop + MARGIN_TOP)) + playTop + MARGIN_TOP;
      this.targetX = Math.random() * (playRight - TARGET_MARGIN - this.size - (playLeft + TARGET_MARGIN)) + playLeft + TARGET_MARGIN;
      this.targetY = this.startY;
      this.rotation = 270;
    } else if (this.side === 2) { // top
      this.startX = Math.random() * (playRight - MARGIN_RIGHT - this.size - (playLeft + MARGIN_LEFT)) + playLeft + MARGIN_LEFT;
      this.startY = playTop - this.size - MARGIN_TOP;
      this.targetX = this.startX;
      this.targetY = Math.random() * (playBottom - TARGET_MARGIN - this.size - (playTop + TARGET_MARGIN)) + playTop + TARGET_MARGIN;
      this.rotation = 180;
    } else { // bottom
      this.startX = Math.random() * (playRight - MARGIN_RIGHT - this.size - (playLeft + MARGIN_LEFT)) + playLeft + MARGIN_LEFT;
      this.startY = playBottom + this.size + MARGIN_BOTTOM;
      this.targetX = this.startX;
      this.targetY = Math.random() * (playBottom - TARGET_MARGIN - this.size - (playTop + TARGET_MARGIN)) + playTop + TARGET_MARGIN;
      this.rotation = 0;
    }

    this.x = this.startX;
    this.y = this.startY;
  }

  update() {
    if (this.moveProgress < this.moveDuration) {
      this.moveProgress++;
    }

    let progress = Math.min(this.moveProgress / this.moveDuration, 1);

    this.x = this.startX + (this.targetX - this.startX) * progress;
    this.y = this.startY + (this.targetY - this.startY) * progress;

    this.alpha += FADE_SPEED;
    if (this.alpha > 255) this.alpha = 255;
  }

  draw() {
    push();
    translate(this.x + this.size / 2, this.y + this.size / 2);
    rotate(radians(this.rotation));
    tint(255, this.alpha);
    image(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
    noTint();
    pop();
  }

  // Circular hit detection — works correctly regardless of rotation
  isTouched(px, py) {
    let cx = this.x + this.size / 2;
    let cy = this.y + this.size / 2;
    let d = dist(px, py, cx, cy);
    return d < this.size / 2;
  }
}