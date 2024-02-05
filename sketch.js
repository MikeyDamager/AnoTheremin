/*
    ___              ________                             _     
   /   |  ____  ____/_  __/ /_  ___  ________  ____ ___  (_)___ 
  / /| | / __ \/ __ \/ / / __ \/ _ \/ ___/ _ \/ __ `__ \/ / __ \
 / ___ |/ / / / /_/ / / / / / /  __/ /  /  __/ / / / / / / / / /
/_/  |_/_/ /_/\____/_/ /_/ /_/\___/_/   \___/_/ /_/ /_/_/_/ /_/ 
*/


////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*                                                                   
                                                                            
LLLLLLLLLLL             EEEEEEEEEEEEEEEEEEEEEETTTTTTTTTTTTTTTTTTTTTTT        
L:::::::::L             E::::::::::::::::::::ET:::::::::::::::::::::T        
L:::::::::L             E::::::::::::::::::::ET:::::::::::::::::::::T        
LL:::::::LL             EE::::::EEEEEEEEE::::ET:::::TT:::::::TT:::::T        
  L:::::L                 E:::::E       EEEEEETTTTTT  T:::::T  TTTTTT        
  L:::::L                 E:::::E                     T:::::T         :::::: 
  L:::::L                 E::::::EEEEEEEEEE           T:::::T         :::::: 
  L:::::L                 E:::::::::::::::E           T:::::T         :::::: 
  L:::::L                 E:::::::::::::::E           T:::::T                
  L:::::L                 E::::::EEEEEEEEEE           T:::::T                
  L:::::L                 E:::::E                     T:::::T                
  L:::::L         LLLLLL  E:::::E       EEEEEE        T:::::T         :::::: 
LL:::::::LLLLLLLLL:::::LEE::::::EEEEEEEE:::::E      TT:::::::TT       :::::: 
L::::::::::::::::::::::LE::::::::::::::::::::E      T:::::::::T       :::::: 
L::::::::::::::::::::::LE::::::::::::::::::::E      T:::::::::T              
LLLLLLLLLLLLLLLLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEE      TTTTTTTTTTT              
                                                                                                                                                                                               
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const baseFrequency = 220; 
const twelfthRootOf2 = Math.pow(2, 1 / 12);

let chromatic = false

const volume = -15;
let lead, bass, hiPass, loPass, wub, crusher, chorus, verb, vib, trem
  
let askButton;
let frontToBack = 0; 
let leftToRight = 0; 

let tiltPos = 0 
let twistPos = 0
let scalePos = 0

let frequency

let modSpeed

let bits

let multi = 1

let audioStart = false

let meth, stacker, zyborg

let myFFT, bgSound



/*    
LLLLLLLLLLL                  OOOOOOOOO          OOOOOOOOO     PPPPPPPPPPPPPPPPP   
L:::::::::L                OO:::::::::OO      OO:::::::::OO   P::::::::::::::::P  
L:::::::::L              OO:::::::::::::OO  OO:::::::::::::OO P::::::PPPPPP:::::P 
LL:::::::LL             O:::::::OOO:::::::OO:::::::OOO:::::::OPP:::::P     P:::::P
  L:::::L               O::::::O   O::::::OO::::::O   O::::::O  P::::P     P:::::P
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P::::P     P:::::P
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P::::PPPPPP:::::P 
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P:::::::::::::PP  
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P::::PPPPPPPPP    
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P::::P            
  L:::::L               O:::::O     O:::::OO:::::O     O:::::O  P::::P            
  L:::::L         LLLLLLO::::::O   O::::::OO::::::O   O::::::O  P::::P            
LL:::::::LLLLLLLLL:::::LO:::::::OOO:::::::OO:::::::OOO:::::::OPP::::::PP          
L::::::::::::::::::::::L OO:::::::::::::OO  OO:::::::::::::OO P::::::::P          
L::::::::::::::::::::::L   OO:::::::::OO      OO:::::::::OO   P::::::::P          
LLLLLLLLLLLLLLLLLLLLLLLL     OOOOOOOOO          OOOOOOOOO     PPPPPPPPPP                                                                                          
*/


function preload(){

  stacker = loadFont('assets/stacker.ttf')
  zyborg = loadFont('assets/zyborgs.otf')

  myFFT = new Tone.Waveform();

}

function setup () {
  
  createCanvas(windowWidth, windowHeight);
  background(50);
  createSynth()
  motionListeners()
  strokeWeight(3)
  rectMode(CENTER)
  angleMode(DEGREES)
  noFill();
  stroke(255,20);

}

