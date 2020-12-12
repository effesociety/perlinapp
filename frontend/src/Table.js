import {useState, useEffect} from 'react';
import CardImages from './CardImages';
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import TableImg from "./images/tavolo.png";

const Table = (props) =>{
    const [cards, setCards] = useState([]);

    useEffect(() => {  
        setCards(props.cards);
    }, [props]);

    return (
        <Box className="table">
            <Box className="table-cards-wrapper-box">
                {cards.map(card => {
                    
                    return (
                        <Box className="table-cards-box">
                            <Box className="table-cards-img-wrapper">
                                <img src={CardImages[card]} className="table-cards-img"/>
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            <img src={TableImg} className="table-img" />
        </Box>
    )
}

export default Table;