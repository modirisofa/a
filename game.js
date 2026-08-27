const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const finalScoreElement = document.getElementById("finalScore");
const startPanel = document.getElementById("startPanel");
const gameOverPanel = document.getElementById("gameOverPanel");
const soundButton = document.getElementById("soundButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 72;
const PIPE_WIDTH = 64;
const PIPE_GAP = 155;
const BIRD_X = 98;
const faNumber = new Intl.NumberFormat("fa-IR");

let state = "ready";
let bird;
let pipes;
let score;
let frame;
let lastTime = 0;
let soundEnabled = true;
let bestScore = Number(localStorage.getItem("playful-bird-best")) || 0;

function resetGame() {
  bird = { x: BIRD_X, y: HEIGHT * 0.42, velocity: 0, radius: 17, rotation: 0 };
  pipes = [];
  score = 0;
  frame = 0;
  updateScores();
}

function updateScores() {
  scoreElement.textContent = faNumber.format(score);
  bestScoreElement.textContent = faNumber.format(bestScore);
}

function startGame() {
  resetGame();
  state = "playing";
  startPanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  flap();
}

function flap() {
  if (state !== "playing") return;
  bird.velocity = -6.7;
  playTone(520, 0.045);
}

function endGame() {
  if (state !== "playing") return;
  state = "over";
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("playful-bird-best", bestScore);
  finalScoreElement.textContent = faNumber.format(score);
  updateScores();
  playTone(120, 0.18);
  gameOverPanel.classList.remove("hidden");
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function addPipe() {
  const margin = 105;
  const available = HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin * 2;
  const topHeight = margin + Math.random() * available;
  pipes.push({ x: WIDTH + 10, top: topHeight, passed: false });
}

function update(delta) {
  if (state !== "playing") return;
  const scale = Math.min(delta / 16.67, 1.7);
  bird.velocity += 0.37 * scale;
  bird.y += bird.velocity * scale;
  bird.rotation = Math.min(Math.PI / 2.7, bird.velocity * 0.07);

  frame += scale;
  if (frame >= 94) { addPipe(); frame = 0; }

  for (const pipe of pipes) {
    pipe.x -= 2.75 * scale;
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score += 1;
      updateScores();
      playTone(760, 0.07);
    }
    const overlapsX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH;
    const hitsPipe = bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.top + PIPE_GAP;
    if (overlapsX && hitsPipe) endGame();
  }
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -5);
  if (bird.y + bird.radius >= HEIGHT - GROUND_HEIGHT || bird.y - bird.radius <= 0) endGame();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#73d7e8"); sky.addColorStop(0.72, "#b8edf0"); sky.addColorStop(1, "#d6f3d0");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,.72)";
  [[55,105,28],[280,155,34],[355,70,22]].forEach(([x,y,r]) => {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.arc(x+r,y+6,r*.75,0,Math.PI*2); ctx.arc(x-r,y+8,r*.62,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle = "#94d7ae";
  ctx.beginPath(); ctx.moveTo(0, HEIGHT-GROUND_HEIGHT); ctx.quadraticCurveTo(80,460,165,HEIGHT-GROUND_HEIGHT); ctx.quadraticCurveTo(265,455,400,HEIGHT-GROUND_HEIGHT); ctx.fill();
}

function drawPipe(pipe) {
  const bottomY = pipe.top + PIPE_GAP;
  const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  gradient.addColorStop(0,"#35a852"); gradient.addColorStop(.5,"#72da6b"); gradient.addColorStop(1,"#218842");
  ctx.fillStyle = gradient; ctx.strokeStyle = "#16723a"; ctx.lineWidth = 3;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top); ctx.strokeRect(pipe.x, -3, PIPE_WIDTH, pipe.top + 3);
  ctx.fillRect(pipe.x-6, pipe.top-28, PIPE_WIDTH+12, 28); ctx.strokeRect(pipe.x-6, pipe.top-28, PIPE_WIDTH+12, 28);
  ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, HEIGHT-bottomY); ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, HEIGHT-bottomY+3);
  ctx.fillRect(pipe.x-6, bottomY, PIPE_WIDTH+12, 28); ctx.strokeRect(pipe.x-6, bottomY, PIPE_WIDTH+12, 28);
  ctx.fillStyle = "rgba(255,255,255,.24)";
  ctx.fillRect(pipe.x+9, 0, 9, Math.max(0,pipe.top-30)); ctx.fillRect(pipe.x+9, bottomY+30, 9, HEIGHT-bottomY-30);
}

function drawBird() {
  ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rotation);
  ctx.fillStyle = "#f1a72c"; ctx.beginPath(); ctx.ellipse(-11, 5, 13, 9, -.35, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#ffd349"; ctx.strokeStyle = "#bd7617"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, bird.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(7,-6,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#253b44"; ctx.beginPath(); ctx.arc(9,-6,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#f47b2c"; ctx.beginPath(); ctx.moveTo(14,1); ctx.lineTo(29,7); ctx.lineTo(14,10); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawGround() {
  const y = HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = "#7acb5b"; ctx.fillRect(0,y,WIDTH,13);
  ctx.fillStyle = "#f3d887"; ctx.fillRect(0,y+13,WIDTH,GROUND_HEIGHT-13);
  ctx.fillStyle = "rgba(169,122,48,.18)";
  for (let x=-20; x<WIDTH; x+=38) ctx.fillRect(x + (Date.now()/25)%38, y+25, 19, 5);
}

function render(time = 0) {
  const delta = lastTime ? time-lastTime : 16.67; lastTime = time;
  if (state === "ready") bird.y = HEIGHT*.42 + Math.sin(time/350)*7;
  update(delta); drawBackground(); pipes.forEach(drawPipe); drawGround(); drawBird();
  requestAnimationFrame(render);
}

function handleAction(event) {
  if (event.type === "keydown" && !["Space","ArrowUp"].includes(event.code)) return;
  if (event.type === "keydown") event.preventDefault();
  if (state === "playing") flap();
}

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", startGame);
canvas.addEventListener("pointerdown", handleAction);
window.addEventListener("keydown", handleAction);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "🔊" : "🔇";
  soundButton.setAttribute("aria-label", soundEnabled ? "قطع صدا" : "وصل صدا");
});

resetGame();
render();
