import * as BABYLON from "babylonjs";

export const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);

    // CAMERAS
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
    const alphaKeys = [
        { frame: 0, value: BABYLON.Tools.ToRadians(60) },
        { frame: 100, value: BABYLON.Tools.ToRadians(0) }
    ];
    cameraAlphaAnim.setKeys(alphaKeys);
    camera.animations.push(cameraAlphaAnim);

    const cameraBetaAnim = new BABYLON.Animation(
        "cameraBetaAnim",
        "beta",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const betaKeys = [
        { frame: 0, value: BABYLON.Tools.ToRadians(55) },
        { frame: 100, value: BABYLON.Tools.ToRadians(0) }
    ];
    cameraBetaAnim.setKeys(betaKeys);
    camera.animations.push(cameraBetaAnim);

    scene.beginAnimation(camera, 0, 100, false);

    // LIGHTS
    const hemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.8;

    // OBJECTS
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 10.97, height: 23.77 },
        scene
    );
    const clayMaterial = new BABYLON.StandardMaterial("clayMaterial", scene);
    clayMaterial.diffuseTexture = new BABYLON.Texture(
        "https://media.istockphoto.com/id/520420178/fr/photo/abstrait-rouge-texture-de-mur-de-ciment.jpg?s=612x612&w=0&k=20&c=wq5Y1JHKIQTPywXnLnJTcK3DLjYP_Wa6uQWbNNvz39Y=",
        scene
    );
    clayMaterial.specularColor = BABYLON.Color3.Black();
    ground.material = clayMaterial;

    // Function to create paddles
    const PADDLE_WIDTH = 1;
    const PADDLE_HEIGHT = 1.5;
    const PADDLE_DEPTH = 0.2;

    const createPlayerPaddle = (positionZ: number): BABYLON.Mesh => {
        const paddle = BABYLON.MeshBuilder.CreateBox(
            "playerPaddle",
            { width: PADDLE_WIDTH, height: PADDLE_HEIGHT, depth: PADDLE_DEPTH },
            scene
        );
        paddle.position.set(0, 0, positionZ);

        const paddleMaterial = new BABYLON.StandardMaterial("paddleMaterial", scene);
        paddleMaterial.emissiveColor = BABYLON.Color3.White();
        paddle.material = paddleMaterial;

        return paddle;
    };

    createPlayerPaddle(-10); // Player 1
    createPlayerPaddle(10);  // Player 2

    return scene;
};
