var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(3000);
var io = socket(server);

var os = require( 'os' );

var networkInterfaces = os.networkInterfaces( );

var currentTurn = 0;
var previousTurn = 0;

var programState = 'Lobby';

var userArray =[];

var cardDeck = {
    cards: [],
    resetDeck: function() {
        var suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        var ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        for (var i = 0; i < suits.length; i++) {
            for (var j = 0; j < ranks.length; j++) {
                this.cards.push(this.cardConstructor(suits[i], ranks[j], values[j]));
            }
        }
    },

    shuffleDeck: function() {
       var location1, location2, tmp;
       for (var i = 0; i < 1000; i++) {
           location1 = Math.floor((Math.random() * this.cards.length));
           location2 = Math.floor((Math.random() * this.cards.length));
           tmp = this.cards[location1];
           this.cards[location1] = this.cards[location2];
           this.cards[location2] = tmp;
        }
    },

    logCards: function(){
        for(var i = 0; i<this.cards.length; i++){
            console.log(this.cards[i].suit,this.cards[i].rank);
        }
    },

    cardConstructor: function(suitin,rankin,valuein){
        var card = {
            suit: suitin,
            rank: rankin,
            value: valuein
        }

        return card;

    },

    pickAndRemoveCard: function(){
        var cardToReturn = this.cards[this.cards.length-1];
        this.cards.splice(this.cards.length-1,1);
        return cardToReturn;
    }
}

app.use(express.static('../RingOfFireOMP-Client'));
console.log("Listening on 3000");
for(var i = 0; i<networkInterfaces.en1.length;i++){
    console.log( networkInterfaces.en1[i].address );
}

cardDeck.resetDeck();
cardDeck.shuffleDeck();

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log('New Connection ' + socket.id);
    
    
    socket.on('userConfirmed', function(data){
        console.log("NewUserConfirmation");
        userArray.push(data);
        for(var i = 0; i<userArray.length;i++){
            console.log(userArray[i].nickname);
        }
        io.sockets.emit('usersUpdate',userArray);

    });

    socket.on('userUpdate', function(data){
        for(var i = 0; i<userArray.length; i++){
            if(data.ID == userArray[i].ID){
                userArray[i] = data;
            }
        }
        
        io.sockets.emit('usersUpdate',userArray);

        var allReady = true;
        for(var i = 0; i<userArray.length;i++){
            if(allReady){
                allReady = userArray[i].isReady;
            }
        }
        console.log("Are We Ready? : ", allReady);
        if(allReady){
            io.sockets.emit('programStateUpdate', 'Game'); console.log("Going to game Mode");
            nextTurn();
            // at some point actually change programMode to game and do 
        }
    });

    socket.on('revealCard', (data)=>{
        console.log('cardUnveilded');
        userArray[previousTurn].cardRevealed = true;
        io.sockets.emit('usersUpdate',userArray);

    });

    socket.on('turnFinished', (data)=>{
        userArray[previousTurn].isActive = false;
        userArray[previousTurn].cardRevealed = false;
        io.sockets.emit('usersUpdate',userArray);
        nextTurn();
    });

    socket.on('disconnect',(reason)=>{
        console.log('DISCONNECT',socket.id);
        for(var i = 0; i<userArray.length; i++){
            if(userArray[i].ID == socket.id){
                console.log('userLost', userArray[i].nickname);
                io.sockets.emit('userLost', socket.id);
                userArray.splice(i,1);
            }
        }
        if(userArray.length == 0){
            programState = 'Lobby';
            console.log('Everybody Disconnected : Resetting');
            currentTurn = 0;
            previousTurn = 0;
            cardDeck.resetDeck();
            cardDeck.shuffleDeck();
        }
    });
    
};

function nextTurn(){
    for(var i = 0; i<userArray.length;i++){
        userArray[i].isReady = false;           // not sure if necessary just yet.
    }
    userArray[currentTurn].isActive = true;
    userArray[currentTurn].lastCard = cardDeck.pickAndRemoveCard();
    io.sockets.emit('usersUpdate',userArray);
    io.to(`${userArray[currentTurn].ID}`).emit('yourTurn',userArray[currentTurn].lastCard);
    previousTurn = currentTurn;
    currentTurn = (currentTurn+1)%userArray.length;

}



