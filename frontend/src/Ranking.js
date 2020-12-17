import { Box, Typography } from '@material-ui/core';

const Ranking = (props) => {
    return (
        <Box className="ranking-wrapper">
            <Typography variant="h3">
                Classifica utenti
            </Typography>
            {Object.values(props.user).map(u => {
                const playerClassname = u.active ? "ranking-player ranking-active-player" : "ranking-player ranking-inactive-player";
                return (
                    <Box className={playerClassname}>
                        {u.username}: {u.pocket}
                    </Box>
                )
            })}
        </Box>
    )
}

export default Ranking;