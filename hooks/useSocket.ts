"use client";

import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Only connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // Attach listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket, isConnected };
};
