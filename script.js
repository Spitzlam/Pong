const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const themeToggle = document.getElementById("themeToggle");
const pauseToggle = document.getElementById("pauseToggle");
const scoreboard = document.getElementById("scoreboard");
const modeToggle = document.getElementById("modeToggle");
const menuButton = document.getElementById("menuButton");

const mainMenu = document.getElementById("main-menu");
const startGameBtn = document.getElementById("startGame");
const bestDisplay = document.getElementById("bestDisplay");
const gameWrapper = document.getElementById("game-wrapper");
const controls = document.getElementById("controls");

const paddleWidth = 14, paddleHeight = 100;
const ballSize = 10;
const maxScore = 3;
const maxBallSpeed = 17;
const paddleSpeed = 8;

const sounds = {
  paddle: new Audio("sounds/pong.mp3"),
  wall: new Audio("sounds/bounce.mp3"),
  score: new Audio("sounds/score.mp3"),
  win: new Audio("sounds/win.mp3")
};

const playerNameLeft = document.getElementById("playerNameLeft");
const playerNameRight = document.getElementById("playerNameRight");

const bgColorPicker = document.getElementById("bgColorPicker");
const fgColorPicker = document.getElementById("fgColorPicker");

const muteToggle = document.getElementById("muteToggle");
const muteToggleMenu = document.getElementById("muteToggleMenu");

const TARGET_FPS = 165;
const FRAME_DURATION = 1000 / TARGET_FPS;

const player1NameInput = document.getElementById("player1NameInput");
const player2NameInput = document.getElementById("player2NameInput");
const player2Label = document.getElementById("player2Label");

let player1Name = "Player 1";
let player2Name = "Player 2";

let gameStarted = false;
let showingVictoryScreen = false;

let isWaiting = false;
let waitTimer = 0;

const waitDuration = 1000; // 3 second delay

let lastFrameTime = 0;

let isGameOver = false;
let isPaused = false;

let isMuted = false;

let player = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ai = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let useAI = true; // Start in AI mode

// Control state for P1
let player1Up = false;
let player1Down = false;

// Control state for Player 2
let player2Up = false;
let player2Down = false;

let ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 5,
  velocityX: 5,
  velocityY: 5,
  size: ballSize,
};

function drawRect(x, y, w, h) {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg-color');
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r) {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg-color');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawText(text, x, y, size = "32px") {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg-color');
  ctx.font = `${size} Arial`;
  ctx.fillText(text, x, y);
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = 5;
  ball.velocityX = 0;
  ball.velocityY = 0;

  isWaiting = true;
  waitStart = performance.now();
}

function collision(b, p) {
  return (
    b.x < p.x + paddleWidth &&
    b.x + ballSize > p.x &&
    b.y < p.y + paddleHeight &&
    b.y + ballSize > p.y
  );
}

function updateScoreboard() {
  scoreboard.textContent = `${player1Name}: ${player.score} — ${player2Name}: ${ai.score}`;
}
  

function update() {

  if (ai.score >= maxScore) {
  isGameOver = true;
  showingVictoryScreen = true;
  sounds.win.currentTime = 0;
  sounds.win.play();
  updateBestResult();
  setTimeout(() => 
  {
  showingVictoryScreen = false;
  isGameOver = false;
  goToMainMenu();
  resetBall();
  }, 3000);

}

  if (player.score >= maxScore) {
  isGameOver = true;
  showingVictoryScreen = true;
  sounds.win.currentTime = 0;
  sounds.win.play();
  updateBestResult();
  setTimeout(() => 
  {
  showingVictoryScreen = false;
  isGameOver = false;
  goToMainMenu();
  resetBall();
  }, 3000);
}

 if (showingVictoryScreen) return;
  const now = performance.now();
  const elapsed = now - waitStart;

if (isWaiting) {
  if (elapsed >= waitDuration) {
    const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4);
    const direction = Math.random() < 0.5 ? 1 : -1;

    ball.velocityX = direction * ball.speed * Math.cos(angle);
    ball.velocityY = ball.speed * Math.sin(angle);
    isWaiting = false;
  }

  return; // 
}


  // Player controls
  if (!useAI) {
    // Player 1 (W/S)
    if (player1Up) player.y -= paddleSpeed;
    if (player1Down) player.y += paddleSpeed;

    // Player 2 (Arrow keys)
    if (player2Up) ai.y -= paddleSpeed;
    if (player2Down) ai.y += paddleSpeed;

    // Clamp both paddles
    player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));
    ai.y = Math.max(0, Math.min(canvas.height - paddleHeight, ai.y));
  } else {
    // AI control
    ai.y += (ball.y - (ai.y + paddleHeight / 2)) * 0.1;
    ai.y = Math.max(0, Math.min(canvas.height - paddleHeight, ai.y));

    // Clamp Player 1 (in case user moves mouse too far)
    player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));
  }

  // Ball movement and collisions remain unchanged
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;

  if (ball.y - ball.size <= 0) {
    ball.y = ball.size;
    ball.velocityY = -ball.velocityY;
    sounds.wall.currentTime = 0;
    sounds.wall.play();

  } else if (ball.y + ball.size >= canvas.height) {
    ball.y = canvas.height - ball.size;
    ball.velocityY = -ball.velocityY;
    sounds.wall.currentTime = 0;
    sounds.wall.play();

  }

  let playerPaddle = (ball.x < canvas.width / 2) ? player : ai;

  if (collision(ball, playerPaddle)) {
    sounds.paddle.currentTime = 0;
    sounds.paddle.play();
    let collidePoint = ball.y - (playerPaddle.y + paddleHeight / 2);
    collidePoint /= (paddleHeight / 2);
    let angleRad = (Math.PI / 4) * collidePoint;
    let direction = (ball.x < canvas.width / 2) ? 1 : -1;
    ball.velocityX = direction * ball.speed * Math.cos(angleRad);
    ball.velocityY = ball.speed * Math.sin(angleRad);
    ball.speed = Math.min(ball.speed + 0.5, maxBallSpeed);
  }

  if (ball.x < 0) {
  ai.score++;
  updateScoreboard();
  if (ai.score >= maxScore) {
    isGameOver = true;
    updateBestResult();
    setTimeout(goToMainMenu, 3000); // wait 3 seconds
  }
  resetBall();
  sounds.score.currentTime = 0;
  sounds.score.play();
} else if (ball.x > canvas.width) {
  player.score++;
  updateScoreboard();
  if (player.score >= maxScore) {
    isGameOver = true;
    updateBestResult();
    setTimeout(goToMainMenu, 3000); // wait 3 seconds
  }
  resetBall();
  sounds.score.currentTime = 0;
  sounds.score.play();
}

}

