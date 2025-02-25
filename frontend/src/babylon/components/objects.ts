import * as BABYLON from 'babylonjs';

export function createObjects(scene: BABYLON.Scene): void {
  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
  sphere.position.y = 1;

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
}
