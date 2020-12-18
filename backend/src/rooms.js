const { deck, generateID, shuffleArray } = require("./util");
const cloneDeep = require('lodash.clonedeep');

const DEFAULT_POCKET_VALUE = process.env.DEFAULT_POCKET_VALUE || 0;

class Rooms{
    constructor(){
        this.data = {};
    }   

    getInfo(){
        console.log(this.data);
    }

    getRoom(roomID){
        return this.data[roomID];
    }

    getGameStatus(roomID){
        return this.data[roomID].gameStatus.currentStatus;
    }

    getUser(roomID, userID){
        return this.data[roomID].users[userID];
    }

    getPositionsData(roomID){
        const room = this.getRoom(roomID);
        let data = {}

        Object.values(room.users).forEach(user => {
            if(user.active){
                data = Object.assign(data, {[user.username] : user.position})
            }
        })
        return data;
    }

    getActivePlayers(roomID){
        return Object.values(this.data[roomID].users).filter(user => user.active);
    }

    getStatusPlayers(roomID, status){
        return Object.values(this.data[roomID].users).filter(user => user.active && user.status === status)
    }
    
    getOrderedPlayers(roomID, status){
        const playersByStatus = Object.values(this.data[roomID].users).filter(user => user.active && user.status === status);
        const orderedPlayers = playersByStatus.sort((a,b) => parseInt(a.position) - parseInt(b.position));
        return orderedPlayers;
    }

    setPlayingThisRound(roomID){
        const room = this.getRoom(roomID);
        let users = this.getStatusPlayers(roomID, 'play');
        users.forEach(user => {
            room.gameStatus.playingThisRound.push(user.username);
        })
    }

    getTableCards(roomID){
        const room = this.getRoom(roomID);
        const deck = room.gameStatus.deck;
        const tableCards = [deck[0], deck[1], deck[2]];
        return tableCards;
    }

    getUserStatus(roomID, userID){
        let user = this.getUser(roomID, userID);
        return user.status;
    }
    
    setUserStatus(roomID, userID, newStatus){
        let user = this.getUser(roomID, userID);
        user.status = newStatus;
    }

    addRoom(minBet, waitingTime, firstPlayerUsername, firstPlayerWs){
        let res; //Value to be returned to the user
        let roomID;
        let duplicate;
        do{
            roomID = generateID().toUpperCase();
            duplicate = true;
            if(!this.data.hasOwnProperty(roomID)){
                duplicate = false;
                //Default values for new room
                this.data[roomID] = {
                    'gameProperties': {
                        'minBet': parseFloat(minBet),
                        'waitingTime': parseFloat(waitingTime)
                    },
                    'gameStatus': {
                        'entranceFee': parseFloat(minBet),
                        'currentStatus': 'stop',
                        'deck': null,
                        'potValue': 0,
                        'playingThisRound': [],
                        'properties': {
                            'noTaxPlayers': []
                        }
                    },
                    'users': {

                    }
                };
                //Add the first player
                res = this.addPlayer(roomID, firstPlayerUsername, firstPlayerWs);
            }
        }   
        while(duplicate);
        return res;
    }

    addPlayer(roomID, username, ws){
        const position = this.getActivePlayers(roomID).length+1;
        const room = this.getRoom(roomID);
        let newUser = {
            'username': username,
            'active': true,
            'status': 'wait',
            'pocket': parseFloat(DEFAULT_POCKET_VALUE),
            'position': position,
            'betValue': null,
            'currentCards': [],
            'ws': ws,
            'countdown': null
        }

        let duplicate;
        //Avoid players with the same username
        if(Object.values(room.users).some(user => user.username == username)){
            let i = 2;
            do{
                duplicate = true;
                const newUsername = username + i.toString();
                if(!Object.values(room.users).some(user => user.username == newUsername)){
                    duplicate = false;
                    newUser.username = newUsername;
                }
            }
            while(duplicate);
        }
        //Avoid players with the same ID
        let userID;
        do{
            userID = generateID();
            duplicate = true;
            if(!room.users.hasOwnProperty(userID)){
                duplicate = false;
                room.users[userID] = newUser;
            }
        }   
        while(duplicate);
        const res = {
            'username': newUser.username,
            'roomID': roomID,
            'position': position,
            'pocket': DEFAULT_POCKET_VALUE,
            'minBet': room.gameProperties.minBet,
        }
        //Add info to socket for quicker disconnect management
        ws.join(roomID);
		ws.roomID = roomID;
        ws.userID = userID;
        return res;
    }

