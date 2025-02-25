// Gère la configuration de l'engin Babylon.js
import * as BABYLON from 'babylonjs';

export function createEngine(canvas: HTMLCanvasElement): BABYLON.Engine {
  return new BABYLON.Engine(canvas, true);
}
