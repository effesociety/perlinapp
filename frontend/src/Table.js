import {useState, useEffect} from 'react';
import CardImages from './CardImages';
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import TableImg from "./images/tavolo.png";
import 'animate.css/animate.css'
import { Typography } from '@material-ui/core';

const Table = (props) =>{
    const [cards, setCards] = useState([]);
    const [players, setPlayers] = useState({});

    useEffect(() => {  
        setCards(props.cards);
        setPlayers(props.players);
    }, [props]);

    return (
        <Box className="table animate__animated  animate__fadeInUp">

            <Box className="players-wrapper-box">
                {Object.keys(players).map(player => {
                    
                    const position = players[player];
                    const playerClassName = "players-position players-position-" + position.toString();

                    return (
                        <Box className={playerClassName}>
                            <Typography>{player}</Typography>
                        </Box>
                    )
                })}
            </Box>

            <Box className="table-cards-wrapper-box">
                {cards.map(card => {
                    
                    return (
                        <Box className="table-cards-box">
                            <Box className="table-cards-img-wrapper">
                                <img draggable="false" src={CardImages[card]} className="table-cards-img "/>
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            <img draggable="false" src={TableImg} className="table-img" />
        </Box>
    )
}

export default Table;