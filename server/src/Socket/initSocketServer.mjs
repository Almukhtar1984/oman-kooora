import { Server }   from "socket.io";
import sequelize from 'sequelize';

import { AuthMiddlewareSocket } from "../Middlewares/index.mjs";
import logger from "../Config/logger.mjs";

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

		// Map: userId -> Set of socket.id
		this.userSockets = new Map();
		this.socketConnect = null;
	}

	getSocketIds(userId) {
		return Array.from(this.userSockets.get(String(userId)) || []);
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

			socket.data.userId = String(socket.handshake.query.userId);
			socket.data.role = socket.handshake.query.Role || "";

			next();
		});
	}

	async connection() {
		this.socketConfig();
		this.socketConnect = this.io.on('connection', (socket) => {
			this._trackSocket(socket);
			this.sendNotifications(socket);
			this.socketError(socket);
			this.socketDisconnect(socket);

			logger.info(`Socket connected. Online sockets: ${this.io.of("/").sockets.size}`);
		});
	}

	_trackSocket(socket) {
		const userId = socket.data.userId;
		if (!this.userSockets.has(userId)) {
			this.userSockets.set(userId, new Set());
		}
		this.userSockets.get(userId).add(socket.id);
	}

	async sendNewMessage(to, message) {
		const ids = this.getSocketIds(to);
		if (ids.length > 0) {
			this.socketConnect.to(ids).emit("newMessage", message);
		}
	}

	async sendNewNotification(to, notification) {
		const ids = this.getSocketIds(to);
		if (ids.length > 0) {
			this.socketConnect.to(ids).emit("newNotification", notification);
		}
	}

	sendNotifications(socket) {
        socket.emit("notifications", "this is connection emit")
	}

	socketError(socket) {
		socket.on("error", (err) => {
			logger.error("Socket error");
			if (err && (err.message === UNAUTHORIZED || err.message === "date config empty")) {
				socket.disconnect();
			}
		})
	}

	socketDisconnect(socket) {
		socket.on('disconnect', () => {
			logger.info("Socket disconnected");
			const userId = socket.data.userId;
			if (userId && this.userSockets.has(userId)) {
				this.userSockets.get(userId).delete(socket.id);
				if (this.userSockets.get(userId).size === 0) {
					this.userSockets.delete(userId);
				}
			}
		});
	}
}
