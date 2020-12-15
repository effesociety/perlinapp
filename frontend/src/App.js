import React from 'react';
import { socket } from "./services/socket";
import Header from './Header';
import Enter from './Enter';
import Game from './Game';
import Footer from './Footer';
import CustomSnackbar from './CustomSnackbar';

class App extends React.Component{
    constructor(){
        super();
        this.state = {
            'isPlaying': false,//To decide if the user is playing or not
            'gameInfo': {},  //roomID, username, pocket and position
            'snackBbarProps': {}
        }
        //Function bindings
        this.handleRoomCreated = this.handleRoomCreated.bind(this);
        this.handleRoomJoined = this.handleRoomJoined.bind(this);
        this.handleError = this.handleError.bind(this);
        this.closeSnackbar = this.closeSnackbar.bind(this);
  }

    componentDidMount(){
        socket.on('created', this.handleRoomCreated);
        socket.on('joined', this.handleRoomJoined);
        socket.on('error', this.handleError);
    }


    handleRoomCreated(json){
        const data = JSON.parse(json);
        const nextGameInfo = {
            'roomID': data.roomID,
            'username': data.username,
            'initialPocket': data.pocket,
            'initialPosition': data.position,
            'minBet': data.minBet
        }
        this.setState({
            'gameInfo': nextGameInfo,
            'isPlaying': true
        })
    }

    handleRoomJoined(json){
        const data = JSON.parse(json);
        const nextGameInfo = {
            'roomID': data.roomID,
            'username': data.username,
            'initialPocket': data.pocket,
            'initialPosition': data.position,
            'minBet': data.minBet
        }
        this.setState({
            'gameInfo': nextGameInfo,
            'isPlaying': true
        })
    }

    handleError(json){
        const data = JSON.parse(json);
        const nextSnackbarProps = {
        'open': true,
        'severity': 'error',
        'msg': data.errMsg,
        }
        this.setState({
            'snackbarProps': nextSnackbarProps
        })
    }

    closeSnackbar(){
        const nextSnackbarProps = {
        'open': false,
        'severity': "",
        'msg': "",
        };
        this.setState({
            'snackbarProps': nextSnackbarProps
        })
    }
    
    render(){
        return (
            <div className="App">
              <Header />
              {this.state.isPlaying ? (
                <Game {...this.state.gameInfo} />
              ) : (
                <Enter/>
              )}
              <Footer/>
              <CustomSnackbar {...this.state.snackbarProps} closeSnackbar={this.closeSnackbar}/>
            </div>
          );
    }
}

export default App;
