// TODO : Setup putting in an IP address and having the IP shit happen before the start screen and have the positive
// connection signal trigger the start screen.
//fix bug where the text appears before start screen has finished.
// fix placement so you are always at the bottom.

// start button in middle of screen when pressed sends to server to update that this user is ready.
// TOGGLEABLE BUTTON THAT TOGGLES READINESS ON SERVER AND THEREFORE READINESS DISPLAYED IN PHASE.
// Possible future use of readiness to turn away users who try to connect late.
// when all users ready server broadcasts game has begun to switch mode and then prompts the first player to press a button

// Turn taking Mechanism
// (DONE)all ready broadcast to all to switch to game
// (DONE)server updates client 0 as active and sends updated client list to all clients
// (DONE)server notifies client 0 with 'yourTurn' and sends card ID that 'will be picked'
// (DONE)client 0 in response enables pick a card button (futureproofing)
// (DONE)client 0 when button pressed hides button
// (DONE)client 0 runs function which handles what should happen for that card.
// (HALFDONE)client 0 replies to server with any input that was created in the course of that.
// (DONE)server on recieving this increments currentTurn and starts over.

// send your turn to 


// other to do
    // (DONE BUT ITS RED NOW)put a #4cffff circle around the player at the top (current user)
    // (DONE)STOP server going when only one person is in and they click ready.
    // ()Examine the need for cardHandler.
    // (DONE)don't beginClick on people who are already mates.
    // (DONE)server side make a function to convert ID to username and use it to make console logs better.
    // ()Graceful Ending.
    // ()Disconnecting Players also erase any relevant outstanding drinks in drinkerArray.
    // ()stop user connecting once in game mode.
    // (DONE)Add more explanatory titles such as picking someone to drink or picking someone to mate.
    // ()on phone version we don't actually need to show everyone, just that person who is currently active.
    // ()where everyone should be displayed, we could use a scrollable list.

var localplayer = {
    nickname : "",
    imagePath : "",
    gender : "",
    isThumbMaster : false,
    isHeavenMaster : false,
    isActive : false,
    isReady: false,
    mates : [],
    ID : "",
    lastCard:{},
    cardRevealed: false
}

var localPositionInArray = 0;

var userArray = [];
var userSpriteArray = [];

var programState = "Connect";

/*

Connect - Set up text in to enter IP
Log-in - Put in nickname and Gender
Lobby - Players accumulate in lobby
Game - Responding to server kicking off actions on individual players.

*/

const socket = io.connect('https://ring-of-fire-omp.herokuapp.com:3000');

socket.on('connect', () => {

    console.log("\n*** CONNECTED TO SOCKET *** ", socket.id);

    localplayer.ID = socket.id;

    socket.on('userLost',(id)=>{
        console.log('disconnectEvent');
        for(var i = 0; i<userSpriteArray.length; i++){
            if(userSpriteArray[i].userObject.ID == id){
                console.log('UserLost', userSpriteArray[i].userObject.nickname);
                //remove this object from array.
                userSpriteArray[i].disable();
                userSpriteArray.splice(i,1);
                updateUserRingPositions();
            }
        }
    });

    socket.on('usersUpdate',(data)=>{
        updateUsersFromArray(data);   
    });

    socket.on('yourTurn', turnHandler);

    socket.on('programStateUpdate',(data)=>{
        
        programStateChange(data);

    });

    socket.on('drink',(becauseOfMate)=>{
        drinkAnim.go();
    })
    
});

var app = new PIXI.Application({ width: 1280, height: 720, antialias: true, backgroundColor: 0xffffff});
document.body.appendChild(app.view);

const filter = new PIXI.filters.ColorMatrixFilter();

initStarburstBG();
createStartScreen();

