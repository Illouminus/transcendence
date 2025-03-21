import { fetchUserProfile } from "./services/user.service";
import { incrementWins } from "./services/user.service";

let scorePlayer1 = 0;
let scorePlayer2 = 0;
let userId: number | null = null;

// Récupérer l'ID utilisateur au chargement
fetchUserProfile().then(user => {
  if (user) {
    userId = user.id;
  }
});

function updateScoreDisplay(): void {
  const scoreDisplay = document.getElementById("scoreDisplay") as HTMLElement;
  scoreDisplay.innerHTML = `${scorePlayer1} : ${scorePlayer2}`;
}

function getElements(): {
  canvas: HTMLCanvasElement;
  scoreDisplay: HTMLElement;
  startMenu: HTMLElement;
  gameOverMenu: HTMLElement;
  startButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  quitButton: HTMLButtonElement;
} {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const scoreDisplay = document.getElementById("scoreDisplay") as HTMLElement;
  const startMenu = document.getElementById("startMenu") as HTMLElement;
  const gameOverMenu = document.getElementById("gameOverMenu") as HTMLElement;
  const startButton = document.getElementById("startButton") as HTMLButtonElement;
  const restartButton = document.getElementById("restartButton") as HTMLButtonElement;
  const quitButton = document.getElementById("quitButton") as HTMLButtonElement;

  return { canvas, startMenu, gameOverMenu, startButton, restartButton, quitButton, scoreDisplay };
}


function createEngine(canvas: HTMLCanvasElement): BABYLON.Engine {
  return new BABYLON.Engine(canvas, true,{ disableWebGL2Support: false, preserveDrawingBuffer: true, stencil: true , powerPreference: "high-performance"});
}


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
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  cameraAlphaAnim.setKeys([
    { frame: 0, value: BABYLON.Tools.ToRadians(60) },
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
    { frame: 100, value: BABYLON.Tools.ToRadians(0) }
  ]);
  camera.animations.push(cameraBetaAnim);

  return camera;
}

function createLights(scene: BABYLON.Scene): void {
  const hemisphericLight = new BABYLON.HemisphericLight(
    'light1',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemisphericLight.intensity = 0.8;
}


function createGround(scene: BABYLON.Scene): BABYLON.Mesh {
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10.97, height: 23.77 }, scene);
  const clayMaterial = new BABYLON.StandardMaterial("clayMaterial", scene);
  clayMaterial.diffuseTexture = new BABYLON.Texture("https://media.istockphoto.com/id/520420178/fr/photo/abstrait-rouge-texture-de-mur-de-ciment.jpg?s=612x612&w=0&k=20&c=wq5Y1JHKIQTPywXnLnJTcK3DLjYP_Wa6uQWbNNvz39Y=", scene); // Replace with a realistic texture
  clayMaterial.specularColor = BABYLON.Color3.Black();
  ground.material = clayMaterial;

  return ground;
}


function createNet(scene: BABYLON.Scene): void {
  const netWidth = 10.97;
  const netHeight = 1.07;

  const whiteBand = BABYLON.MeshBuilder.CreateBox(
    "whiteBand",
    { width: netWidth, height: 0.1, depth: 0.01 },
    scene
  );
  whiteBand.position = new BABYLON.Vector3(0, netHeight - 0.05, 0);
  const whiteBandMaterial = new BABYLON.StandardMaterial("whiteBandMaterial", scene);
  whiteBandMaterial.emissiveColor = BABYLON.Color3.White();
  whiteBand.material = whiteBandMaterial;

  const netMesh = BABYLON.MeshBuilder.CreateBox(
    "netMesh",
    { width: netWidth, height: netHeight, depth: 0.01 },
    scene
  );
  netMesh.position = new BABYLON.Vector3(0, netHeight / 2 - 0.05, 0);
}


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


function createCourtLines(scene: BABYLON.Scene): void {
  const halfCourtWidth = 4.115; 
  const fullCourtLength = 23.77; 
  const serviceLineDistance = 6.40; 
  const doublesWidth = 5.485; 

  createLine(
    scene,
    new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2),
    "outerLeft"
  );
  createLine(
    scene,
    new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2),
    "outerRight"
  );
  createLine(
    scene,
    new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2),
    "outerTop"
  );
  createLine(
    scene,
    new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2),
    new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2),
    "outerBottom"
  );

  createLine(
    scene,
    new BABYLON.Vector3(-halfCourtWidth, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(-halfCourtWidth, 0.01, fullCourtLength / 2),
    "singlesLeft"
  );
  createLine(
    scene,
    new BABYLON.Vector3(halfCourtWidth, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(halfCourtWidth, 0.01, fullCourtLength / 2),
    "singlesRight"
  );


  createLine(
    scene,
    new BABYLON.Vector3(-halfCourtWidth, 0.01, -serviceLineDistance),
    new BABYLON.Vector3(halfCourtWidth, 0.01, -serviceLineDistance),
    "serviceLineTop"
  );
  createLine(
    scene,
    new BABYLON.Vector3(-halfCourtWidth, 0.01, serviceLineDistance),
    new BABYLON.Vector3(halfCourtWidth, 0.01, serviceLineDistance),
    "serviceLineBottom"
  );


  createLine(
    scene,
    new BABYLON.Vector3(0, 0.01, -serviceLineDistance),
    new BABYLON.Vector3(0, 0.01, serviceLineDistance),
    "centerServiceLine"
  );
  createLine(
    scene,
    new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2),
    new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2 + 0.1),
    "baselineCenterTop"
  );
  createLine(
    scene,
    new BABYLON.Vector3(0, 0.01, fullCourtLength / 2),
    new BABYLON.Vector3(0, 0.01, fullCourtLength / 2 - 0.1),
    "baselineCenterBottom"
  );
}


