import React from 'react';
import { socket } from "./services/socket";
import CardImages from './CardImages';
import {Box, Container, Button, TextField, Typography} from "@material-ui/core/";
import PocketImg from "./images/money-bag.png";
import 'animate.css/animate.css'

class MyCards extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            'cards': [],
            'selectedCards': [],
            'isRaiseAllowed': false,
            'countdownValue': -1,
            'showCountdown': false,
            'countdownInterval': null,
        }
        this.betValue = React.createRef();
        //Function bindings
        this.handleClickCard = this.handleClickCard.bind(this);
        this.handleChangeCards = this.handleChangeCards.bind(this);
        this.handleBet = this.handleBet.bind(this);
        this.handleTextfieldChange = this.handleTextfieldChange.bind(this);
    }

    
    componentDidUpdate(prevProps){
        if(!prevProps.isMyTurn && this.props.isMyTurn){
            this.setState({
                'countdownValue': this.props.remainingTime,
                'showCountdown': true
            })
            const interval = setInterval(() => {
                if(this.state.countdownValue > 0){
                    this.setState({
                        'countdownValue': this.state.countdownValue - 1,
                    });
                }
                else{
                    this.setState({
                        'showCountdown': false
                    });
                }
            }, 1000);
            this.setState({'countdownInterval': interval});
        }

        //Clear countdown interval
        if(prevProps.isMyTurn && !this.props.isMyTurn){
            clearInterval(this.state.countdownInterval);
            this.setState({'countdownInterval': null});
        }
    }
    

    handleClickCard(card){
        if(this.props.gameStatus && this.props.gameStatus === "change" && this.props.gameStatusProps.numChangeableCards && this.props.isMyTurn){
            const numChangeableCards = this.props.gameStatusProps.numChangeableCards;
            const nextSelectedCards = Array.from(this.state.selectedCards);
            if(this.state.selectedCards.includes(card)){
                const cardIndex = this.state.selectedCards.findIndex(c => c === card);
                nextSelectedCards.splice(cardIndex,1);
                this.setState({
                    'selectedCards': nextSelectedCards
                })
            }
            else if(this.state.selectedCards.length < numChangeableCards && !this.state.selectedCards.includes(card)){
                nextSelectedCards.push(card);
                this.setState({
                    'selectedCards': nextSelectedCards
                })
            }
            else if(this.state.selectedCards.length === numChangeableCards && !this.state.selectedCards.includes(card)){
                nextSelectedCards.splice(0,1,card);
                this.setState({
                    'selectedCards': nextSelectedCards
                })
            }
        }
    }

    handleChangeCards(){
        if(this.props.gameStatus && this.props.gameStatus === "change"){
            const data = {
                'cards': this.state.selectedCards
            }
            socket.emit('change', JSON.stringify(data));
        }
    }
    
    handleBet(action){
        if(this.props.gameStatus && this.props.gameStatus === "bet"){
            this.setState({
                'isRaiseAllowed': false
            })
            let data = {
                'action': action,
                'value': -1 //Default value
            }
            if(action === "raise"){
                data.value = this.betValue.current.value;
            }
            socket.emit('bet', JSON.stringify(data));
            document.getElementById('bet-value').value = "";
        }
    }

    handleTextfieldChange(event){
        //If problems use 'event.target.value'
        if(!isNaN(this.betValue.current.value) && parseFloat(this.betValue.current.value) > this.props.gameStatusProps.currentBet &&  parseFloat(this.betValue.current.value) >= this.props.minBet){
            this.setState({
                'isRaiseAllowed': true
            })
        }
        else{
            this.setState({
                'isRaiseAllowed': false
            })
        }
    }

    render(){
        //Fix for selected cards
        const isSelectable = this.props.gameStatus === "change";
        if(!isSelectable && this.state.selectedCards.length > 0){
            this.setState({
                'selectedCards': []
            })
        }
        //Fix for disabling bet button
        if(this.props.gameStatus !== "bet" && this.state.isRaiseAllowed){
            this.setState({
                "isRaiseAllowed": false
            })
        }

        /*
        <Typography variant="h4" className="my-cards-h4" align="center">
            Codice Room: <b>{this.props.roomID}</b>
        </Typography>
        */

        return (
            <Container className="animate__animated animate__slideInUp">


                {this.props.gameStatus && this.props.gameStatus === "showdown" && this.props.gameStatusProps.isDraw && (
                    <Typography variant="h2" align="center" className="my-cards-h2">Pareggio!</Typography>
                )}
                {this.props.gameStatus && this.props.gameStatus === "showdown" && !this.props.gameStatusProps.isDraw && this.props.gameStatusProps.isWinner && (
                    <Typography variant="h2" align="center" className="my-cards-h2">Hai vinto!</Typography>
                )}
                {this.props.gameStatus && this.props.gameStatus === "showdown" && !this.props.gameStatusProps.isDraw && !this.props.gameStatusProps.isWinner && (
                    <Typography variant="h2" align="center" className="my-cards-h2">Hai perso... (vincitore: <b>{this.props.gameStatusProps.winner[0]}</b>)</Typography>
                )}


                {
                    //Show cards of the winner
                }
                {this.props.gameStatus && this.props.gameStatus === "showdown" && !this.props.gameStatusProps.isDraw && !this.props.gameStatusProps.isWinner && (
                    <Box className="card-outer-wrapper-box">
                        <Box className="card-inner-wrapper-box">
                            {this.props.gameStatusProps.cards.map(card => {
                                return (
                                    <Box className="card-box">
                                        <Box className="card-img-wrapper">
                                            <img draggable="false" src={CardImages[card]} className="card-img"/>
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                )}

                {this.props.gameStatus && (this.props.gameStatus === "change" || this.props.gameStatus === "bet") && this.props.isMyTurn && (
                    <Box>
                        {this.state.showCountdown && (
                            <Box>
                                <Typography variant="h2" align="center" className="my-cards-h2">
                                    {this.state.countdownValue}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="h4" className="my-cards-h4" align="center">
                        È il <b>tuo </b>turno
                        </Typography>
                    </Box>

                )}
                {this.props.gameStatus && (this.props.gameStatus === "change" || this.props.gameStatus === "bet") && !this.props.isMyTurn && (
                    <Typography variant="h4" className="my-cards-h4" align="center">
                    È il turno di <b>{this.props.turnPlayer}</b>
                    </Typography>
                )}
    
                {this.props.cards.length === 0 ? (
                    <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>La mano deve ancora iniziare...</Typography>
                ) : (
                    <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>Le tue carte</Typography>
                )}
                <Box className="card-outer-wrapper-box">
                    <Box className="card-inner-wrapper-box">
                        {this.props.cards.map(card => {
        
                            const selectableImg = this.props.gameStatus === "change" ? 'card-img-wrapper-selectable' : 'card-img-wrapper';
                            const imgWrapperClassname = this.state.selectedCards.includes(card) && isSelectable ? 'card-img-wrapper-selected' : selectableImg;
                            
                            return (
                                <Box className="card-box">
                                    <Box className={imgWrapperClassname}>
                                        <img draggable="false" src={CardImages[card]} className="card-img" onClick={() => this.handleClickCard(card)}/>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
    
                <Box className="actions-wrapper-box">
                    {this.props.gameStatus && this.props.gameStatus === 'bet' && this.props.gameStatusProps.currentBet > 0 && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={() => this.handleBet('call')}>Call</Button>
                    )}
                    {this.props.gameStatus && this.props.gameStatus === 'bet' && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn || !this.state.isRaiseAllowed}  onClick={() => this.handleBet('raise')}>Punta</Button>
                    )}
                    {this.props.gameStatus && this.props.gameStatus === 'bet' && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={() => this.handleBet('fold')}>Fold</Button>
                    )}
    
                    
                    {this.props.gameStatus && this.props.gameStatus === 'change' && this.state.selectedCards.length === 0 && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={this.handleChangeCards}>Sto Bene</Button>
                    )}
                    {this.props.gameStatus && this.props.gameStatus === 'change' && this.state.selectedCards.length !== 0 && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={this.handleChangeCards}>Cambia</Button>
                    )}
                </Box>
    
                {this.props.gameStatus && this.props.gameStatus === 'bet' && (
                    <Box className="bet-input-box">
                        <TextField id="bet-value" label="Valore puntata" variant="filled" disabled={!this.props.isMyTurn} inputRef={this.betValue} onChange={this.handleTextfieldChange} fullWidth/>
                    </Box>
                )}


                <Box className="pocket-box">
                    <img draggable="false" src={PocketImg} className="pocket-img"/>
                    <Typography><b>{this.props.pocket}</b>  (Puntata minima: <b>{this.props.minBet}</b>)</Typography>
                </Box>

                {this.props.gameStatus && this.props.gameStatus === "bet" && this.props.gameStatusProps.currentBet > 0 && (
                    <Typography variant="h4" className="my-cards-h4" align="center">
                        Puntata maggiore: {this.props.gameStatusProps.currentBet} (<b>{this.props.gameStatusProps.betUser}</b>)
                    </Typography>
                )}
                
            </Container>
        )
    }
}

export default MyCards;