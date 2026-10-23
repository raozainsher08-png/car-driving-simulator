const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const speedValue = document.getElementById('speed-value');
const gearValue = document.getElementById('gear-value');
const scoreValue = document.getElementById('score-value');
const bestValue = document.getElementById('best-value');
const panel = document.getElementById('panel');
const startButton = document.getElementById('start-button');
const carPicker = document.getElementById('car-picker');
const statsBox = document.getElementById('stats-box');

const road = {
  x: canvas.width / 2 - 210,
  width: 420,
  lanes: 3,
};

const cars = [
  {
    name: 'Bugatti Chiron',
    color: '#f3d6a6',
    accent: '#7a4d12',
    topSpeed: 350,
    acceleration: 14,
    handling: 1.45,
    brake: 18,
    description: 'Hypercar icon',
  },
  {
    name: 'BMW M8',
    color: '#d4d9df',
    accent: '#6a7a8d',
    topSpeed: 300,
    acceleration: 13,
    handling: 1.28,
    brake: 17,
    description: 'Grand touring power',
  },
  {
    name: 'Porsche 911 Turbo',
    color: '#ef3b5b',
    accent: '#7a0e22',
    topSpeed: 290,
    acceleration: 12.5,
    handling: 1.35,
    brake: 16,
    description: 'Track-ready balance',
  },
  {
    name: 'Mercedes AMG GT',
    color: '#2ec4b6',
    accent: '#0d5d57',
    topSpeed: 280,
    acceleration: 11.8,
    handling: 1.22,
    brake: 15.5,
    description: 'Luxury speed',
  },
  {
    name: 'Audi R8',
    color: '#ff9f1c',
    accent: '#c86a00',
    topSpeed: 275,
    acceleration: 11.4,
    handling: 1.25,
    brake: 15,
    description: 'Italian-inspired coupe',
  },
];

let selectedCar = cars[0];
let world = null;
let bestScore = Number(localStorage.getItem('luxury-highway-best') || 0);

const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  boost: false,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createCarOption(car, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'car-option';
  button.innerHTML = `
    <h3>${car.name}</h3>
    <p>${car.description}</p>
  `;

  if (index === 0) button.classList.add('selected');

  button.addEventListener('click', () => {
    selectedCar = car;
    document.querySelectorAll('.car-option').forEach((el) => el.classList.remove('selected'));
    button.classList.add('selected');
    updateStats();
  });

  return button;
}

function updateStats() {
  statsBox.innerHTML = `
    <div class="stat"><span class="stat-label">Top speed</span><strong>${selectedCar.topSpeed} km/h</strong></div>
    <div class="stat"><span class="stat-label">Acceleration</span><strong>${selectedCar.acceleration.toFixed(1)}</strong></div>
    <div class="stat"><span class="stat-label">Handling</span><strong>${selectedCar.handling.toFixed(2)}</strong></div>
    <div class="stat"><span class="stat-label">Braking</span><strong>${selectedCar.brake.toFixed(1)}</strong></div>
  `;
}

cars.forEach((car, index) => {
  carPicker.appendChild(createCarOption(car, index));
});
updateStats();
bestValue.textContent = bestScore;

function resetWorld() {
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 38,
    height: 72,
    speed: 0,
    maxSpeed: selectedCar.topSpeed,
    acceleration: selectedCar.acceleration,
    handling: selectedCar.handling,
    brake: selectedCar.brake,
    color: selectedCar.color,
    accent: selectedCar.accent,
    tilt: 0,
    boostMeter: 100,
    boostActive: false,
  };

  const traffic = [];
  const laneCenters = [-140, 0, 140];
  for (let i = 0; i < 12; i += 1) {
    const lane = Math.floor(Math.random() * laneCenters.length);
    const type = cars[Math.floor(Math.random() * cars.length)];
    traffic.push({
      x: road.x + 76 + lane * 140 + (Math.random() - 0.5) * 18,
      y: -140 - i * 120,
      width: 34,
      height: 68,
      speed: 180 + Math.random() * 120,
      lane,
      drift: (Math.random() - 0.5) * 1.5,
      color: type.color,
      accent: type.accent,
      passed: false,
    });
  }

  world = {
    player,
    traffic,
    roadScroll: 0,
    score: 0,
    distance: 0,
    time: 0,
    gameOver: false,
  };

  updateHud();
}

function updateHud() {
  if (!world) return;

  const speedKmh = Math.round(Math.abs(world.player.speed));
  speedValue.textContent = speedKmh;

  let gear = 'N';
  if (world.player.speed > 15) gear = '1';
  if (world.player.speed > 65) gear = '2';
  if (world.player.speed > 120) gear = '3';
  if (world.player.speed > 180) gear = '4';
  if (world.player.speed > 240) gear = '5';
  if (world.player.speed > 300) gear = '6';

  gearValue.textContent = gear;
  scoreValue.textContent = Math.floor(world.score);
  bestValue.textContent = Math.floor(bestScore);
}

function drawRoad() {
  const { x, width } = road;
  ctx.fillStyle = '#1a1d23';
  ctx.fillRect(x, 0, width, canvas.height);

  ctx.fillStyle = '#474d57';
  for (let i = 0; i < canvas.height; i += 60) {
    const y = (i + (world.roadScroll * 1.5)) % (canvas.height + 60) - 60;
    ctx.fillRect(x + width / 3 - 4, y, 8, 30);
    ctx.fillRect(x + (2 * width) / 3 - 4, y, 8, 30);
  }

  ctx.strokeStyle = '#f2f5f7';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 20]);
  ctx.beginPath();
  ctx.moveTo(x + width / 2, 0);
  ctx.lineTo(x + width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, 0, width, canvas.height);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#1a3757');
  sky.addColorStop(1, '#050b12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 140 + world.roadScroll * 0.2) % (canvas.width + 300) - 100;
    const y = 40 + (i % 6) * 80;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x, y, 3, 3);
  }

  drawRoad();
}

