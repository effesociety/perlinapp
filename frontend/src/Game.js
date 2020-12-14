import {Component} from 'react';
import { socket } from "./services/socket";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';

import MyCards from './MyCards';
import Table from './Table';


class Game extends Component{
    constructor(props){
        super(props);
        this.state = {
            'roomID': props.roomID,
            'username': props.username,
            'pocket': props.pocket,
            'position': props.position,
            'players': [],
            'potValue': 0,
            'tableCards': [],
            'myCards': [],
            'gameStatus': 'stop',
            'GameStatusProps': {},
            'isMyTurn': false,
            'turnPlayer': ""
        }
        this.handleNewPositions = this.handleNewPositions.bind(this);
        this.handlePocketUpdate = this.handlePocketUpdate.bind(this);
        this.handlePotValueUpdate = this.handlePotValueUpdate.bind(this);
        this.handleTableCards = this.handleTableCards.bind(this);
        this.handleMyCards = this.handleMyCards.bind(this);
        this.handleStatus = this.handleStatus.bind(this);
        this.handleTurn = this.handleTurn.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleStatusBet = this.handleStatusBet.bind(this);
        this.handleStatusShowdown = this.handleStatusShowdown.bind(this);
        this.handleStatusStop = this.handleStatusStop.bind(this);
    }

    componentDidMount(){  
        socket.on('newPositions', this.handleNewPositions);
        socket.on('pocketUpdate', this.handlePocketUpdate);
        socket.on('potValueUpdate', this.handlePotValueUpdate);
        socket.on('tableCards', this.handleTableCards);
        socket.on('cards', this.handleMyCards);
        socket.on('status', this.handleStatus);
        socket.on('turn', this.handleTurn);
    }

    handleNewPositions(json){
        const data = JSON.parse(json);
        //Set players for visualization
        this.setState({
            'players': data
        })
        //TO-DO: Verify if this is still needed
        Object.keys(data).forEach(u => {
            if(u === this.state.username){
                this.setState({
                    'position': data[u]
                })
            }
        })
    }

    handlePocketUpdate(json){
        const data = JSON.parse(json);
        this.setState({
            'pocket': data.pocket
        })
    }

    handlePotValueUpdate(json){
        const data = JSON.parse(json);
        this.setState({
            'potValue': data.potValue
        })
    }

    handleStart(action){
        const data = {
            'action': action
        };
        socket.emit('start', JSON.stringify(data));
    }

    handleTableCards(json){
        const data = JSON.parse(json);
        this.setState({
            'tableCards': data.tableCards
        })
    }

    handleMyCards(json){
        const data = JSON.parse(json);
        this.setState({
            'myCards': data.cards
        })
    }

    handleStatus(json){
        const data = JSON.parse(json);
        switch(data.status){
            case 'change':
                this.handleStatusChange(data.numChangeableCards);
                break;
            case 'bet':
                this.handleStatusBet(data.currentBet);
                break;
            case 'showdown':
                this.handleStatusShowdown(data.isDraw, data.winner);
                break;
            case 'stop':
                this.handleStatusStop();
                break;
        }
    }

    handleStatusChange(numChangeableCards){
        const nextGameStatusProps = {
            'numChangeableCards': numChangeableCards
        }
        this.setState({
            'gameStatus': 'change',
            'gameStatusProps': nextGameStatusProps
        })
    }

    handleStatusBet(currentBet){
        const nextGameStatusProps = {
            'currentBet': currentBet
        }
        this.setState({
            'gameStatus': 'bet',
            'gameStatusProps': nextGameStatusProps
        })
    }

    handleStatusShowdown(isDraw, winner){
        let isWinner = false;
        if(!isDraw && winner === this.state.username){
            isWinner = true;
        }

        const nextGameStatusProps = {
            'isDraw': isDraw,
            'isWinner': isWinner
        }
        //Well a lot needs to be done here!
        this.setState({
            'gameStatus': 'showdown',
            'gameStatusProps': nextGameStatusProps
        })
    }

    handleStatusStop(){
        this.setState({
            'gameStatus': 'stop',
            'gameStatusProps': {},
            'myCards': [],
            'tableCards': []
        })
    }

    handleTurn(json){
        const data = JSON.parse(json);
        if(data.turn === this.state.username){
            this.setState({
                'isMyTurn': true,
                'turnPlayer': data.turn
            })
        }
        else{
            this.setState({
                'isMyTurn': false,
                'turnPlayer': data.turn
            })
        }
    }
    
    render(){
        return (
            <div>
                <Container>
                    <Card>
                        <CardContent>
                            RoomID: {this.state.roomID} <br/>
                            Username: {this.state.username} <br/>
                            Pocket: {this.state.pocket} <br/>
                            PotValue: {this.state.potValue} <br/>
                            Position: {this.state.position} <br/>
                            TableCards: {this.state.tableCards} <br/>
                            MyCards: {this.state.myCards} <br/>
                            GameStatus: {this.state.gameStatus} <br/>
                            IsMyTurn: {this.state.isMyTurn ? ("True") : ("False")} <br/>
                            <Button variant="contained" color="primary" onClick={() => this.handleStart('play')}>Partecipa</Button>
                            <Button variant="contained" color="primary" onClick={() => this.handleStart('skip')}>Skip</Button>
                        </CardContent>
                    </Card>
                </Container>

            <Box className="game-container">


                <Box className="table-box-container">
                    <Table 
                        cards={this.state.tableCards} 
                        players={this.state.players} 
                        potValue={this.state.potValue}
                    />
                </Box>
                <Box className="cards-box-container">
                    <MyCards 
                        cards={this.state.myCards} 
                        gameStatus={this.state.gameStatus} 
                        gameStatusProps={this.state.gameStatusProps} 
                        isMyTurn={this.state.isMyTurn} 
                        turnPlayer={this.state.turnPlayer}
                        roomID={this.state.roomID}
                    />
                </Box>
            </Box>



            </div>
        )
    }
}

export default Game;