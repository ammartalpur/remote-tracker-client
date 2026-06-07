import { io, Socket } from "socket.io-client";

// Use the local Node.js server port we set up earlier
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL

// Export a singleton socket instance
export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  auth: { type: "owner" }, // Identifies this connection as the control room
});
