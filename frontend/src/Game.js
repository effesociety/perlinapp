import {Component} from 'react';
import { socket } from "./services/socket";
import { Box, Card, CardContent, Button, Typography} from "@material-ui/core/";
import TimelineIcon from '@material-ui/icons/Timeline';
import MyCards from './MyCards';
import Table from './Table';
import Ranking from './Ranking';
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
            'startBtnsDisabled': false,
            'ranking': [],
            'showRanking': false
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
        this.handleRankingUpdate = this.handleRankingUpdate.bind(this);
        this.renderRanking = this.renderRanking.bind(this);
        this.setRankingBtn = this.setRankingBtn.bind(this);
    }

    componentDidMount(){  
        socket.on('newPositions', this.handleNewPositions);
        socket.on('pocketUpdate', this.handlePocketUpdate);
        socket.on('potValueUpdate', this.handlePotValueUpdate);
        socket.on('tableCards', this.handleTableCards);
        socket.on('cards', this.handleMyCards);
        socket.on('status', this.handleStatus);
        socket.on('turn', this.handleTurn);
        socket.on('rankingUpdate', this.handleRankingUpdate);
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
        console.log("gotPotValueUpdate")
        
        const data = JSON.parse(json);

        console.log(data);

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
                this.handleStatusShowdown(data.isDraw, data.winner, data.winnerCards);
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

    handleStatusShowdown(isDraw, winner, cards){
        let isWinner = false;
        if(!isDraw && winner[0] === this.props.username){
            isWinner = true;
        }

        const nextGameStatusProps = {
            'isDraw': isDraw,
            'isWinner': isWinner,
            'winner': winner,
            'cards': cards
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
    
    handleRankingUpdate(json){
        const data = JSON.parse(json);
        this.setState({
            'ranking': data.ranking
        })
    }

    setRankingBtn(state){
        this.setState({
            'showRanking': state
        })
    }

    renderRanking(){
        if(this.state.showRanking){
            return (
                <Ranking users={this.state.ranking} onClose={() => this.setRankingBtn(false)}/>
            )
        }
        else{
            return (
                <Button 
                startIcon={<TimelineIcon />} 
                variant ="contained" 
                color="primary" 
                className="show-ranking-btn animate__animated animate__slideInUp" 
                onClick={() => this.setRankingBtn(true)}/>
            )
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

                    {this.renderRanking()}

                </Box>

            </Box>
        )
    }
}

export default Game;