import { createEngine } from './utils/engine';
import { createPongScene } from './scenes/pongScene';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas not found! Check your HTML file.');
    return;
  }
  console.log('Canvas element retrieved:', canvas);

  const engine = createEngine(canvas);
  console.log('Engine created:', engine);

  const scene = createPongScene(engine, canvas);
  console.log('Scene created:', scene);

  engine.runRenderLoop(() => {
    scene.render();
    console.log('Scene rendered');
  });

  window.addEventListener('resize', () => {
    engine.resize();
    console.log('Engine resized');
  });
});
