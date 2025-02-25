import * as BABYLON from 'babylonjs';

export function createCamera(scene: BABYLON.Scene, canvas: HTMLCanvasElement): BABYLON.Camera {
  const camera = new BABYLON.ArcRotateCamera('camera1', Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  return camera;
}