    checkIfBetIsOver(roomID){
        const room = this.getRoom(roomID);
        const numFoldedPlayers = this.getStatusPlayers(roomID, "fold").length;
        const numCalledPlayers = this.getStatusPlayers(roomID, "call").length;
        const numRaisePlayers = this.getStatusPlayers(roomID, "raise").length;
        const numPlayingThisRound = room.gameStatus.playingThisRound.length;
        const condition1 = numRaisePlayers === 1 && numRaisePlayers + numCalledPlayers + numFoldedPlayers === numPlayingThisRound; //1 raise and the others called/folded
        const condition2 = numFoldedPlayers === numPlayingThisRound-1; //Everybody except one folded
        return condition1 || condition2;
    } 

    /**
     * 
     * @param {String} roomID 
     * @param {String} userID 
     * This function returns either True or False.
     * It returns True if the room after the player removal is still active (there is at least one player left)
     * It returns False if the room became empty and is closed
     */
    removePlayer(roomID, userID){
        const room = this.getRoom(roomID);
        if(room && room.users[userID]){
            const userToRemove = this.getUser(roomID,userID);
            userToRemove.active = false;
            //Check if the room is empty (everyone is inactive)
            if(this.getActivePlayers(roomID).length === 0){
                this.closeRoom(roomID);
                return false;
            }
            else{
                const userIndex = room.gameStatus.playingThisRound.findIndex(u => u === userToRemove.username);
                room.gameStatus.playingThisRound.splice(userIndex, 1);
                //Change position for everyone with a higher number in the room
                const removedUserPosition = userToRemove.position;
                Object.values(room.users).forEach(u => {
                    if(u.active && u.position > removedUserPosition){
                        u.position -= 1;
                    }
                })
                //
                const currentStatus = room.gameStatus.currentStatus;
                if(currentStatus === "change"){
                    //Find next player that has to change
					const nextUserPosition = room.gameStatus.properties.currentUserPosition;
                    const nextPlayer = room.gameStatus.playingThisRound[nextUserPosition];
                    //TO-DO: Fix error in bet state
                    if(nextPlayer){
                        const turnData = {
                            'turn': nextPlayer,
                            'remainingTime': room.gameProperties.waitingTime
                        }
                        this.sendAll(roomID, 'turn', turnData);
                        this.startCountdown(roomID, nextPlayer);
                    }
                    else{
                        //Go to next state
                        this.startBetRound(roomID);
                    }
                }
                else if(currentStatus === "bet"){
                    //Find next player that has to bet
                    const isBetOver = this.checkIfBetIsOver(roomID);
                    if(isBetOver){
                        //Go to next state
                        this.startShowdown(roomID);
                    }
                    else{
                        const numPlayers = room.gameStatus.playingThisRound.length;
                        //Finding next user
                        let nextUserFound = false;
                        //Just a little trick
                        room.gameStatus.properties.currentUserPosition -= 1;
                        while(!nextUserFound){
                            const currentUserPos = room.gameStatus.properties.currentUserPosition;
                            let candidateUserPosition = currentUserPos+1 === numPlayers ? 0 : currentUserPos+1;
                            room.gameStatus.properties.currentUserPosition = candidateUserPosition;
                            const candidateUser = Object.values(room.users).find(u => u.username === room.gameStatus.playingThisRound[candidateUserPosition]);
                            if(candidateUser.status !== "fold"){
                                nextUserFound = true;
                            }
                        }
                    }
                }
                return true;
            }
        }
    }

    closeRoom(roomID){
        if(this.data[roomID]){
            delete this.data[roomID];
        }
    }

