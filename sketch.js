/*
    ___              ________                             _     
   /   |  ____  ____/_  __/ /_  ___  ________  ____ ___  (_)___ 
  / /| | / __ \/ __ \/ / / __ \/ _ \/ ___/ _ \/ __ `__ \/ / __ \
 / ___ |/ / / / /_/ / / / / / /  __/ /  /  __/ / / / / / / / / /
/_/  |_/_/ /_/\____/_/ /_/ /_/\___/_/   \___/_/ /_/ /_/_/_/ /_/ 


AnoTheremin is another theremin. It uses tone.js for the sounds and gyroscope and x/y data for controls. No midi yet, but i'll get to that one day. 
Currently the sound is made from two oscillators that are running through their own signal paths for effects and they both get passed to the master track. 
One lead osc is playing a lead tone, and a bass osc is playing the same notes tuned several octaves lower

Its designed for mobile, naturally. Its intended to be held in one hand like a computer mouse or remote control, but it only uses the index finger for controls. 
Forward and back tilt controls the pitch which is currently locked to two octaves of the A minor pentatonic scale (notes A, C, D, E, G, A, C etc).
Left and right tilt currently controls the modulation speed of the filter on the bass oscillator to make it wub. 
x and y position data from the touchscreen control a number of different effect parameters 
(as of writing this sentence I can't remember what they are, but read on and i'll talk you through them.)

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



//chromatic

const rootFrequency = 220; 
const twelfthRootOf2 = Math.pow(2, 1 / 12);
let chromatic = false
/*
To get us off to a good start, i dont actually currently use these first  variables, they will just be helpful later because its the formula for an equal tempered chromatic scale.
I'm going to immediately get sidetracked here by talking about music theory, because thats what i do, 
but this is a good formula to know if you're making music related things. 

In order to counteract a whole bunch of issues caused by historical methods of tuning musical notes to simple, low integer ratios of eachother
a number of major composers in the 18th century started using a tuning that evenly dispersed 12 notes across an octave and this is what most modern pianos are now tuned to.

- Take a base frequency (the A above middle C (A4) on a piano is usually tuned to 440hz so it is an easy one to remember).

- multiply that note by the 12th root of 2 (or 1.05946309436) and you've got the frequency of the next key on the piano. 

- multiply the second note by the same number and keep going until you end up with double the frequency you started with.

-this is your octave. you can now multiply or divide every note by 2 to shift into higher or lower octaves respectively.


unfortunately, the chromatic scale makes this instrument sound like a pissed off cat until we can implement a better system of triggering the sound and calibrate the tilt action a little better.
*/



//tone.js variables for the nodes in our signal path. 
const volume = -15;
let lead, bass, hiPass, loPass, wub, crusher, chorus, verb, vib, trem
let leadGain, bassGain

let frequency
let modSpeed
let bits

//fft
let spec

let audioStart = false

//tilt data 
let askButton;
let frontToBack = 0; 
let leftToRight = 0; 

let tiltPos = 0 
let twistPos = 0
let scalePos = 0

//font
let stacker

//gonna put a menu splash screen in
let splash = true







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

  spec = new Tone.Waveform();

}

function setup () {
  
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER)
  angleMode(DEGREES)
  background(50);
  strokeWeight(3)


//I put all the tone.js and U/I bits and bobs in their own functions.
  createEffects()
  createSynth()
  motionListeners()
 
  stroke(255,20);

}

