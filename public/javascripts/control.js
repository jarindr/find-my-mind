
$(document).ready(function () {
  var socket = io.connect('http://localhost:3000')
  $('.end-game').on('click',function () {
    socket.emit('endGame')
  })
})
