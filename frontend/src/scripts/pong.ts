/**
 * This file sets up and renders a Pong scene using BabylonJS.
 * The actual game logic (ball movement, scoring, collisions) is handled on the backend.
 * We maintain a `clientGameState` object locally (imported from userState or a global store)
 * to keep track of the player's positions and the ball's position, updated via WebSocket.
 * 
 * The code below focuses on:
 * - Creating BabylonJS scene and meshes (player paddles, ball, court).
 * - Subscribing to user input (keyboard) to send 'player_move' events to the server.
 * - Rendering the scene each frame based on `clientGameState`.
 */

import { incrementWins } from "./services/user.service";
import { UserState } from "./userState";

/**
 * A shared or global clientGameState that mirrors the server state.
 * The server will periodically send updates (positions, scores, etc.)
 * which we store here. Then we use these coordinates for rendering.
 */
export const clientGameState = {
  gameId: 0,
  player1: {
    x: 0,
    y: 0,
    score: 0
  },
  player2: {
    x: 0,
    y: 0,
    score: 0
  },
  ball: {
    x: 0,
    y: 0
  }
};

/**
 * Get user's own ID (for reference when sending 'player_move' to the server).
 * If not found, will remain null.
 */
let userId: number | null = UserState.getUser()?.id || null;


/**
 * updateScoreDisplay() - updates the DOM score element.
 * Currently, it uses local scorePlayer1 and scorePlayer2,
 * but ideally you'd read from `clientGameState.player1.score` and `clientGameState.player2.score`.
 */
function updateScoreDisplay(): void {
  const scoreDisplay = document.getElementById("scoreDisplay") as HTMLElement;
  scoreDisplay.innerHTML = `${clientGameState.player1.score} : ${clientGameState.player2.score}`;
}

/**
 * Helper to retrieve essential DOM elements for the Pong UI.
 */
function getElements(): {
  canvas: HTMLCanvasElement;
  scoreDisplay: HTMLElement;
  startMenu: HTMLElement;
  gameOverMenu: HTMLElement;
  startButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  quitButton: HTMLButtonElement;
} {
  return {
    canvas: document.getElementById("renderCanvas") as HTMLCanvasElement,
    scoreDisplay: document.getElementById("scoreDisplay") as HTMLElement,
    startMenu: document.getElementById("startMenu") as HTMLElement,
    gameOverMenu: document.getElementById("gameOverMenu") as HTMLElement,
    startButton: document.getElementById("startButton") as HTMLButtonElement,
    restartButton: document.getElementById("restartButton") as HTMLButtonElement,
    quitButton: document.getElementById("quitButton") as HTMLButtonElement
  };
}

/**
 * Creates the BabylonJS engine for the given canvas.
 */
function createEngine(canvas: HTMLCanvasElement): BABYLON.Engine {
  return new BABYLON.Engine(canvas, true, {
    disableWebGL2Support: false,
    preserveDrawingBuffer: true,
    stencil: true,
    powerPreference: "high-performance"
  });
}

/**
 * Sets up the camera with a simple animation.
 */
function createCamera(scene: BABYLON.Scene): BABYLON.ArcRotateCamera {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    BABYLON.Tools.ToRadians(60),
    BABYLON.Tools.ToRadians(55),
    20,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.setTarget(BABYLON.Vector3.Zero());

  const cameraAlphaAnim = new BABYLON.Animation(
    "cameraAlphaAnim",
    "alpha",
    40,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  cameraAlphaAnim.setKeys([
    { frame: 0, value: BABYLON.Tools.ToRadians(30) },
    { frame: 100, value: BABYLON.Tools.ToRadians(0) }
  ]);
  camera.animations.push(cameraAlphaAnim);

  const cameraBetaAnim = new BABYLON.Animation(
    "cameraBetaAnim",
    "beta",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  cameraBetaAnim.setKeys([
    { frame: 0, value: BABYLON.Tools.ToRadians(55) },
    { frame: 100, value: BABYLON.Tools.ToRadians(30) }
  ]);
  camera.animations.push(cameraBetaAnim);

  return camera;
}

/**
 * Creates a basic HemisphericLight in the scene.
 */
function createLights(scene: BABYLON.Scene): void {
  const hemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 5;
}

/**
 * Creates the ground (court) with a custom texture.
 */
function createGround(scene: BABYLON.Scene): BABYLON.Mesh {
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10.97, height: 23.77 }, scene);
  const clayMaterial = new BABYLON.StandardMaterial("clayMaterial", scene);
  clayMaterial.diffuseTexture = new BABYLON.Texture(
    "https://media.istockphoto.com/id/520420178/fr/photo/abstrait-rouge-texture-de-mur-de-ciment.jpg?s=612x612&w=0&k=20&c=wq5Y1JHKIQTPywXnLnJTcK3DLjYP_Wa6uQWbNNvz39Y=",
    scene
  );
  clayMaterial.specularColor = BABYLON.Color3.Black();
  ground.material = clayMaterial;
  return ground;
}

