// FINAL PROJECT

const OPEN_TILE = 0;
const IMPASSABLE = 1;
const FINISH_LINE = 2;
const CELL_SIZE = 10;
const DARK_FINISH = 3;

// Kerb painting
const KERB_RED = 4;
const KERB_WHITE = 5;

// Color combos

const CIRCUIT_COLORS = {
  yasMarina: {
    track: "#333333",
    grass: "#477A45",
    kerbRed: "#E32636",
    white: "#ffffffe3",
    water: "#25BFE0",
    runoff: "#0bc0b1",
    buildings: "#A6A6A6",
    buildingsDark: "#707070",
  },

  monaco: {
    track: "#333333",
    grass: "#477A45",
    kerbRed: "#E32636",
    white: "#ffffffe3",
    water: "#25BFE0",
    buildings: "#808080",
  },

};


let rows, cols, grid, yasMarina, deMonaco;
let gameState = "home";
let finishPaintMode = false;

let currentCircuit;
let currentRbLine, currentSfLine, currentScale;
let winner = "";

let buttonW = 250;
let buttonH = 60;
let buttonX, buttonY;

let homeW = 100;
let homeH = 40;
let homeX, homeY;

let restartW = 120;
let restartH = 40;
let restartX, restartY;

// Starting positions (grid coordinates)
let rbFinishLine = { x: 124, y: 50 };
let sfFinishLine = { x: 124, y: 53 };
let monacoRbStart = { x: 132, y: 375 }; 
let monacoSfStart = { x: 132, y: 377 }; 

// Cars' images and Physics
let redbullImage;
let rbCarSpeed = 0;
let rbAcceleration = 0.18;
let rbMaxSpeed = 9.5;
let rbFriction = 0.98;
let rbTurnSpeed = 0.067;
let rbCarAngle = 0;
let rbCarX;
let rbCarY;

let ferrariImage;
let sfCarSpeed = 0;
let sfAcceleration = 0.18;
let sfFriction = 0.98;
let sfMaxSpeed = 9.5;
let sfTurnSpeed = 0.065;
let sfCarAngle = 0;
let sfCarX;
let sfCarY;

let rbState = "racing";
let sfState = "racing";

// Circuit measurement
let circuitScale = 1;
let circuitOffsetX = 0;
let circuitOffsetY = 0;
let circuitShiftX = 0;
let circuitShiftY = 0;
let yasScale = 1.5;
let monacoScale = 1.0;

let showCoords = false;

// Cars' Lap time
let rbStartTime = 0;
let sfStartTime = 0;
let rbStarted = false;
let sfStarted = false;
let rbTime = 0;
let sfTime = 0;

// Painting
let kerbPaintMode = false;
let lastKerbX = -1;
let lastKerbY = -1;
let kerbStripe = 0;

async function setup() {
  createCanvas(windowWidth, windowHeight);

  rows = Math.floor(height / CELL_SIZE);
  cols = Math.floor(width / CELL_SIZE);
  grid = generateEmptyGrid(cols, rows);

  yasMarina = await loadJSON("yas_marina.json");
  deMonaco = await loadJSON("monaco.json");

  redbullImage = await loadImage("redbull.png");
  ferrariImage = await loadImage("ferrari.png");

  textAlign(CENTER, CENTER);

  buttonX = width / 2 - buttonW / 2;
  buttonY = height / 2;

  homeX = width - homeW - 20;
  homeY = 20;

  restartX = 20;
  restartY = 20;
}

function draw() {
  background(220);

  if (gameState === "editing") {
    displayGrid();
    drawHomeButton();
  }

  else if (gameState === "home") {
    menuScreen();
  }

  else if (gameState === "playing") {
    handleMovement();
    displayGrid();
    checkCrash();
    drawTimes();
    drawHomeButton();
    drawRestartButton();
  }

  else if (gameState === "finished") {
    displayGrid();

    fill("red");
    textSize(50);
    text("BOTH CRASHED", width / 2, 100);

    drawTimes();
    drawHomeButton();
    drawRestartButton();
  }

  else if (gameState === "won") {
    displayGrid();

    fill("green");
    textSize(50);
    text(winner + " wins!", width / 2, 100);

    drawTimes();
    drawHomeButton();
    drawRestartButton();
  }

  // TEMPORARY: show the grid cell under the mouse
  if (showCoords && gameState !== "home") {
    let gx = Math.floor((mouseX - circuitOffsetX) / circuitScale / CELL_SIZE);
    let gy = Math.floor((mouseY - circuitOffsetY) / circuitScale / CELL_SIZE);
    fill("red");
    textSize(16);
    text(gx + ", " + gy, mouseX, mouseY - 15);
  }
}

