const express = require('express');
const app = express();
const dotenv = require('dotenv');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const validator = require('validator');
dotenv.config();

const DEFAULT_PORT = process.env.PORT || 5000;



/*
****************
* STATIC SERVE *
****************
*/
if(process.env.NODE_ENV === "production"){
	const CLIENT_BUILD_PATH = path.join(__dirname, "../frontend/build");

	// Static files
	app.use(express.static(CLIENT_BUILD_PATH));

	// Server React Client
	app.get("/", function(req, res) {
	res.sendFile(path.join(CLIENT_BUILD_PATH , "index.html"));
	});
}

/*
*********************************
* IMPORT 'rooms' DATA STRUCTURE *
*********************************
*/

const {rooms} = require('./rooms');

io.on('connection',(socket) => {
	console.log('A user connected. Socket ID: ',socket.id);

	socket.on('create', (json) => {
		const data = JSON.parse(json);
		const minBet = data.minBet;
		const waitingTime = data.waitingTime;
		const username = data.username;
		if(validator.isAlphanumeric(username) && !validator.isEmpty(username) && validator.isNumeric(minBet) && validator.isNumeric(waitingTime)){
			const res = rooms.addRoom(minBet, waitingTime, username, socket);
			rooms.getInfo();
			console.log("New room created");
			console.log(res);
			socket.emit('created',JSON.stringify(res));
		}
		else if(!validator.isAlphanumeric(username) || validator.isEmpty(username)){
			const errMsg = "Username non valido (deve essere alfanumerico)";
			console.log(errMsg);
			socket.emit('error', JSON.stringify(errMsg));
		}
		else if(validator.isNumeric(minBet)){
			let errMsg = "Costo puntata inserito non valido";
			console.log(errMsg);
			socket.emit('error', JSON.stringify(errMsg));
		}
		else if(validator.isNumeric(waitingTime)){
			let errMsg = "Tempo di attesa inserito non valido";
			console.log(errMsg);
			socket.emit('error', JSON.stringify(errMsg));
		}	
	})

	socket.on('join', (json) => {
		const data = JSON.parse(json);

		console.log(data)

		const roomID = data.roomID;
		const username = data.username;


		if(validator.isAlphanumeric(username) && !validator.isEmpty(username) && rooms.getRoom(roomID)){
			const res = rooms.addPlayer(roomID, username, socket);
			rooms.getInfo();
			console.log("User added to room");
			console.log(res);
			socket.emit('joined', JSON.stringify(res));
		}
		else if(!validator.isAlphanumeric(username) || validator.isEmpty(username)){
			let errMsg = "Username non valido (deve essere alfanumerico)";
			console.log(errMsg);
			socket.emit('error', JSON.stringify(errMsg));
		}
		else if(!rooms.getRoom(roomID)){
			let errMsg = "Username non valido (deve essere alfanumerico)";
			console.log(errMsg);
			socket.emit('error', JSON.stringify(errMsg));
		}
	})

	socket.on('start', (json) => {
		if(rooms.getGameStatus(socket.roomID) === "stop" && rooms.getUserStatus(socket.roomID,socket.userID) === 'wait'){
			console.log("Receveid start message");
			const data = JSON.parse(json);
			rooms.setUserStatus(socket.roomID, socket.userID, data.action);

			const room = rooms.getRoom(socket.roomID);
			const isEverybodyReady = Object.values(room.users).every(u => u.status === "play" || u.status === "skip");

			if(isEverybodyReady){
				rooms.roundSetup(socket.roomID);
				const tableCards = rooms.getTableCards(socket.roomID);
				const data = {
					'tableCards': tableCards
				}
				io.to(socket.roomID).emit('tableCards', JSON.stringify(data));
			}
		}
	})

	socket.on('disconnect', () => {
		console.log("User disconnected");
		if(socket.roomID && socket.userID){
			const roomActive = rooms.removePlayer(socket.roomID,socket. userID);
			if(roomActive){
				const newPositions = rooms.getNewPositionsData(socket.roomID);
				console.log("Emitting new positions");
				console.log(newPositions);
				io.to(socket.roomID).emit('newPositions', JSON.stringify(newPositions));
			}
			else{
				console.log("Closed room", socket.roomID);
			}
		}
	})
})

server.listen(DEFAULT_PORT);

/**
 ********* 
 * DEBUG *
 * *******
 */
const util = require('util');
const e = require('express');

app.get('/rooms', (req, res) => {
	const json = Object.assign(rooms);
	Object.values(json.data).forEach(room => {
		Object.values(room.users).forEach(user => {
			delete user.ws;
		})
	})
	res.send(json);
});