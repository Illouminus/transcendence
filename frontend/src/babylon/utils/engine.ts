import * as BABYLON from 'babylonjs';

export function createEngine(canvas: HTMLCanvasElement): BABYLON.Engine {
  console.log('Initializing Babylon Engine...');
  const engine = new BABYLON.Engine(canvas, true);
  console.log('Babylon Engine initialized:', engine);
  return engine;
}