// Main circuit logic
function startCircuit(circuit, rbLine, sfLine, startScale, openEditor = false) {
  currentCircuit = circuit;

    if (circuit === yasMarina) {
    selectPalette("yasMarina");
  }

  else if (circuit === deMonaco) {
    selectPalette("monaco");
  }

  currentRbLine = rbLine;
  currentSfLine = sfLine;
  currentScale = startScale;

  grid = structuredClone(circuit);

// Add extra space to Monaco only
if (circuit === deMonaco) {

  // Add 60 empty columns to the right
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < 60; x++) {
      grid[y].push(OPEN_TILE);
    }
  }

  // Add 70 empty rows to the TOP
  for (let y = 0; y < 70; y++) {
    grid.unshift(Array(grid[0].length).fill(OPEN_TILE));
  }

  // Add 30 empty rows to the BOTTOM
  for (let y = 0; y < 30; y++) {
    grid.push(Array(grid[0].length).fill(OPEN_TILE));
  }
}

  // Update dimensions
  rows = grid.length;
  cols = grid[0].length;

  // Red Bull starting position
  rbCarX = rbLine.x * CELL_SIZE;
  rbCarY = rbLine.y * CELL_SIZE;
  rbCarAngle = 0;
  rbCarSpeed = 0;

  // Ferrari starting position
  sfCarX = sfLine.x * CELL_SIZE;
  sfCarY = sfLine.y * CELL_SIZE;
  sfCarAngle = 0;
  sfCarSpeed = 0;

  winner = "";
  rbState = "racing";
  sfState = "racing";

  rbStarted = false;
  sfStarted = false;
  rbTime = 0;
  sfTime = 0;

  circuitScale = startScale;

  // Centre after expanding the grid
  centerCircuit();

  gameState = openEditor ? "editing" : "playing";
}

function displayGrid() {

  // Draw circuit
  push();

  translate(circuitOffsetX, circuitOffsetY);
  scale(circuitScale);

for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {

    if (grid[y][x] === KERB_RED) {
      fill("#E32636");
    }
    else if (grid[y][x] === KERB_WHITE) {
      fill("white");
    }
    else if (grid[y][x] === IMPASSABLE) {
      fill("black");
    }
    else if (grid[y][x] === FINISH_LINE) {
      fill("white");
    }
    else if (grid[y][x] === DARK_FINISH) {
      fill(51, 51, 51);
    }
    else {
      fill(220);
    }

    if (gameState === "editing") {
      stroke(160);
      strokeWeight(0.5);
    } else {
      noStroke();
    }

    square(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE);
  }
}

  pop();

  // Draw both cars separately so each uses its own image and angle.
  if (gameState === "playing" || gameState === "finished" || gameState === "won") {
    push();
    translate(circuitOffsetX, circuitOffsetY);
    scale(circuitScale);

    push();
    translate(rbCarX + CELL_SIZE / 2, rbCarY + CELL_SIZE / 2);
    rotate(rbCarAngle);
    if (redbullImage) {
      imageMode(CENTER);
      image(redbullImage, 0, 0, CELL_SIZE * 4, CELL_SIZE * 4);
    }
    pop();

    push();
    translate(sfCarX + CELL_SIZE / 2, sfCarY + CELL_SIZE / 2);
    rotate(sfCarAngle);
    if (ferrariImage) {
      imageMode(CENTER);
      image(ferrariImage, 0, 0, CELL_SIZE * 4.3, CELL_SIZE * 2.3);
    }
    pop();

    pop();
    imageMode(CORNER);
    rectMode(CORNER);
  }
}

