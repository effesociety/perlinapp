import React from 'react';
import CardImages from './CardImages';
import { Box, Typography } from '@material-ui/core';
import CoinImg from "./images/coin.png";
import 'animate.css/animate.css'

class Table extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            'playerStatus' : {}
        }
    }

    componentDidMount(){
        let nextPlayerStatus = {}
        for(const player of Object.keys(this.props.players)){
            nextPlayerStatus[player] = 'white'
        }
        this.setState({
            'playerStatus': nextPlayerStatus
        })
    }

    componentDidUpdate(prevProps){
        //Update player status on bet action
        if(prevProps.gameStatusProps !== this.props.gameStatusProps && this.props.gameStatusProps.action){
            const actionUser = this.props.gameStatusProps.actionUser;
            const color = this.props.gameStatusProps.action === "fold" ? "red" : "green";
            let nextPlayerStatus = Object.assign({}, this.state.playerStatus);
            nextPlayerStatus[actionUser] = color;
            this.setState({
                'playerStatus': nextPlayerStatus
            })
        }
        //Reset player status on game status change
        if(prevProps.gameStatus !== this.props.gameStatus){
            let nextPlayerStatus = {};
            for(const player of Object.keys(this.props.players)){
                nextPlayerStatus[player] = 'white'
            }
            this.setState({
                'playerStatus': nextPlayerStatus
            })
        }
    }

    render(){
        return (
            <Box className="table animate__animated  animate__fadeInUp">

                <Box className="players-wrapper-box">
                    {Object.keys(this.props.players).map(player => {
                        
                        const position = this.props.players[player];
                        const colorStatus = this.state.playerStatus[player];
                        const playerClassName = `players-position players-position-${position.toString()} player-status-${colorStatus}`;

                        return (
                            <Box className={playerClassName}>
                                <Typography className="player-name-p">{player.substring(0,2)}</Typography>
                            </Box>
                        )
                    })}
                </Box>

                <Box className="table-cards-outer-wrapper-box">
                    <Box className="table-cards-inner-wrapper-box">


                        {this.props.cards.map(card => {
                            return (
                                <Box className="table-cards-box">
                                    <Box className="table-cards-img-wrapper">
                                        <img draggable="false" src={CardImages[card]} className="table-cards-img "/>
                                    </Box>
                                </Box>
                            )
                        })}

                        <Box className="flex-break"/>
                        
                        <Box className="potvalue-box">
                            <img draggable="false" src={CoinImg} className="potvalue-coin-img"/>
                            <Typography><b>{this.props.potValue}</b></Typography>
                        </Box>

                    </Box>

                </Box>
            </Box>
        )
    }
}

export default Table;