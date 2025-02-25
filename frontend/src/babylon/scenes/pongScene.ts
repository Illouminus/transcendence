import * as BABYLON from 'babylonjs';
import { createCamera } from '../components/camera';
import { createLights } from '../components/lights';
import { createObjects } from '../components/objects';

export function createPongScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);

  // Ajouter des composants à la scène
  createCamera(scene, canvas);
  createLights(scene);
  createObjects(scene);

  return scene;
}