function draw() {
  
  background(0);
  fill(200,50)
  textAlign(CENTER, TOP)
  textSize(height/10)
  push()
 rotate(90)
 textFont('stacker')
 stroke(255,20)
  text("AnoTheremin", height/2,-width*0.9)
  pop()
  
  scalePos = int(map(tiltPos, 0, height, 1, 11))
  
  modPos = map(twistPos,0,width,1,3)
  
  modFreq = map(twistPos,0,width,-5,5)
  
  scaleLogic()

  lead.setNote(frequency*2);
  bass.setNote(frequency/4);
  
  let cutoffFreqX = map(mouseX, 0, width, 1000, 20000);
  let cutoffFreqY = map(mouseY, 0, height, 2000, 20);
  
  let chorFreq = map(mouseY, 0, height, 1, 10)
  
  let bits = map(mouseY, 0, height, 0, 6);
  let depth = map(mouseX, 0, width, 0, 0.5)
  
  let room = map(mouseX,0,width,0.2,0.7)

  hiPass.frequency.value = cutoffFreqX;
  loPass.frequency.value = cutoffFreqY;
  wub.frequency.value = modFreq
  crusher.bits.value = bits
  verb.roomSize.value = room
  vib.frequency.value = chorFreq
  vib.depth.value = depth
  chorus.frequency.value = chorFreq/2
  chorus.depth.value = depth/4
  
    spectro()
    tiltMap()
    mouseLoc()

}

/////////////////////////////////////////////////
/*                                                                                                              
MMMMMMMM               MMMMMMMM     OOOOOOOOO     UUUUUUUU     UUUUUUUU   SSSSSSSSSSSSSSS EEEEEEEEEEEEEEEEEEEEEE
M:::::::M             M:::::::M   OO:::::::::OO   U::::::U     U::::::U SS:::::::::::::::SE::::::::::::::::::::E
M::::::::M           M::::::::M OO:::::::::::::OO U::::::U     U::::::US:::::SSSSSS::::::SE::::::::::::::::::::E
M:::::::::M         M:::::::::MO:::::::OOO:::::::OUU:::::U     U:::::UUS:::::S     SSSSSSSEE::::::EEEEEEEEE::::E
M::::::::::M       M::::::::::MO::::::O   O::::::O U:::::U     U:::::U S:::::S              E:::::E       EEEEEE
M:::::::::::M     M:::::::::::MO:::::O     O:::::O U:::::D     D:::::U S:::::S              E:::::E             
M:::::::M::::M   M::::M:::::::MO:::::O     O:::::O U:::::D     D:::::U  S::::SSSS           E::::::EEEEEEEEEE   
M::::::M M::::M M::::M M::::::MO:::::O     O:::::O U:::::D     D:::::U   SS::::::SSSSS      E:::::::::::::::E   
M::::::M  M::::M::::M  M::::::MO:::::O     O:::::O U:::::D     D:::::U     SSS::::::::SS    E:::::::::::::::E   
M::::::M   M:::::::M   M::::::MO:::::O     O:::::O U:::::D     D:::::U        SSSSSS::::S   E::::::EEEEEEEEEE   
M::::::M    M:::::M    M::::::MO:::::O     O:::::O U:::::D     D:::::U             S:::::S  E:::::E             
M::::::M     MMMMM     M::::::MO::::::O   O::::::O U::::::U   U::::::U             S:::::S  E:::::E       EEEEEE
M::::::M               M::::::MO:::::::OOO:::::::O U:::::::UUU:::::::U SSSSSSS     S:::::SEE::::::EEEEEEEE:::::E
M::::::M               M::::::M OO:::::::::::::OO   UU:::::::::::::UU  S::::::SSSSSS:::::SE::::::::::::::::::::E
M::::::M               M::::::M   OO:::::::::OO       UU:::::::::UU    S:::::::::::::::SS E::::::::::::::::::::E
MMMMMMMM               MMMMMMMM     OOOOOOOOO           UUUUUUUUU       SSSSSSSSSSSSSSS   EEEEEEEEEEEEEEEEEEEEEE
                                                                                                               
*/
function mousePressed () {
  lead.triggerAttack();
  bass.triggerAttack();
}