    sendAll(roomID, event, data){
        console.log("broadcasting event", event);
        console.log(data);
        const room = this.getRoom(roomID);
        const jsonData = JSON.stringify(data);
        for(const user of Object.values(room.users)){
            if(user.ws){
                user.ws.emit(event, jsonData);
            }
        }
    }

    startCountdown(roomID, username){
        const room = this.getRoom(roomID);
        const user = Object.values(room.users).find(u => u.username === username);
        user.countdown = setTimeout(() => {
            user.status = "skip";
            const userIndex = room.gameStatus.playingThisRound.findIndex(u => u === username);
            room.gameStatus.playingThisRound.splice(userIndex, 1);
            //Get next user or go to next state
            const currentStatus = room.gameStatus.currentStatus;
            if(currentStatus === "change"){
                //Find next player that has to change
                const nextUserPosition = room.gameStatus.properties.currentUserPosition;
                const nextPlayer = room.gameStatus.playingThisRound[nextUserPosition];
                //TO-DO: Fix error in bet state
                if(nextPlayer && nextUserPosition < room.gameStatus.playingThisRound.length - 1){
                    const turnData = {
                        'turn': nextPlayer,
                        'remainingTime': room.gameProperties.waitingTime
                    }
                    this.sendAll(roomID, 'turn', turnData);
                    this.startCountdown(roomID, nextPlayer);
                }
                else if(nextPlayer && nextUserPosition === room.gameStatus.playingThisRound.length - 1){
                    const nextUser = Object.values(room.users).find(u => u.username === nextPlayer);
                    nextUser.status = "change";
                    this.startShowdown(roomID)
                }
                else{
                    //Go to next state
                    this.startBetRound(roomID);
                }
            }
            else if(currentStatus === "bet"){
                //Find next player that has to bet
                const isBetOver = this.checkIfBetIsOver(roomID);
                if(isBetOver){
                    //Go to next state
                    this.startShowdown(roomID);
                }
                else{
                    const numPlayers = room.gameStatus.playingThisRound.length;
                    //Finding next user
                    let nextUserFound = false;
                    //Just a little trick
                    room.gameStatus.properties.currentUserPosition -= 1;
                    while(!nextUserFound){
                        const currentUserPos = room.gameStatus.properties.currentUserPosition;
                        let candidateUserPosition = currentUserPos+1 === numPlayers ? 0 : currentUserPos+1;
                        room.gameStatus.properties.currentUserPosition = candidateUserPosition;
                        const candidateUser = Object.values(room.users).find(u => u.username === room.gameStatus.playingThisRound[candidateUserPosition]);
                        if(candidateUser.status !== "fold"){
                            nextUserFound = true;
                        }
                    }
                    const nextPlayer = room.gameStatus.playingThisRound[room.gameStatus.properties.currentUserPosition];
                    const turnData = {
                        'turn': nextPlayer,
                        'remainingTime': room.gameProperties.waitingTime
                    }
                    this.sendAll(roomID, 'turn', turnData);
                    this.startCountdown(roomID, nextPlayer);
                }
            }
        }, room.gameProperties.waitingTime*1000)
    }
    
    getRanking(roomID){
        const room = this.getRoom(roomID);
        const ranking = Object.values(room.users).map(u => {
            const userRankingInfo = {
                'active': u.active,
                'username': u.username,
                'pocket': u.pocket
            }
            return userRankingInfo;
        })
        return ranking;
    }