var cardButton = {
    card: {},

    x:0,
    y:0,

    background: new PIXI.Sprite.from("assets/1x/playingCard.png"),

    heartsTexture: new PIXI.Texture.from("assets/1x/heart.png"),
    diamondsTexture: new PIXI.Texture.from("assets/1x/diamond.png"),
    spadesTexture: new PIXI.Texture.from("assets/1x/spade.png"),
    clubsTexture: new PIXI.Texture.from("assets/1x/club.png"),

    instructionText: new PIXI.Text(),
    textTop: new PIXI.Text(),
    textBottom: new PIXI.Text(),
    textStyle: new PIXI.TextStyle({
            fontFamily: 'amboy-black, sans-serif',
            fontSize: 36,
            fontStyle: 'normal',
            fontWeight: '400',
            fill: ['#ffffff'], // gradient
            stroke: '#e32417',
            strokeThickness: 5,
            dropShadow: false,
            dropShadowColor: '#000000',
            wordWrap: true,
            wordWrapWidth: 440,
            align: 'center',
        }),

    init: function(){

        this.textTop.style = this.textStyle;
        this.textBottom.style = this.textStyle;
        this.instructionText.style = this.textStyle;

        this.suitTop = new PIXI.Sprite.from(this.heartsTexture);
        this.suitBottom = new PIXI.Sprite.from(this.heartsTexture);

        this.x = app.screen.width/2;
        this.y = app.screen.height/2;
        
        this.background.anchor.set(0.5);
        this.instructionText.anchor.set(0.5);
        this.textTop.anchor.set(0.5);
        this.textBottom.anchor.set(0.5);
        this.suitTop.anchor.set(0.5);
        this.suitBottom.anchor.set(0.5);

        this.background.scale.set(0.15);
        this.instructionText.scale.set(0.6);
        this.suitTop.scale.set(0.15);
        this.suitBottom.scale.set(0.15);
        this.textTop.scale.set(0.75);
        this.textBottom.scale.set(0.75);

        this.instructionText.angle = 45;

        this.background.x = this.x;
        this.background.y = this.y;
        this.instructionText.x = this.x;
        this.instructionText.y = this.y;
        this.textTop.x = this.x - 70;
        this.textTop.y = this.y - 110;
        this.textBottom.x = this.x + 70;
        this.textBottom.y = this.y + 110;
        this.suitTop.x = this.x - 70;
        this.suitTop.y = this.y - 70;
        this.suitBottom.x = this.x + 70;
        this.suitBottom.y = this.y + 70;

        this.background.interactive = true;
        this.background.buttonMode = true;

        this.background.on('pointerdown',(event)=>{
            this.disable();
            cardHandler.execute();
        });        

    },

    setCard: function(cardin){
        this.card = cardin;
        console.log(cardin);
        if(this.card.suit == 'diamonds'){
            this.suitTop.texture = this.diamondsTexture;
            this.suitBottom.texture = this.diamondsTexture;
            this.textStyle.stroke = '#e32417';
        }
        if(this.card.suit == 'hearts'){
            this.suitTop.texture = this.heartsTexture;
            this.suitBottom.texture = this.heartsTexture;
            this.textStyle.stroke = '#e32417';
        }
        if(this.card.suit == 'clubs'){
            this.suitTop.texture = this.clubsTexture;
            this.suitBottom.texture = this.clubsTexture;
            this.textStyle.stroke = '#000000';
        }
        if(this.card.suit == 'spades'){
            this.suitTop.texture = this.spadesTexture;
            this.suitBottom.texture = this.spadesTexture;
            this.textStyle.stroke = '#000000';
        }

        switch(this.card.rank){
            case 'A':
                this.instructionText.text = 'Waterfall...';
                break;

            case '2':
                this.instructionText.text = 'Pick Someone\nTo Drink!';
                break;

            case '3':
                this.instructionText.text = 'Me!';
                break;

            case '4':
                this.instructionText.text = 'Whores!';
                break;

            case '5':
                this.instructionText.text = 'Thumb\nMaster!';
                break;

            case '6':
                this.instructionText.text = 'Dicks!';
                break;

            case '7':
                this.instructionText.text = 'Heaven!';
                break;

            case '8':
                this.instructionText.text = 'Pick A Mate!';
                break;

            case '9':
                this.instructionText.text = 'Rhyme!';
                break;

            case '10':
                this.instructionText.text = 'Categories!';
                break;

            case 'J':
                this.instructionText.text = 'Make A Rule!';
                break;

            case 'Q':
                this.instructionText.text = 'Questions!';
                break;

            case 'K':
                this.instructionText.text = 'Something\ninstead of\nPour...';
                break;
        }

        this.textTop.text = this.card.rank;
        this.textBottom.text = this.card.rank;

    },

    enable: function(){
        app.stage.addChild(this.background);
        app.stage.addChild(this.instructionText);
        app.stage.addChild(this.textTop);
        app.stage.addChild(this.textBottom);
        app.stage.addChild(this.suitTop);
        app.stage.addChild(this.suitBottom);
    },

    disable: function(){
        app.stage.removeChild(this.background);
        app.stage.removeChild(this.instructionText);
        app.stage.removeChild(this.textTop);
        app.stage.removeChild(this.textBottom);
        app.stage.removeChild(this.suitTop);
        app.stage.removeChild(this.suitBottom);
    }
}
cardButton.init();