function mouseReleased () {
  lead.triggerRelease();
  bass.triggerRelease();
}
////////////////////////////////////////////////////
/*                                                                                                       
   SSSSSSSSSSSSSSS      OOOOOOOOO     UUUUUUUU     UUUUUUUUNNNNNNNN        NNNNNNNNDDDDDDDDDDDDD        
 SS:::::::::::::::S   OO:::::::::OO   U::::::U     U::::::UN:::::::N       N::::::ND::::::::::::DDD     
S:::::SSSSSS::::::S OO:::::::::::::OO U::::::U     U::::::UN::::::::N      N::::::ND:::::::::::::::DD   
S:::::S     SSSSSSSO:::::::OOO:::::::OUU:::::U     U:::::UUN:::::::::N     N::::::NDDD:::::DDDDD:::::D  
S:::::S            O::::::O   O::::::O U:::::U     U:::::U N::::::::::N    N::::::N  D:::::D    D:::::D 
S:::::S            O:::::O     O:::::O U:::::D     D:::::U N:::::::::::N   N::::::N  D:::::D     D:::::D
 S::::SSSS         O:::::O     O:::::O U:::::D     D:::::U N:::::::N::::N  N::::::N  D:::::D     D:::::D
  SS::::::SSSSS    O:::::O     O:::::O U:::::D     D:::::U N::::::N N::::N N::::::N  D:::::D     D:::::D
    SSS::::::::SS  O:::::O     O:::::O U:::::D     D:::::U N::::::N  N::::N:::::::N  D:::::D     D:::::D
       SSSSSS::::S O:::::O     O:::::O U:::::D     D:::::U N::::::N   N:::::::::::N  D:::::D     D:::::D
            S:::::SO:::::O     O:::::O U:::::D     D:::::U N::::::N    N::::::::::N  D:::::D     D:::::D
            S:::::SO::::::O   O::::::O U::::::U   U::::::U N::::::N     N:::::::::N  D:::::D    D:::::D 
SSSSSSS     S:::::SO:::::::OOO:::::::O U:::::::UUU:::::::U N::::::N      N::::::::NDDD:::::DDDDD:::::D  
S::::::SSSSSS:::::S OO:::::::::::::OO   UU:::::::::::::UU  N::::::N       N:::::::ND:::::::::::::::DD   
S:::::::::::::::SS    OO:::::::::OO       UU:::::::::UU    N::::::N        N::::::ND::::::::::::DDD     
 SSSSSSSSSSSSSSS        OOOOOOOOO           UUUUUUUUU      NNNNNNNN         NNNNNNNDDDDDDDDDDDDD     
*/

function createSynth() {
  

  //lead synth
  lead = new Tone.FMSynth({
    harmonicity: 3,
    modulationIndex: 10,
    detune: 0,
    oscillator: {
        type: "triangle"
    },
    envelope: {
        attack: 0.01,
        decay: 0.01,
        sustain: 1,
        release: 0.5
    },
    modulation: {
        type: "square"
    },
    modulationEnvelope: {
        attack: 0.5,
        decay: 0,
        sustain: 1,
        release: 0.5
    },
    portamento: 0.1 // Adjust the value as needed
});

let leadGain = new Tone.Gain(0.2)

  lead.connect(leadGain)
  
  bass = new Tone.FMSynth({
    harmonicity: 3,
    modulationIndex: 10,
    detune: 0,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.01,
        decay: 0.01,
        sustain: 1,
        release: 0.5
    },
    modulation: {
        type: "square"
    },
    modulationEnvelope: {
        attack: 0.5,
        decay: 0,
        sustain: 1,
        release: 0.5
    },
    portamento: 0.05 // Adjust the value as needed
});

let bassGain = new Tone.Gain(0.4)
  bass.connect(bassGain)
  
  
  hiPass = new Tone.Filter();
  loPass = new Tone.Filter();
  wub = new Tone.AutoFilter({
    frequency: 2, 
    depth: 1 
  }).start();
  trem = new Tone.Tremolo()
  vib = new Tone.Vibrato()
  
  crusher = new Tone.BitCrusher()
  chorus = new Tone.Chorus()
  verb = new Tone.JCReverb()
  
  leadGain.connect(vib);
  vib.connect(hiPass)
  
  hiPass.connect(verb)
  
  bassGain.connect(loPass); 
  
  verb.connect(Tone.Master);
  loPass.connect(wub);
    
  wub.connect(Tone.Master);
  
  Tone.Master.connect(myFFT)
 
  
}

function spectro() {
  if (mouseIsPressed) {
      const waveform = myFFT.getValue();
      const waveformLength = waveform.length;
      const step = width / waveformLength;
      beginShape();
      noFill();
      stroke(255, 20);
      for (let i = 0; i < waveformLength; i++) {
          const x = i * step;
          const y = map(waveform[i], -1, 1, height, 0);
          vertex(x, y);
      }
      endShape();
  }
}



///////////////////////////////////////////////////////////

