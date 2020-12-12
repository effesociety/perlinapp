import {useState, useEffect} from 'react';
import {socket} from './services/socket';
import Header from './Header';
import Enter from './Enter';
import Game from './Game';
import Footer from './Footer';
import CustomSnackbar from './CustomSnackbar';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false); //To decide if the user is playing or not
  //Game info (roomID and userID)
  const [gameInfo, setGameInfo] = useState({});
  const [snackbarProps, setSnackbarProps] = useState({});

  useEffect(() => {  
    socket.on('created', handleRoomCreated);
    socket.on('joined', handleRoomJoined);
    socket.on('error', handleError);
  });

  const handleRoomCreated = (json) => {
    const data = JSON.parse(json);
    const nextGameInfo = {
      'roomID': data.roomID,
      'username': data.username,
      'pocket': data.pocket,
      'position': data.position
    }
    setGameInfo(nextGameInfo);
    setIsPlaying(true);
  }

  const handleRoomJoined = (json) => {
    const data = JSON.parse(json);
    const nextGameInfo = {
      'roomID': data.roomID,
      'username': data.username,
      'pocket': data.pocket,
      'position': data.position
    }
    setGameInfo(nextGameInfo);
    setIsPlaying(true);
  }

  const handleError = (json) => {
    const data = JSON.parse(json);
    const nextSnackbarProps = {
      'open': true,
      'severity': 'error',
      'msg': data.errMsg,
    }
    setSnackbarProps(nextSnackbarProps);
  }

  const closeSnackbar = () => {
    const nextSnackbarProps = {
      'open': false,
      'severity': "",
      'msg': "",
    };
    setSnackbarProps(nextSnackbarProps);
  }

  return (
    <div className="App">
      <Header />
      {isPlaying ? (
        <Game {...gameInfo} />
      ) : (
        <Enter/>
      )}
      <Footer/>
      <CustomSnackbar {...snackbarProps} closeSnackbar={closeSnackbar}/>
    </div>
  );
}

export default App;
