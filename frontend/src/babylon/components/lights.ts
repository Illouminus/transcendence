import * as BABYLON from 'babylonjs';

export function createLights(scene: BABYLON.Scene): void {
  const hemisphericLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
}