function createPlayerPaddle(
  scene: BABYLON.Scene,
  positionZ: number,
  paddleWidth: number,
  paddleHeight: number,
  paddleDepth: number
): BABYLON.Mesh {
  const paddle = BABYLON.MeshBuilder.CreateBox(
    "playerPaddle",
    { width: paddleWidth, height: paddleHeight, depth: paddleDepth },
    scene
  );
  paddle.position = new BABYLON.Vector3(0, 0, positionZ);
  const paddleMaterial = new BABYLON.StandardMaterial("playerPaddleMaterial", scene);
  paddleMaterial.emissiveColor = BABYLON.Color3.White();
  paddle.material = paddleMaterial;
  return paddle;
}


function createPlayers(scene: BABYLON.Scene): { player1: BABYLON.Mesh; player2: BABYLON.Mesh } {
  const fullCourtLength = 23.77;
  const PADDLE_WIDTH = 1;
  const PADDLE_HEIGHT = 1.5;
  const PADDLE_DEPTH = 0.2;

  const player1 = createPlayerPaddle(
    scene,
    -fullCourtLength / 2,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_DEPTH
  );
  const player2 = createPlayerPaddle(
    scene,
    fullCourtLength / 2,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_DEPTH
  );

  return { player1, player2 };
}


function createBall(scene: BABYLON.Scene): BABYLON.Mesh {
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.3 }, scene);
  ball.position = new BABYLON.Vector3(0, 0.25, 0);
  return ball;
}


export function loadPongPageScript(): void {
  
  const { canvas, startMenu, gameOverMenu, startButton, restartButton, quitButton } = getElements();

  const engine = createEngine(canvas);
  const scene = new BABYLON.Scene(engine);


  const camera = createCamera(scene);
  createLights(scene);
  createGround(scene);
  createNet(scene);
  createCourtLines(scene);
  const { player1, player2 } = createPlayers(scene);
  const ball = createBall(scene);

  const halfCourtWidth = 4.115;
  const PADDLE_HEIGHT = 1.5;
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 's') {
      player1.position.x = Math.min(player1.position.x + 1, halfCourtWidth - PADDLE_HEIGHT / 2);
    } else if (event.key === 'z') {
      player1.position.x = Math.max(player1.position.x - 1, -(halfCourtWidth - PADDLE_HEIGHT / 2));
    }
  });


  scene.beginAnimation(camera, 0, 100, false, 1, () => {
    startMenu.style.display = "block";
  });


  const BALL_RADIUS = 0.2;
  const BALL_SPEED = 0.1;
  const fullCourtLength = 23.77;
  const PADDLE_DEPTH = 0.2;
  let gameObserver: BABYLON.Observer<BABYLON.Scene> | null = null;


  // Fonction modifiée pour gérer les scores et mettre à jour l'affichage
  function startGame(): void {
    startMenu.style.display = "none";
    gameOverMenu.style.display = "none";
  
    if (gameObserver) {
      scene.onBeforeRenderObservable.remove(gameObserver);
    }
  
    ball.position = new BABYLON.Vector3(0, 0.25, 0);
    let ballDirection = new BABYLON.Vector3(
      (Math.random() - 0.5) * 0.4,
      0,
      Math.random() > 0.5 ? -1 : 1
    ).normalize();
  
    updateScoreDisplay(); // Mise à jour initiale de l'affichage des scores
  
    gameObserver = scene.onBeforeRenderObservable.add(() => {
      ball.position.addInPlace(ballDirection.scale(BALL_SPEED));
  
      if (Math.abs(ball.position.x) + BALL_RADIUS >= halfCourtWidth) {
        ballDirection.x *= -1;
      }
  
      if (ball.intersectsMesh(player1, false)) {
        ballDirection.z *= -1;
        ball.position.z = player1.position.z + BALL_RADIUS + PADDLE_DEPTH / 2;
      }
      if (ball.intersectsMesh(player2, false)) {
        ballDirection.z *= -1;
        ball.position.z = player2.position.z - BALL_RADIUS - PADDLE_DEPTH / 2;
      }
  
      if (Math.abs(ball.position.z) > fullCourtLength / 2) {
        // Mise à jour des scores
        if (ball.position.z > fullCourtLength / 2) {
          scorePlayer1++;
        } else {
          scorePlayer2++;
        }
  
        updateScoreDisplay(); // Mettre à jour l'affichage des scores
  
        // Vérification si un joueur atteint 5 points
        if (scorePlayer1 === 5 || scorePlayer2 === 5) {
          if (scorePlayer1 === 5 && userId !== null) {
            incrementWins(userId);
          }
          scene.onBeforeRenderObservable.remove(gameObserver); // Arrêter le jeu
          gameOverMenu.style.display = "block";
        } else {
          // Relancer la balle si le score n'a pas atteint 5
          ball.position = new BABYLON.Vector3(0, 0.25, 0); // Réinitialiser la position de la balle
          ballDirection = new BABYLON.Vector3(
            (Math.random() - 0.5) * 0.4,
            0,
            Math.random() > 0.5 ? -1 : 1
          ).normalize(); // Réinitialiser la direction de la balle
        }
      }
    });
  }
  

  startButton.onclick = startGame;
  restartButton.onclick = () => {
    // Réinitialiser les scores
    scorePlayer1 = 0;
    scorePlayer2 = 0;
  
    updateScoreDisplay(); // Mettre à jour l'affichage des scores
  
    startGame(); // Redémarrer le jeu
  };
  
  quitButton.onclick = () => {
    alert("Merci d'avoir joué !");
    gameOverMenu.style.display = "none";
  };


  engine.runRenderLoop(() => {
    updateScoreDisplay();
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
}