var drinkAnim = {
    drinkAnimSprite: new PIXI.Sprite.from("assets/1x/drink.png"),
    count: -Math.PI/2,
    countb: -Math.PI/2,
    running: false,
    init: function(){
        this.drinkAnimSprite.x = app.screen.width/2,
        this.drinkAnimSprite.y = app.screen.height/2,
        this.drinkAnimSprite.anchor.set(0.5);
        app.stage.filters = [filter];

        app.ticker.add((delta)=>{
            if(this.running){
                this.count+= 0.022;
            }
            if((Math.sin(this.count%(2*Math.PI))+1)/2<0.8){
                this.countb = this.count;
            }
            this.drinkAnimSprite.scale.x = 0.7 + ((Math.sin(this.countb%(2*Math.PI))+1)/8);
            this.drinkAnimSprite.scale.y = 0.7 + ((Math.sin(this.countb%(2*Math.PI))+1)/8);
            this.drinkAnimSprite.alpha = (Math.sin(this.countb%(2*Math.PI))+1)/1.5;

            if(this.count >= Math.PI*1.5){
                this.running = false;
                this.count = -Math.PI/2;
                app.stage.removeChild(this.drinkAnimSprite);
                drinkFinished();
            }

            const { matrix } = filter;

            matrix[4] = (Math.sin(this.count%(2*Math.PI))+1)/2;//NICE
        });

    },
    go: function(){
        app.stage.addChild(this.drinkAnimSprite);
        this.running = true;
    }
}
drinkAnim.init();

var readyButton = {
    readyButtonTextureDark: new PIXI.Texture.from("assets/1x/readyDark.png"),
    readyButtonTextureDarkHover: new PIXI.Texture.from("assets/1x/readyDarkHover.png"),
    readyButtonTextureLight: new PIXI.Texture.from("assets/1x/readyLight.png"),
    readyButtonTextureLightHover: new PIXI.Texture.from("assets/1x/readyLightHover.png"),
    //readyButtonSprite: new PIXI.Sprite.from(this.readyButtonTextureDark),
    active:false,
    init: function(){

        this.readyButtonSprite = new PIXI.Sprite.from(this.readyButtonTextureDark);

        this.readyButtonSprite.x = app.screen.width/2,
        this.readyButtonSprite.y = app.screen.height/2,
        this.readyButtonSprite.anchor.set(0.5);
        this.readyButtonSprite.scale.x = 0.35;
        this.readyButtonSprite.scale.y = 0.35;

        this.readyButtonSprite.interactive = true;
        this.readyButtonSprite.buttonMode = true;

        this.readyButtonSprite.on('pointerdown',(event)=>{
            this.active = !this.active;
            localplayer.isReady = this.active;
            socket.emit('userUpdate',localplayer);
        });

        this.readyButtonSprite.on('pointerover',(event)=>{
            if(this.active){
                this.readyButtonSprite.texture = this.readyButtonTextureLightHover;
            } else {
                this.readyButtonSprite.texture = this.readyButtonTextureDarkHover;
            }
        });

        this.readyButtonSprite.on('pointerout',(event)=>{
            if(this.active){
                this.readyButtonSprite.texture = this.readyButtonTextureLight;
            } else {
                this.readyButtonSprite.texture = this.readyButtonTextureDark;
            }
        });
        //return this;
    },
    enable: function(){
        app.stage.addChild(this.readyButtonSprite);
    },
    disable: function(){
        app.stage.removeChild(this.readyButtonSprite);
    }
}
readyButton.init();

var pickCardButton = {
    texture: new PIXI.Texture.from("assets/1x/pickCard.png"),
    textureHover: new PIXI.Texture.from("assets/1x/pickCardHover.png"),
    init: function(){

        this.sprite = new PIXI.Sprite.from(this.texture);

        this.sprite.x = app.screen.width/2,
        this.sprite.y = app.screen.height/2,
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.25);
        

        this.sprite.interactive = true;
        this.sprite.buttonMode = true;

        this.sprite.on('pointerdown',(event)=>{
            socket.emit('revealCard','NODATA');
            pickCardButton.disable();
            cardButton.enable();
        });

        this.sprite.on('pointerover',(event)=>{
            this.sprite.texture = this.textureHover;
        });

        this.sprite.on('pointerout',(event)=>{
            this.sprite.texture = this.texture;
        });
        //return this;
    },
    enable: function(){
        app.stage.addChild(this.sprite);
    },
    disable: function(){
        app.stage.removeChild(this.sprite);
    }
}
pickCardButton.init();

