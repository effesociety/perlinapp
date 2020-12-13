import {useState, useEffect, useRef} from 'react';
import {socket} from './services/socket';
import CardImages from './CardImages';
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

const MyCards = (props) =>{
    const [cards, setCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const betValue = useRef(null);


    useEffect(() => {  
        setCards(props.cards);

        //To avoid re-selecting cards
        if(props.state === "bet"){
            setSelectedCards([]);
        }

    }, [props]);

    const handleClickCard = (card) => {
        if(props.gameStatus && props.gameStatus === "change" && props.gameStatusProps.numChangeableCards){
            const numChangeableCards = props.gameStatusProps.numChangeableCards;
            const nextSelectedCards = Array.from(selectedCards);
            if(selectedCards.includes(card)){
                const cardIndex = selectedCards.findIndex(c => c === card);
                nextSelectedCards.splice(cardIndex,1);
                setSelectedCards(nextSelectedCards);
            }
            else if(selectedCards.length < numChangeableCards && !selectedCards.includes(card)){
                nextSelectedCards.push(card);
                setSelectedCards(nextSelectedCards);
            }
            else if(selectedCards.length === numChangeableCards && !selectedCards.includes(card)){
                nextSelectedCards.splice(0,1,card);
                setSelectedCards(nextSelectedCards);
            }
        }
    }

    const handleChangeCards = () => {
        if(props.gameStatus && props.gameStatus === "change"){
            const data = {
                'cards': selectedCards
            }
            socket.emit('change', JSON.stringify(data));
        }
    }
    
    const handleBet = (action) => {
        if(props.gameStatus && props.gameStatus === "bet"){
            let data = {
                'action': action,
                'value': -1 //Default value
            }
            if(action === "raise"){
                data.value = betValue.current.value;
            }
            socket.emit('bet', JSON.stringify(data));
        }
    }

    return (
        <Container>
            <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>Le tue carte</Typography>
            <Box className="card-wrapper-box">
                {cards.map(card => {

                    const imgWrapperClassname = selectedCards.includes(card) ? 'card-img-wrapper-selected' : 'card-img-wrapper';
                    
                    return (
                        <Box className="card-box">
                            <Box className={imgWrapperClassname}>
                                <img draggable="false" src={CardImages[card]} className="card-img" onClick={() => handleClickCard(card)}/>
                            </Box>
                        </Box>
                    )
                })}
            </Box>

            <Box className="actions-wrapper-box">
                {props.gameStatus && props.gameStatus === 'bet' && props.gameStatusProps.currentBet > 0 && (
                    <Button variant="contained" color="primary" className="actions-btn" disabled={!props.isMyTurn} onClick={() => handleBet('call')}>Call</Button>
                )}
                {props.gameStatus && props.gameStatus === 'bet' && (
                    <Button variant="contained" color="primary" className="actions-btn" disabled={!props.isMyTurn} onClick={() => handleBet('raise')}>Punta</Button>
                )}
                {props.gameStatus && props.gameStatus === 'bet' && (
                    <Button variant="contained" color="primary" className="actions-btn" disabled={!props.isMyTurn} onClick={() => handleBet('fold')}>Fold</Button>
                )}

                
                {props.gameStatus && props.gameStatus === 'change' && selectedCards.length === 0 && (
                    <Button variant="contained" color="primary" className="actions-btn" disabled={!props.isMyTurn} onClick={handleChangeCards}>Sto Bene</Button>
                )}
                {props.gameStatus && props.gameStatus === 'change' && selectedCards.length !== 0 && (
                    <Button variant="contained" color="primary" className="actions-btn" disabled={!props.isMyTurn} onClick={handleChangeCards}>Cambia</Button>
                )}
            </Box>

            {props.gameStatus && props.gameStatus === 'bet' && (
                <Box className="bet-input-box">
                    <TextField id="bet-value" label="Valore puntata" variant="filled" disabled={!props.isMyTurn} inputRef={betValue} fullWidth/>
                </Box>
            )}
        </Container>
    )
}

export default MyCards;