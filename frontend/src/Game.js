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
    const [gameStatus, setGameStatus] = useState('stop');
    const [gameStatusProps, setGameStatusProps] = useState({});

    useEffect(() => {  
        socket.on('newPositions', handleNewPositions);
        socket.on('pocketUpdate', handlePocketUpdate);
        socket.on('tableCards', handleTableCards);
        socket.on('cards', handleMyCards);
        socket.on('status', handleStatus);
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

    const handlePocketUpdate = (json) => {
        const data = JSON.parse(json);
        setPocket(data.pocket);
    }

    const handleStart = (action) => {
        const data = {
            'action': action
        };
        socket.emit('start', JSON.stringify(data));
    }

    const handleTableCards = (json) => {
        const data = JSON.parse(json);
        const tableCards = data.tableCards;
        setTableCards(tableCards);
    }

    const handleMyCards = (json) => {
        const data = JSON.parse(json);
        const cards = data.cards;
        setMyCards(cards);
    }

    const handleStatus = (json) => {
        const data = JSON.parse(json);
        switch(data.status){
            case 'change':
                handleStatusChange(data.numChangeableCards);
                break;
            case 'bet':
                handleStatusBet();
                break;
        }
    }

    const handleStatusChange = (numChangeableCards) => {
        setGameStatus('change');
        const nextGameStatusProps = {
            'numChangeableCards': numChangeableCards
        }
        setGameStatusProps(nextGameStatusProps);
    }

    const handleStatusBet = () => {
        setGameStatus('bet');
        setGameStatusProps({});
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
                        GameStatus: {gameStatus} <br/>
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
                <MyCards cards={myCards} gameStatus={gameStatus} gameStatusProps={gameStatusProps} />
            </Box>
        </Box>



        </div>
    )
}

export default Game;