function expandCircuit(circuit) {
  let newGrid = structuredClone(circuit);

  let screenCols = Math.floor(width / CELL_SIZE);
  let screenRows = Math.floor(height / CELL_SIZE);

  // Find the required number of columns
  let targetCols = Math.max(
    screenCols,
    ...newGrid.map(row => row.length)
  );

  // Expand every existing row
  for (let y = 0; y < newGrid.length; y++) {
    while (newGrid[y].length < targetCols) {
      newGrid[y].push(OPEN_TILE);
    }
  }

  // Add rows if needed
  while (newGrid.length < screenRows) {
    newGrid.push(Array(targetCols).fill(OPEN_TILE));
  }

  return newGrid;
}

function checkCrash() {
  fill("red");
  textSize(30);
  if (rbState === "crashed") {
    text("Red Bull crashed", width / 2, 40);
  }
  if (sfState === "crashed") {
    text("Ferrari crashed", width / 2, 80);
  }
}

function handleMovement() {

  // RED BULL
  if (rbState === "racing") {
    if (!rbStarted && (keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW))) {
      rbStarted = true;
      rbStartTime = millis();
    }

    if (keyIsDown(UP_ARROW)) {
      rbCarSpeed += rbAcceleration;
    }
    if (keyIsDown(DOWN_ARROW)) {
      rbCarSpeed -= rbAcceleration;
    }
    if (keyIsDown(LEFT_ARROW)) {
      rbCarAngle -= rbTurnSpeed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      rbCarAngle += rbTurnSpeed;
    }

    rbCarSpeed *= rbFriction;
    rbCarSpeed = constrain(rbCarSpeed, -rbMaxSpeed / 2, rbMaxSpeed);

    rbCarX += cos(rbCarAngle) * rbCarSpeed;
    rbCarY += sin(rbCarAngle) * rbCarSpeed;

    rbState = checkCollision(rbCarX, rbCarY);
    if (rbState === "won") {
      rbTime = millis() - rbStartTime;
    }
  }

  // FERRARI
  if (sfState === "racing") {
    if (!sfStarted && (keyIsDown("KeyW") || keyIsDown("KeyS"))) {
      sfStarted = true;
      sfStartTime = millis();
    }

    if (keyIsDown("KeyW")) {
      sfCarSpeed += sfAcceleration;
    }
    if (keyIsDown("KeyS")) {
      sfCarSpeed -= sfAcceleration;
    }
    if (keyIsDown("KeyA")) {
      sfCarAngle -= sfTurnSpeed;
    }
    if (keyIsDown("KeyD")) {
      sfCarAngle += sfTurnSpeed;
    }

    sfCarSpeed *= sfFriction;
    sfCarSpeed = constrain(sfCarSpeed, -sfMaxSpeed / 2, sfMaxSpeed);

    sfCarX += cos(sfCarAngle) * sfCarSpeed;
    sfCarY += sin(sfCarAngle) * sfCarSpeed;

    sfState = checkCollision(sfCarX, sfCarY);
    if (sfState === "won") {
      sfTime = millis() - sfStartTime;
    }
  }

  // Game is over once neither car is still racing
  if (rbState !== "racing" && sfState !== "racing") {
    if (rbState === "won" && sfState === "won") {
      winner = rbTime < sfTime ? "Red Bull" : "Ferrari";
      gameState = "won";
    }
    else if (rbState === "won") {
      winner = "Red Bull";
      gameState = "won";
    }
    else if (sfState === "won") {
      winner = "Ferrari";
      gameState = "won";
    }
    else {
      gameState = "finished";
    }
  }
}

function checkCollision(carX, carY) {
  let gridX = Math.floor((carX + CELL_SIZE / 2) / CELL_SIZE);
  let gridY = Math.floor((carY + CELL_SIZE / 2) / CELL_SIZE);

  if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows) {
    return "crashed";
  }

  if (grid[gridY][gridX] === IMPASSABLE) {
    return "crashed";
  }

  if (grid[gridY][gridX] === FINISH_LINE || grid[gridY][gridX] === DARK_FINISH) {
    return "won";
  }

  return "racing";
}

let currentPalette;
let selectedColor;

function selectPalette(circuitName) {
  currentPalette = CIRCUIT_COLORS[circuitName];
  selectedColor = currentPalette.track;
}

