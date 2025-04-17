import { 
  Scene, Engine, ArcRotateCamera, Tools, Vector3, Animation,
  CubeTexture, Mesh, AssetContainer, ActionManager, SetValueAction,
  Quaternion, CannonJSPlugin, PhysicsImpostor, LoadAssetContainerAsync, 
  MeshBuilder, Color3 
} from "@babylonjs/core";
import * as CANNON from "cannon";
import "@babylonjs/loaders";
import { UserState } from "./userState";
import { showGameOverModal } from './endGame';
import { GameEvent } from './userState';

// Global game state synced with server updates
export const clientGameState = {
  gameId: 0,
  player1: { id: 0, x: 0, y: 0, score: 0 },
  player2: { id: 0, x: 0, y: 0, score: 0 },
  ball: { x: 0, y: 0, velX: 0, velY: 0 },
};

// Current interpolated positions
const currentPositions = {
  player1: { x: 0 },
  player2: { x: 0 },
  ball: { x: 0, z: 0 }
};

let userId: number | null = UserState.getUser()?.id || null;

// Update scoreboard in the DOM
function updateScoreDisplay(): void {
  const scoreDisplay = document.getElementById("scoreDisplay") as HTMLElement;
  scoreDisplay.innerHTML = `${clientGameState.player1.score} : ${clientGameState.player2.score}`;
}

// Get essential UI elements
function getElements() {
  return {
    canvas: document.getElementById("renderCanvas") as HTMLCanvasElement,
    scoreDisplay: document.getElementById("scoreDisplay") as HTMLElement,
    startMenu: document.getElementById("startMenu") as HTMLElement,
    gameOverMenu: document.getElementById("gameOverMenu") as HTMLElement,
    startButton: document.getElementById("startButton") as HTMLButtonElement,
    restartButton: document.getElementById("restartButton") as HTMLButtonElement,
    quitButton: document.getElementById("quitButton") as HTMLButtonElement,
    choiseModal: document.getElementById("gameChoiseModal") as HTMLElement,
  };
}

// Create Babylon engine
function createEngine(canvas: HTMLCanvasElement): Engine {
  return new Engine(canvas, true);
}

// Create and animate camera
function createCamera(scene: Scene): ArcRotateCamera {


  const { player1, player2 } = clientGameState;

  const isPlayer1 = UserState.getUser()?.id === clientGameState.player1.id;

  const initialAlpha = isPlayer1 ?  Tools.ToRadians(0): Tools.ToRadians(180);
  const targetPosition = isPlayer1 ?  new Vector3(0, 8, 25) :  new Vector3(0, 8, -25);

  const camera = new ArcRotateCamera(
    "camera",
    initialAlpha,
    Tools.ToRadians(90),
    20,
    targetPosition,
    scene
  );
  camera.setTarget(Vector3.Zero());

  // Camera alpha animation
  const alphaAnim = new Animation("cameraAlphaAnim", "alpha", 40, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
  alphaAnim.setKeys([
    { frame: 0, value: initialAlpha },
    { frame: 100, value: initialAlpha }
  ]);
  camera.animations.push(alphaAnim);

  // Camera position animation
  const positionAnim = new Animation("cameraPositionAnim", "position", 40, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
  positionAnim.setKeys([
    { frame: 0, value: camera.position.clone() },
    { frame: 100, value: targetPosition }
  ]);
  camera.animations.push(positionAnim);

  // camera.lowerRadiusLimit = 5;
  // camera.upperRadiusLimit = 20;
  // camera.panningSensibility = 0;
  camera.attachControl(getElements().canvas, true);
  camera.checkCollisions = true;
  return camera;
}

// Setup lights and environment (using a skybox)
function createLights(scene: Scene): void {
  // Enable basic physics with zero gravity (2D-like behavior)
  scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));

  const envTex = CubeTexture.CreateFromPrefilteredData("environment/night.env", scene);
  envTex.gammaSpace = false;
  envTex.rotationY = Math.PI;
  scene.createDefaultSkybox(envTex, true);

  scene.environmentTexture = envTex;

  scene.environmentIntensity = 1.5;
  scene.environmentTexture = envTex;
}