function render() {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRect(player.x, player.y, paddleWidth, paddleHeight);
  drawRect(ai.x, ai.y, paddleWidth, paddleHeight);
  drawCircle(ball.x, ball.y, ball.size);

if (isGameOver) {
  drawText("Game Over", canvas.width / 2 - 90, canvas.height / 2);

let winnerMessage;
if (player.score > ai.score) 
{
  winnerMessage = `${player1Name} Wins!`;
} 
else 
{
  winnerMessage = `${player2Name} Wins!`;
}

  drawText(winnerMessage, canvas.width / 2 - 100, canvas.height / 2 + 40);
  drawText("Returning to menu...", canvas.width / 2 - 110, canvas.height / 2 + 80, "20px");
}

  else if (isPaused) 
  {
    drawText("Paused", canvas.width / 2 - 50, canvas.height / 2);
  }

}

function game() {
  if (!gameStarted) return;

  if (!isPaused && !showingVictoryScreen) {
    update();
  }
  render();
}

function gameLoop(currentTime) {
  if (!lastFrameTime) {
    lastFrameTime = currentTime;
  }

  const delta = currentTime - lastFrameTime;

  if (delta >= FRAME_DURATION) {
    // For smoother frame alignment
    lastFrameTime = currentTime - (delta % FRAME_DURATION);

    game();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function updateBestResult() {
  const winner = player.score > ai.score ? "Player 1" : (useAI ? "AI" : "Player 2");
  const difference = Math.abs(player.score - ai.score);
  const winningScore = Math.max(player.score, ai.score);

  const saved = JSON.parse(localStorage.getItem("bestResult")) || { difference: 0 };

  if (difference > saved.difference) {
    const bestResult = {
      winner,
      score: winningScore,
      difference
    };
    localStorage.setItem("bestResult", JSON.stringify(bestResult));
    displayBestResult(bestResult);
  }
}

function displayBestResult(data) {
  const bestDiv = document.getElementById("bestResult");
  if (data) {
    bestDiv.textContent = `Best Win: ${data.winner} scored ${data.score} (diff ${data.difference})`;
  } else {
    bestDiv.textContent = "Best Win: None yet";
  }
}

function goToMainMenu() {
  gameStarted = false;
  isPaused = false;
  isGameOver = false;

  mainMenu.classList.remove("hidden");
  gameWrapper.classList.add("hidden");
  controls.classList.add("hidden");
  menuButton.classList.add("hidden");

  player.score = 0;
  ai.score = 0;
  updateScoreboard();
  resetBall();
}

function applyMuteState(muted) {
  isMuted = muted;
  Object.values(sounds).forEach(sound => sound.muted = muted);
  const label = muted ? "Unmute" : "Mute";
  muteToggle.textContent = label;
  muteToggleMenu.textContent = label;
  localStorage.setItem("pongMuted", muted);
}

function applyCustomColors(bgColor, fgColor) {
  if (bgColor.toLowerCase() === fgColor.toLowerCase()) {
    alert("Background and paddle/ball colors must be different!");
    return; // Don't apply or save invalid colors
  }

  document.documentElement.style.setProperty('--bg-color', bgColor);
  document.documentElement.style.setProperty('--fg-color', fgColor);
  document.documentElement.style.setProperty('--border-color', fgColor);

  // Save to localStorage
  localStorage.setItem("pongColors", JSON.stringify({ bgColor, fgColor }));
}

function validateColorSelection() {
  const bgColor = bgColorPicker.value.toLowerCase();
  const fgColor = fgColorPicker.value.toLowerCase();
  const colorsMatch = bgColor === fgColor;

  startGameBtn.disabled = colorsMatch;
  startGameBtn.style.opacity = colorsMatch ? "0.5" : "1";
  startGameBtn.title = colorsMatch
    ? "Background and paddle/ball colors must be different"
    : "";
}

document.addEventListener("mousemove", (evt) => {
  if (isPaused || isGameOver || !useAI) return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  player.y = (evt.clientY - rect.top) * scaleY - paddleHeight / 2;
});


document.addEventListener("keydown", (evt) => {
  if (evt.key === "w" || evt.key === "W") player1Up = true;
  if (evt.key === "s" || evt.key === "S") player1Down = true;
  if (evt.key === "ArrowUp") player2Up = true;
  if (evt.key === "ArrowDown") player2Down = true;
   {
   if (evt.key === "Escape") 
     isPaused = !isPaused;
     pauseToggle.textContent = isPaused ? "Resume" : "Pause";
     menuButton.classList.toggle("hidden", !isPaused);
  }
});

document.addEventListener("keyup", (evt) => {
  if (evt.key === "w" || evt.key === "W") player1Up = false;
  if (evt.key === "s" || evt.key === "S") player1Down = false;
  if (evt.key === "ArrowUp") player2Up = false;
  if (evt.key === "ArrowDown") player2Down = false;
});

document.body.addEventListener("click", () => {
  // Create a silent audio to unlock autoplay policy
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const buffer = context.createBuffer(1, 1, 22050); // 1 sample of silence
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}, { once: true });


canvas.addEventListener("click", () => {
  if (isGameOver) {
    player.score = 0;
    ai.score = 0;
    isGameOver = false;
    isPaused = false;
    updateScoreboard();
    resetBall();
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

pauseToggle.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseToggle.textContent = isPaused ? "Resume" : "Pause";
  menuButton.classList.toggle("hidden", !isPaused); // this must be here
});

gameWrapper.classList.add("hidden");
controls.classList.add("hidden");

startGameBtn.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  gameWrapper.classList.remove("hidden");
  controls.classList.remove("hidden");

  gameStarted = true;
  isGameOver = false;
  isPaused = false;
  showingVictoryScreen = false;

  player1Name = player1NameInput.value.trim() || "Player 1";
  player2Name = useAI ? "AI" : (player2NameInput.value.trim() || "Player 2");

  playerNameLeft.textContent = player1Name;
  playerNameRight.textContent = player2Name;

  localStorage.setItem("playerNames", JSON.stringify({ player1Name, player2Name }));

  player.score = 0;
  ai.score = 0;
  updateScoreboard();
  resetBall();
  isWaiting = true;

  const bgColor = bgColorPicker.value;
  const fgColor = fgColorPicker.value;
  applyCustomColors(bgColor, fgColor);
});

muteToggle.addEventListener("click", () => {
  applyMuteState(!isMuted);
});

muteToggleMenu.addEventListener("click", () => {
  applyMuteState(!isMuted);
});

modeToggle.addEventListener("click", () => {
  useAI = !useAI;
  modeToggle.textContent = useAI ? "Switch to Multiplayer" : "Switch to AI";
  player2Label.classList.toggle("hidden", useAI);
  // Reset scores
  player.score = 0;
  ai.score = 0;
  updateScoreboard();
  resetBall();
});


menuButton.addEventListener("click", () => {
  goToMainMenu();
});

bgColorPicker.addEventListener("input", () => {
  const bgColor = bgColorPicker.value;
  const fgColor = fgColorPicker.value;
  applyCustomColors(bgColor, fgColor);
  validateColorSelection(); // ✅ added
});

fgColorPicker.addEventListener("input", () => {
  const bgColor = bgColorPicker.value;
  const fgColor = fgColorPicker.value;
  applyCustomColors(bgColor, fgColor);
  validateColorSelection(); // ✅ added
});

const savedBest = JSON.parse(localStorage.getItem("bestResult"));
if (savedBest) {
  displayBestResult(savedBest);
  bestDisplay.textContent = `Best Win: ${savedBest.winner} scored ${savedBest.score} (diff ${savedBest.difference})`;
} else {
  displayBestResult(null);
  bestDisplay.textContent = "Best Win: None yet";
}

const savedColors = JSON.parse(localStorage.getItem("pongColors"));
if (savedColors) {
  bgColorPicker.value = savedColors.bgColor;
  fgColorPicker.value = savedColors.fgColor;
  applyCustomColors(savedColors.bgColor, savedColors.fgColor);
}

const savedNames = JSON.parse(localStorage.getItem("playerNames"));
if (savedNames) {
  player1Name = savedNames.player1Name;
  player2Name = savedNames.player2Name;
  player1NameInput.value = player1Name;
  player2NameInput.value = player2Name;
}

player2Label.classList.toggle("hidden", useAI);

const savedMute = localStorage.getItem("pongMuted") === "true";
applyMuteState(savedMute);

validateColorSelection();

updateScoreboard();