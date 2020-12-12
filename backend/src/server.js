const express = require('express');
const app = express();
const dotenv = require('dotenv');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const validator = require('validator');
dotenv.config();

const DEFAULT_PORT = process.env.PORT || 5000;
const MAX_NUM_PLAYERS = 9;


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
			const data = {
				'errMsg': "Username non valido (deve essere alfanumerico)",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}
		else if(validator.isNumeric(minBet)){
			const data = {
				'errMsg': "Costo puntata inserito non valido",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}
		else if(validator.isNumeric(waitingTime)){
			const data = {
				'errMsg': "Tempo di attesa inserito non valido",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}	
	})

	socket.on('join', (json) => {
		const data = JSON.parse(json);
		const roomID = data.roomID;
		const username = data.username;

		if(validator.isAlphanumeric(username) && !validator.isEmpty(username) && rooms.getRoom(roomID) && rooms.getActivePlayers(roomID) < MAX_NUM_PLAYERS){
			const res = rooms.addPlayer(roomID, username, socket);
			rooms.getInfo();
			console.log("User added to room");
			console.log(res);
			socket.emit('joined', JSON.stringify(res));
		}
		else if(!validator.isAlphanumeric(username) || validator.isEmpty(username)){
			const data = {
				'errMsg': "Username non valido (deve essere alfanumerico)",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}
		else if(!rooms.getRoom(roomID)){
			const data = {
				'errMsg': "Room non esistente",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}
		else if(rooms.getActivePlayers(roomID) >= MAX_NUM_PLAYERS){
			const data = {
				'errMsg': "Room piena!",
			}
			console.log(data);
			socket.emit('error', JSON.stringify(data));
		}
	})

	socket.on('start', (json) => {
		if(socket.roomID && socket.userID && rooms.getGameStatus(socket.roomID) === "stop" && rooms.getUserStatus(socket.roomID,socket.userID) === 'wait'){
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
				//Go to next state
				rooms.startChangeRound(socket.roomID);
				const numChangeableCards = room.gameStatus.properties.numChangeableCards;
				const statusData = {
					'status': 'change',
					'numChangeableCards': numChangeableCards
				}
				io.to(socket.roomID).emit('status', JSON.stringify(statusData));
			}
		}
	})

	socket.on('change', (json) => {
		if(socket.roomID && socket.userID && rooms.getGameStatus(socket.roomID) === "change" && rooms.getUserStatus(socket.roomID,socket.userID) === 'play' ){
			const room = rooms.getRoom(socket.roomID);
			const currentUserPosition = room.gameStatus.properties.currentUserPosition;
			const user = rooms.getUser(socket.roomID, socket.userID);
			//Check if is the correct user who sent the message
			if(user.position === currentUserPosition){
				console.log("Receveid change message");
				room.gameStatus.properties.currentUserPosition += 1;
				const data = JSON.parse(json);
				rooms.changeCards(socket.roomID, socket.userID, data.cards);
				rooms.setUserStatus(socket.roomID, socket.userID, 'change');

				const numReadyPlayers = Object.values(room.users).filter(u => u.status === "change").length;
				if(numReadyPlayers === room.gameStatus.playingThisRound){
					//Go to next state
					rooms.startBetRound(socket.roomID);
					const statusData = {
						'status': 'bet',
					}
					io.to(socket.roomID).emit('status', JSON.stringify(statusData));
				}
			}
		}
	})

	socket.on('bet', (json) => {
		const acceptableUserStatus = ['play', 'raise', 'call', 'fold'];
		if(socket.roomID && socket.userID && rooms.getGameStatus(socket.roomID) === "bet" && acceptableUserStatus.includes(rooms.getUserStatus(socket.roomID,socket.userID))){
			//Check if correct position

			//Then call a function in rooms.js

			//Then check if the bet round is over and go to next state
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

app.get('/rooms', (req, res) => {
	const json = Object.assign(rooms);
	Object.values(json.data).forEach(room => {
		Object.values(room.users).forEach(user => {
			delete user.ws;
		})
	})
	res.send(json);
});