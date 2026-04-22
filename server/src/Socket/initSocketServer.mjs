import { Server }   from "socket.io";
import { format as dateFormat } from 'date-fns';
import sequelize from 'sequelize';
import RandToken from 'rand-token';

import { AuthMiddlewareSocket } from "../Middlewares/index.mjs";

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
			const nowDate = new Date();
			const dateConnection = dateFormat(nowDate, "yyyy-mm-dd HH:MM:ss");

			let token = socket.handshake.auth.token || "";

			let Authorization = await AuthMiddlewareSocket(token)

			if (!Authorization.isAuth) {
				return next(new Error('You must be the authenticated user'));
			}

			if (!socket.handshake.query.userId) {
				console.log("*** No date config ***")
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

			//this.socketPacketCreate(socket)
			//this.socketPacket(socket)
			//this.socketUpgrade(socket)
			this.socketError(socket);
			this.socketDisconnect(socket);
			return await socket
		})
	}

	async socketInfo(socket) {
		console.log('\n***************************************************************************');
		console.log('*** New user information ************************************************** \n**');
		console.log('** \t A new user here his id => ', socket.id);
		console.log("** \t Type transport connection : ", socket.conn.transport.name);
		console.log('**\n***************************************************************************');
		console.log('*** general information *************************************************** \n**');

		let fetchSockets = await this.io.fetchSockets() // get all sockets
		this.online_users = []; // re-empty list online users
		fetchSockets.map(socket => {
			this.online_users.push(socket.id) // add just id user
		});

		console.log("** \t Number visitor connected ", this.io.of("/").sockets.size)
		console.log("** \t Online users ========> ", this.online_users);

		console.log('**\n***************************************************************************');
		console.log('*************************************************************************** \n');
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
			console.log("error", err)
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
			const nowDate = new Date();
			const dateDisconnect = dateFormat(nowDate, "yyyy-mm-dd HH:MM:ss");

//			if (socket.id.split("_")[1] != "undefined") {
//				User.update({lastDisconnection: dateDisconnect}, {
//					where: { id:  socket.id.split("_")[1] }
//				})
//			}
			console.info(`${dateDisconnect}  | visitor ${socket.id} disconnected 🖐🖐🖐`);
			this.online_users = this.online_users.filter(user => user != socket.id);
		});
	}

	socketPacketCreate(socket) {
		socket.conn.on("packetCreate", ({ type, data }) => {
			// console.log("packetCreate");
			// console.log({ type, data });
		});
	}

	socketPacket(socket) {
		socket.conn.on("packet", ({ type, data }) => {
			// console.log("packet");
			// console.log({ type, data });
		});
	}

	socketUpgrade(socket) {
		socket.conn.once("upgrade", () => {
			// console.log("upgraded transport", socket.conn.transport.name);
		});
	}
}