var cardHandler = {
    cardID: "",
    init: function(cardin){
        this.cardID = cardin;
    },
    execute: function(){

        console.log("Card Was :", this.cardID);
        //big if or switch thing here which determines what is gonna happen.
        //socket.emit('turnFinished', 'NoDataYet'); // move this somewhere where it gets called when whatever is over.
        switch(this.cardID.rank){
            case '2':
                pickPlayer();
                break;

            case '8':
                pickNewMate();
                break;

            default:
                turnOver('NODATA');
        }

    }
}

var localUserHighlight = {
    graphic: new PIXI.Graphics(),
    init: function(){
        this.graphic.lineStyle(4, 0xE32417, 1);
        this.graphic.drawCircle(app.screen.width/2, app.screen.height/6.5, 100);
    },
    enable: function(){
        app.stage.addChild(this.graphic);
    },
    disable: function(){
        app.stage.removeChild(this.graphic);
    }
}
localUserHighlight.init();

function drinkFinished(){
    socket.emit('drinkFinished', localplayer.ID);
}

function pickPlayer(){
    // make all players clickable
    for(var i = 0; i<userSpriteArray.length; i++){
        console.log(userSpriteArray[i].userObject.ID, localplayer.ID);
        if(userSpriteArray[i].userObject.ID != localplayer.ID){
            userSpriteArray[i].beginClickable();
        }
    }
}

function pickNewMate(){

    // A bunch of this code is for the random case that one person gets more 8 cards than there are other players.
    // make all players clickable
    var localMates = [];
    for(var i = 0; i<userSpriteArray.length; i++){
        if(userSpriteArray[i].userObject.ID == localplayer.ID){
            localMates = userSpriteArray[i].userObject.mates;
        }
    }
    console.log('localMates', localMates);
    var somethingClickable = false;
    for(var i = 0; i<userSpriteArray.length; i++){
        if(userSpriteArray[i].userObject.ID != localplayer.ID){
            var inLocalMates = false;
            for(var j = 0; j<localMates.length; j++){
                if(userSpriteArray[i].userObject.ID == localMates[j]){
                    inLocalMates = true;
                }
            }
            if(!inLocalMates || localMates.length == 0){
                userSpriteArray[i].beginClickable();
                somethingClickable = true;
            }
        }
    }
    if(!somethingClickable){
        console.log('No More To Click');
        turnOver('NONELEFT');
    }
}

function playerPicked(playerID){

    turnOver(playerID);
    for(var i = 0; i<userSpriteArray.length; i++){
        console.log(userSpriteArray[i].userObject.ID, localplayer.ID);
        if(userSpriteArray[i].userObject.ID != localplayer.ID){
            userSpriteArray[i].endClickable();
        }
    }
    console.log("playerPicked", playerID);
}

function turnOver(data){
    socket.emit('turnFinished', data);
    console.log('turnOver', data);
}

function turnHandler(cardID){

    // maybe blur everything behind button (write a function for this elsewhere) // doing this later
    // draw Your turn somewhere
    cardHandler.init(cardID);
    cardButton.setCard(cardID);
    pickCardButton.enable();// enable pick card button
    //          eventually :...  pick a card displays card that server sent and triggers a specific card handler that returns what we need to send back to the server.
    // when clicked do nothing for now except reply to server that everything went okay
    // when clicked also set everything back to normal.
}

function programStateChange(newState){
   
    if(programState == 'Lobby' && newState == 'Game'){
        readyButton.disable();
    }

    programState = newState;
}

function initStarburstBG(){
    const starburstBGTexture = PIXI.Texture.from('assets/3x/starburst@3x.png');

    const starburstBG = new PIXI.Sprite(starburstBGTexture);

    starburstBG.anchor.set(0.5);
    starburstBG.x = app.screen.width/2;
    starburstBG.y = app.screen.height;
    app.stage.addChild(starburstBG);

    app.ticker.add((delta) => {
        starburstBG.rotation += 0.0015 * delta;
    });
}

