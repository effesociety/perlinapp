import {useRef, useState} from 'react';
import {socket} from './services/socket';
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const Enter = () => {
    //Refs for Create Room form
    const usernameCreateForm = useRef(null);
    const betCost = useRef(null);
    const waitingTime = useRef(null);
    //Refs for Join Room form
    const usernameJoinForm = useRef(null);
    const roomID = useRef(null);

    const createRoom = () => {
        const data = {
            'username': usernameCreateForm.current.value,
            'minBet': betCost.current.value,
            'waitingTime': waitingTime.current.value
        }
        socket.emit('create',JSON.stringify(data));
    }

    const joinRoom = () => {
        const data = {
            'username': usernameJoinForm.current.value,
            'roomID': roomID.current.value,
        }
        socket.emit('join', JSON.stringify(data));
    }

    return (
        <Container m={4}>
            <Grid container spacing={4}>
                <Grid item sm={6}>
                    <Card>
                        <CardContent>
                            <form className="create-game-form" noValidate autoComplete="off">
                                <TextField id="create-form-username" label="Username" variant="outlined" inputRef={usernameCreateForm} fullWidth/>
                                <TextField id="create-form-bet-cost" label="Costo puntata" variant="outlined" inputRef={betCost} fullWidth/>
                                <TextField id="create-form-waiting-time" label="Tempo di attesa" variant="outlined" inputRef={waitingTime} fullWidth/>
                                <Button variant="contained" color="primary" fullWidth onClick={createRoom}>
                                    Crea partita
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item sm={6}>
                    <Card>
                        <CardContent>
                            <form className="join-game-form" noValidate autoComplete="off">
                                <TextField id="join-form-username" label="Username" variant="outlined" inputRef={usernameJoinForm} fullWidth/>
                                <TextField id="join-form-room-id" label="ID della partita" variant="outlined" inputRef={roomID} fullWidth/>
                                <Button variant="contained" color="primary" fullWidth onClick={joinRoom}>
                                    Entra in partita
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Enter;