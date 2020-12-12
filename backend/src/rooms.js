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

    getNewPositionsData(roomID){
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

    getOrderedPlayers(roomID){
        let data = [];
        const room = this.getRoom(roomID);
        const numPlayers = this.getStatusPlayers(roomID, 'play');
        for(let i = 0; i < numPlayers; i++){
            Object.values(room.users).forEach(user => {
                if(user.position === i+1){
                    data.push(user);
                }
            })
        }
        return data;
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
                        'currentStatus': 'stop',
                        'deck': null,
                        'potValue': 0,
                        'playingThisRound': 0,
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

    roundSetup(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'setup';
        room.gameStatus.deck = shuffleArray(deck);
        //Dealing cards
        room.gameStatus.playingThisRound = this.getStatusPlayers(roomID, 'play');
        const orderedPlayers = this.getOrderedPlayers(roomID);
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
            player.pocket -= room.gameProperties.minBet;
            room.gameStatus.potValue += parseFloat(room.gameProperties.minBet);
            const pocketData = {
                'pocket': player.pocket
            }
            player.ws.emit('pocketUpdate', JSON.stringify(pocketData));
        })
    }

    startChangeRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'change';
        //Getting num players to calculate how many cards are changeable
        const numPlayers = room.gameStatus.playingThisRound
        const numChangeableCards = numPlayers <= 7 ? 2 : 1;
        room.gameStatus.properties = {
            'currentUserPosition': 1, 
            'numChangeableCards': numChangeableCards,
            'numCardsChanged': 0
        }
    }

    changeCards(roomID, userID, cards){
        const room = this.getRoom(roomID);
        const user = this.getUser(roomID, userID);
        const playingThisRound = room.gameStatus.playingThisRound;

        for(const card of cards){
            const deckPointer = 3 + (3*playingThisRound) + room.gameStatus.properties.numCardsChanged;
            //Check if the user has the card
            if(user.currentCards.includes(card)){
                const cardToAdd = room.gameStatus.deck[deckPointer];
                const cardIndex = user.currentCards.findIndex(c => c === card);
                user.currentCards.splice(cardIndex,1,cardToAdd);
                room.gameStatus.properties.numCardsChanged += 1;
                //Take points for changing card
                user.pocket -= room.gameProperties.minBet;
                room.gameStatus.potValue += parseFloat(room.gameProperties.minBet);
            }
        }
        let cardsData = {
            'cards': user.currentCards
        }
        user.ws.emit('cards',JSON.stringify(cardsData));
    }

    startBetRound(roomID){
        const room = this.getRoom(roomID);
        room.gameStatus.currentStatus = 'bet';
        room.gameStatus.properties = {
            'currentUserPosition': 1,
            'currentBet': 0,
        }
    }

}

exports.rooms = new Rooms();