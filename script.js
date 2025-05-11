const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const themeToggle = document.getElementById("themeToggle");
const pauseToggle = document.getElementById("pauseToggle");
const scoreboard = document.getElementById("scoreboard");
const modeToggle = document.getElementById("modeToggle");

const mainMenu = document.getElementById("main-menu");
const startGameBtn = document.getElementById("startGame");
const bestDisplay = document.getElementById("bestDisplay");
const gameContainer = document.getElementById("game-container");
const controls = document.getElementById("controls");

const paddleWidth = 14, paddleHeight = 100;
const ballSize = 10;
const maxScore = 10;
const maxBallSpeed = 12;
const paddleSpeed = 8;

const bgColorPicker = document.getElementById("bgColorPicker");
const fgColorPicker = document.getElementById("fgColorPicker");

const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;

let gameStarted = false;

let isWaiting = false;
let waitTimer = 0;

const waitDuration = 1000; // 3 second delay

let lastFrameTime = 0;

let isGameOver = false;
let isPaused = false;

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
  speed: 8,
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
    const opponentLabel = useAI ? "AI" : "Player 2";
    scoreboard.textContent = `Player 1: ${player.score} — ${opponentLabel}: ${ai.score}`;
  }
  

function update() {
  if (isWaiting) {
  const now = performance.now();
  const elapsed = now - waitStart;

  if (elapsed >= waitDuration) {
    const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4);
    const direction = Math.random() < 0.5 ? 1 : -1;

    ball.velocityX = direction * ball.speed * Math.cos(angle);
    ball.velocityY = ball.speed * Math.sin(angle);
    isWaiting = false;
  }

  return; // Skip update while waiting
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
  } else if (ball.y + ball.size >= canvas.height) {
    ball.y = canvas.height - ball.size;
    ball.velocityY = -ball.velocityY;
  }

  let playerPaddle = (ball.x < canvas.width / 2) ? player : ai;
  if (collision(ball, playerPaddle)) {
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
    if (ai.score >= maxScore) isGameOver = true;
    resetBall();
  } else if (ball.x > canvas.width) {
    player.score++;
    updateScoreboard();
    if (player.score >= maxScore) isGameOver = true;
    resetBall();
  }
}

function render() {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRect(player.x, player.y, paddleWidth, paddleHeight);
  drawRect(ai.x, ai.y, paddleWidth, paddleHeight);
  drawCircle(ball.x, ball.y, ball.size);

  if (isGameOver) 
  {
    drawText("Game Over", canvas.width / 2 - 90, canvas.height / 2);
    const message = player.score > ai.score ? "Player 1 Wins!" : "Player 2 Wins!";
    drawText(message, canvas.width / 2 - 100, canvas.height / 2 + 40);
    drawText("Click to restart", canvas.width / 2 - 100, canvas.height / 2 + 80, "20px");
  } else if (isPaused) {
    drawText("Paused", canvas.width / 2 - 50, canvas.height / 2);
  }

}

function game() {
  if (!gameStarted) return;

  if (!isGameOver && !isPaused) {
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

function applyCustomColors(bgColor, fgColor) {
  document.documentElement.style.setProperty('--bg-color', bgColor);
  document.documentElement.style.setProperty('--fg-color', fgColor);
  document.documentElement.style.setProperty('--border-color', fgColor);

  // Save to localStorage
  localStorage.setItem("pongColors", JSON.stringify({ bgColor, fgColor }));
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
  if (evt.key === "Escape") {
    isPaused = !isPaused;
    pauseToggle.textContent = isPaused ? "Resume" : "Pause";
  }
});

document.addEventListener("keyup", (evt) => {
  if (evt.key === "w" || evt.key === "W") player1Up = false;
  if (evt.key === "s" || evt.key === "S") player1Down = false;
  if (evt.key === "ArrowUp") player2Up = false;
  if (evt.key === "ArrowDown") player2Down = false;
});

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
});

gameContainer.classList.add("hidden");
controls.classList.add("hidden");

startGameBtn.addEventListener("click", () => 
{
  mainMenu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  controls.classList.remove("hidden");
  gameStarted = true;
  const bgColor = bgColorPicker.value;
  const fgColor = fgColorPicker.value;
  applyCustomColors(bgColor, fgColor);
});

modeToggle.addEventListener("click", () => {
  useAI = !useAI;
  modeToggle.textContent = useAI ? "Switch to Multiplayer" : "Switch to AI";

  // Reset scores
  player.score = 0;
  ai.score = 0;
  updateScoreboard();
  resetBall();
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

updateScoreboard();
