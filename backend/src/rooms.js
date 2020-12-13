const { deck, generateID, shuffleArray } = require("./util");

const DEFAULT_POCKET_VALUE = process.env.DEFAULT_POCKET_VALUE || 1000;

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
        return Object.values(this.data[roomID].users).filter(user => user.active).length;
    }

    getStatusPlayers(roomID, status){
        return Object.values(this.data[roomID].users).filter(user => user.active && user.status === status).length;
    }

    getOrderedPlayers(roomID, status){
        let data = [];
        const room = this.getRoom(roomID);
        const numPlayers = this.getStatusPlayers(roomID, status);
        for(let i = 0; i < numPlayers; i++){
            Object.values(room.users).forEach(user => {
                if(user.position === i+1){
                    data.push(user);
                }
            })
        }
        return data;
    }

    setPlayingThisRound(roomID){
        const room = this.getRoom(roomID);
        let users = this.getOrderedPlayers(roomID, 'play');
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
            roomID = generateID();
            duplicate = true;
            if(!this.data.hasOwnProperty(roomID)){
                duplicate = false;
                //Default values for new room
                this.data[roomID] = {
                    'gameProperties': {
                        'minBet': minBet,
                        'waitingTime': waitingTime
                    },
                    'gameStatus': {
                        'entranceFee': minBet,
                        'currentStatus': 'stop',
                        'deck': null,
                        'potValue': 0,
                        'playingThisRound': [],
                        'properties': {
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
        const position = this.getActivePlayers(roomID)+1;
        let newUser = {
            'username': username,
            'active': true,
            'status': 'wait',
            'pocket': DEFAULT_POCKET_VALUE,
            'position': position,
            'betValue': null,
            'currentCards': [],
            'ws': ws
        }

        let duplicate;
        //Avoid players with the same username
        if(Object.values(this.data[roomID].users).some(user => user.username == username)){
            let i = 2;
            do{
                duplicate = true;
                const newUsername = username + i.toString();
                if(!Object.values(this.data[roomID].users).some(user => user.username == newUsername)){
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
            if(!this.data[roomID].users.hasOwnProperty(userID)){
                duplicate = false;
                this.data[roomID].users[userID] = newUser;
            }
        }   
        while(duplicate);
        const res = {
            'username': newUser.username,
            'roomID': roomID,
            'position': position,
            'pocket': DEFAULT_POCKET_VALUE
        }
        //Add info to socket for quicker disconnect management
        ws.join(roomID);
		ws.roomID = roomID;
		ws.userID = userID;
        return res;
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
        if(this.data[roomID] && this.data[roomID].users[userID]){
            const userToRemove = this.getUser(roomID,userID);
            userToRemove.active = false;
            //Check if the room is empty (everyone is inactive)
            if(this.getActivePlayers(roomID) === 0){
                this.closeRoom(roomID);
                return false;
            }
            else{
                //Change position for everyone with a higher number in the room
                const currentUserPosition = userToRemove.position;
                Object.values(this.data[roomID].users).forEach(u => {
                    if(u.active && u.position > currentUserPosition){
                        u.position -= 1;
                    }
                })
                return true;
            }
        }
    }

    closeRoom(roomID){
        if(this.data[roomID]){
            delete this.data[roomID];
        }
    }

    newRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = "stop";
        room.gameStatus.playingThisRound = [];
        if(room.gameStatus.potValue !== 0){
            room.gameStatus.entranceFee = room.gameStatus.properties.currentBet;
        }
        //TO-DO: Who partecipated before doesn't have to pay
        room.gameStatus.properties = {};
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

    setShowdownProps(room, cardsOnTheFloor){
        const scoreOnTheFloor = this.calculateScore(cardsOnTheFloor);      
        let topScorers = [];
        let topCards = [];
        let isPerlina = false;
        let isTris = false;
        let winnerDifference = 31; //default value for diff

        const playingThisRound = room.gameStatus.playingThisRound;

        for(const user of Object.values(room.users)){
            if(playingThisRound.includes(user.username)){
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
        const winner = topScorers.length > 1 ? "" : topScorers[0]
        let winnerCards = [];
        if(!isDraw){
            const potValue = room.gameStatus.potValue;
            const winnerPlayer =Object.values(room.users).find(u => u.username === winner)
            winnerCards = winnerPlayer.currentCards;
            winnerPlayer.pocket += parseFloat(potValue);
            room.gameStatus.potValue = 0;
        }
        const currentBet = room.gameStatus.properties.currentBet;

        room.gameStatus.properties = {
            'score':  scoreOnTheFloor,
            'isDraw': isDraw,
            'winner': winner,
            'winnerCards': winnerCards,
            'currentBet': currentBet
        }
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
        orderedPlayers.forEach(player => {
            //Send cards and...
            player.currentCards = [deck[i], deck[i+1], deck[i+2]];
            i += 3;
            let cardsData = {
                'cards': player.currentCards
            }
            player.ws.emit('cards',JSON.stringify(cardsData));
            //...take money
            //TO-DO: Handle draw in previous match
            player.pocket -= parseFloat(room.gameProperties.entranceFee);
            room.gameStatus.potValue += parseFloat(room.gameProperties.entranceFee);
            const pocketData = {
                'pocket': player.pocket
            }
            player.ws.emit('pocketUpdate', JSON.stringify(pocketData));
            const potValueData = {
                'potValue': room.gameStatus.potValue
            }
            player.ws.emit('potValueUpdate', JSON.stringify(potValueData));
        })        
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
    }

    changeCards(roomID, userID, cards){
        const room = this.getRoom(roomID);
        room.gameStatus.properties.currentUserPosition += 1;
        const user = this.getUser(roomID, userID);
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
        user.ws.emit('potValueUpdate', JSON.stringify(potValueData));
        this.setUserStatus(roomID, userID, 'change');
    }

    startBetRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'bet';
        room.gameStatus.properties = {
            'currentUserPosition': 0,
            'currentBet': 0,
        }
    }

    handleBet(roomID, userID, data){
        const room = this.getRoom(roomID);
        const numPlayers = room.gameStatus.playingThisRound.length;
        room.gameStatus.properties.currentUserPosition += 1;
        if(room.gameStatus.properties.currentUserPosition === numPlayers){
            room.gameStatus.properties.currentUserPosition = 0;
        }

        const user = this.getUser(roomID, userID);
        const action = data.action;
        if(action === "raise" && data.value && data.value > room.gameStatus.properties.currentBet){
            room.gameStatus.properties.currentBet = parseFloat(data.value);
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
            user.ws.emit('potValueUpdate', JSON.stringify(potValueData));
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
            user.ws.emit('potValueUpdate', JSON.stringify(potValueData));
        }

        this.setUserStatus(roomID, userID, action);
    }

    startShowdown(roomID){
        const room = this.getRoom(roomID);
        const cardsOnTheFloor = [deck[0], deck[1], deck[2]];
        room.gameStatus.currentStatus = 'showdown';
        this.setShowdownProps(room, cardsOnTheFloor);
    }
}

exports.rooms = new Rooms();