/**
 * Creates the net in the center of the court.
 */
function createNet(scene: BABYLON.Scene): void {
  const netWidth = 10.97;
  const netHeight = 1.07;

  // Upper white band
  const whiteBand = BABYLON.MeshBuilder.CreateBox("whiteBand", { width: netWidth, height: 0.1, depth: 0.01 }, scene);
  whiteBand.position = new BABYLON.Vector3(0, netHeight - 0.05, 0);
  const whiteBandMaterial = new BABYLON.StandardMaterial("whiteBandMaterial", scene);
  whiteBandMaterial.emissiveColor = BABYLON.Color3.White();
  whiteBand.material = whiteBandMaterial;

  // Actual net part
  const netMesh = BABYLON.MeshBuilder.CreateBox("netMesh", { width: netWidth, height: netHeight, depth: 0.01 }, scene);
  netMesh.position = new BABYLON.Vector3(0, netHeight / 2 - 0.05, 0);
}

/**
 * Utility to create a single line in the scene.
 */
function createLine(
  scene: BABYLON.Scene,
  start: BABYLON.Vector3,
  end: BABYLON.Vector3,
  name: string
): BABYLON.Mesh {
  const line = BABYLON.MeshBuilder.CreateLines(name, { points: [start, end] }, scene);
  line.color = BABYLON.Color3.White();
  return line;
}

/**
 * Draw the tennis court lines.
 */
function createCourtLines(scene: BABYLON.Scene): void {
  const halfCourtWidth = 4.115;
  const fullCourtLength = 23.77;
  const serviceLineDistance = 6.4;
  const doublesWidth = 5.485;

  // Outer boundary lines
  createLine(scene, new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2), "outerLeft");
  createLine(scene, new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2), "outerRight");
  createLine(scene, new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2), "outerTop");
  createLine(scene, new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2), "outerBottom");

  // Singles lines
  createLine(scene, new BABYLON.Vector3(-halfCourtWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(-halfCourtWidth, 0.01, fullCourtLength / 2), "singlesLeft");
  createLine(scene, new BABYLON.Vector3(halfCourtWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(halfCourtWidth, 0.01, fullCourtLength / 2), "singlesRight");

  // Service lines
  createLine(scene, new BABYLON.Vector3(-halfCourtWidth, 0.01, -serviceLineDistance), new BABYLON.Vector3(halfCourtWidth, 0.01, -serviceLineDistance), "serviceLineTop");
  createLine(scene, new BABYLON.Vector3(-halfCourtWidth, 0.01, serviceLineDistance), new BABYLON.Vector3(halfCourtWidth, 0.01, serviceLineDistance), "serviceLineBottom");
  createLine(scene, new BABYLON.Vector3(0, 0.01, -serviceLineDistance), new BABYLON.Vector3(0, 0.01, serviceLineDistance), "centerServiceLine");

  // Baseline center marks
  createLine(scene, new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2 + 0.1), "baselineCenterTop");
  createLine(scene, new BABYLON.Vector3(0, 0.01, fullCourtLength / 2), new BABYLON.Vector3(0, 0.01, fullCourtLength / 2 - 0.1), "baselineCenterBottom");
}

/**
 * Create a player's paddle (just a box mesh here).
 */