function createUserSprite(datain){
    var spriteCollectionObject = {
        userObject: {},
        x: 0,
        y: 0,
        nicknameSprite: new PIXI.Text(),
        nicknameStyle: new PIXI.TextStyle({
            fontFamily: 'amboy-black, sans-serif',
            fontSize: 36,
            fontStyle: 'normal',
            fontWeight: '400',
            fill: ['#ffffff','#5c5c5c'], // gradient
            stroke: '#e32417',
            strokeThickness: 5,
            dropShadow: false,
            dropShadowColor: '#000000',
            wordWrap: true,
            wordWrapWidth: 440,
        }),

        iconText: new PIXI.Text(),
        iconTextStyle: new PIXI.TextStyle({
            fontFamily: 'amboy-black, sans-serif',
            fontSize: 36,
            fontStyle: 'normal',
            fontWeight: '400',
            fill: ['#ffffff'], // gradient
            stroke: '#e32417',
            strokeThickness: 5,
            dropShadow: false,
            dropShadowColor: '#000000',
            wordWrap: true,
            wordWrapWidth: 440,
        }),

        thumbMasterSprite: new PIXI.Sprite.from("assets/1x/thumb.png"),
        heavenMasterSprite: new PIXI.Sprite.from("assets/1x/heaven.png"),

        heartsTexture: new PIXI.Texture.from("assets/1x/heart.png"),
        diamondsTexture: new PIXI.Texture.from("assets/1x/diamond.png"),
        spadesTexture: new PIXI.Texture.from("assets/1x/spade.png"),
        clubsTexture: new PIXI.Texture.from("assets/1x/club.png"),

        init: function(datain){
            
            this.userObject = datain;

            this.nicknameSprite.style = this.nicknameStyle;
            this.nicknameSprite.text = this.userObject.nickname;

            this.nicknameSprite.anchor.set(0.5);
            if(!this.userObject.isReady){
                this.nicknameSprite.tint = 0x454545;
            }

            this.thumbMasterSprite.anchor.set(0.5);
            this.heavenMasterSprite.anchor.set(0.5);
            this.thumbMasterSprite.scale.set(0.25);
            this.heavenMasterSprite.scale.set(0.25);
            this.thumbMasterSprite.tint = 0x454545;
            this.heavenMasterSprite.tint = 0x454545;

            this.iconText.style = this.iconTextStyle;

            this.iconSuit = new PIXI.Sprite.from(this.heartsTexture);

            this.x = app.screen.width/2;
            this.y = app.screen.height/2;
        
            this.iconText.anchor.set(0.5);
            this.iconSuit.anchor.set(0.5);
            this.iconSuit.scale.set(0.2);


            // TO ADD HERE LastCard will be fed in at update... if Active display the card rank in between the heaven nd thumbmaster bits.


            // ONLY IF PICKING OTHERS SET OTHERS TO TRUE.
            //this.nicknameSprite.interactive = true;
            //this.nicknameSprite.buttonMode = true;
            
            this.nicknameSprite.on('pointerdown', (data)=>{
                this.nicknameClicked();
            });
            
            this.nicknameSprite.on('pointerover', function(){
                if(this.interactive){
                    this.tint = 0xFFFFFF;
                }
            });

            this.nicknameSprite.on('pointerout', function(){
                if(this.interactive){
                    this.tint = 0x454545;
                }
            });
                // check if the local user is supposed to be picking
                //and if they are change some colours so its obvious they can click.  

            //this.nicknameSprite.on('pointerout', function(){
                // check if the local user is supposed to be picking
                //and if they are change some colours so its obvious they can click.
            //});
            // Set everything up in the first place.
            //nicknameSprite

            
                                                                                
        },

        nicknameClicked: function() {
            playerPicked(this.userObject.ID); // TO FIX... THIS IS OUT OF SCOPE DON'T KNOW WHAT TO DO.
            console.log('nicknameClicked', this.userObject.nickname);
        },

        update: function(datain){
            //take Data that came in and find the one that matches this one and update the stuff. Change the colour of the person when its their turn.
            //in certain situations switch on hilighting CLICKABILITY! when mousing over people and other times not.
            for(var i = 0; i<datain.length; i++){
                if(datain[i].ID == this.userObject.ID){
                    //console.log('isthiseverrrunnig');
                    this.userObject.isThumbMaster = datain[i].isThumbMaster;
                    this.userObject.isHeavenMaster = datain[i].isHeavenMaster;
                    this.userObject.isActive = datain[i].isActive;
                    this.userObject.isReady = datain[i].isReady;
                    this.userObject.mates = datain[i].mates;
                    this.userObject.lastCard = datain[i].lastCard;
                    this.userObject.cardRevealed = datain[i].cardRevealed;
                    
                    if(programState == 'Lobby'){
                        if(this.userObject.isReady){
                            this.nicknameSprite.tint = 0xFFFFFF;
                        } else {
                            this.nicknameSprite.tint = 0x454545;
                        }
                    }

                    if(programState == 'Game'){
                        if(!this.userObject.cardRevealed){
                            app.stage.removeChild(this.iconText);
                            app.stage.removeChild(this.iconSuit);
                        }
                        if(this.userObject.isActive){
                            this.nicknameSprite.tint = 0xE32417;
                            if(this.userObject.cardRevealed){
                                app.stage.addChild(this.iconText);
                                app.stage.addChild(this.iconSuit);
                            }
                        } else {
                            this.nicknameSprite.tint = 0xFFFFFF;
                        }

                        if(this.userObject.isThumbMaster){
                            this.thumbMasterSprite.tint = 0xFFFFFF;
                        } else {
                            this.thumbMasterSprite.tint = 0x454545;
                        }

                        if(this.userObject.isHeavenMaster){
                            this.heavenMasterSprite.tint = 0xFFFFFF;
                        } else {
                            this.heavenMasterSprite.tint = 0x454545;
                        }
                    }

                    if(this.userObject.lastCard.suit == 'diamonds'){
                        this.iconSuit.texture = this.diamondsTexture;
                        this.iconTextStyle.stroke = '#e32417';
                    }
                    if(this.userObject.lastCard.suit == 'hearts'){
                        this.iconSuit.texture = this.heartsTexture;
                        this.iconTextStyle.stroke = '#e32417';
                    }
                    if(this.userObject.lastCard.suit == 'clubs'){
                        this.iconSuit.texture = this.clubsTexture;
                        this.iconTextStyle.stroke = '#000000';
                    }
                    if(this.userObject.lastCard.suit == 'spades'){
                        this.iconSuit.texture = this.spadesTexture;
                        this.iconTextStyle.stroke = '#000000';
                    }

                    this.iconText.text = this.userObject.lastCard.rank;

                    return true;
                }
            }
            
            console.log('failed to find a match for ', this.userObject.nickname);
            return false;
            
        },
        intupdate: function(){
            
            //take Data that came in and find the one that matches this one and update the stuff. Change the colour of the person when its their turn.
            //in certain situations switch on hilighting when mousing over people and other times not.
            this.nicknameSprite.x = this.x;
            this.nicknameSprite.y = this.y;
            this.thumbMasterSprite.x = this.x - 50;
            this.thumbMasterSprite.y = this.y - 50;
            this.heavenMasterSprite.x = this.x + 50;
            this.heavenMasterSprite.y = this.y - 50;
            this.iconText.x = this.x;
            this.iconText.y = this.y - 50;
            this.iconSuit.x = this.x;
            this.iconSuit.y = this.y + 50;
            
        },
        setPos: function(xin,yin){
            this.x = xin;
            this.y = yin;
            this.intupdate();
        },
        enable: function(){
            //Add children Here
            app.stage.addChild(this.thumbMasterSprite);
            app.stage.addChild(this.heavenMasterSprite);
            app.stage.addChild(this.nicknameSprite);
        },
        disable: function(){
            //remove children Here
            app.stage.removeChild(this.nicknameSprite);
            app.stage.removeChild(this.thumbMasterSprite);
            app.stage.removeChild(this.heavenMasterSprite);
        },
        setTint: function(tintValue){
            this.nicknameSprite.tint = tintValue;
        },
        beginClickable: function(callback){
            // set all to dark with set tint
            // turn on interactivity so hovering makes stuff bright
            // possibly modify the hover behavior to also scale up
            // when clicked : call callback passing the socket ID from userObject.
            this.nicknameSprite.tint = 0x454545;
            this.nicknameSprite.interactive = true;
            this.nicknameSprite.buttonMode = true;


        },
        endClickable: function(){
            // turn off interactivity
            this.nicknameSprite.tint = 0xFFFFFF;
            this.nicknameSprite.interactive = false;
            this.nicknameSprite.buttonMode = false;
        }
    }
    spriteCollectionObject.init(datain);
    
    return spriteCollectionObject;
    //Right this thing is gonna return an object with a bunch of sprites in it and functions to set position and state Like your turn and Thumb Master etc based on getting an update from the server. Maybe I could just give it everything and it decides what it needs.
}

