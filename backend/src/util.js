const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const createDeck = () => {
    const letters = ['B', 'C', 'D', 'S']; //Bastoni, Coppe, Denari, Spade
    let deck = [];
    letters.forEach(letter => {
        for(let i = 1; i <= 10; i++){
            deck.push(letter + i.toString());
        }
    })
    return deck;
}

const generateID = () => {
    return Math.random().toString(36).substring(7);
}

exports.deck = createDeck();
exports.shuffleArray = shuffleArray;
exports.generateID = generateID;