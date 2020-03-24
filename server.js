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

app.use(express.static('../RingOfFireOMP-Client'));
console.log("Listening on 3000");
for(var i = 0; i<networkInterfaces.en1.length;i++){
    console.log( networkInterfaces.en1[i].address );
}

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

    socket.on('TEST', (data)=>{
        console.log('TEST'+ data);
    });

    socket.on('turnFinished', (data)=>{
        userArray[previousTurn].isActive = false;
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
    });
    
};

function nextTurn(){
    for(var i = 0; i<userArray.length;i++){
        userArray[i].isReady = false;           // not sure if necessary just yet.
    }
    userArray[currentTurn].isActive = true;
    io.sockets.emit('usersUpdate',userArray);
    io.to(`${userArray[currentTurn].ID}`).emit('yourTurn',userArray[currentTurn].nickname);
    previousTurn = currentTurn;
    currentTurn = (currentTurn+1)%userArray.length;

}