function draw() {
  
  background(0);
  fill(200,50)
  textAlign(CENTER, TOP)
  textSize(height/10)
  push()
 rotate(90)
 textFont(stacker)
 stroke(255,20)
  text("AnoTheremin", height/2,-width*0.9)
  pop()


  //foward back tilt is mapped to 11 notes that are currently set to two octaves of the A minor pentatonic scale
  scalePos = int(map(tiltPos, 0, height, 1, 11))

  //left to right twist is mapped to the modulation speed on a lowpass filter to make the bass wub
  modFreq = map(twistPos,0,width,-5,5)
  
  //note calculation happens in another function. 
  scaleLogic()


  //update the oscillator frequencies
  lead.setNote(frequency*2);//lead osc doubles the base frequency to sound one octave higher than the note we have calculated
  bass.setNote(frequency/4);//bass osc divides the base frequency to sound two octaves lower. 

  /*
  These next variables map the user actions to different effect parameters. Effect routing is where the real fun happens. 
  */

  //FILTER MAPS - human hearing range is from around 20hz to 20Khz

  //x mouse position maps to a range between 1000 and 200000 from left to right for the hipass filter.
  let cutoffFreqX = map(mouseX, 0, width, 1000, 20000);
  //y mouse maps from 2000 to 20 top to bottom for the lowpass filter on the bass
  let cutoffFreqY = map(mouseY, 0, height, 2000, 20);


  let chorFreq = map(mouseY, 0, height, 1, 10) //this is the speed of the chorus effect. 1 - 10 hz. 

  let bits = map(mouseY, 0, height, 0, 6); //bit size for the bitcrusher distortion

  let depth = map(mouseX, 0, width, 0, 0.5) //depth setting for the reverb. effectively how much wet signal is mixed in with the dry.
  let room = map(mouseX,0,width,0.2,0.7) //the size of the reverberations.
  let gainVol = map(mouseY, height, height*0.1, 0,0.1)//maps y to the lead gain.

//these just link the mapped input data to their respective effect nodes. 
  hiPass.frequency.value = cutoffFreqX;  
  loPass.frequency.value = cutoffFreqY;
  wub.frequency.value = modFreq
  crusher.bits.value = bits
  verb.roomSize.value = room
  vib.frequency.value = chorFreq
  vib.depth.value = depth
  chorus.frequency.value = chorFreq/2
  chorus.depth.value = depth/4
  leadGain.gain.value = gainVol
  
  spectro()//draws the waveform
  tiltMap()//maps the tilt position to 11 possible notes
  mouseLoc()//draws the mouse location indicator.

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
  if (Tone.context.state !== 'running') {
    Tone.context.resume();
  }
    
  lead.triggerAttack();
  bass.triggerAttack();
}

function mouseReleased () {

  //release triggers the release envelope. 
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
  
//Two FM synths are created, one triangle lead sound one square for bass. 
//They both have portamento turned on, which is how the notes can glide between eachother which is key to emulating a theremin type sound. 
//The lead takes longer to drift betwen notes than the bass.
//I want to get a whole bank of synth patches that can be changed on the fly, this one is just a starting point, and its already annoying the fuck out of me having to listen to over and over again


//FM synthesis can get very weird and complicated and unnecessary and quite frankly I hate it, but here it is anyway. 
//the frequency of a carrier signal is modulated by another signal to create more complex harmonic activity from simple waveforms. 
//feel free to change any node for a different one.

  lead = new Tone.FMSynth({
    harmonicity: 2, //this figures out the ratio of modulation signal vs the carrier. 1 is unison, 2 is an octave, 3 is octave+perfect 5th, etc.
    //effectively, this is causing the frequency to quickly change between the root and an octave higher so the sound has a more complex timbre. 

    modulationIndex: 10,//modulation signal depth

    detune: 0, //modify base frequency by cents (100ths of a semitone) not hz.

    oscillator: {type: "sine"},//the shape of the carrier signal that is actually heard.
    //amplitude envelope.
    
    
    envelope: {//shapes the amplitude of the signal.

      attack: 0.01, //attack is the time it takes for a sound to reach its loudest volume after triggering
      decay: 0.01, //decay is how long after the peak it takes to fall to the sustain volume
      sustain: 1, //sustain is the volume of note as it holds before releasing
      release: 0.5 //release is how long it takes for the amplitude to return to zero when the note is released 

    },


    modulation: {type: "sine"},//shape of the modulation signal.
    modulationEnvelope: {attack: 0.5, decay: 0, sustain: 1, release: 0.5},

    portamento: 0.1 //how long it takes for the oscillator to drift between frequencies when new notes are triggered.
});


//same deal with the bass synth, but different settings. 
bass = new Tone.FMSynth({

  harmonicity: 3,

  modulationIndex: 10,

  detune: 0,

  oscillator: {type: "sine"},

  envelope: {attack: 0.01, decay: 0.01, sustain: 1, release: 0.5},

  modulation: {type: "square"},

  modulationEnvelope: {attack: 0.5,decay: 0,sustain: 1,release: 0.5},

  portamento: 0.05 
});


//each oscillator gets a gain node to balance their respective volumes in the signal path. 
leadGain = new Tone.Gain(0.2)
bassGain = new Tone.Gain(0.4)


//connect the oscs to the gain nodes. 
  bass.connect(bassGain)
  lead.connect(leadGain)
  
//This is how the audio signal path connects. 
//It's not too crazy at the moment but this is where things can get real confusing really quick without a robust naming system and real cables to visualise everything.

  
  leadGain.connect(vib); //Lead gain goes into vibrato, to give it the voicelike, wavering quality to the pitch. 
  vib.connect(hiPass) //vibrato goes into hipass filter
  hiPass.connect(verb) //hipass goes into the reverb
  verb.connect(Tone.Master); //reverb connects to master output.
  
  bassGain.connect(loPass); //bassgain goes to lopass filter.
  loPass.connect(wub); //lopass goes into the second, modulated lowpass filter that controls the wubs. 
  wub.connect(Tone.Master);//wub filter goes into master output. . 
  
  Tone.Master.connect(spec); //finally, the effected master output is sent to the fft to draw the waveform. 
 
}