// Load a model asset and optionally merge its meshes; assign a physics impostor if specified.
async function loadModel(
  scene: Scene,
  url: string,
  merge: boolean = true,
  physicsImpostorType?: number,
  physicsOptions?: any
): Promise<Mesh> {
  const container: AssetContainer = await LoadAssetContainerAsync(url, scene);
  container.meshes.forEach((mesh, index) => {
    console.log(`Mesh ${index} from ${url}: ${mesh.name}, vertices: ${mesh.getTotalVertices()}`);
  });
  container.addAllToScene();
  let modelMesh: Mesh;
  if (merge) {
    const meshesToMerge = container.meshes.filter(m => m.getTotalVertices() > 0) as Mesh[];
    const mergedMesh = Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
    if (!mergedMesh) throw new Error(`Failed to merge meshes from ${url}`);
    modelMesh = mergedMesh;
  } else {
    const validMesh = container.meshes.find(m => m.getTotalVertices() > 0) as Mesh;
    if (!validMesh) throw new Error(`No valid mesh found in ${url}`);
    modelMesh = validMesh;
  }
  if (physicsImpostorType && physicsOptions) {
    modelMesh.physicsImpostor = new PhysicsImpostor(modelMesh, physicsImpostorType, physicsOptions, scene);
  }
  return modelMesh;
}

// Create the ground (court)
async function createGround(scene: Scene): Promise<Mesh> {
  const groundContainer = await LoadAssetContainerAsync("models/court.glb", scene);
  const groundMesh = groundContainer.meshes[0] as Mesh;
  groundMesh.scaling = new Vector3(10.97, 1, 23.77);
  groundMesh.position = new Vector3(0, 0, 0);
  groundContainer.addAllToScene();
  return groundMesh;
}

// Create a player's paddle from model data.
async function createPlayerPaddle(scene: Scene, positionZ: number): Promise<Mesh> {

  const paddle = await loadModel(scene, "models/paddel.glb", true);
  paddle.scaling = new Vector3(0.2, 0.2, 0.2);
  paddle.position = new Vector3(45, 0.5, positionZ);
  return paddle;
}

// Create both player paddles.
async function createPlayers(scene: Scene): Promise<{ player1: Mesh; player2: Mesh }> {
  const fullCourtLength = 23.77;
  const player1 = await createPlayerPaddle(scene, -fullCourtLength / 2);
  const player2 = await createPlayerPaddle(scene, fullCourtLength / 2);
  return { player1, player2 };
}

// Create the ball mesh.
async function createBall(scene: Scene): Promise<Mesh> {
  const ball = await loadModel(scene, "models/ball.glb", true);
  ball.scaling = new Vector3(0.1, 0.1, 0.1);
  ball.position = new Vector3(0, 0.5, 0);
  return ball;
}

