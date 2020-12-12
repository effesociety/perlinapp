import {useState, useEffect} from 'react';
import CardImages from './CardImages';
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Typography from '@material-ui/core/Typography';

const MyCards = (props) =>{
    const [cards, setCards] = useState([]);

    useEffect(() => {  
        setCards(props.cards);
    }, [props]);

    return (
        <Container>
            <Typography variant="h2" align="center" className="my-cards-h2" gutterBottom>Le tue carte</Typography>
            <Box className="card-wrapper-box">
                {cards.map(card => {
                    
                    return (
                        <Box className="card-box">
                            <Box className="card-img-wrapper">
                                <img src={CardImages[card]} className="card-img"/>
                            </Box>
                        </Box>
                    )
                })}
            </Box>

            <Box className="actions-wrapper-box">
                <Button variant="contained" color="primary" className="actions-btn">Call</Button>
                <Button variant="contained" color="primary" className="actions-btn">Punta</Button>
                <Button variant="contained" color="primary" className="actions-btn">Fold</Button>
                <Button variant="contained" color="primary" className="actions-btn">Cambia</Button>
            </Box>
        </Container>
    )
}

export default MyCards;