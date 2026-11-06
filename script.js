// Canvas
const { body } = document;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const width = 500;
const height = 700;
const isMobile = window.matchMedia('(max-width: 600px)');
const gameOverEl = document.createElement('div');

// Paddle
const paddleHeight = 10;
const paddleWidth = 50;
const paddleHalf = paddleWidth / 2;
const paddleBottomY = height - 20;
const paddleTopY = 10;
const paddleDiff = 25;
let paddleBottomX = (width - paddleWidth) / 2;
let paddleTopX = (width - paddleWidth) / 2;
let playerMoved = false;
let paddleContact = false;

// Ball
let ballX = width / 2;
let ballY = height / 2;
const ballRadius = 5;
// Y Positions where the ball's edge touches each paddle
const bottomHitY = paddleBottomY - ballRadius;
const topHitY = paddleTopY + paddleHeight + ballRadius;

// Speed (negative speedY = ball moves DOWN the screen)
const startSpeedY = -3;
const maxSpeed = 5;
const baseComputerSpeed = isMobile.matches ? 4 : 3;
let speedX = 0;
let speedY = startSpeedY;
let computerSpeed = baseComputerSpeed;

// Score
let playerScore = 0;
let computerScore = 0;
const winningScore = 7;
let isGameOver = true;

// Render everything on canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Player Paddle (Bottom)
  context.fillRect(paddleBottomX, paddleBottomY, paddleWidth, paddleHeight);

  // Player Paddle (Top)
  context.fillRect(paddleTopX, paddleTopY, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
  context.fillStyle = 'white';
  context.fill();

  // Score
  context.font = '32px Courier New';
  context.fillText(playerScore, 20, height / 2 + 50);
  context.fillText(computerScore, 20, height / 2 - 30);
}

// Create Canvas Element
function createCanvas() {
  canvas.width = width;
  canvas.height = height;
  if (!canvas.isConnected) body.appendChild(canvas);
  renderCanvas();
}

// Adjust Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = startSpeedY;
  speedX = 0;
  computerSpeed = baseComputerSpeed;
  paddleContact = false;
}

// Adjust Ball Movement
function ballMove() {
  // vertical speed
  ballY += -speedY;
  // Horizontal Speed
  if (playerMoved && paddleContact) {
    ballX += speedX;
  }
}

// Determine what Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX - ballRadius < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX + ballRadius > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > bottomHitY && speedY < 0) {
    if (ballX > paddleBottomX && ballX < paddleBottomX + paddleWidth) {
      paddleContact = true;
      // Add Speed on Hit
      if (playerMoved) {
        speedY -= 1;
        // Max Speed
        if (speedY < -maxSpeed) {
          speedY = -maxSpeed;
          computerSpeed = 6;
        }
      }
      speedY = -speedY;
      speedX = (ballX - (paddleBottomX + paddleHalf)) * 0.3;
    } else if (ballY > height) {
      // Reset Ball, add to computer score
      ballReset();
      computerScore++;
    }
  }
  // Bounce off Computer Paddle (top)
  if (ballY < topHitY && speedY > 0) {
    if (ballX > paddleTopX && ballX < paddleTopX + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > maxSpeed) {
          speedY = maxSpeed;
        }
      }
      speedY = -speedY;
    } else if (ballY < 0) {
      // Reset Ball, add to Player Score
      ballReset();
      playerScore++;
    }
  }
}

// Computer Movement
function computerAI() {
  if (!playerMoved) return;
  const center = paddleTopX + paddleHalf;
  // Dead zone stops the paddle from jittering left/right when aligned
  if (Math.abs(ballX - center) > computerSpeed) {
    paddleTopX += ballX > center ? computerSpeed : -computerSpeed;
  } else {
    paddleTopX = Math.max(0, Math.min(width - paddleWidth, paddleTopX));
  }
}

function showGameOverEl(winner) {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = `${winner} Wins!`;
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.textContent = 'Play Again';
  playAgainBtn.setAttribute('onclick', 'startGame()');
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
}

// Chek If One Player has Winning Score, If they do, END Game
function gameOver() {
  if (playerScore === winningScore || computerScore === winningScore) {
    isGameOver = true;
    // Set Winner
    const winner = playerScore === winningScore ? 'Player 1' : 'Computer';
    showGameOverEl(winner);
  }
}

// Called Every Frame
function animate() {
  renderCanvas();
  ballMove();
  ballBoundaries();
  computerAI();
  gameOver();
  if (!isGameOver) {
    window.requestAnimationFrame(animate);
  }
}

// Move the player's paddle to a screen X position
function movePaddle(clientX) {
  playerMoved = true;
  // Use the canvas real on-screen position (and scale if CSS resized it)
  const rect = canvas.getBoundingClientRect();
  const scale = width / rect.width;
  const x = (clientX - rect.left) * scale - paddleHalf;
  paddleBottomX = Math.max(0, Math.min(width - paddleWidth, x));
}

// Input listeners: added ONCE, not on every game start
canvas.addEventListener('mousemove', (e) => {
  movePaddle(e.clientX);
  canvas.style.cursor = 'none';
});
canvas.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault();
    movePaddle(e.touches[0].clientX);
  },
  { passive: false }
);

// Start Game, Reset Everything
function startGame() {
  gameOverEl.remove();
  canvas.hidden = false;
  isGameOver = false;
  playerMoved = false;
  playerScore = 0;
  computerScore = 0;
  paddleBottomX = (width - paddleWidth) / 2;
  paddleTopX = (width - paddleWidth) / 2;
  ballReset();
  createCanvas();
  animate();
}

// On Load
startGame();
