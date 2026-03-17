import { io } from "socket.io-client";

const SOCKET_URL = "https://hospital-ecosystem-clean-backend.onrender.com";
const socket = io(SOCKET_URL, {
  transports: ["websocket"]
});

export default socket;
