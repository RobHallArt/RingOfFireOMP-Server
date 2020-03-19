var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(3000);
var io = socket(server);

var userArray =[];

app.use(express.static('../RingOfFireOMP-Client'));
console.log("Listening on 3000");

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log('New Connection ' + socket.id);
    
    
    socket.on('userConfirmed', function(data){
        console.log("NewUserConfirmation");
        userArray.push(data);
        for(var i =0; i<userArray.length;i++){
            console.log(userArray[i].nickname);
        }
        socket.emit('usersUpdate',userArray);
    });

    socket.on('TEST', (data)=>{
        console.log('TEST'+ data);
    });
    
};

