var socket = io();
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var flagNum = -1
var timeStamp = new Date()
var previousTimeStamp = 0
var serverFps = 0
var boxes = {}

class Box{
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.savedx = 0
    this.savedy = 0
    this.xvel = 0
    this.yvel = 0
  }
  boxMove(e){
    this.savedx = this.x
    this.savedy = this.y
    this.x = event.clientX-150;
    this.y = event.clientY-150;
    this.xvel = this.x - this.savedx
    this.yvel = this.y - this.savedy
    for(var i in boxes){
      if(i != socket.id && this.x + 100>= boxes[i].x && this.x <= boxes[i].x+100 && this.y + 100 >= boxes[i].y && this.y <= boxes[i].y+100){
        this.x = this.savedx
        this.y = this.savedy
        break
      }
    }
    socket.emit('box move',{"x": this.x, "y": this.y, "savedX": this.savedx, "savedY": this.savedy, "xvel": this.xvel, "yvel": this.yvel});
  }
}
socket.on('create', function(msg) {
    for(var key in msg){
      boxes[key] = new Box(msg[key]["x"], msg[key]["y"])
    }
});
socket.on('update pos', function(msg){
  boxes[msg["id"]] = msg["info"]
})
socket.on('delete box', function(msg){
  delete boxes[msg]
})
socket.on("addParticles", function(info){
  particle = info
})
socket.on("updateParticle", function(info){
  particle[info["index"]] = info["info"]
})
socket.on("updateFPS", function(info){
  serverFps = info
}) 
function fpsCounter(){
  var fps = 1/((timeStamp - previousTimeStamp)/1000)
  previousTimeStamp = timeStamp
  timeStamp = new Date()
  ctx.clearRect(0,0, c.width, c.height)
  ctx.fillStyle = "black"
  ctx.fillText(Math.round(fps), 5, 10)
  ctx.fillStyle = "red"
  ctx.fillText(Math.round(serverFps), 25, 10)
}
function draw(){
  fpsCounter()
  for(var key in boxes){
    ctx.strokeRect(boxes[key].x, boxes[key].y, 100, 100); 
  }
  for(var i = 0; i < particle.length; i++){
    var p = particle[i]
    ctx.fillStyle = p.color
    ctx.fillRect(p.x-2, p.y-2, 4, 4)
  }
  requestAnimationFrame(draw)
}

var particle = []


document.addEventListener("mousemove", function(e){
  if(boxes[socket.id] != null){
    boxes[socket.id].boxMove(e)
  }
})
draw();