// Function to animate paddle hit
function animatePaddleHit(paddle: Mesh, isPlayer1: boolean): void {
    const scene = paddle.getScene();
    scene.stopAnimation(paddle);
    
    // Get current rotation
    const startQuat = paddle.rotationQuaternion?.clone() || Quaternion.Identity();
    
    // Calculate hit rotation (tilt back)
    const hitAngle = Tools.ToRadians(isPlayer1 ? -15 : 15); // Different direction for each player
    const hitQuat = Quaternion.FromEulerAngles(hitAngle, 0, 0);
    const targetQuat = startQuat.multiply(hitQuat);
    
    // Create animation
    const anim = new Animation(
        "paddleHit",
        "rotationQuaternion",
        60,
        Animation.ANIMATIONTYPE_QUATERNION,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Set key frames
    anim.setKeys([
        { frame: 0, value: startQuat },
        { frame: 5, value: targetQuat },
        { frame: 10, value: startQuat }
    ]);
    
    // Start animation
    paddle.animations = [anim];
    scene.beginAnimation(paddle, 0, 10, false);
}

// Main function to initialize and run the game scene.
export async function loadPongPageScript(): Promise<void> {
  const { canvas, startMenu, gameOverMenu, choiseModal } = getElements();
  const engine = createEngine(canvas);
  engine.displayLoadingUI();
  engine.loadingUIText = "Loading...";
  engine.loadingUIBackgroundColor = "black";

  // Subscribe to game events
  const handleGameEvent = (event: GameEvent) => {
    if (event.type === 'game_result' && event.gameResult) {
      showGameOverModal(event.gameResult);
    }
  };
  UserState.onGameEvent(handleGameEvent);

  // Cleanup subscription when component unmounts
  window.addEventListener('beforeunload', () => {
    UserState.offGameEvent(handleGameEvent);
  });

  const scene = new Scene(engine);
  
  // In this 2D-like setup, we disable gravity.
  scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));

  const camera = createCamera(scene);
  createLights(scene);
  createGround(scene);

  const { player1, player2 } = await createPlayers(scene);
  const ball = await createBall(scene);

  engine.hideLoadingUI();

  // Keyboard events for player movement (sending updates to the server)
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    userId = UserState.getUser()?.id || null;
    if (event.key === "s") {
      UserState.getGameSocket()?.send(JSON.stringify({
        type: "player_move",
        gameId: clientGameState.gameId,
        userId,
        direction: "LEFT"
      }));
    } else if (event.key === "a") {
      UserState.getGameSocket()?.send(JSON.stringify({
        type: "player_move",
        gameId: clientGameState.gameId,
        userId,
        direction: "RIGHT"
      }));
    }
  });

  //choiseModal.style.display = "block";

  // Show start menu after camera animation
  scene.beginAnimation(camera, 0, 100, false, 1, () => {
    //startMenu.style.display = "block";
  });

  function startGame(): void {
    startMenu.style.display = "none";
    gameOverMenu.style.display = "none";
    updateScoreDisplay();
  }

  //startButton.onclick = startGame;
  // restartButton.onclick = () => {
  //   clientGameState.player1.score = 0;
  //   clientGameState.player2.score = 0;
  //   updateScoreDisplay();
  //   startGame();
  // };
  // quitButton.onclick = () => {
  //   alert("Merci d'avoir joué!");
  //   gameOverMenu.style.display = "none";
  // };

  // Main render loop: update scoreboard and sync mesh positions from global state.
  engine.runRenderLoop(() => {
    updateScoreDisplay();

    // Interpolation speed (adjust for smoother/faster movement)
    const interpolationSpeed = 0.15;

    // Smooth interpolation for player 1
    currentPositions.player1.x += (clientGameState.player1.x - currentPositions.player1.x) * interpolationSpeed;
    player1.position.x = currentPositions.player1.x;

    // Smooth interpolation for player 2
    currentPositions.player2.x += (clientGameState.player2.x - currentPositions.player2.x) * interpolationSpeed;
    player2.position.x = currentPositions.player2.x;

    // Smooth interpolation for ball
    currentPositions.ball.x += (clientGameState.ball.x - currentPositions.ball.x) * interpolationSpeed;
    currentPositions.ball.z += (clientGameState.ball.y - currentPositions.ball.z) * interpolationSpeed;
    ball.position.x = currentPositions.ball.x;
    ball.position.z = currentPositions.ball.z;

    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());

  // Update the WebSocket message handler
  const socket = UserState.getGameSocket();
  if (socket) {
    const existingOnMessage = socket.onmessage;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Вызываем существующий обработчик, если он есть
      if (existingOnMessage) {
        existingOnMessage.call(socket, event);
      }
      
      // Добавляем обработку game_result для модального окна
      if (message.type === 'game_result') {
        showGameOverModal(message.payload);
      }
    };
  }
}