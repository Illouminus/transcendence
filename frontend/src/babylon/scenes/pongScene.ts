import * as BABYLON from 'babylonjs';

export const createScene = (engine: BABYLON.Engine) => {
    const scene = new BABYLON.Scene(engine);

    // CAMERAS
    var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(60), BABYLON.Tools.ToRadians(55), 20, BABYLON.Vector3.Zero(), scene);
    // camera.attachControl(canvas, true); Allow To move camera
    camera.setTarget(BABYLON.Vector3.Zero());

    // Animation for the camera (alpha - rotation around the Y axis)
    var cameraAlphaAnim = new BABYLON.Animation("cameraAlphaAnim", "alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    
    var alphaKeys = []; 
    alphaKeys.push({ frame: 0, value: BABYLON.Tools.ToRadians(60) });
    alphaKeys.push({ frame: 100, value: BABYLON.Tools.ToRadians(0) });  // Rotate the camera around the Y axis

    cameraAlphaAnim.setKeys(alphaKeys);
    camera.animations.push(cameraAlphaAnim);

    // Animation for the camera (beta - rotation around the X axis)
    var cameraBetaAnim = new BABYLON.Animation("cameraBetaAnim", "beta", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    
    var betaKeys = []; 
    betaKeys.push({ frame: 0, value: BABYLON.Tools.ToRadians(55) });
    betaKeys.push({ frame: 100, value: BABYLON.Tools.ToRadians(0) });  // Move the camera towards a top view

    cameraBetaAnim.setKeys(betaKeys);
    camera.animations.push(cameraBetaAnim);

    // LIGHTS
    const hemisphericLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.8;

    // OBJECTS
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10.97, height: 23.77}, scene); // Standard tennis court dimensions

    // Material for ground (clay texture)
    var clayMaterial = new BABYLON.StandardMaterial("clayMaterial", scene);
    clayMaterial.diffuseTexture = new BABYLON.Texture("https://media.istockphoto.com/id/520420178/fr/photo/abstrait-rouge-texture-de-mur-de-ciment.jpg?s=612x612&w=0&k=20&c=wq5Y1JHKIQTPywXnLnJTcK3DLjYP_Wa6uQWbNNvz39Y=", scene); // Replace with a realistic texture
    clayMaterial.specularColor = BABYLON.Color3.Black();
    ground.material = clayMaterial;

    // Tennis net
    var netWidth = 10.97; // Full width of the court
    var netHeight = 1.07; // Standard net height

    // Bande blanche
    var whiteBand = BABYLON.MeshBuilder.CreateBox("whiteBand", {width: netWidth, height: 0.1, depth: 0.01}, scene);
    whiteBand.position = new BABYLON.Vector3(0, netHeight - 0.05, 0);
    var whiteBandMaterial = new BABYLON.StandardMaterial("whiteBandMaterial", scene);
    whiteBandMaterial.emissiveColor = BABYLON.Color3.White();
    whiteBand.material = whiteBandMaterial;

    // Filet noir
    var netMesh = BABYLON.MeshBuilder.CreateBox("netMesh", {width: netWidth, height: netHeight, depth: 0.01}, scene);
    netMesh.position = new BABYLON.Vector3(0, netHeight / 2 - 0.05, 0);
    var netMaterial = new BABYLON.StandardMaterial("netMaterial", scene);

    // Tennis lines
    var lineMaterial = new BABYLON.StandardMaterial("lineMaterial", scene);
    lineMaterial.diffuseColor = BABYLON.Color3.White();
    lineMaterial.emissiveColor = BABYLON.Color3.White();

    function createLine(start, end, name) {
        var line = BABYLON.MeshBuilder.CreateLines(name, {points: [start, end]}, scene);
        line.color = BABYLON.Color3.White();
        return line;
    }

    // Court lines
    const halfCourtWidth = 4.115; // Half of singles court width
    const fullCourtLength = 23.77; // Full length of court
    const serviceLineDistance = 6.40; // Distance from net to service line
    const doublesWidth = 5.485; // Half of doubles court width

    // Outer boundary lines (doubles)
    createLine(new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2), "outerLeft");
    createLine(new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2), "outerRight");
    createLine(new BABYLON.Vector3(-doublesWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, -fullCourtLength / 2), "outerTop");
    createLine(new BABYLON.Vector3(-doublesWidth, 0.01, fullCourtLength / 2), new BABYLON.Vector3(doublesWidth, 0.01, fullCourtLength / 2), "outerBottom");

    // Singles court lines
    createLine(new BABYLON.Vector3(-halfCourtWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(-halfCourtWidth, 0.01, fullCourtLength / 2), "singlesLeft");
    createLine(new BABYLON.Vector3(halfCourtWidth, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(halfCourtWidth, 0.01, fullCourtLength / 2), "singlesRight");

    // Service lines
    createLine(new BABYLON.Vector3(-halfCourtWidth, 0.01, -serviceLineDistance), new BABYLON.Vector3(halfCourtWidth, 0.01, -serviceLineDistance), "serviceLineTop");
    createLine(new BABYLON.Vector3(-halfCourtWidth, 0.01, serviceLineDistance), new BABYLON.Vector3(halfCourtWidth, 0.01, serviceLineDistance), "serviceLineBottom");

    // Center service line and baseline centers
    createLine(new BABYLON.Vector3(0, 0.01, -serviceLineDistance), new BABYLON.Vector3(0, 0.01, serviceLineDistance), "centerServiceLine");
    createLine(new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2), new BABYLON.Vector3(0, 0.01, -fullCourtLength / 2 + 0.1), "baselineCenterTop");
    createLine(new BABYLON.Vector3(0, 0.01, fullCourtLength / 2), new BABYLON.Vector3(0, 0.01, fullCourtLength / 2 - 0.1), "baselineCenterBottom");     

    // Players
    const PADDLE_WIDTH = 1;
    const PADDLE_HEIGHT = 1.5;
    const PADDLE_DEPTH = 0.2;
    
    
    function createPlayerPaddle(scene,  positionZ) {
        var playerPaddle = BABYLON.MeshBuilder.CreateBox('playerPaddle', { width: PADDLE_WIDTH, height: PADDLE_HEIGHT, depth: PADDLE_DEPTH }, scene);
        playerPaddle.position.x = 0; 
        playerPaddle.position.y = 0; 
        playerPaddle.position.z = positionZ;

        var playerPaddleMaterial = new BABYLON.StandardMaterial("playerPaddleMaterial", scene);
        playerPaddleMaterial.emissiveColor = BABYLON.Color3.White();
        playerPaddle.material = playerPaddleMaterial;

        return playerPaddle;
    }

    // Créer le premier joueur (paddle placé à l'arrière)
    let player1Paddle = createPlayerPaddle(scene, -fullCourtLength / 2);

    // Créer le second joueur (paddle placé à l'avant)
    let player2Paddle = createPlayerPaddle(scene, fullCourtLength / 2);

    // Control for Player 1
    window.addEventListener('keydown', function(event) {
        if (event.key === 's') {
            // Player 1 moves up (increasing X position)
            player1Paddle.position.x = Math.min(player1Paddle.position.x + 1, halfCourtWidth - PADDLE_HEIGHT / 2);
        } else if (event.key === 'z') {
            // Player 1 moves down (decreasing X position)
            player1Paddle.position.x = Math.max(player1Paddle.position.x - 1, -(halfCourtWidth - PADDLE_HEIGHT / 2));
        }
    });

    // BALL
    const BALL_RADIUS = 0.2;
    const BALL_SPEED = 0.1;
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.3 }, scene);
    ball.position = new BABYLON.Vector3(0, 0.25, 0);
    let ballDirection;

    // Animation de la caméra terminée
    scene.beginAnimation(camera, 0, 100, false, 1, () => {
        startMenu.style.display = "block";
    });

    let gameObserver = null;  // Variable pour stocker l'observateur du jeu

    function startGame() {
        startMenu.style.display = "none";
        gameOverMenu.style.display = "none";

        // Nettoyer l'ancien observateur s'il existe
        if (gameObserver) {
            scene.onBeforeRenderObservable.remove(gameObserver);
        }

        // Réinitialiser la balle
        ball.position = new BABYLON.Vector3(0, 0.25, 0);
        ballDirection = new BABYLON.Vector3((Math.random() - 0.5) * 0.4, 0, Math.random() > 0.5 ? -1 : 1).normalize();

        // Créer un nouvel observateur pour la logique du jeu
        gameObserver = scene.onBeforeRenderObservable.add(() => {
            // Update ball position
            ball.position.addInPlace(ballDirection.scale(BALL_SPEED));

            // Collisions with side lines
            if (Math.abs(ball.position.x) + BALL_RADIUS >= halfCourtWidth) {
                ballDirection.x *= -1;
            }

            // Collisions with paddles
            if (ball.intersectsMesh(player1Paddle, false)) {
                ballDirection.z *= -1;
                ball.position.z = player1Paddle.position.z + BALL_RADIUS + PADDLE_DEPTH / 2;
            }

            if (ball.intersectsMesh(player2Paddle, false)) {
                ballDirection.z *= -1;
                ball.position.z = player2Paddle.position.z - BALL_RADIUS - PADDLE_DEPTH / 2;
            }

            // Ball out of bounds (past the paddles)
            if (Math.abs(ball.position.z) > fullCourtLength / 2) {
                scene.onBeforeRenderObservable.remove(gameObserver);
                gameOverMenu.style.display = "block";
            }
        });
    }

    // Event listeners
    startButton.onclick = startGame;
    restartButton.onclick = startGame;
    quitButton.onclick = () => {
        alert("Merci d'avoir joué !");
        gameOverMenu.style.display = "none";
    };
    return scene;
};
