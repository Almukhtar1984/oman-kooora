import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useStore from '../store/useStore';
interface State {
  token: string | null;
  userData: {
    id: string;
    // Add other user data properties here if necessary
  } | null;
} 

const useSocket = (): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  
  let Role = "club";
  const token = useStore((state : any  ) => state.token);
  const userData = useStore((state : any) => state.userData);

  useEffect(() => {
    const userId = (useStore.getState() as any)?.userData?.person?.clubManagement?.club?.id

    if (token) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = io(`${protocol}${process.env.NEXT_PUBLIC_API_SOCKET}`, {
        path: "/socket.io/",
        transports: ["polling", "websocket"],
        auth: {
          token,
        },
        query: { userId, Role },
      });

      socket.connect();
      setSocketInstance(socket);

      socket.on("auth_success", (message: string) => {
        //console.log("auth succes")
      });

      return () => {
        socket.disconnect();
        setSocketInstance(null);
      };
    }
  
    return () => {
      socketInstance?.disconnect();
      setSocketInstance(null);
    };
  }, [token, userData]);

  return socketInstance;
};

export default useSocket;
