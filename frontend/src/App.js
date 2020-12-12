import {useState, useEffect} from 'react';
import {socket} from './services/socket';
import Header from './Header';
import Enter from './Enter';
import Game from './Game';
import Footer from './Footer';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false); //To decide if the user is playing or not
  //Game info (roomID and userID)
  const [gameInfo, setGameInfo] = useState({});

  useEffect(() => {  
    socket.on('created', handleRoomCreated);
    socket.on('joined', handleRoomJoined);
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

  return (
    <div className="App">
      <Header />
      {isPlaying ? (
        <Game {...gameInfo} />
      ) : (
        <Enter/>
      )}
      <Footer/>
    </div>
  );
}

export default App;
