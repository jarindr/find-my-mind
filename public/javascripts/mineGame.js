var socket
var initialized=false
$(document).ready(function () {
  var mineGame={
    x:6,
    y:6,
    data:{coordinate:'',result:''},
    initialize:function(){
      mineGame.createGame()
      if(initialized==false){
        initialized=true
        mineGame.setUpSocketHandler()
      }
      $('.reset-game').on('click',function () {
        socket.emit('gameReset')
      })
      $('.end-game').on('click',function () {
        socket.emit('endGame')
      })
      mineGame.starter()
      socket.emit('initialized')
    },
    createGame:function () {
      var html=""
      for(var i=0;i<mineGame.x;i++){
        for(var j=0;j<mineGame.y;j++){
          html=html+"<div class='mine-box' id="+i+"-"+j+">&nbsp</div>"
        }
        html=html+"<div class='row'></div>"
      }
      $(html).appendTo($('.mine-game'))
      var width=100/this.x
      var height=100/this.y
      $('.mine-box').css({
      'width':width+'%',
      'height':height+'%'}
      )
    },
    setUpSocketHandler:function () {
      socket.on("updateMineBox",function (data) {
        data.result?$("#"+data.coordinate).css('background-color','black')
        :$("#"+data.coordinate).css('background-color','red')
      })
      socket.on('endGameWithResult',function (result) {
        $('.endgame-result').text(result)
      })
      socket.on('active',function (active) {
        active? mineGame.enable():mineGame.disable()
      })
      socket.on('bombCheck',function (result) {
        mineGame.data.result=result
        socket.emit("updateMineBox",mineGame.data)
      })
      socket.on('timerUpdate',function (time) {
        $('.timer').text(time)
      })
      socket.on('scoreUpdate',function (score) {
        $('.player-score').text(score.join(" VS "))
      })
      socket.on('gameReset',function () {
        $('.mine-box').css('background-color','grey')
      })
      socket.on('disabledMineBox',function (coordinate) {
        $('#'+coordinate).addClass('disabled')
      })
    },
    enable:function () {
      console.log('start turn');
      $('.player-status').text('Your turn.')
      $('.mine-box').click(function () {
        if(!$(this).hasClass('disabled')){
          mineGame.data.coordinate=$(this).prop('id')
          socket.emit('bombCheck',$(this).prop('id'))
          socket.emit('endTurn')
          socket.emit('disabledMineBox',$(this).prop('id'))
        }
      })
    },
    disable:function () {
      $('.mine-box').off()
      $('.player-status').text('Waiting for opponent..')
      console.log('end')
    },
    starter:function () {
      socket.emit('updatePlayer')
      socket.emit('scoreUpdate')

    }
  }

  var lobby={
    initialize:function () {
      if(initialized==false){
        this.setUpdateHandler()
      }
        this.setInputHandler()
        socket.emit('updatePlayer')
        socket.emit('updateWelcomePlayer')
    },
    setUpdateHandler:function () {
      socket.on('updatePlayer',function (player) {
        $('.lobby-player').html(player.join('<br>'))
        $('.player-name').text(player.join('&'))

      })
      socket.on('updateWelcomePlayer',function (player) {
        $('.welcome-player').text('Welcome: '+player)
      })
      socket.on('endGame',function () {
        $('.state').load('lobby',function () {
          lobby.initialize()

        })
      })
      socket.on('startGame',function (callback) {
        $('.state').load('/game',function () {
          mineGame.initialize()
          callback()
        })
      })
    },
    setInputHandler:function () {
      $('.ready-game').click(function () {
        socket.emit('ready')
        $(this).prop('disabled',true)
      })
    }

  }
  var welcome={
    initialize:function () {
      this.inputHandler()
    },
    inputHandler:function () {
      $('#join-server').click(function (e) {
        e.preventDefault()
        socket = io.connect('http://localhost:3000')
        socket.emit('playerName',$('#player-name').val()) // send name to player object
        $('.state').load('/lobby',function () {
          lobby.initialize()
        })
      })
    }
  }
  welcome.initialize()






})
