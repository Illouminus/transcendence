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
import { redirectTo } from "./router";

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

// Локальное состояние для игры (позиции, очки, мяч)
const localGameState = {
  player1: { x: 0, score: 0 },
  player2: { x: 0, score: 0 },
  ball: { x: 0, y: 0, velX: 0.12, velY: 0.18 },
};

// Локальное состояние для управления ракетками
const localPaddleState = {
  player1: { x: 0 },
  player2: { x: 0 }
};

// Update scoreboard in the DOM
function updateScoreDisplay(): void {
  const scoreDisplay = document.getElementById("scoreDisplay") as HTMLElement;
  if (!scoreDisplay) return;
  scoreDisplay.innerHTML = `${localGameState.player1.score} : ${localGameState.player2.score}`;
}

const assetContainers: AssetContainer[] = [];

// Get essential UI elements
function getElements() {
  return {
    canvas: document.getElementById("renderLocalCanvas") as HTMLCanvasElement,
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

function createCamera(scene: Scene): ArcRotateCamera {
  const alpha = Tools.ToRadians(0);        
  const beta = Tools.ToRadians(60);        
  const finalRadius = 20;
  const startRadius = 50; // Камера начнёт издалека
  const target = new Vector3(0, 4, 0);

  const camera = new ArcRotateCamera("camera", alpha, beta, startRadius, target, scene);
  camera.setTarget(target);

  // Анимация приближения (radius)
  const radiusAnim = new Animation(
    "cameraZoomIn",
    "radius",
    60, // FPS
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  radiusAnim.setKeys([
    { frame: 0, value: startRadius },
    { frame: 60, value: finalRadius } // длительность: 1 секунда
  ]);

  camera.animations.push(radiusAnim);
  scene.beginAnimation(camera, 0, 60, false);

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
  assetContainers.push(container);
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
  assetContainers.push(groundContainer);
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

let localGameOver = false;

function showGameEndModal() {
  let modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.7)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';
  modal.innerHTML = `<div style="background:#222;padding:40px 60px;border-radius:16px;color:white;font-size:2rem;text-align:center;box-shadow:0 8px 32px #000a;">Game End</div>`;
  document.body.appendChild(modal);
}

function removeGameEndModal() {
  const modal = document.querySelector('div[style*="position: fixed"]');
  if (modal) {
    modal.parentNode?.removeChild(modal);
  }
}

function resetLocalBall() {
  localGameState.ball.x = 0;
  localGameState.ball.y = 0;
  // Случайное направление, уменьшенная скорость
  localGameState.ball.velX = (Math.random() - 0.5) * 0.08;
  localGameState.ball.velY = (Math.random() > 0.5 ? 1 : -1) * 0.08;
}

function updateLocalGame() {
  if (localGameOver) return;
  // Двигаем мяч
  localGameState.ball.x += localGameState.ball.velX;
  localGameState.ball.y += localGameState.ball.velY;

  // Столкновение с боковыми стенками
  if (Math.abs(localGameState.ball.x) > 5) {
    localGameState.ball.velX *= -1;
    localGameState.ball.x = Math.sign(localGameState.ball.x) * 5;
  }

  // Столкновение с ракеткой player1 (нижняя)
  if (
    Math.abs(localGameState.ball.y + 11.885) < 0.5 &&
    Math.abs(localGameState.ball.x - localGameState.player1.x) < 1.5
  ) {
    localGameState.ball.velY = Math.abs(localGameState.ball.velY);
    localGameState.ball.y = -11.885 + 0.5;
  }
  // Столкновение с ракеткой player2 (верхняя)
  if (
    Math.abs(localGameState.ball.y - 11.885) < 0.5 &&
    Math.abs(localGameState.ball.x - localGameState.player2.x) < 1.5
  ) {
    localGameState.ball.velY = -Math.abs(localGameState.ball.velY);
    localGameState.ball.y = 11.885 - 0.5;
  }

  // ГОЛЫ
  if (localGameState.ball.y < -13) {
    localGameState.player2.score++;
    resetLocalBall();
  }
  if (localGameState.ball.y > 13) {
    localGameState.player1.score++;
    resetLocalBall();
  }

  // Проверка окончания игры
  if (localGameState.player1.score > 5 || localGameState.player2.score > 5) {
    localGameOver = true;
    showGameEndModal();
    setTimeout(() => {
      removeGameEndModal();
      redirectTo("/");
    }, 1500);
  }
}

// Main function to initialize and run the game scene.
export async function loadLocalPongPageScript(): Promise< ()  => void> {
  const { canvas } = getElements();
  
  const engine = createEngine(canvas);
  engine.displayLoadingUI();
  engine.loadingUIText = "Loading...";
  engine.loadingUIBackgroundColor = "black";


  const scene = new Scene(engine);
  
  // In this 2D-like setup, we disable gravity.
  scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));

  const camera = createCamera(scene);
  createLights(scene);
  createGround(scene);

  const { player1, player2 } = await createPlayers(scene);
  const ball = await createBall(scene);

  engine.hideLoadingUI();

  // Локальное управление двумя ракетками на одной клавиатуре
  const paddleSpeed = 0.5;
  const keyDownHandler = (event: KeyboardEvent) => {
    switch (event.key) {
      case "a":
        localGameState.player1.x = Math.max(localGameState.player1.x - paddleSpeed, -10);
        break;
      case "d":
        localGameState.player1.x = Math.min(localGameState.player1.x + paddleSpeed, 10);
        break;
      case "ArrowLeft":
        localGameState.player2.x = Math.max(localGameState.player2.x - paddleSpeed, -10);
        break;
      case "ArrowRight":
        localGameState.player2.x = Math.min(localGameState.player2.x + paddleSpeed, 10);
        break;
    }
  };
  window.addEventListener("keydown", keyDownHandler);

  //choiseModal.style.display = "block";

  // Show start menu after camera animation
  scene.beginAnimation(camera, 0, 100, false, 1, () => {
    //startMenu.style.display = "block";
  });

  localGameOver = false;

  // Main render loop: update scoreboard and sync mesh positions from global state.
  engine.runRenderLoop(() => {
    updateLocalGame();
    if (localGameOver) return;
    updateScoreDisplay();
    const interpolationSpeed = 0.15;
    // Плавное движение ракеток
    currentPositions.player1.x += (localGameState.player1.x - currentPositions.player1.x) * interpolationSpeed;
    currentPositions.player2.x += (localGameState.player2.x - currentPositions.player2.x) * interpolationSpeed;
    player1.position.x = currentPositions.player1.x;
    player2.position.x = currentPositions.player2.x;
    // Плавное движение мяча
    currentPositions.ball.x += (localGameState.ball.x - currentPositions.ball.x) * interpolationSpeed;
    currentPositions.ball.z += (localGameState.ball.y - currentPositions.ball.z) * interpolationSpeed;
    ball.position.x = currentPositions.ball.x;
    ball.position.z = currentPositions.ball.z;
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());


  function cleanup() {
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('popstate', cleanup);
    window.removeEventListener('keydown', keyDownHandler);

    
    for (const container of assetContainers) {
      container.dispose();
    }
    assetContainers.length = 0;

    engine.stopRenderLoop();
    scene.dispose();
    engine.clearInternalTexturesCache();
    engine.dispose();

    //if (socket) socket.onmessage = null;

    const { canvas } = getElements();
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    clientGameState.gameId = 0;
    clientGameState.player1 = { ...clientGameState.player1, x: 0, y: 0, score: 0 };
    clientGameState.player2 = { ...clientGameState.player2, x: 0, y: 0, score: 0 };
    clientGameState.ball = { x: 0, y: 0, velX: 0, velY: 0 };
    currentPositions.player1 = { x: 0 };
    currentPositions.player2 = { x: 0 };
    currentPositions.ball = { x: 0, z: 0 };

    localGameOver = false;
  }

  return cleanup;
}