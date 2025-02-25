import * as BABYLON from 'babylonjs';
import { createCamera } from '../components/camera';
import { createLights } from '../components/lights';
import { createObjects } from '../components/objects';

export function createPongScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
  console.log('Creating scene...');
  const scene = new BABYLON.Scene(engine);
  console.log('Scene created:', scene);

  // Ajouter caméra
  createCamera(scene, canvas);
  console.log('Camera added to scene');

  // Ajouter lumières
  createLights(scene);
  console.log('Lights added to scene');

  // Ajouter objets
  createObjects(scene);
  console.log('Objects added to scene');
  
  scene.debugLayer.show();

  return scene;
}
