const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
var boxes = {}
var particles = []
var timeStamp = new Date()
var previousTimeStamp = 0

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  io.emit('addParticles', particles)
  boxes[socket.id] = {"x": Math.random() * 600 + 100, "y": Math.random() * 250 + 100, "savedX": 0, "savedY": 0, "xvel": 0, "yvel":0}
  io.emit('create', boxes);
  socket.on('disconnect', () => {
    io.emit("delete box", socket.id)
    delete boxes[socket.id]
    console.log('a user disconnected');
  });
  socket.on('box move', (msg) => {
    boxes[socket.id] = msg
    socket.broadcast.emit("update pos", {
      "id": socket.id,
      "info": msg})
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});

//particle code
class Particle{
  constructor(index){
    this.index = index
    this.x = Math.random()*800
    this.y = 25
    this.xvel = Math.random()*2-1
    this.yvel = Math.random()*2-1
    this.r = Math.random() * 255
    this.g = Math.random() * 255
    this.b = Math.random() * 255
    this.color = "rgb(" + this.r + "," + this.g + "," + this.b + ")"
  }

  particlemove(i){
    this.yvel = this.yvel + 0.1
    this.x = this.x + this.xvel
    this.y = this.y + this.yvel
    for(var key in boxes){
      var box = boxes[key]
      var x = box["x"]
      var y = box["y"]
      if(this.topcollide(x, y)){
        this.yvel = -this.yvel / 2
        if (box["yvel"] < 0){
          this.yvel += box["yvel"]/2
        }
        this.y = y - 4
      }
      else if(this.leftcollide(x, y)){
        this.xvel = -this.xvel / 2
        if (box["xvel"] < 0){
          this.xvel += box["xvel"]/2
        }
        this.x = x - 4
      }
      else if(this.rightcollide(x,y)){
        this.xvel = -this.xvel / 2
        if (box["xvel"] > 0){
          this.xvel += box["xvel"]/2
        }
        this.x = x + 101
      }
      else if(this.bottomcollide(x, y)){
        this.yvel = -this.yvel / 2
        if (box["yvel"] > 0){
          this.yvel += box["yvel"]/2
        }
        this.y = y + 101
        
      }
    }
    if(this.x < 0){
      this.x = 0
      this.xvel = -this.xvel / 2
      
    }
    else if(this.x + 3 > 800){
      this.x = 800 - 3
      this.xvel = -this.xvel / 2
      
    }
    if(this.y + 3 > 450){
      this.y = 450 -  3
      this.yvel = -this.yvel / 2
    }
    for(let j = 0; j < i; j++){
      let p = particles[j]
      if(this.collide(p)){
        let tempyvel = p.yvel
        p.yvel = this.yvel
        this.yvel = tempyvel
        this.xvel -= (Math.random()/5)-0.1
        if(this.y < p.y){
          this.y = p.y - 4
        }else if(this.y > p.y){
          this.y = p.y + 4
        }
        let tempxvel = p.xvel
        p.xvel = this.xvel
        this.xvel = tempxvel
        this.yvel -= (Math.random()/10)
        if(this.x < p.x){
          this.x = p.x - 4
        }else if(this.x > p.x){
          this.x = p.x + 4
        }
      }
    }
    
  }
  topcollide(x, y){
    if(this.x <= x + 100 && this.x + 3 >= x){
      if(this.y <= y + 10 && this.y + 3 >= y){
        return true
      }
    }
    return false
  }
  bottomcollide(x, y){
    if(this.x <= x + 100 && this.x + 3 >= x){
      if(this.y <= y + 100 && this.y + 3 >= y + 90){
        return true
      }
    }
    return false
  }
  rightcollide(x, y){
    if(this.x <= x + 100 && this.x + 3 >= x + 50){
      if(this.y <= y + 100 && this.y + 3 >= y){
        return true
      }
    }
    return false
  }
  leftcollide(x, y){
    if(this.x <= x + 50 && this.x + 3 >= x){
      if(this.y <= y + 100 && this.y + 3 >= y){
        return true
      }
    }
    return false
  }
  collide(p){
    if(this.x <= p.x + 3 && this.x + 3 >= p.x){
      if(this.y <= p.y + 3 && this.y + 3 >= p.y){
        return true
      }
    }
    return false
  }
}
function host(){
  for(var i = 0; i < 150; i++){
    let p = new Particle()
    particles.push(p);
  }
}
host()
function updateParticles(){
  for(var i = 0; i < particles.length; i++){
    var p = particles[i]
    p.particlemove(i)
    io.emit("updateParticle", {"index": i, "info": p})
  }
  var fps = 1/((timeStamp - previousTimeStamp)/1000)
  previousTimeStamp = timeStamp
  timeStamp = new Date()
  io.emit("updateFPS", fps)
  setTimeout(updateParticles, 1)
}
updateParticles()