function paintKerbCell() {
  let x = Math.floor((mouseX - circuitOffsetX) / circuitScale / CELL_SIZE);
  let y = Math.floor((mouseY - circuitOffsetY) / circuitScale / CELL_SIZE);

  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  // First cell
  if (lastKerbX === -1) {
    paintAlternatingKerb(x, y);
  }

  // Connect the previous cell to the current cell
  else {
    let x0 = lastKerbX;
    let y0 = lastKerbY;

    let dx = Math.abs(x - x0);
    let sx = x0 < x ? 1 : -1;

    let dy = -Math.abs(y - y0);
    let sy = y0 < y ? 1 : -1;

    let error = dx + dy;

    while (x0 !== x || y0 !== y) {
      let e2 = 2 * error;

      if (e2 >= dy) {
        error += dy;
        x0 += sx;
      }

      if (e2 <= dx) {
        error += dx;
        y0 += sy;
      }

      paintAlternatingKerb(x0, y0);
    }
  }

  lastKerbX = x;
  lastKerbY = y;
}


// Paint one alternating red/white tile
function paintAlternatingKerb(x, y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  if (kerbStripe === 0) {
    grid[y][x] = KERB_RED;
    kerbStripe = 1;
  } else {
    grid[y][x] = KERB_WHITE;
    kerbStripe = 0;
  }
}


// Generating the grid and templates
function generateEmptyGrid(gridCols, gridRows) {
  let newGrid = [];

  for (let y = 0; y < gridRows; y++) {
    newGrid.push([]);

    for (let x = 0; x < gridCols; x++) {
      newGrid[y].push(OPEN_TILE);
    }
  }

  return newGrid;
}

function restartCircuit() {
  if (currentCircuit) {
    startCircuit(currentCircuit, currentRbLine, currentSfLine, currentScale);
  }
}

function startTemplate() {
  currentCircuit = null;
  rows = Math.floor(height / CELL_SIZE);
  cols = Math.floor(width / CELL_SIZE);
  grid = generateEmptyGrid(cols, rows);
  circuitScale = 1;
  centerCircuit();
  gameState = "editing";
}

function menuScreen() {
  fill("black");
  textSize(48);
  text("Select Your Circuit", width / 2, height / 2 - 100);

  drawButton("Yas Marina", buttonX, buttonY);
  drawButton("Circuit Template", buttonX, buttonY + 100);
  drawButton("Circuit De Monaco", buttonX, buttonY + 200);
}

// Drawing circuit
function drawButton(label, bx, by) {
  fill("black");
  rect(bx, by, buttonW, buttonH);

  fill("white");
  textSize(24);
  text(label, bx + buttonW / 2, by + buttonH / 2);
}

function drawHomeButton() {
  fill("black");
  rect(homeX, homeY, homeW, homeH);

  fill("white");
  textSize(20);
  text("Home", homeX + homeW / 2, homeY + homeH / 2);
}

function drawRestartButton() {
  fill("black");
  rect(restartX, restartY, restartW, restartH);

  fill("white");
  textSize(20);
  text("Restart", restartX + restartW / 2, restartY + restartH / 2);
}

function paintCell() {
  let x = Math.floor((mouseX - circuitOffsetX) / circuitScale / CELL_SIZE);
  let y = Math.floor((mouseY - circuitOffsetY) / circuitScale / CELL_SIZE);

  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    // Erase
    if (keyIsDown(SHIFT)) {
      grid[y][x] = OPEN_TILE;
    }

    // White finish line
    else if (finishPaintMode) {
      grid[y][x] = FINISH_LINE;
    }

    // Dark finish line
    else if (key === "d" || key === "D") {
      grid[y][x] = DARK_FINISH;
    }

    // Wall
    else {
      grid[y][x] = IMPASSABLE;
    }
  }
}

function drawTimes() {
  fill("black");
  textSize(30);
  text(timeText("Red Bull", rbState, rbStarted, rbStartTime, rbTime), width / 2, height - 70);
  text(timeText("Ferrari", sfState, sfStarted, sfStartTime, sfTime), width / 2, height - 35);
}

function timeText(name, state, started, startTime, finalTime) {
  if (state === "crashed") {
    return name + ": crashed";
  }
  if (state === "won") {
    return name + ": " + (finalTime / 1000).toFixed(3) + " s";
  }
  if (!started) {
    return name + ": 0.000 s";
  }
  // still racing, so show the running time
  return name + ": " + ((millis() - startTime) / 1000).toFixed(3) + " s";
}

