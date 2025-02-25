import * as BABYLON from 'babylonjs';

export function createCamera(scene: BABYLON.Scene, canvas: HTMLCanvasElement): BABYLON.Camera {
  var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(60), BABYLON.Tools.ToRadians(55), 20, BABYLON.Vector3.Zero(), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  return camera;
}
