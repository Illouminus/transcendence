// eventManager.ts

type Listener = {
    element: EventTarget;
    type: string;
    handler: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  };
  
  const listeners: Listener[] = [];
  
  export function trackedAddEventListener(
    element: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    element.addEventListener(type, handler, options);
    listeners.push({ element, type, handler, options });
  }
  
  export function removeAllTrackedEventListeners() {
    for (const { element, type, handler, options } of listeners) {
      element.removeEventListener(type, handler, options);
    }
    listeners.length = 0;
  }