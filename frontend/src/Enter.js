import React from 'react';
import { socket } from "./services/socket";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

class Enter extends React.Component{

    constructor(){
        super();
        //Refs for Create Room form
        this.usernameCreateForm = React.createRef();
        this.betCost = React.createRef();
        this.waitingTime = React.createRef();
        //Refs for Join Room form
        this.usernameJoinForm = React.createRef();
        this.roomID = React.createRef();

        this.createRoom = this.createRoom.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
    }

    createRoom(){
        const data = {
            'username': this.usernameCreateForm.current.value,
            'minBet': this.betCost.current.value,
            'waitingTime': this.waitingTime.current.value
        }
        socket.emit('create',JSON.stringify(data));
    }

    joinRoom(){
        const data = {
            'username': this.usernameJoinForm.current.value,
            'roomID': this.roomID.current.value,
        }
        socket.emit('join', JSON.stringify(data));
    }

    render(){
        return (
            <Container m={4}>
                <Grid container spacing={4}>
                    <Grid item sm={6}>
                        <Card>
                            <CardContent>
                                <form className="create-game-form" noValidate autoComplete="off">
                                    <TextField id="create-form-username" label="Username" variant="outlined" inputRef={this.usernameCreateForm} fullWidth/>
                                    <TextField id="create-form-bet-cost" label="Costo puntata" variant="outlined" inputRef={this.betCost} fullWidth/>
                                    <TextField id="create-form-waiting-time" label="Tempo di attesa" variant="outlined" inputRef={this.waitingTime} fullWidth/>
                                    <Button variant="contained" color="primary" fullWidth onClick={this.createRoom}>
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
                                    <TextField id="join-form-username" label="Username" variant="outlined" inputRef={this.usernameJoinForm} fullWidth/>
                                    <TextField id="join-form-room-id" label="ID della partita" variant="outlined" inputRef={this.roomID} fullWidth/>
                                    <Button variant="contained" color="primary" fullWidth onClick={this.joinRoom}>
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
}

export default Enter;