let video;
let videoReady = false; // Track if camera loaded successfully
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

// Bug spawn timing (in milliseconds)
const SPAWN_DELAY_MIN = 500;
const SPAWN_DELAY_MAX = 2000;

// Bug movement duration (in seconds)
const BUG_MOVE_DURATION_MIN = 3;
const BUG_MOVE_DURATION_MAX = 8;

// Bug size range (in pixels) — reduced for mobile screens
const BUG_SIZE_MIN = 80;
const BUG_SIZE_MAX = 150;

// Bug fade-in speed
const FADE_SPEED = 3;

// Bug spawn margins
const MARGIN_TOP = 0;
const MARGIN_BOTTOM = 0;
const MARGIN_LEFT = 0;
const MARGIN_RIGHT = 0;

// Target position margins
const TARGET_MARGIN = 50;

// ===== END CUSTOMIZABLE SETTINGS =====

function preload() {
  customFont = loadFont('Tiny5-Regular.ttf');

  for (let i = 0; i < totalBugs; i++) {
    bugImages[i] = loadImage(`bug${i + 1}.png`);
  }
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  cnv.style('display', 'block');
  cnv.style('position', 'fixed');
  cnv.style('top', '0px');
  cnv.style('left', '0px');
  cnv.style('margin', '0');
  cnv.style('padding', '0');

  // Setup camera with success and error callbacks
  video = createCapture(
    {
      video: { facingMode: { ideal: "environment" } },
      audio: false
    },
    () => {
      // Camera loaded successfully
      videoReady = true;
    },
    (err) => {
      // Camera failed — fall back gracefully to black background
      console.warn("Camera not available:", err);
      videoReady = false;
      video = null;
    }
  );

  if (video) video.hide();

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
  textSize(80); // Reduced from 175 — more readable on mobile
  fill(255);
  text(`${defeatedCount}/${totalBugs}`, width / 2, 20);
  pop();
}

/* ===============================
   Camera: object-fit cover
=============================== */
function drawCameraCover() {
  // Bail out if camera isn't ready or has no dimensions yet
  if (!video || !videoReady || video.width === 0 || video.height === 0) return;

  let camW = video.width;
  let camH = video.height;
  let canvasW = width;
  let canvasH = height;
  let camRatio = camW / camH;
  let canvasRatio = canvasW / canvasH;

  let sx, sy, sw, sh;

  if (camRatio > canvasRatio) {
    // Camera is wider — crop sides
    visibleWidth = canvasW;
    visibleHeight = canvasH;
    visibleX = 0;
    visibleY = 0;

    sh = camH;
    sw = camH * canvasRatio;
    sx = (camW - sw) / 2;
    sy = 0;
  } else {
    // Camera is taller — crop top/bottom
    visibleWidth = canvasW;
    visibleHeight = canvasH;
    visibleX = 0;
    visibleY = 0;

    sw = camW;
    sh = camW / canvasRatio;
    sx = 0;
    sy = (camH - sh) / 2;
  }

  image(video, 0, 0, canvasW, canvasH, sx, sy, sw, sh);
}

/* ===============================
   Spawn bugs with staggered entrance
=============================== */
function spawnBugs() {
  for (let i = 0; i < totalBugs; i++) {
    // Use Math.random() instead of p5's random() inside setTimeout
    let delay = i * (Math.random() * (SPAWN_DELAY_MAX - SPAWN_DELAY_MIN) + SPAWN_DELAY_MIN);
    setTimeout(() => {
      bugs.push(new Bug(bugImages[i]));
    }, delay);
  }
}

/* ===============================
   Touch/Click handler
=============================== */
function touchStarted() {
  handleInteraction(touches.length > 0 ? touches[0].x : mouseX, touches.length > 0 ? touches[0].y : mouseY);
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
    this.size = Math.random() * (BUG_SIZE_MAX - BUG_SIZE_MIN) + BUG_SIZE_MIN;
    this.alpha = 0;

    this.startX = 0;
    this.startY = 0;
    this.rotation = 0;

    // Convert seconds to frames at ~60fps
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