function createEffects(){

  //creates all the effects. 
  hiPass = new Tone.Filter(); //hipass filter allows all frequencies over a certain number.
  loPass = new Tone.Filter(); //lopass filter allows all frequencies under a certain number. 
//this allows us to keep a degree of separation between the bass and the lead if the timbres get too harmonically complex.
//It stops the basstone from producing frequencies that might clutter up the high end, and vice versa. 


  wub = new Tone.AutoFilter({frequency: 2, depth: 1}).start();//autofilter is where the wubs come from. left and right tilt controls the speed of this.

  trem = new Tone.Tremolo();//tremolo modulates signal volume.
  vib = new Tone.Vibrato() //vibrato modulates signal pitch. 
  crusher = new Tone.BitCrusher() //bitcrusher digitally downsamples the audio to different bitrates and creates that beautiful digital speak n spell type distortion that can also sound like absolute garbage if you arent careful (i love it)
  chorus = new Tone.Chorus() //chorus is supposed to mimic slight tuning and timing discrepancies between two musicians playing something in unison. 
  // It doubles (or more) the sound being played, and plays back the copies with very slight, almost imperceptible delays. 
  //this has the effect of modulating the pitch we hear and thickening up the sound. It's a good way of making music sound very 80s. 
  verb = new Tone.JCReverb()//reverb is reverb. its sound bouncing off walls. 
}


//draws the waveform from the fft
function spectro() {
  if (mouseIsPressed) {
      const waveform = spec.getValue();
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

  //if chromatic mode were true, it would calculate the notes this way, but its not so it doesnt. 
    if(chromatic){
      if (scalePos >= 1 && scalePos <= 15) {
  frequency = rootFrequency * Math.pow(twelfthRootOf2, scalePos - 1);
} else { 
        frequency = 0; 
}
  }else{
  
  //manually assigns the notes in our scale
  if(scalePos==1){
  frequency = 220 // Root A
  }else if(scalePos==2){
  frequency = 277.18 //C#
  } else if(scalePos==3){
  frequency = 311.13 //aug 4th D#
  } else if(scalePos==4){
  frequency = 329.63 //perfect 5th E
  } else if(scalePos==5){
  frequency = 415.3 //major 7 g#
  }else if(scalePos==6){
  frequency = 440 //octave
  }else if(scalePos==7){
  frequency = 277.18*2 //etc...
  }
  else if(scalePos==8){
  frequency = 311.13*2
  }else  if(scalePos==9){
  frequency = 659.26
  }else if(scalePos==10){
  frequency = 415.3*2
  } else if(scalePos==11){
  frequency = 880 //octave
  }
  
  }
}


function tiltMap(){
  //maps -45 to 135 degrees of forward/backwards tilt to display height
  tiltPos = constrain(map(frontToBack, -45,135,0,height),0,height)
  //maps -45 to 45 degrees of twist to display width
  twistPos = constrain(map(leftToRight, -45,45,0,width),0,width)
 ;
 
 //draws the keys
  noFill()
   for(let i = 0; i<11; i++){
    push()
    translate(0,height/(11*2))
    rect(width/2,height/11*i,width/2,height/11)
    pop()
  }
  textSize(15);
  fill(255,50)

  //indicator for the tilt/twist
  circle(twistPos,tiltPos,50)
 
}

function mouseLoc(){

  //draws an indicator at mouse location. the opacity fade is all fucked up and i havent fixed it yet. 
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
//all the other boring stuff. Gyroscopes spitting out numbers and window resizing and such.

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
       
        window.addEventListener('deviceorientation', deviceTurnedHandler, true)
      }
    })
    .catch(console.error);  
}

function deviceMotionHandler(event){
  
  /*
 im not using accelerometer, but like you say we could figure out a war to impliment it for percussive or staccato sounds. like digital maracas.
  
  */
  accX = event.acceleration.x;
  accY = event.acceleration.y;
  accZ = event.acceleration.z;
  
  rrateZ = event.rotationRate.alpha;
  rrateX = event.rotationRate.beta;
  rrateY = event.rotationRate.gamma;
  
}

function deviceTurnedHandler(event){
  
  frontToBack = event.beta; 
  leftToRight = event.gamma; 

}

function motionListeners(){
    if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
  
    askButton = createButton('Permission');
    askButton.mousePressed(handlePermissionButtonPressed);
  }else{
    
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
}
