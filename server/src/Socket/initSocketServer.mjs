import { Server }   from "socket.io";
import sequelize from 'sequelize';
import RandToken from 'rand-token';

import { AuthMiddlewareSocket } from "../Middlewares/index.mjs";
import logger from "../Config/logger.mjs";

const { uid } = RandToken;
const {Op, col, QueryTypes} = sequelize;

const UNAUTHORIZED = 'You must be the authenticated user to get this information'
const defaultOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:3002",
	"http://localhost:3003",
	"http://localhost:3004"
];
const allowedOrigins = process.env.CLIENT_ORIGINS
	? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
	: defaultOrigins;


export class socketServer {

	constructor(httpServer) {
		this.io = new Server(httpServer, {
			path: "/socket.io/",
			cors: {
                origin: allowedOrigins
			},
			credentials: true
		});

		//instrument(this.io, { auth: false })
		this.online_users = [];
		this.socketConnect = null;
	}

	async getIds(id) {
		let data = []
		for (let i = 0; i < this.online_users.length; i++) {
			if (this.online_users[i].split("_")[1] === id) {
				await data.push(this.online_users[i])
			}
		}
		return data;
	}

	socketConfig() {
		this.io.use( async (socket, next)=>{
			let token = socket.handshake.auth.token || "";

			let Authorization = await AuthMiddlewareSocket(token)

			if (!Authorization.isAuth) {
				return next(new Error('You must be the authenticated user'));
			}

			if (!socket.handshake.query.userId) {
				logger.warn("Socket connection rejected: missing user id");
				return next(new Error("date config empty"));
			}

			socket['id'] = `${uid(3)}_${socket.handshake.query.userId}` || this.online_users.length + 1;

			next();
		});
	}

	async connection() {
		this.socketConfig();
		this.socketConnect = await this.io.on('connection', async (socket) => {
			await this.socketInfo(socket)
			 await this.sendNotifications(socket);

			this.socketError(socket);
			this.socketDisconnect(socket);
			return await socket
		})
	}

	async socketInfo(socket) {
		let fetchSockets = await this.io.fetchSockets() // get all sockets
		this.online_users = []; // re-empty list online users
		fetchSockets.map(socket => {
			this.online_users.push(socket.id) // add just id user
		});

		logger.info(`Socket connected. Online sockets: ${this.io.of("/").sockets.size}`);
	}

	async sendNewMessage(to, message) {
		const Ids = await this.getIds(to)
		if (Ids && Ids.length > 0) {
			this.socketConnect.to(Ids).emit("newMessage", message)
		}
	}

	async sendNewNotification(to, notification) {
		const Ids = await this.getIds(to)
		if (Ids && Ids.length > 0) {
			this.socketConnect.to(Ids).emit("newNotification", notification)
		}
	}

	async sendNotifications(socket) {
        socket.emit("notifications", "this is connection emit")
	}

	socketError(socket) {
		socket.on("error", (err) => {
			logger.error("Socket error");
			if (err && err.message === UNAUTHORIZED) {
				socket.disconnect();
			}
			if (err && err.message === "date config empty") {
				socket.disconnect();
			}
		})
	}

	socketDisconnect(socket) {
		socket.on('disconnect',(data)=>{
//			if (socket.id.split("_")[1] != "undefined") {
//				User.update({lastDisconnection: dateDisconnect}, {
//					where: { id:  socket.id.split("_")[1] }
//				})
//			}
			logger.info("Socket disconnected");
			this.online_users = this.online_users.filter(user => user != socket.id);
		});
	}
}