function createStartScreen(){
    const playButtonTextureStandard = PIXI.Texture.from('assets/1x/playStandard.png');
    const playButtonTextureHover = PIXI.Texture.from('assets/1x/playBright.png');
    const maleButtonTextureDark = PIXI.Texture.from('assets/1x/maleDark.png');
    const maleButtonTextureStandard = PIXI.Texture.from('assets/1x/maleStandard.png');
    const maleButtonTextureBright = PIXI.Texture.from('assets/1x/maleBright.png');
    const maleButtonTextureHover = PIXI.Texture.from('assets/1x/maleHover.png');
    const femaleButtonTextureDark = PIXI.Texture.from('assets/1x/femaleDark.png');
    const femaleButtonTextureStandard = PIXI.Texture.from('assets/1x/femaleStandard.png');
    const femaleButtonTextureBright = PIXI.Texture.from('assets/1x/femaleBright.png');
    const femaleButtonTextureHover = PIXI.Texture.from('assets/1x/femaleHover.png');
    const headlineBGTexture = PIXI.Texture.from('assets/1x/Title.png');



    const headlineBG = new PIXI.Sprite(headlineBGTexture);
    headlineBG.anchor.set(0.5);
    headlineBG.x = app.screen.width/2;
    headlineBG.y = 170;
    app.stage.addChild(headlineBG);


    var nicknameInput = new PIXI.TextInput({
    input: {
        fontSize: '36px',
        padding: '12px',
        width: '500px',
        color: '#26272E'
    },
    box: {
        default: {fill: 0xE8E9F3, rounded: 12, stroke: {color: 0xCBCEE0, width: 3}},
        focused: {fill: 0xE1E3EE, rounded: 12, stroke: {color: 0xABAFC6, width: 3}},
        disabled: {fill: 0xDBDBDB, rounded: 12}
    }
    });
    //nicknameInput.anchor.set(0.5);
    nicknameInput.x = (app.screen.width/2)-250;
    nicknameInput.y = 300;
    nicknameInput.placeholder = 'Nickname';
    app.stage.addChild(nicknameInput);
    nicknameInput.focus();


    nicknameInput.on('input', text => {
        //console.log('input:', text);
        localplayer.nickname = text;
    });

    const playButton = new PIXI.Sprite(playButtonTextureStandard);
    const maleButton = new PIXI.Sprite(maleButtonTextureStandard);
    const femaleButton = new PIXI.Sprite(femaleButtonTextureStandard);

    playButton.interactive = true;
    playButton.buttonMode = true;
    maleButton.interactive = true;
    maleButton.buttonMode = true;
    femaleButton.interactive = true;
    femaleButton.buttonMode = true;

    playButton.anchor.set(0.5);
    playButton.x = app.screen.width/2;
    playButton.y = 600;
    maleButton.anchor.set(0.5);
    maleButton.x = (app.screen.width/3);
    maleButton.y = (app.screen.height/3)*2;
    femaleButton.anchor.set(0.5);
    femaleButton.x = (app.screen.width/3)*2;
    femaleButton.y = (app.screen.height/3)*2;


    playButton.on('pointerover', function(){
        this.texture = playButtonTextureHover;
    });

    playButton.on('pointerout', function(){
        this.texture = playButtonTextureStandard;
    });

    maleButton.on('pointerdown', function(){
        this.texture = maleButtonTextureStandard;
        femaleButton.texture = femaleButtonTextureDark;
        localplayer.gender = 'MALE';
    });

    femaleButton.on('pointerdown', function(){
        this.texture = femaleButtonTextureStandard;
        maleButton.texture = maleButtonTextureDark;
        localplayer.gender = 'FEMALE';
    });

    maleButton.on('pointerover', function(){
        if(localplayer.gender == 'FEMALE'){
            this.texture = maleButtonTextureHover;
        } else {
            this.texture = maleButtonTextureBright;
        }
    });

    maleButton.on('pointerout', function(){
        if(localplayer.gender == 'FEMALE'){
            this.texture = maleButtonTextureDark;
        } else {
            this.texture = maleButtonTextureStandard;
        }
    });

    femaleButton.on('pointerover', function(){
        if(localplayer.gender == 'MALE'){
            this.texture = femaleButtonTextureHover;
        } else {
            this.texture = femaleButtonTextureBright;
        }
    });

    femaleButton.on('pointerout', function(){
        if(localplayer.gender == 'MALE'){
            this.texture = femaleButtonTextureDark;
        } else {
            this.texture = femaleButtonTextureStandard;
        }
    });

    playButton.on('pointerdown', function(){
        if(localplayer.nickname != "" && localplayer.gender != ""){
            console.log("PLAY");
            window.document.title = 'Ring Of Fire - ' + localplayer.nickname;
            app.stage.removeChild(playButton);
            app.stage.removeChild(maleButton);
            app.stage.removeChild(femaleButton);
            app.stage.removeChild(nicknameInput);
            app.stage.removeChild(headlineBG);
            socket.emit('userConfirmed',localplayer);
            programState = 'Lobby';
            for(var i = 0; i<userSpriteArray.length; i++){
                userSpriteArray[i].enable();
            }
            readyButton.enable();
            localUserHighlight.enable();
        }
    });

    app.stage.addChild(playButton);
    app.stage.addChild(maleButton);
    app.stage.addChild(femaleButton);

    playButton.scale.set(0.3);
    maleButton.scale.set(0.3);
    femaleButton.scale.set(0.3);
}

