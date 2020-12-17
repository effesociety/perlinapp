import { Box, Typography } from '@material-ui/core';

const YouShallNotPass = (props) => {
    return (
        <Box className="you-shall-not-pass">
            <Typography variant="h2" className="you-shall-not-pass-h2">
                Ci dispiace! <br/><br/>
                Quest'app non è disponibile per questo dispositivo <br/>
                (Se sei da computer prova impostare a impostare il browser a schermo intero)
            </Typography>
        </Box>

    )
}

export default YouShallNotPass;