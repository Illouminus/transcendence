let socket : WebSocket | null = null;


export function connectWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`ws://localhost:8082/ws?token=${token}`);
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log("WebSocket message received:", data);
    };
    return socket;
  }
  
  export function getWebSocket(): WebSocket | null {
    return socket;
  }