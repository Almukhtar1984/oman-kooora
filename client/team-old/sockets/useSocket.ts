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
  
  let Role = "team";
  const token = useStore((state : any  ) => state.token);
  const userData = useStore((state : any) => state.userData);

  useEffect(() => {
    const userId = (useStore.getState() as any)?.userData?.person?.member?.team?.id;

    if (token) {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
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
        // console.log("auth succes")
      });

      return () => {
        socket.disconnect();
        setSocketInstance(null);
      };
    }

    // Optional: Subscribe to store updates
    const unsubscribe = useStore.subscribe(() => {
      const newToken = (useStore.getState() as any)?.token;
      const newUserId = (useStore.getState() as any)?.userData?.id;

      if (newToken && !socketInstance) {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
          path: "/socket.io/",
          transports: ["polling", "websocket"],
          auth: {
            token: newToken,
          },
          query: { userId: newUserId, Role },
        });

        socket.connect();
        setSocketInstance(socket);

        socket.on("auth_success", (message: string) => {
          // console.log("auth succes")
        });
      }
    });

    return () => {
      socketInstance?.disconnect();
      setSocketInstance(null);
      //unsubscribe(); // Cleanup subscription
    };
  }, [token, userData]);

  return socketInstance;
};

export default useSocket;
