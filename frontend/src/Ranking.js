import { Box, Typography, Card, CardContent, Button } from '@material-ui/core';
import 'animate.css/animate.css'
import CloseIcon from '@material-ui/icons/Close';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const Ranking = (props) => {

    const handleCloseBtn = () => {
        props.onClose();
    }

    const renderRankInfo = () => {
        if(props.users.length > 0){
            console.log(props)

            const ranking = Object.values(props.users).map(u => {
                const statusIcon = u.pocket >= 0 ? (<KeyboardArrowUpIcon className="ranking-status-green"/>) : (<KeyboardArrowDownIcon className="ranking-status-red"/>)
                const playerClassname = u.active ? "ranking-player ranking-active-player" : "ranking-player ranking-inactive-player";
                return (
                    <Card className="ranking-card">
                        <CardContent className="ranking-card-content">
                            {statusIcon}
                            <Typography className={playerClassname}>
                                 <b>{u.username}</b>: {u.pocket.toString()}
                            </Typography>
                        </CardContent>
                    </Card>

                )
            })
            return (
                <Box>
                    <Typography variant="h6" className="ranking-h6">
                        I punteggi degli utenti vengono aggiornati <b>solamente</b> al termine di ogni giro.
                    </Typography>
                    {ranking}
                </Box>
            )
        }
        else{
            return (
                <Typography variant="h4" className="ranking-h4">
                    Nessuna info giocatore, attendi il termine della prima mano!
                </Typography>
            )
        }
    }

    return (
        <Box className="ranking-wrapper animate__animated animate__slideInRight">
            <Button startIcon={<CloseIcon />} onClick={handleCloseBtn} className="close-ranking-btn"/>
            <Typography variant="h3" className="ranking-h3">
                Punteggi utenti
            </Typography>
            {renderRankInfo()}
        </Box>
    )
}

export default Ranking;