/*                                                                                                                       
   SSSSSSSSSSSSSSS         CCCCCCCCCCCCC               AAA               LLLLLLLLLLL             EEEEEEEEEEEEEEEEEEEEEE
 SS:::::::::::::::S     CCC::::::::::::C              A:::A              L:::::::::L             E::::::::::::::::::::E
S:::::SSSSSS::::::S   CC:::::::::::::::C             A:::::A             L:::::::::L             E::::::::::::::::::::E
S:::::S     SSSSSSS  C:::::CCCCCCCC::::C            A:::::::A            LL:::::::LL             EE::::::EEEEEEEEE::::E
S:::::S             C:::::C       CCCCCC           A:::::::::A             L:::::L                 E:::::E       EEEEEE
S:::::S            C:::::C                        A:::::A:::::A            L:::::L                 E:::::E             
 S::::SSSS         C:::::C                       A:::::A A:::::A           L:::::L                 E::::::EEEEEEEEEE   
  SS::::::SSSSS    C:::::C                      A:::::A   A:::::A          L:::::L                 E:::::::::::::::E   
    SSS::::::::SS  C:::::C                     A:::::A     A:::::A         L:::::L                 E:::::::::::::::E   
       SSSSSS::::S C:::::C                    A:::::AAAAAAAAA:::::A        L:::::L                 E::::::EEEEEEEEEE   
            S:::::SC:::::C                   A:::::::::::::::::::::A       L:::::L                 E:::::E             
            S:::::S C:::::C       CCCCCC    A:::::AAAAAAAAAAAAA:::::A      L:::::L         LLLLLL  E:::::E       EEEEEE
SSSSSSS     S:::::S  C:::::CCCCCCCC::::C   A:::::A             A:::::A   LL:::::::LLLLLLLLL:::::LEE::::::EEEEEEEE:::::E
S::::::SSSSSS:::::S   CC:::::::::::::::C  A:::::A               A:::::A  L::::::::::::::::::::::LE::::::::::::::::::::E
S:::::::::::::::SS      CCC::::::::::::C A:::::A                 A:::::A L::::::::::::::::::::::LE::::::::::::::::::::E
 SSSSSSSSSSSSSSS           CCCCCCCCCCCCCAAAAAAA                   AAAAAAALLLLLLLLLLLLLLLLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEE
*/

function scaleLogic(){
    if(chromatic){
      if (scalePos >= 1 && scalePos <= 15) {
  frequency = baseFrequency * Math.pow(twelfthRootOf2, scalePos - 1);
} else { 
        frequency = 0; 
}
  }else{
  
  
  if(scalePos==1){
  frequency = 220
  }else if(scalePos==2){
  frequency = 261.63
  } else if(scalePos==3){
  frequency = 293.66
  } else if(scalePos==4){
  frequency = 329.63
  } else if(scalePos==5){
  frequency = 392
  }else if(scalePos==6){
  frequency = 440
  }else if(scalePos==7){
  frequency = 523.25
  }
  else if(scalePos==8){
  frequency = 587.33
  }else  if(scalePos==9){
  frequency = 659.26
  }else if(scalePos==10){
  frequency = 783.99
  } else if(scalePos==11){
  frequency = 880
  }
  
  }
}

/*                                                                                                    
                                                                      
*/

function tiltMap(){
  
  tiltPos = constrain(map(frontToBack, -45,135,0,height),0,height)
  
  twistPos = constrain(map(leftToRight, -45,45,0,width),0,width)
 ;
 
  noFill()
   for(let i = 0; i<11; i++){
    push()
    translate(0,height/(11*2))
    rect(width/2,height/11*i,width/2,height/11)
    pop()
  }
  textSize(15);
  fill(255,50)
  circle(twistPos,tiltPos,50)
 
}

function mouseLoc(){
  const dim = Math.min(width, height);
   if(mouseIsPressed){
     opacity = 0
   }else{
     opacity = 0.085
   }
   background(0, 0, 0, opacity * 255);
    if (mouseIsPressed) {
    background(0,0)
    push()
    stroke(255)
    circle(mouseX, mouseY, dim * 0.2);
    pop()
   
  }
}


/*
  _   _         _                                      
 | | (_)       | |                                     
 | |  _   ___  | |_    ___   _ __     ___   _ __   ___ 
 | | | | / __| | __|  / _ \ | '_ \   / _ \ | '__| / __|
 | | | | \__ \ | |_  |  __/ | | | | |  __/ | |    \__ \
 |_| |_| |___/  \__|  \___| |_| |_|  \___| |_|    |___/
*/

function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

function handlePermissionButtonPressed(){
    DeviceMotionEvent.requestPermission()
    .then(response => {
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

function deviceMotionHandler(event){
  
  accX = event.acceleration.x;
  accY = event.acceleration.y;
  accZ = event.acceleration.z;
  
  rrateZ = event.rotationRate.alpha;//alpha: rotation around z-axis
  rrateX = event.rotationRate.beta;//rotating about its X axis; that is, front to back
  rrateY = event.rotationRate.gamma;//rotating about its Y axis: left to right
  
}

function deviceTurnedHandler(event){
  
  frontToBack = event.beta; // beta: front back motion
  leftToRight = event.gamma; // gamma: left to right

}

function motionListeners(){
    if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
  
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  }else{
    
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
}