const Card = require("card.js");

var suits = ["spades", "diamonds", "clubs", "hearts"];
var values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// class Card {
//     constructor(suit, value) {
//         this.suit = suit;
//         this.value = value;
//     }
// }

let card = new Card("hearts", "Q");

class Deck {
    constructor() {
        this.deck = [];
    }

    createDeck(suits, values) {
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push(new Card(suit, value));
            }
        }
        return this.deck.length;
    }
    shuffle() {
        let counter = this.deck.length, temp, i;
        while(counter) {
            i = Math.floor(Math.random() * counter--);
            temp = this.deck[counter];
            this.deck[counter] = this.deck[i];
            this.deck[i] = temp;
        }
        return this.deck;
    }
    
    deal() {
        let hand = [];
        while(hand.length < 2) {
            hand.push(this.deck.pop());
        }
        return hand;
    }
}

let deck = new Deck();
// deck.createDeck(suits, values);
console.log(deck.createDeck(suits, values));

module.exports = Deck;