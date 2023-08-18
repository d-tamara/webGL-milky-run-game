# MILKY RUN WebGL based game
used gl-matrix.js library

## How to run the game
run file "home.html" preferably with live server (vs code)
bottom left -> click to play

## How to play
- start moving: up arrow
- left and right arrrow for movement
- space: jump

## OBJ loader:
used webgl-obj-loader.js
- function initObjFiles used for importing .obj files
- objects are placed in the world using arrays with coordinates for each instance of object groups. Each object is made using createObject function for each element in the array of coordinates. (eg. function loadStars()).

## Initialize game
- to initialize game we are initializing physics, loading obj files, platforms and initializing our player.
- in "astronavtek.data" player contains atributes that we need for movement and for saving a score. From "astronavtek.actions" we are accessing a kill function that resets players position and score and plays certain sound.

## Collision detection:
used cannon.js library
calculating distances between player and object for pickup
pickup simulation: "object visible = false"

"# webGL-milky-run-game" 
