import {Component} from 'react';
import { socket } from "./services/socket";
import {Container, Box, Card, CardContent, Button, Typography} from "@material-ui/core/";
import MyCards from './MyCards';
import Table from './Table';
import 'animate.css/animate.css'

class Game extends Component{
    constructor(props){
        super(props);
        this.state = {
            'pocket': props.initialPocket,
            'position': props.initialPosition,
            'players': [],
            'potValue': 0,
            'tableCards': [],
            'myCards': [],
            'gameStatus': 'stop',
            'GameStatusProps': {},
            'isMyTurn': false,
            'turnPlayer': "",
            'startBtnsDisabled': false
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
            if(u === this.props.username){
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
            'action': action,
        };
        socket.emit('start', JSON.stringify(data));
        this.setState({
            'startBtnsDisabled': true
        })
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
                this.handleStatusBet(data.currentBet, data.betUser);
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

    handleStatusBet(currentBet, betUser){
        const nextGameStatusProps = {
            'currentBet': currentBet,
            'betUser': betUser
        }
        this.setState({
            'gameStatus': 'bet',
            'gameStatusProps': nextGameStatusProps
        })
    }

    handleStatusShowdown(isDraw, winner){
        let isWinner = false;
        if(!isDraw && winner === this.props.username){
            isWinner = true;
        }

        const nextGameStatusProps = {
            'isDraw': isDraw,
            'isWinner': isWinner,
            'winner': winner
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
            'tableCards': [],
            'startBtnsDisabled': false
        })
    }

    handleTurn(json){
        const data = JSON.parse(json);
        if(data.turn === this.props.username){
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

        if(this.state.gameStatus === "stop"){
            document.body.classList.add("no-scroll")
        }
        else if(this.state.gameStatus !== "stop" && document.body.classList.contains("no-scroll")){
            document.body.classList.remove("no-scroll")
        }

        return (
            <Box>

                {this.state.gameStatus === "stop" && (
                    <Box className="outer-wrapper">
                        <Box className="inner-wrapper">
                            <Card className="inner-wrapper-card animate__animated animate__slideInUp">
                                <CardContent>
                                    <Typography variant="h4" align="center">
                                        Codice Room: <b>{this.props.roomID}</b>
                                    </Typography>
                                </CardContent>
                            </Card>
                            <Box className="flex-break"/>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                className="inner-wrapper-btn animate__animated animate__slideInUp" 
                                disabled={this.state.startBtnsDisabled} 
                                onClick={() => this.handleStart('play')}>
                                    Partecipa
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                className="inner-wrapper-btn animate__animated animate__slideInUp" 
                                disabled={this.state.startBtnsDisabled} 
                                onClick={() => this.handleStart('skip')}>
                                    Skip
                            </Button>
                        </Box>
                    </Box>
                )}

                <Container>
                    <Card>
                        <CardContent>
                            RoomID: {this.props.roomID} <br/>
                            Username: {this.props.username} <br/>
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
                        roomID={this.props.roomID}
                        pocket={this.state.pocket}
                        minBet={this.props.minBet}
                    />
                </Box>
            </Box>



            </Box>
        )
    }
}

export default Game;