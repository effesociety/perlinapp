const express = require('express');
const app = express();
const dotenv = require('dotenv');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const validator = require('validator');
const path = require('path');
dotenv.config();

const DEFAULT_PORT = process.env.PORT || 5000;
const MAX_NUM_PLAYERS = 9;


/*
****************
* STATIC SERVE *
****************
*/
if(process.env.NODE_ENV === "production"){
	const CLIENT_BUILD_PATH = path.join(__dirname, "../../frontend/build");

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

			
			const newPositions = rooms.getPositionsData(socket.roomID);
			console.log("Emitting new positions");
			console.log(newPositions);
			io.to(socket.roomID).emit('newPositions', JSON.stringify(newPositions));
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

		if(validator.isAlphanumeric(username) && !validator.isEmpty(username) && rooms.getRoom(roomID) && rooms.getActivePlayers(roomID).length < MAX_NUM_PLAYERS){
			const res = rooms.addPlayer(roomID, username, socket);
			rooms.getInfo();
			console.log("User added to room");
			console.log(res);
			socket.emit('joined', JSON.stringify(res));
			
			
			const newPositions = rooms.getPositionsData(socket.roomID);
			console.log("Emitting new positions");
			console.log(newPositions);
			io.to(socket.roomID).emit('newPositions', JSON.stringify(newPositions));
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
		else if(rooms.getActivePlayers(roomID).length >= MAX_NUM_PLAYERS){
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
			const isEverybodyReady = rooms.getActivePlayers(socket.roomID).every(u => u.status === "play" || u.status === "skip");
			const moreThanOnePlayer = Object.values(room.users).filter(u => u.status === "play").length > 1;

			if(isEverybodyReady && moreThanOnePlayer){
				rooms.roundSetup(socket.roomID);
				const tableCards = rooms.getTableCards(socket.roomID);
				const data = {
					'tableCards': tableCards
				}
				//rooms.sendAll(socket.roomID, 'tableCards', data);
				io.to(socket.roomID).emit('tableCards', JSON.stringify(data));
				//Go to next state
				rooms.startChangeRound(socket.roomID);
				const numChangeableCards = room.gameStatus.properties.numChangeableCards;
				const statusData = {
					'status': 'change',
					'numChangeableCards': numChangeableCards
				}
				io.to(socket.roomID).emit('status', JSON.stringify(statusData));
				//Find first player that has to change
				const firstPlayer = rooms.getOrderedPlayers(socket.roomID, 'play')[0];
				const turnData = {
					'turn': firstPlayer.username
				}
				console.log("The first player that has to change is")
				console.log(turnData);
				io.to(socket.roomID).emit('turn', JSON.stringify(turnData));
			}
		}
	})

	socket.on('change', (json) => {
		if(socket.roomID && socket.userID && rooms.getGameStatus(socket.roomID) === "change" && rooms.getUserStatus(socket.roomID,socket.userID) === 'play' ){
			const room = rooms.getRoom(socket.roomID);
			const currentUserPosition = room.gameStatus.properties.currentUserPosition;
			const user = rooms.getUser(socket.roomID, socket.userID);
			const nextUser = room.gameStatus.playingThisRound[currentUserPosition];
			//Check if is the correct user who sent the message
			if(user.username === nextUser){
				console.log("Receveid change message");
				const data = JSON.parse(json);
				rooms.changeCards(socket.roomID, socket.userID, data.cards);

				const numReadyPlayers = rooms.getStatusPlayers(socket.roomID, "change").length;
				if(numReadyPlayers === room.gameStatus.playingThisRound.length){
					//Go to next state
					rooms.startBetRound(socket.roomID);
				}
				else{
					//Find next player that has to change
					const nextUserPosition = room.gameStatus.properties.currentUserPosition
					const nextPlayer = room.gameStatus.playingThisRound[nextUserPosition];
					const turnData = {
						'turn': nextPlayer
					}
					io.to(socket.roomID).emit('turn', JSON.stringify(turnData));
				}
			}
		}
	})

	socket.on('bet', (json) => {
		const acceptableUserStatus = ['change', 'raise', 'call', 'fold'];
		if(socket.roomID && socket.userID && rooms.getGameStatus(socket.roomID) === "bet" && acceptableUserStatus.includes(rooms.getUserStatus(socket.roomID,socket.userID))){
			//Check if correct position
			const room = rooms.getRoom(socket.roomID);
			const user = rooms.getUser(socket.roomID, socket.userID);
			const currentUserPosition = room.gameStatus.properties.currentUserPosition;
			const nextUser = room.gameStatus.playingThisRound[currentUserPosition];
			
			const data = JSON.parse(json);
			if(user.username === nextUser && (data.action !== "raise" || (data.action === "raise" && data.value > room.gameStatus.properties.currentBet))){
				console.log("Received bet message");
				rooms.handleBet(socket.roomID, socket.userID, data);

				if(data.action === "raise"){
					const statusData = {
						'status': 'bet',
						'currentBet': room.gameStatus.properties.currentBet,
						'betUser': room.gameStatus.properties.betUser
					}
					io.to(socket.roomID).emit('status', JSON.stringify(statusData));
				}

				//Check if the bet round is over and go to next state
				const numFoldedPlayers = rooms.getStatusPlayers(socket.roomID, "fold").length;
				const numCalledPlayers = rooms.getStatusPlayers(socket.roomID, "call").length;
				const numRaisePlayers = rooms.getStatusPlayers(socket.roomID, "raise").length;

				const numPlayingThisRound = room.gameStatus.playingThisRound.length;
				const condition1 = numRaisePlayers === 1 && numRaisePlayers + numCalledPlayers + numFoldedPlayers === numPlayingThisRound; //1 raise and the others called/folded
				const condition2 = numFoldedPlayers === numPlayingThisRound-1; //Everybody except one folded

				if(condition1 || condition2){
					//Go to next state
					rooms.startShowdown(socket.roomID);
				}
				else{
					//Find next player that has to bet
					const nextUserPosition = room.gameStatus.properties.currentUserPosition
					const nextPlayer = room.gameStatus.playingThisRound[nextUserPosition];
					const turnData = {
						'turn': nextPlayer
					}
					io.to(socket.roomID).emit('turn', JSON.stringify(turnData));
				}
			}


		}
	})

	socket.on('disconnect', () => {
		console.log("User disconnected");
		if(socket.roomID && socket.userID){
			const roomActive = rooms.removePlayer(socket.roomID,socket. userID);
			if(roomActive){
				const newPositions = rooms.getPositionsData(socket.roomID);
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

const cloneDeep = require('lodash.clonedeep');

app.get('/rooms', (req, res) => {
	const clonedRooms = {}
	for(const room of Object.keys(rooms.data)){
		let gameProperties = rooms.data[room].gameProperties;
		const gameStatus = rooms.data[room].gameStatus;
		let users = {};
		const oldUsers = rooms.data[room].users;
		for(const user of Object.keys(oldUsers)){
			users[user] = Object.assign({},oldUsers[user], {'ws': 'Something veeery long'});
		}
		clonedRooms[room] = {
			'gameProperties': gameProperties,
			'gameStatus': gameStatus,
			'users': users
		}
	}

	res.send(clonedRooms);
});