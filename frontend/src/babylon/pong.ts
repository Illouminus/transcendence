import { createEngine } from './utils/engine';
import { createPongScene } from './scenes/pongScene';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  const engine = createEngine(canvas);
  const scene = createPongScene(engine, canvas);

  engine.runRenderLoop(() => {
    scene.render();
    console.log('render');
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
