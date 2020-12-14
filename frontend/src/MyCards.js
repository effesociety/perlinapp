import React from 'react';
import { socket } from "./services/socket";
import CardImages from './CardImages';
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import 'animate.css/animate.css'

class MyCards extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            'cards': [],
            'selectedCards': []
        }
        this.betValue = React.createRef();
        //Function bindings
        this.handleClickCard = this.handleClickCard.bind(this);
        this.handleChangeCards = this.handleChangeCards.bind(this);
        this.handleBet = this.handleBet.bind(this);
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
            let data = {
                'action': action,
                'value': -1 //Default value
            }
            if(action === "raise"){
                data.value = this.betValue.current.value;
            }
            socket.emit('bet', JSON.stringify(data));
        }
    }

    render(){
        const isSelectable = this.props.gameStatus === "change" ? true : false;
        if(!isSelectable && this.state.selectedCards.length > 0){
            this.setState({
                'selectedCards': []
            })
        }

        return (
            <Container className="animate__animated animate__slideInUp">
    
                {this.props.gameStatus && this.props.gameStatus === "showdown" && this.props.gameStatusProps.isDraw && (
                    <Typography variant="h1" align="center" className="my-cards-h1">Pareggio!</Typography>
                )}
                
                {this.props.gameStatus && this.props.gameStatus === "showdown" && !this.props.gameStatusProps.isDraw && this.props.gameStatusProps.isWinner && (
                    <Typography variant="h1" align="center" className="my-cards-h1">Hai vinto!</Typography>
                )}
    
                {this.props.gameStatus && this.props.gameStatus === "showdown" && !this.props.gameStatusProps.isDraw && !this.props.gameStatusProps.isWinner && (
                    <Typography variant="h1" align="center" className="my-cards-h1">Hai perso...</Typography>
                )}
    
    
                {this.props.cards.length === 0 ? (
                    <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>La mano deve ancora iniziare...</Typography>
                ) : (
                    <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>Le tue carte</Typography>
                )}
                <Box className="card-wrapper-box">
                    {this.props.cards.map(card => {
    
                        const imgWrapperClassname = this.state.selectedCards.includes(card) && isSelectable ? 'card-img-wrapper-selected' : 'card-img-wrapper';
                        
                        return (
                            <Box className="card-box">
                                <Box className={imgWrapperClassname}>
                                    <img draggable="false" src={CardImages[card]} className="card-img" onClick={() => this.handleClickCard(card)}/>
                                </Box>
                            </Box>
                        )
                    })}
                </Box>
    
                <Box className="actions-wrapper-box">
                    {this.props.gameStatus && this.props.gameStatus === 'bet' && this.props.gameStatusProps.currentBet > 0 && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={() => this.handleBet('call')}>Call</Button>
                    )}
                    {this.props.gameStatus && this.props.gameStatus === 'bet' && (
                        <Button variant="contained" color="primary" className="actions-btn" disabled={!this.props.isMyTurn} onClick={() => this.handleBet('raise')}>Punta</Button>
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
                        <TextField id="bet-value" label="Valore puntata" variant="filled" disabled={!this.props.isMyTurn} inputRef={this.betValue} fullWidth/>
                    </Box>
                )}
            </Container>
        )
    }
}

export default MyCards;