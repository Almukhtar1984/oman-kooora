import { Server } from "socket.io";
import { format as dateFormat } from 'date-fns';
import sequelize from 'sequelize';
import RandToken from 'rand-token';
import { AuthMiddlewareSocket } from "../Middlewares/index.mjs";
import { allowedOrigins } from "../Config/runtime.mjs";

const { uid } = RandToken;
const { Op, col, QueryTypes } = sequelize;

const UNAUTHORIZED = 'You must be the authenticated user to get this information';

export class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      path: "/socket.io/",
      cors: {
        origin: allowedOrigins,
        credentials: true
      }
    });

    this.online_users = [];
    this.Club_users = [];
    this.Team_users = [];
    this.League_users = [];
    this.Player_users = [];
    this.socketConnect = null;
  }

  async getIds(id) {
    let data = [];
    for (let i = 0; i < this.online_users.length; i++) {
      if (this.online_users[i].split("_")[1] === id) { // 
        await data.push(this.online_users[i]);
      }
    }
    return data;
  }
  
  async getClub(id) {
    let data = [];
    for (let i = 0; i < this.Club_users.length; i++) {
      if (this.Club_users[i].split("_")[1]) { // === id
        await data.push(this.Club_users[i]);
      }
    }
    return data;
  }
  async getIdsTeam  (id) {
    let data = [];
    for (let i = 0; i < this.Team_users.length; i++) {
      if (this.Team_users[i].split("_")[1] === id) { // === id
        await data.push(this.Team_users[i]);
      }
    }
    return data;
  }

  socketConfig() {
    this.io.use(async (socket, next) => {
      const nowDate = new Date();
      const dateConnection = dateFormat(nowDate, "yyyy-mm-dd HH:MM:ss");

      let token = socket.handshake.auth.token || "";
      const origin = socket.handshake.headers?.origin;
      let Authorization = await AuthMiddlewareSocket(token, origin);

      if (!Authorization.isAuth) {
        return next(new Error('You must be the authenticated user'));
      }

      if (!socket.handshake.query.userId) {
        return next(new Error("date config empty"));
      }
      socket["id"] = `${uid(3)}_${socket.handshake.query.userId}` || this.online_users.length + 1;
      socket["Role"] = `${socket?.handshake?.query?.Role}` || "undifined";
      

      next();
    });
  }

  async connection() {
    if (this.socketConnect) {
      return this.socketConnect;
    }

    this.socketConfig();
    this.socketConnect = await this.io.on('connection', async (socket) => {
      await this.socketInfo(socket);
      await this.sendNotifications(socket);
      this.socketError(socket);
      this.socketDisconnect(socket);
      return await socket;
    });
  }

  async socketInfo(socket) {
    let fetchSockets = await this.io.fetchSockets();
    this.online_users = [];
    this.Team_users = [];
    this.Club_users = [];
    
    fetchSockets.map(socket => {
      //console.log(socket.Role)
      this.online_users.push(socket.id);
      switch (socket.Role){
        case "team":
          this.Team_users.push(socket.id);
          break
        case "club":
          this.Club_users.push(socket.id);
          break

      }
    });

    if (process.env.LOG_SOCKET_EVENTS === 'true') {
      console.log('\n*** New user connected ***\n');
      console.log('ID:', socket.id);
      console.log('Connection type:', socket.conn.transport.name);
      console.log('Total connected users:', this.io.of("/").sockets.size);
      console.log('all Online users:', this.online_users);
      console.log('Team users:', this.Team_users);
      console.log('Club users:', this.Club_users);
    }
  }

  async sendNewNotification(type,to, notification) {
    const Ids = await this.getIds(to);
    
    this.sendNotifications(this.io)
   
      if (Ids && Ids.length > 0) {
     
        this.socketConnect.to(Ids[0]).emit("newNotification", notification);
      }
    }

  async sendNotifications(socket) {
    socket.emit("notifications", "this is connection emit");
  }

  socketError(socket) {
    socket.on("error", (err) => {
      if (process.env.LOG_SOCKET_EVENTS === 'true') {
        console.log("error", err);
      }
      if (err && err.message === UNAUTHORIZED) {
        socket.disconnect();
      }
      if (err && err.message === "date config empty") {
        socket.disconnect();
      }
    });
  }

  socketDisconnect(socket) {
    socket.on('disconnect', () => {
      const nowDate = new Date();
      const dateDisconnect = dateFormat(nowDate, "yyyy-mm-dd HH:MM:ss");

      if (process.env.LOG_SOCKET_EVENTS === 'true') {
        console.info(`${dateDisconnect} | visitor ${socket.id} disconnected`);
      }
      this.online_users = this.online_users.filter(user => user != socket.id);
    });
  }
}

let socketInstance = null;

export const initializeSocketServer = (httpServer) => {
  if (!socketInstance) {
    socketInstance = new SocketServer(httpServer);
  }
  return socketInstance;
};

export const getSocketServerInstance = () => {
  if (!socketInstance) {
    throw new Error("Socket server not initialized");
  }
  return socketInstance;
};