    newRound(roomID){
        const room = this.getRoom(roomID);
        //If the room is closed during the 10 seconds before the new round
        if(!room){
            return;
        }
        const noTaxPlayers = room.gameStatus.properties.noTaxPlayers;
        room.gameStatus.currentStatus = "stop";
        room.gameStatus.playingThisRound = [];

        room.gameStatus.entranceFee = room.gameStatus.properties.isDraw ? room.gameStatus.properties.currentBet : room.gameProperties.minBet;

        for(const user of Object.values(room.users)){
            user.status = noTaxPlayers.includes(user.username) ? "play" : "wait";
            user.currentCards = [];
        }
        
        if(noTaxPlayers.length === this.getActivePlayers(roomID).length){
            this.roundSetup(roomID);
            const tableCards = this.getTableCards(roomID);
            const data = {
                'tableCards': tableCards
            }
            this.sendAll(roomID, 'tableCards', data);
            //Go to next state
            this.startChangeRound(roomID);
        }
        else if (room.gameStatus.properties.isDraw){
            const statusData = {
                'status': 'stop',
            }
            console.log(statusData);
            this.sendAll(roomID, 'status', statusData);
            //Send special message to users if its draw and only someone has to pay
            for(const user of this.getActivePlayers(roomID)){
                const action = noTaxPlayers.includes(user.username) ? "free" : "pay";
                const drawInfoData = {
                    'fee': room.gameStatus.entranceFee,
                    'action': action
                }
                user.ws.emit('drawInfo', JSON.stringify(drawInfoData))
            }
        }
        else{
            const statusData = {
                'status': 'stop',
            }
            console.log(statusData);
            this.sendAll(roomID, 'status', statusData);
        }

        room.gameStatus.properties = {
            'noTaxPlayers': noTaxPlayers
        }
    }

    calculateScore(cards){
        let score = 0; 
        let figureValue = 10;
        for(const card of cards){
            let value = parseInt(card.substring(1));
            if(value < 8){
                score += value;
            }
            else{
                score +=  figureValue;
            }
        }
        return score;
    }

    checkIfTris(cards){
        const values = cards.map(c => parseInt(c.substring(1)));
        const isTris = values.every(val => val === values[0]);
        return isTris;
    }

    checkIfPerlina(floorCards, playerCards){
        const floorValues = floorCards.map(c => parseInt(c.substring(1)));
        const playerValues = playerCards.map(c => parseInt(c.substring(1)));

        let isPerlina = true;
        for(const floorVal of floorValues){
            if(!playerValues.includes(floorVal)){
                isPerlina = false;
                break;
            }
        }
        return isPerlina;
    }

    roundSetup(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'setup';
        room.gameStatus.deck = shuffleArray(deck);
        //Dealing cards
        //room.gameStatus.playingThisRound = this.getStatusPlayers(roomID, 'play');
        this.setPlayingThisRound(roomID);
        const orderedPlayers = this.getOrderedPlayers(roomID, 'play');
        let i = 3;
        const noTaxPlayers = room.gameStatus.properties.noTaxPlayers;
        
        for(const player of orderedPlayers){
            //Send cards and...
            player.currentCards = [deck[i], deck[i+1], deck[i+2]];
            i += 3;
            let cardsData = {
                'cards': player.currentCards
            }
            player.ws.emit('cards',JSON.stringify(cardsData));
            //...take money
            //Who partecipated before doesn't have to pay
            if(!noTaxPlayers.includes(player.username)){
                player.pocket -= parseFloat(room.gameStatus.entranceFee);
                room.gameStatus.potValue += parseFloat(room.gameStatus.entranceFee);
                const pocketData = {
                    'pocket': player.pocket
                }
                player.ws.emit('pocketUpdate', JSON.stringify(pocketData));
            }         
        }     
        const potValueData = {
            'potValue': room.gameStatus.potValue
        }
        this.sendAll(roomID,'potValueUpdate', potValueData);
    }

    startChangeRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'change';
        //Getting num players to calculate how many cards are changeable
        const numPlayers = room.gameStatus.playingThisRound.length
        const numChangeableCards = numPlayers <= 7 ? 2 : 1;
        room.gameStatus.properties = {
            'currentUserPosition': 0, 
            'numChangeableCards': numChangeableCards,
            'numCardsChanged': 0
        }
        const statusData = {
            'status': 'change',
            'numChangeableCards': numChangeableCards
        }
        this.sendAll(roomID, 'status', statusData);
        //Find first player that has to change
        const firstPlayer = this.getOrderedPlayers(roomID, 'play')[0];
        const turnData = {
            'turn': firstPlayer.username,
            'remainingTime': room.gameProperties.waitingTime
        }
        console.log("The first player that has to change is")
        console.log(turnData);
        this.sendAll(roomID, 'turn', turnData);
        this.startCountdown(roomID, firstPlayer.username);
    }

    changeCards(roomID, userID, cards){
        const room = this.getRoom(roomID);
        room.gameStatus.properties.currentUserPosition += 1;
        const user = this.getUser(roomID, userID);
        clearTimeout(user.countdown);
        const numPlayers = room.gameStatus.playingThisRound.length;

        for(const card of cards){
            const deckPointer = 3 + (3*numPlayers) + room.gameStatus.properties.numCardsChanged;
            //Check if the user has the card
            if(user.currentCards.includes(card)){
                const cardToAdd = room.gameStatus.deck[deckPointer];
                const cardIndex = user.currentCards.findIndex(c => c === card);
                user.currentCards.splice(cardIndex,1,cardToAdd);
                room.gameStatus.properties.numCardsChanged += 1;
                //Take points for changing card
                user.pocket -= parseFloat(room.gameProperties.minBet);
                room.gameStatus.potValue += parseFloat(room.gameProperties.minBet);
            }
        }
        let cardsData = {
            'cards': user.currentCards
        }
        user.ws.emit('cards',JSON.stringify(cardsData));
        const pocketData = {
            'pocket': user.pocket
        }
        user.ws.emit('pocketUpdate', JSON.stringify(pocketData));
        const potValueData = {
            'potValue': room.gameStatus.potValue
        }
        this.sendAll(roomID,'potValueUpdate', potValueData);
        this.setUserStatus(roomID, userID, 'change');
    }

    startBetRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'bet';
        room.gameStatus.properties = {
            'currentUserPosition': 0,
            'currentBet': 0,
            'betUser': ''
        }
        const statusData = {
            'status': 'bet',
            'currentBet': 0,
            'betUser': '',
            'action': '',
            'actionUser': ''
        }
        this.sendAll(roomID, 'status', statusData);
        //Find first player that has to bet
        const firstPlayer = this.getOrderedPlayers(roomID, 'change')[0];
        const turnData = {
            'turn': firstPlayer.username,
            'remainingTime': room.gameProperties.waitingTime
        }
        this.sendAll(roomID, 'turn', turnData);
        this.startCountdown(roomID, firstPlayer.username);
    }

    handleBet(roomID, userID, data){
        const room = this.getRoom(roomID);
        const user = this.getUser(roomID, userID);
        clearTimeout(user.countdown);

        const numPlayers = room.gameStatus.playingThisRound.length;
        //Finding next user
        let nextUserFound = false;
        while(!nextUserFound){
            const currentUserPos = room.gameStatus.properties.currentUserPosition;
            let candidateUserPosition = currentUserPos+1 === numPlayers ? 0 : currentUserPos+1;
            room.gameStatus.properties.currentUserPosition = candidateUserPosition;
            const candidateUser = Object.values(room.users).find(u => u.username === room.gameStatus.playingThisRound[candidateUserPosition]);
            if(candidateUser.status !== "fold"){
                nextUserFound = true;
            }
        }

        const action = data.action;
        if(action === "raise" && data.value && data.value > room.gameStatus.properties.currentBet){
            room.gameStatus.properties.currentBet = parseFloat(data.value);
            room.gameStatus.properties.betUser = user.username;
            //Take points for raising
            user.pocket -= parseFloat(data.value);
            room.gameStatus.potValue += parseFloat(data.value);
            const pocketData = {
                'pocket': user.pocket
            }
            user.ws.emit('pocketUpdate', JSON.stringify(pocketData));
            const potValueData = {
                'potValue': room.gameStatus.potValue
            }
            this.sendAll(roomID,'potValueUpdate', potValueData);
        }
        else if(action === "call" && room.gameStatus.properties.currentBet > 0){
            //Take points for calling
            const currentBet = room.gameStatus.properties.currentBet;
            user.pocket -= parseFloat(currentBet);
            room.gameStatus.potValue += parseFloat(currentBet);
            const pocketData = {
                'pocket': user.pocket
            }
            user.ws.emit('pocketUpdate', JSON.stringify(pocketData));
            const potValueData = {
                'potValue': room.gameStatus.potValue
            }
            this.sendAll(roomID,'potValueUpdate', potValueData);
        }
        this.setUserStatus(roomID, userID, action);

        const statusData = {
            'status': 'bet',
            'currentBet': room.gameStatus.properties.currentBet,
            'betUser': room.gameStatus.properties.betUser,
            'action': action,
            'actionUser': user.username
        }
        this.sendAll(roomID, 'status', statusData);
    }

    startShowdown(roomID){
        const room = this.getRoom(roomID);
        const cardsOnTheFloor = [deck[0], deck[1], deck[2]];
        room.gameStatus.currentStatus = 'showdown';
        const scoreOnTheFloor = this.calculateScore(cardsOnTheFloor);      
        let topScorers = [];
        let isPerlina = false;
        let isTris = false;
        let winnerDifference = 31; //default value for diff

        const playingThisRound = room.gameStatus.playingThisRound;
        const acceptableUserStatus = ['call', 'raise', 'change'] //'change' is acceptable is everyone folded (expect the last player)

        for(const user of Object.values(room.users)){
            if(playingThisRound.includes(user.username) && acceptableUserStatus.includes(user.status)){
                const userScore = this.calculateScore(user.currentCards);
                const difference = Math.abs(userScore - scoreOnTheFloor);
                const isThisTris = this.checkIfTris(user.currentCards);
                let isThisPerlina = false;
                if(difference === 0){
                    isThisPerlina = this.checkIfPerlina(cardsOnTheFloor, user.currentCards);
                }

                
                if(isThisPerlina){
                    if(isPerlina){
                        topScorers.push(user.username);
                    }
                    else{
                        topScorers = [user.username];
                        isPerlina = true;
                    }
                    isTris = false;
                    winnerDifference = 0;
                }
                else if(isThisTris && !isThisPerlina && !isPerlina){
                    if(isTris){
                        topScorers.push(user.username);
                    }
                    else{
                        topScorers = [user.username]
                        isTris = true;
                    }
                }
                else if(!isThisPerlina && !isThisTris && !isPerlina && !isTris && difference <= winnerDifference){
                    if(difference === winnerDifference){
                        topScorers.push(user.username);
                    }
                    else{
                        winnerDifference = difference;
                        topScorers = [user.username];
                    }
                }
            }
        }

        const isDraw = topScorers.length > 1 ? true : false;
        const winner = topScorers;
        let winnerCards = [];
        let noTaxPlayers = [];        
        
        if(!isDraw){
            const potValue = room.gameStatus.potValue;
            const winnerPlayer = Object.values(room.users).find(u => u.username === winner[0])
            winnerCards = winnerPlayer.currentCards;
            winnerPlayer.pocket += parseFloat(potValue);
            room.gameStatus.potValue = 0;

            const pocketData = {
                'pocket': winnerPlayer.pocket
            }
            winnerPlayer.ws.emit('pocketUpdate', JSON.stringify(pocketData));
            const potValueUpdateData = {
                'potValue': 0
            }
            this.sendAll(roomID, 'potValueUpdate', potValueUpdateData);
        }
        else{
            noTaxPlayers = this.getStatusPlayers(roomID, 'raise').concat(this.getStatusPlayers(roomID, 'call')).map(u => u.username);
        }
        
        const currentBet = room.gameStatus.properties.currentBet;
        room.gameStatus.properties = {
            'score':  scoreOnTheFloor,
            'isDraw': isDraw,
            'winner': winner,
            'winnerCards': winnerCards,
            'noTaxPlayers': noTaxPlayers,
            'currentBet': currentBet
        }

        //At the end of every round update the ranking
        const rankingUpdateData = {
            'ranking': this.getRanking(roomID)
        }
        this.sendAll(roomID, 'rankingUpdate', rankingUpdateData);

        //Update status
        const statusData = {
            'status': 'showdown',
            'isDraw': room.gameStatus.properties.isDraw,
            'winner': room.gameStatus.properties.winner,
            'winnerCards': room.gameStatus.properties.winnerCards
        }
        this.sendAll(roomID, 'status',statusData);

        //Start new round in 10 sec
        setTimeout(() => {
            this.newRound(roomID);
        }, 10000);
    }
}

exports.rooms = new Rooms();