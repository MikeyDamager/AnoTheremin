const socket = io();

//global variables
let askButton;
let canvas;
let drawIsOn = false;

// device motion
let accX = 0;
let accY = 0; 
let accZ = 0;
let rrateX = 0;
let rrateY = 0; 
let rrateZ = 0;

// device orientation
let rotateDegrees = 0;
let frontToBack = 0; 
let leftToRight = 0; 

let accMag = 0;
let userId;

const circlePos = {x: 0, y: 0};

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.mousePressed(startDrawing);
  canvas.touchStarted(startDrawing);

  angleMode(DEGREES);
 

  //----------
  //the bit between the two comment lines could be move to a three.js sketch except you'd need to create a button there
  if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    // iOS 13+
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  }else{
    //if there is a device that doesn't require permission
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
  
}

//we are using p5.js to visualise this movement data
function draw() {
  background(22);
  rectMode(CENTER);

  if(userId == "B"){
    push();
    translate(width/2,height/2);
  
    if(frontToBack > 10){
      push();
      rotate(-180);
      triangle(-30,-40,0,-100,30,-40);
      pop();
    }else if(frontToBack < -10){
      push();
      triangle(-30,-40,0,-100,30,-40);
      pop();
    }
    
    if(leftToRight > 10){
      push();
      rotate(90);
      triangle(-30,-40,0,-100,30,-40);
      pop();
    }else if(leftToRight < -10){
      push();
      rotate(-90);
      triangle(-30,-40,0,-100,30,-40);
      pop();
    }
    pop();
  }else if(userId == "A"){
    //lines
    stroke(220, 30);
    strokeWeight(3);
    line(0, height * 0.5, width, height * 0.5);
    line(width * 0.5, 0, width * 0.5, height);

    stroke(220);
    strokeWeight(2);
    const yLine = map(frontToBack, -180, 180, 0, height);
    const xLine = map(leftToRight, -180, 180, 0, width);
    line(0, yLine, width, yLine);
    line(xLine, 0, xLine, height);
  }
  
  //circle
  if(drawIsOn){
    noFill();
    stroke(220);
    strokeWeight(2);
    const rSize = 80 + accMag * 10;
    circle(circlePos.x, circlePos.y, rSize);
  }
  //Debug text
  fill(200);
  noStroke();
  textSize(15);
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  text("acceleration Mag: " + accMag.toFixed(2), 0, 50, width, 30);
  text("device orientation: " + rotateDegrees.toFixed(2) + ", " + leftToRight.toFixed(2) + ", " + frontToBack.toFixed(2), 0, 70, width, 30);
  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

}
function mouseReleased(){
  drawIsOn = false;
  emitTouch(drawIsOn, mouseX, mouseY);
}

function touchEnded(){
  drawIsOn = false;
  emitTouch(drawIsOn, mouseX, mouseY);
}

function mouseDragged() {
  if(!drawIsOn){
    return;
  }
  
  circlePos.x = mouseX;
  circlePos.y = mouseY;

  emitTouch(drawIsOn, mouseX, mouseY);
}

function touchMoved() {
  if(!drawIsOn){
    return;
  }
  
  circlePos.x = mouseX;
  circlePos.y = mouseY;

  emitTouch(drawIsOn, mouseX, mouseY);
}

function startDrawing(){
  drawIsOn = true;
  circlePos.x = mouseX;
  circlePos.y = mouseY;
  emitTouch(drawIsOn, mouseX, mouseY);
}

//Everything below here you could move to a three.js or other javascript sketch

function handlePermissionButtonPressed(){

    DeviceMotionEvent.requestPermission()
    .then(response => {
      // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
      if (response === 'granted') {
        window.addEventListener('devicemotion', deviceMotionHandler, true);
      }
    });

    DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
        window.addEventListener('deviceorientation', deviceTurnedHandler, true)
      }
    })
    .catch(console.error);  
}

//AVERAGE YOUR DATA!!!
//Microphone input from last term.... 

// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event
function deviceMotionHandler(event){
  
  accX = event.acceleration.x;
  accY = event.acceleration.y;
  accZ = event.acceleration.z;
  const acc = createVector(accX, accY, accZ);
  accMag = acc.mag()
  emitAcc(accMag);
 
  
  rrateZ = event.rotationRate.alpha;//alpha: rotation around z-axis
  rrateX = event.rotationRate.beta;//rotating about its X axis; that is, front to back
  rrateY = event.rotationRate.gamma;//rotating about its Y axis: left to right
}

//https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
function deviceTurnedHandler(event){
  
  rotateDegrees = event.alpha; // alpha: rotation around z-axis
  frontToBack = event.beta; // beta: front back motion
  leftToRight = event.gamma; // gamma: left to right

  emitTurned(event.alpha / 360 + 0.5, event.beta / 360 + 0.5, event.gamma / 360 + 0.5 );
 

}

socket.on("connect", () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  userId = urlParams.get('id');

  console.log("conecting ");
  if(userId){
    console.log("paring " + userId);
    socket.emit("paired", {
      id: userId,
      controlId: socket.id
    });
  }
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
  console.log(socket.id);
});

function emitTurned(alpha, beta, gamma){
  if(userId){
    socket.emit("controllerTurned", {
      id: userId,
      alpha,
      beta,
      gamma
    });
  }
}

function emitAcc(mag){
  if(userId){
    socket.emit("controllerAcc", {
      id: userId,
      mag,
    });
  }
}

function emitTouch(state, posX, posY){
  if(userId){
    socket.emit("touch", {
      id: userId,
      state,
      x: posX / width,
      y: posY / height
    });
  }
}



