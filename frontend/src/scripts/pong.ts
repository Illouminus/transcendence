import { 
  Scene, Engine, ArcRotateCamera, Tools, Vector3, Animation,
  CubeTexture, Mesh, AssetContainer, ActionManager, SetValueAction,
  Quaternion, CannonJSPlugin, PhysicsImpostor, LoadAssetContainerAsync, 
  MeshBuilder, Color3 
} from "@babylonjs/core";
import * as CANNON from "cannon";
import "@babylonjs/loaders";
import { UserState } from "./userState";

// Global game state synced with server updates
export const clientGameState = {
  gameId: 0,
  player1: { x: 0, y: 0, score: 0 },
  player2: { x: 0, y: 0, score: 0 },
  ball: { x: 0, y: 0, velX: 0, velY: 0 },
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
    quitButton: document.getElementById("quitButton") as HTMLButtonElement
  };
}

// Create Babylon engine
function createEngine(canvas: HTMLCanvasElement): Engine {
  return new Engine(canvas, true);
}

// Create and animate camera
function createCamera(scene: Scene): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "camera",
    Tools.ToRadians(60),
    Tools.ToRadians(55),
    20,
    Vector3.Zero(),
    scene
  );
  camera.setTarget(Vector3.Zero());

  // Camera alpha animation
  const alphaAnim = new Animation("cameraAlphaAnim", "alpha", 40, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  alphaAnim.setKeys([
    { frame: 0, value: Tools.ToRadians(30) },
    { frame: 100, value: Tools.ToRadians(0) }
  ]);
  camera.animations.push(alphaAnim);

  // Camera beta animation
  const betaAnim = new Animation("cameraBetaAnim", "beta", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  betaAnim.setKeys([
    { frame: 0, value: Tools.ToRadians(55) },
    { frame: 100, value: Tools.ToRadians(30) }
  ]);
  camera.animations.push(betaAnim);

  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 20;
  camera.panningSensibility = 0;
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
  scene.createDefaultSkybox(envTex, true, 1000, 0.3);

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
  const container: AssetContainer = await LoadAssetContainerAsync("models/racket.glb", scene);
  console.log("Paddle meshes:", container.meshes);
  const paddle = container.meshes[0] as Mesh;
  paddle.scaling = new Vector3(0.5, 0.5, 0.5);
  paddle.position = new Vector3(45, 0, positionZ);
  paddle.rotation.x = 0;
  paddle.rotation.y = 45;
  paddle.checkCollisions = true;
  paddle.actionManager = new ActionManager(scene);
  paddle.actionManager.registerAction(new SetValueAction(ActionManager.OnPickDownTrigger, paddle, "scaling", new Vector3(5, 5, 5)));
  container.addAllToScene();
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
  const container: AssetContainer = await LoadAssetContainerAsync("models/ball.glb", scene);

  const ball = container.meshes[0] as Mesh;
  
  ball.scaling = new Vector3(0.2, 0.2, 0.2);
  
  ball.position = new Vector3(0, 1, 0);
  container.addAllToScene();
  ball.physicsImpostor = new PhysicsImpostor(ball, PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.9 }, scene);
  ball.checkCollisions = true;
  return ball;
}

// Animate paddle swing (demonstration)
function swingRacket(mesh: Mesh): void {
  const scene = mesh.getScene();
  scene.stopAnimation(mesh);
  const startQuat = mesh.rotationQuaternion?.clone() || Quaternion.Identity();
  const swingQuat = Quaternion.FromEulerAngles(Tools.ToRadians(45), 0, 0);
  const targetQuat = startQuat.multiply(swingQuat);
  const anim = new Animation("racketSwingQuat", "rotationQuaternion", 60, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
  anim.setKeys([
    { frame: 0, value: startQuat },
    { frame: 5, value: targetQuat },
    { frame: 10, value: startQuat }
  ]);
  mesh.animations = [anim];
  scene.beginAnimation(mesh, 0, 10, false);
}

// Main function to initialize and run the game scene.
export async function loadPongPageScript(): Promise<void> {
  const { canvas, startMenu, gameOverMenu, startButton, restartButton, quitButton } = getElements();
  const engine = createEngine(canvas);
  engine.displayLoadingUI();
  engine.loadingUIText = "Loading...";
  engine.loadingUIBackgroundColor = "black";

  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
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

  // Show start menu after camera animation
  scene.beginAnimation(camera, 0, 100, false, 1, () => {
    startMenu.style.display = "block";
  });

  function startGame(): void {
    startMenu.style.display = "none";
    gameOverMenu.style.display = "none";
    updateScoreDisplay();
  }

  startButton.onclick = startGame;
  restartButton.onclick = () => {
    clientGameState.player1.score = 0;
    clientGameState.player2.score = 0;
    updateScoreDisplay();
    startGame();
  };
  quitButton.onclick = () => {
    alert("Merci d'avoir joué!");
    gameOverMenu.style.display = "none";
  };

  // Main render loop: update scoreboard and sync mesh positions from global state.
  engine.runRenderLoop(() => {
    updateScoreDisplay();
    player1.position.x = clientGameState.player1.x;
    player2.position.x = clientGameState.player2.x;
    ball.position.x = clientGameState.ball.x;
    ball.position.z = clientGameState.ball.y;
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());
}