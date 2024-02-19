// Import Libraries and Setup

const { debug } = require("console");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);//socket io needs an http server
const { Server } = require("socket.io");
const io = new Server(server);

// Tell our Node.js Server to host our P5.JS sketch from the public folder.
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections from chrome, and open chrome when it is ready
server.listen(3000, () => {
  console.log("listening on *:3000");
});

let printEveryMessage = false; 

const controllers = {
  "A": {
    controlId: null,
    turned: { alpha:0.5, beta: 0.5, gamma: 0.5 },
    accMag: 0,
    isPaired : false,
    isTaped: false,
    touchPos: {x: 0, y: 0}
  },
  "B":{
    controlId: null,
    turned: { alpha:0.5, beta: 0.5, gamma: 0.5 },
    accMag: 0,
    isPaired : false,
    isTaped: false,
    touchPos: {x: 0, y: 0}
  }
}

// Callback function for what to do when our P5.JS sketch connects and sends us messages
io.on("connection", (socket) => {
  console.log("connected: " + socket.id);
  
  socket.on("controllerTurned", (data) => {
    // const user = users.find((user) => user.id == data.id)
    // if(user){
    //   user.turned = {alpha: data.alpha, beta: data.beta, gamma: data.gamma};
    //   if (printEveryMessage) {
    //     console.log(user.turned);
    //   }
    // }
    // socket.broadcast.emit('update', users);
    
  });
  
  socket.on("drawing", (data) => {
    //do something
    socket.broadcast.emit('drawing', data);//broadcast.emit means send to everyone but the sender

    // Print it to the Console
    if (printEveryMessage) {
      console.log(data);
    }
  });

  socket.on("paired", (data) => {
    const pId =  data.id;
    
    if(pId == "A" || pId == "B" ){
      controllers[pId].controlId = data.controlId;
      console.log(pId+" joind: " + data.controlId);
      controllers[pId].isPaired = true;
    }
    socket.broadcast.emit('update', controllers);
  });

  socket.on("touch", (data) => {
    const pId =  data.id;
    const state = data.state;

    if(pId == "A" || pId == "B" ){
      controllers[pId].isTaped = state;
      controllers[pId].touchPos = {x: data.x, y: data.y};
    }
    socket.broadcast.emit('update', controllers);
  });

  socket.on("controllerAcc", (data) => {
    const pId =  data.id;
    
    if(pId == "A" || pId == "B" ){
      controllers[pId].accMag = data.accMag;
    }
    socket.broadcast.emit('update', controllers);
  });
 
  socket.on("controllerTurned", (data) => {
    const pId =  data.id;
    
    if(pId == "A" || pId == "B" ){
      controllers[pId].turned = { alpha: data.alpha, beta: data.beta, gamma: data.gamma};
    }
    socket.broadcast.emit('update', controllers);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    for(key in controllers) {
      const value = controllers[key];
      if(value.controlId === socket.id) {
        value.isPaired = false;
        value.controlId = null;
      }
    }
   
    console.log(controllers);
    socket.broadcast.emit('update', controllers);
  });
});
