var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(3000);
var io = socket(server);

var os = require( 'os' );

var networkInterfaces = os.networkInterfaces( );



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
        //console.log("userUpdate");
        //search through things and check who updated and update them.
        for(var i = 0; i<userArray.length; i++){
            //console.log(data.ID,userArray[i].ID);
            if(data.ID == userArray[i].ID){
                console.log(data.nickname," Updated");
                userArray[i] = data;
            }
        }
        //for(var i = 0; i<userArray.length;i++){
        //    console.log(userArray[i].nickname);
        //}
        io.sockets.emit('usersUpdate',userArray);

    });

    socket.on('TEST', (data)=>{
        console.log('TEST'+ data);
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