function drawCar(car, isPlayer = false) {
  const { x, y, width, height, color, accent, tilt } = car;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt || 0);

  if (isPlayer) {
    ctx.shadowColor = 'rgba(110, 231, 255, 0.72)';
    ctx.shadowBlur = 15;
  }

  ctx.fillStyle = color;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  ctx.fillStyle = accent;
  ctx.fillRect(-width / 2 + 6, -height / 2 + 10, width - 12, 18);

  ctx.fillStyle = '#dfe7ef';
  ctx.fillRect(-width / 2 + 8, -height / 2 + 2, 8, 10);
  ctx.fillRect(width / 2 - 16, -height / 2 + 2, 8, 10);
  ctx.fillRect(-width / 2 + 8, height / 2 - 12, 8, 10);
  ctx.fillRect(width / 2 - 16, height / 2 - 12, 8, 10);

  ctx.fillStyle = '#1c2330';
  ctx.fillRect(-width / 2 + 6, -height / 2 + 26, width - 12, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-width / 2 + 10, -height / 2 + 32, width - 20, 6);

  ctx.restore();
}

function drawBoostMeter() {
  if (!world) return;
  const { player } = world;
  const x = 80;
  const y = canvas.height - 36;
  const w = 220;
  const h = 16;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, y, w, h);

  const boostWidth = (player.boostMeter / 100) * w;
  ctx.fillStyle = player.boostMeter > 30 ? '#69f0ae' : '#ffb648';
  ctx.fillRect(x, y, boostWidth, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#edf6ff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Nitro', x, y - 8);
}

function drawGameOver() {
  if (!world || !world.gameOver) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px Arial';
  ctx.fillText('Crash!', canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = '22px Arial';
  ctx.fillText(`Score: ${Math.floor(world.score)}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
  ctx.textAlign = 'left';
}

function updateWorld() {
  if (!world || world.gameOver) return;

  const { player } = world;

  if (input.up) {
    player.speed += player.acceleration * 0.35;
  } else {
    player.speed -= 0.8;
  }

  if (input.down) {
    player.speed -= player.brake * 0.4;
  }

  if (!input.up && !input.down) {
    player.speed -= 0.6;
  }

  if (input.boost && player.boostMeter > 0) {
    player.speed += 1.8;
    player.boostMeter = Math.max(0, player.boostMeter - 2.2);
    player.boostActive = true;
  } else {
    player.boostActive = false;
    player.boostMeter = Math.min(100, player.boostMeter + 0.22);
  }

  player.speed = clamp(player.speed, 0, player.maxSpeed + (input.boost ? 85 : 0));

  const steerAmount = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const turnPower = (player.speed / 220) * player.handling * 1.7;
  player.x += steerAmount * turnPower * 10;
  player.x = clamp(player.x, road.x + 32, road.x + road.width - 32);
  player.tilt = steerAmount * (0.14 + player.speed / 500);

  world.roadScroll += player.speed * 0.75;
  world.score += player.speed * 0.08;
  world.distance += player.speed * 0.1;
  world.time += 1;

  for (const trafficCar of world.traffic) {
    trafficCar.y += player.speed * 0.8 - trafficCar.speed * 0.75;
    trafficCar.x += Math.sin((world.time + trafficCar.lane * 25) * 0.045) * 0.35;

    if (trafficCar.y > canvas.height + 120) {
      trafficCar.y = -200;
      trafficCar.x = road.x + 70 + Math.random() * (road.width - 140);
      trafficCar.speed = 150 + Math.random() * 110;
      trafficCar.lane = Math.floor(Math.random() * road.lanes);
      trafficCar.passed = false;
    }

    if (!trafficCar.passed && trafficCar.y > player.y) {
      trafficCar.passed = true;
      world.score += 30;
    }

    const dx = Math.abs(trafficCar.x - player.x);
    const dy = Math.abs(trafficCar.y - player.y);
    if (dx < (trafficCar.width + player.width) * 0.45 && dy < (trafficCar.height + player.height) * 0.52) {
      world.gameOver = true;
      bestScore = Math.max(bestScore, Math.floor(world.score));
      localStorage.setItem('luxury-highway-best', String(bestScore));
    }
  }

  updateHud();
}

function drawScene() {
  drawBackground();

  if (!world) return;

  for (const trafficCar of world.traffic) {
    drawCar(trafficCar, false);
  }

  drawCar(world.player, true);
  drawBoostMeter();
  drawGameOver();
}

function gameLoop() {
  updateWorld();
  drawScene();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  resetWorld();
  panel.classList.add('hidden');
  world.gameOver = false;
  requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', () => {
  startGame();
});

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'a' || key === 'arrowleft') input.left = true;
  if (key === 'd' || key === 'arrowright') input.right = true;
  if (key === 'w' || key === 'arrowup') input.up = true;
  if (key === 's' || key === 'arrowdown') input.down = true;
  if (key === 'shift') input.boost = true;

  if (key === 'r' && world && world.gameOver) {
    startGame();
  }
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'a' || key === 'arrowleft') input.left = false;
  if (key === 'd' || key === 'arrowright') input.right = false;
  if (key === 'w' || key === 'arrowup') input.up = false;
  if (key === 's' || key === 'arrowdown') input.down = false;
  if (key === 'shift') input.boost = false;
});

resetWorld();
updateHud();
requestAnimationFrame(gameLoop);