// Mouse and keyboard inputs
function mousePressed() {

  // Home button
  if (gameState !== "home" &&
    isMouseOver(homeX, homeY, homeW, homeH)) {

    gameState = "home";
    return;
  }

  // Restart button
  if ((gameState === "playing" || gameState === "finished" || gameState === "won") && isMouseOver(restartX, restartY, restartW, restartH)) {
    restartCircuit();
    return;
  }

  // Menu
  if (gameState === "home") {
    if (isMouseOver(buttonX, buttonY, buttonW, buttonH)) {
      circuitShiftX = 0;
      circuitShiftY = 0;
      startCircuit(yasMarina, rbFinishLine, sfFinishLine, yasScale, true);
      // gameState = "editing";
    }

    else if (isMouseOver(buttonX, buttonY + 100, buttonW, buttonH)) {
      circuitShiftX = 0;
      circuitShiftY = 0;
      startTemplate();
    }

    else if (isMouseOver(buttonX, buttonY + 200, buttonW, buttonH)) {
      circuitShiftX = 0;
      circuitShiftY = 52;
      startCircuit(deMonaco, monacoRbStart, monacoSfStart, monacoScale, true);
      // gameState = "editing";
    }
  }

  // Editing
  else if (gameState === "editing") {
    if (kerbPaintMode) {
      paintKerbCell();
    } else {
      paintCell();
    }
  }
}

function mouseDragged() {
  if (gameState === "editing") {
    if (kerbPaintMode) {
      paintKerbCell();
    } else {
      paintCell();
    }
  }
}

function keyPressed() {

  if (currentPalette) {
    const colors = Object.values(currentPalette);
    const index = Number(key) - 1;

    if (index >= 0 && index < colors.length && index < 9) {
      selectedColor = colors[index];
    }
  }

  if (key === "k" || key === "K") {
    kerbPaintMode = true;
    kerbStripe = 0;
    lastKerbX = -1;
    lastKerbY = -1;
  }
  // Start racing after editing
  if ((key === "p" || key === "P") && gameState === "editing" && currentCircuit) {
    kerbPaintMode = false;
    finishPaintMode = false;
    gameState = "playing";
  }

  // Finish line painting
  if (key === "f" || key === "F") {
    finishPaintMode = true;
  }

  // Home
  if (key === "e" || key === "E") {
    gameState = "home";
  }

  // Restart (only while a race is on screen)
  if ((key === "r" || key === "R") &&
    (gameState === "playing" || gameState === "finished" || gameState === "won")) {
    restartCircuit();
  }

  // Stop the arrow keys from scrolling the page
  if (
    key === "ArrowRight" ||
    key === "ArrowLeft" ||
    key === "ArrowUp" ||
    key === "ArrowDown"
  ) {
    return false;
  }

  // Zoom in
  if (key === "+" || key === "=") {
    enlargeCircuit(0.1);
  }

  // Zoom out
  if (key === "-") {
    enlargeCircuit(-0.1);
  }
}

function keyReleased() {
  if (key === "f" || key === "F") {
    finishPaintMode = false;
  }
  if (key === "k" || key === "K") {
  kerbPaintMode = false;
  }
}

// Circuit adjustment
function enlargeCircuit(amount) {
  circuitScale += amount;

  if (circuitScale < 0.5) {
    circuitScale = 0.5;
  }

  if (circuitScale > 3) {
    circuitScale = 3;
  }

  centerCircuit();
}

function centerCircuit() {
  let minX = cols;
  let maxX = 0;
  let minY = rows;
  let maxY = 0;
  let foundWall = false;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === IMPASSABLE) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        foundWall = true;
      }
    }
  }

  if (!foundWall) {
    circuitOffsetX = 0;
    circuitOffsetY = 0;
    return;
  }

  let centerX = ((minX + maxX + 1) / 2) * CELL_SIZE;
  let centerY = ((minY + maxY + 1) / 2) * CELL_SIZE;

  circuitOffsetX = width / 2 - centerX * circuitScale + circuitShiftX;
  circuitOffsetY = height / 2 - centerY * circuitScale + circuitShiftY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  buttonX = width / 2 - buttonW / 2;
  buttonY = height / 2;

  homeX = width - homeW - 20;
  homeY = 20;

  centerCircuit();
}

function isMouseOver(bx, by, w, h) {
  return mouseX >= bx && mouseX <= bx + w && mouseY >= by && mouseY <= by + h;
}
