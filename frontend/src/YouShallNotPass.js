import { Box, Typography } from '@material-ui/core';
import Header from './Header';

const YouShallNotPass = () => {
    return (
        <Box className="you-shall-not-pass">
            <Typography variant="h2" className="you-shall-not-pass-h2">
                Ci dispiace! <br/><br/>
                Quest'app non è disponibile per dispositivi mobile
            </Typography>
        </Box>

    )
}

export default YouShallNotPass;