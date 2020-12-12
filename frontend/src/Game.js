import {useEffect, useState} from 'react';
import {socket} from './services/socket';
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';

import MyCards from './MyCards';
import Table from './Table';

const Game = (props) => {
    const {roomID, username} = props;
    const [pocket, setPocket] = useState(props.pocket);
    const [position, setPosition] = useState(props.position);
    const [tableCards, setTableCards] = useState([]);
    const [myCards, setMyCards] = useState([]);

    useEffect(() => {  
        socket.on('newPositions', handleNewPositions);
        socket.on('tableCards', handleTableCards);
        socket.on('cards', handleMyCards);
    });

    const handleNewPositions = (json) => {
        console.log("Got new positions")
        const data = JSON.parse(json);
        Object.keys(data).forEach(u => {
            if(u === username){
                setPosition(data[u]);
            }
        })
    }

    const handleStart = (action) => {
        const data = {
            'action': action
        };
        socket.emit('start', JSON.stringify(data));
    }

    const handleTableCards = (json) => {
        console.log("Got table cards");
        const data = JSON.parse(json);
        const tableCards = data.tableCards;
        setTableCards(tableCards);
    }

    const handleMyCards = (json) => {
        console.log("Got my cards");
        const data = JSON.parse(json);
        const cards = data.cards;
        setMyCards(cards);
    }
      
    return (
        <div>
            <Container>
                <Card>
                    <CardContent>
                        RoomID: {roomID} <br/>
                        Username: {username} <br/>
                        Pocket: {pocket} <br/>
                        Position: {position} <br/>
                        TableCards: {tableCards} <br/>
                        MyCards: {myCards} <br/>
                        <Button variant="contained" color="primary" onClick={() => handleStart('play')}>Partecipa</Button>
                        <Button variant="contained" color="primary" onClick={() => handleStart('skip')}>Skip</Button>
                    </CardContent>
                </Card>
            </Container>

        <Box className="game-container">


            <Box className="table-box-container">
                <Table cards={tableCards} />
            </Box>
            <Box className="cards-box-container">
                <MyCards cards={myCards} />
            </Box>
        </Box>



        </div>
    )
}

export default Game;