function updateUserRingPositions(){
    for(var i = localPositionInArray; i<userSpriteArray.length+localPositionInArray;i++){
        userSpriteArray[i%userSpriteArray.length].setPos(   placePointsX(app.screen.width/2, app.screen.height/2, app.screen.height/3, userSpriteArray.length, i-localPositionInArray),
                                                            placePointsY(app.screen.width/2, app.screen.height/2, app.screen.height/3, userSpriteArray.length, i-localPositionInArray));
        if(programState == 'Lobby'){
            userSpriteArray[i%userSpriteArray.length].enable();
        }
        //console.log(i,i%userSpriteArray.length,i-localPositionInArray);
    }
}

function updateUsersFromArray(data){
    for(var i = 0; i<userArray.length; i++){
        //userSpriteArray[i].disable();
    }
    userArray = data;
    if(userSpriteArray.length == 0){
        for(var i = 0; i<userArray.length; i++){
            userSpriteArray.push(createUserSprite(userArray[i]));
            //console.log("new",userArray[i].nickname);
        }
    } else if (userSpriteArray.length == userArray.length) {
        for(var i = 0; i<userSpriteArray.length; i++){
            if(userSpriteArray[i].update(userArray)){
                //console.log('updated ', userSpriteArray[i].userObject.nickname, ' and there were no new players.');
            }
        }
    } else if(userSpriteArray.length+1 == userArray.length){
        for(var i = 0; i<userSpriteArray.length; i++){
            if(userSpriteArray[i].update(userArray)){
                //console.log('updated ', userSpriteArray[i].userObject.nickname, ' and there was one new player');
            }
        }
        userSpriteArray.push(createUserSprite(userArray[userArray.length-1]));
        //console.log("All updated and ",userArray[i].nickname, " Added");
    }
    for(var i = 0; i<userSpriteArray.length; i++){
        if(userSpriteArray[i].userObject.ID == localplayer.ID){
            localPositionInArray = i;
            //console.log('set local position in array to ', localPositionInArray);
        }
    }
    updateUserRingPositions();
}

function findPointOnCircle(originX, originY , radius, angleRadians) {
        var newX = radius * Math.cos(angleRadians) + originX;
        var newY = radius * Math.sin(angleRadians) + originY;
        return {"x" : newX, "y" : newY};
}

function placePointsX(originX, originY, radius, totalPoints, currentPoint){

    var eachAngle = 6.28/totalPoints;
    var currentPos = currentPoint*eachAngle;
    var points = findPointOnCircle(originX, originY, radius*1.6, currentPos-(Math.PI*0.5));

    return points.x;
}

function placePointsY(originX, originY, radius, totalPoints, currentPoint){
    var eachAngle = 6.28/totalPoints;
    var currentPos = currentPoint*eachAngle;


    var points = findPointOnCircle(originX, originY, radius, currentPos-(Math.PI*0.5));
    return points.y;
}