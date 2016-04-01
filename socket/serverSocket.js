var currentUser=0
var currentTurnPlayer=0
var players=[]
var ready=0
const stopWatch = require('timer-stopwatch')
const timer=getTimer()
const maxPlayer=2
var doOneTime=2
var boxPressed=0
var initialized=0
//global var destory everything we all know that right :
Array.prototype.shuffle = function () {
  var input = this;
  for (var i = input.length - 1; i > 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1));
    var itemAtIndex = input[randomIndex];
    input[randomIndex] = input[i];
    input[i] = itemAtIndex;
  }
  return input;
}



// the whole game will run on this file because i'm so lazy to structure the codes
function Player(socket) {
  this.name=null
  this.socket=socket
  this.onTurn=false
  this.ready=false
  this.score=0
}
Player.prototype.start=function () {
  this.onTurn=true
  this.socket.emit('active',true)
}
Player.prototype.stop=function () {
  this.onTurn=false
  this.socket.emit('active',false)
}
var bombs=createBombs()
function getRandomBombSecret(coordinate){
  return bombs.indexOf(coordinate)==-1
}

function createBombs() {
  var bombs=[]
  for(var i=0;i<6;i++){
    for(var j=0;j<6;j++){
      bombs.push(i+'-'+j)
    }
  }
  bombs=bombs.shuffle().slice(0,12) // due to laziness shuffle all possible and slice out 11 bombs
  return bombs

}

function socketHandler(io){
  io.on('connection', function (socket) {
    players.push(new Player(socket))
    console.log('user connected');

    currentUser++
    console.log('currentUser: ',currentUser)

    // global socket emitter and on
    socket.on('endTurn',function () {
      changeTurn()
    })

    socket.on('updateMineBox', function (data) {
      io.emit('updateMineBox',data)
      boxPressed++
      if(boxPressed==36){
        var scoreArr=players.map(function (player) {
          return player.score
        })
        players[scoreArr.indexOf(Math.min(...scoreArr))].socket.emit('endGameWithResult','loser')
        players[scoreArr.indexOf(Math.max(...scoreArr))].socket.emit('endGameWithResult','winner')
        resetGame()
      }
    })
    socket.on('gameReset',function () {
      resetGame()
      timer.start()
      io.emit('gameReset')
    })
    socket.on('scoreUpdate',function () {
      io.emit('scoreUpdate',players.map(function(player,index){
        players[index].score=0
        return player.score
      }))
    })

    socket.on('ready',function () {
      findPlayerFromSocket(socket).ready=true
      io.emit('updatePlayer',players.map(function(player){ //update current join player
        if(player.ready) return player.name+' (ready)'
        return player.name
      }))
      ready++
      ready==players.length? startGame(io):null
    })

    socket.on('playerName',function (name) {
      players.map(function (player,index) {
        if(player.socket.id==socket.id){
          players[index].name=name
        }
      })
    })
    socket.on('updatePlayer',function () {
      io.emit('updatePlayer',players.map(function(player){ //update current join player
        return player.name
      }))
    })
    socket.on('disabledMineBox',function (coordinate) {
      io.emit('disabledMineBox',coordinate)
    })
    socket.on('updateWelcomePlayer',function () {
      socket.emit('updateWelcomePlayer',findPlayerFromSocket(socket).name)
    })
    socket.on('bombCheck',function (coordinate) {
      var player=findPlayerFromSocket(socket)
      var result=getRandomBombSecret(coordinate)
      if(!result){
        player.score++
        io.emit('scoreUpdate',players.map(function(player){ //update current join player
          return player.score
        }))
      }
      players[currentTurnPlayer].socket.emit('bombCheck',result)
    })
    socket.on('endGame',function () {
      resetGame()
      io.emit('endGame')
    })
    socket.on('initialized',function () {
      initialized++
      if(initialized==players.length){
        currentTurnPlayer=Math.floor(Math.random()*players.length) // random first player
        players[currentTurnPlayer].start()
        timer.start()
      }
    })

    socket.on('disconnect', function () {
      currentUser--
      console.log('Player disconnected')
      console.log('currentUser:',currentUser)
      players.map(function (player,index) {
        if(socket.id==player.socket.id){
          players.splice(index,1)
        }
      })
      resetGame()
      io.emit('endGame')
    })


  })
}
function resetGame() {
  ready=0
  currentTurnPlayer=0
  boxPressed=0
  initialized=0
  timer.reset()
  players.map(function(player,index){
    players[index].score=0
    players[index].ready=false

  })
}
function findPlayerFromSocket(socket){
  for(player of players){
    if(player.socket.id==socket.id){
      return player
    }
  }
}
function startGame(io,winnerPlayer) {
  io.emit('startGame')
}


function changeTurn() {
  players[currentTurnPlayer].stop()
  currentTurnPlayer++
  if(currentTurnPlayer>players.length-1){
    currentTurnPlayer=0
  }
  players[currentTurnPlayer].start()
  timer.reset()
  timer.start()
}

function getTimer() {
  var timer=new stopWatch(10000,{refreshRateMS: 50})
  // timer
  timer.on('time', function(time) {
    for(var player of players)player.socket.emit('timerUpdate',Math.round(time.ms/1000))
  })
  timer.on('done',function(){
    if(doOneTime%2==0){ // due to the npm stopwatch sucks and bug calling done twice so i need to hack it.
      changeTurn()
    }
    timer.reset()
    timer.start()
    doOneTime++
  });
  return timer
}




module.exports=socketHandler
