import * as BABYLON from 'babylonjs';

export function createMaterial(scene: BABYLON.Scene, color: BABYLON.Color3): BABYLON.StandardMaterial {
  const material = new BABYLON.StandardMaterial('material', scene);
  material.diffuseColor = color;
  return material;
}