function createPlayerPaddle(
  scene: BABYLON.Scene,
  positionZ: number,
  paddleWidth: number,
  paddleHeight: number,
  paddleDepth: number
): BABYLON.Mesh {
  const paddle = BABYLON.MeshBuilder.CreateBox("playerPaddle", { width: paddleWidth, height: paddleHeight, depth: paddleDepth }, scene);
  paddle.position = new BABYLON.Vector3(0, 0, positionZ);
  const paddleMaterial = new BABYLON.StandardMaterial("playerPaddleMaterial", scene);
  paddleMaterial.emissiveColor = BABYLON.Color3.White();
  paddle.material = paddleMaterial;
  return paddle;
}

/**
 * Create two paddles (player1, player2).
 */
function createPlayers(scene: BABYLON.Scene): { player1: BABYLON.Mesh; player2: BABYLON.Mesh } {
  const fullCourtLength = 23.77;
  const PADDLE_WIDTH = 1;
  const PADDLE_HEIGHT = 1.5;
  const PADDLE_DEPTH = 0.2;

  const player1 = createPlayerPaddle(scene, -fullCourtLength / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH);
  const player2 = createPlayerPaddle(scene, fullCourtLength / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH);

  return { player1, player2 };
}

/**
 * Create the ball mesh.
 */
function createBall(scene: BABYLON.Scene): BABYLON.Mesh {
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.3 }, scene);
  ball.position = new BABYLON.Vector3(0, 0.25, 0);
  return ball;
}

/**
 * Main function that is called when rendering the /pong page.
 * It initializes the scene, sets up the game objects (players, ball, ground),
 * and listens to keyboard events to send 'player_move' events (if needed).
 */
export function loadPongPageScript(): void {
  const { canvas, startMenu, gameOverMenu, startButton, restartButton, quitButton } = getElements();

  // Create a Babylon engine and scene
  const engine = createEngine(canvas);
  const scene = new BABYLON.Scene(engine);

  // Basic setup: camera, lights, environment
  const camera = createCamera(scene);
  createLights(scene);
  createGround(scene);
  createNet(scene);
  createCourtLines(scene);

  // Create mesh objects
  const { player1, player2 } = createPlayers(scene);
  const ball = createBall(scene);

  // Example: If you still want to handle local input for test
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    console.log("Key pressed: ", event.key);
    userId = UserState.getUser()?.id || null;
    if(event.key === "ArrowLeft") {
      UserState.getGameSocket()?.send(JSON.stringify({ type: 'player_move', gameId: clientGameState.gameId, userId, direction: 'LEFT' }))}
    else if(event.key === "ArrowRight") {
      UserState.getGameSocket()?.send(JSON.stringify({ type: 'player_move', gameId: clientGameState.gameId, userId, direction: 'RIGHT' }))


    // Instead of directly moving the paddle, you can send a WebSocket message:
    // socket.send(JSON.stringify({type: 'player_move', userId, direction: 'LEFT' / 'RIGHT'}));
    console.log("Pressed: ", event.key);
  }});

  scene.beginAnimation(camera, 0, 100, false, 1, () => {
    // Show the start menu after camera animation
    startMenu.style.display = "block";
  });

  /**
   * Example startGame function. Right now, it just hides the menu and resets some UI.
   * The actual ball/paddle logic is on the server, so no local loop is needed.
   */
  function startGame(): void {
    startMenu.style.display = "none";
    gameOverMenu.style.display = "none";
    updateScoreDisplay();
  }

  startButton.onclick = startGame;
  restartButton.onclick = () => {
    // If you want to request a "restart" from the server, do it here
    // For now, just reset local scores
    clientGameState.player1.score = 0;
    clientGameState.player2.score = 0;
    updateScoreDisplay();
    startGame();
  };

  quitButton.onclick = () => {
    alert("Merci d'avoir joué!");
    gameOverMenu.style.display = "none";
    // Potentially redirect user away from the game
  };

  /**
   * Main render loop for BabylonJS
   * - We read the `clientGameState` for positions/score
   * - Then we update the mesh positions accordingly
   */
  engine.runRenderLoop(() => {
    // Update the scoreboard from clientGameState
    updateScoreDisplay();

    // Move player1 mesh according to clientGameState
    player1.position.x = clientGameState.player1.x;
    // We keep the Z constant for player1 at the "top" or "bottom" as needed

    // Move player2 mesh
    player2.position.x = clientGameState.player2.x;

    // Move the ball
    ball.position.x = clientGameState.ball.x;
    ball.position.z = clientGameState.ball.y;

    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    engine.resize();
  });
}