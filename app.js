var canvas;
var gl;

var vertexShader;
var fragmentShader;

var camera;
var astronavtek;

var zvezdice = [];
var asteroids = [];
var okolje = []; 
var raketa = [];

var score;

// physics
var world;
var materials = {};
var collisionD = {
	GROUND: 1,
	OBJECT: 2
};
//v ozadju
var audioBack = new Audio('space.mp3');
//na koncu
var audioEnd = new Audio('win.mp3');
//če pade
var audioFall = new Audio('fall.mp3');
//za zvezdice
var audioStar = new Audio('pickup.wav');
//za asteoride
var audioAsteroid = new Audio('hit.wav');

// objekti: x, y, z; u, v
var kocka = {
	box: {
		vertices: [
			// Top
			-1.0, 1.0, -1.0,   0,0,		0.0,  1.0,  0.0,
			-1.0, 1.0, 1.0,    0,1,		0.0,  1.0,  0.0,
			1.0, 1.0, 1.0,     1,1,		0.0,  1.0,  0.0,
			1.0, 1.0, -1.0,    1,0,		0.0,  1.0,  0.0,

			// Left
			-1.0, 1.0, 1.0,    0,0,		-1.0,  0.0,  0.0,
			-1.0, -1.0, 1.0,   1,0,		-1.0,  0.0,  0.0,
			-1.0, -1.0, -1.0,  1,1,		-1.0,  0.0,  0.0,
			-1.0, 1.0, -1.0,   0,1,		-1.0,  0.0,  0.0,

			// Right
			1.0, 1.0, 1.0,    1,1,		1.0,  0.0,  0.0,
			1.0, -1.0, 1.0,   0,1,		1.0,  0.0,  0.0,
			1.0, -1.0, -1.0,  0,0,		1.0,  0.0,  0.0,
			1.0, 1.0, -1.0,   1,0,		1.0,  0.0,  0.0,

			// Front
			1.0, 1.0, 1.0,      1,1,		0.0,  0.0,  1.0,
			1.0, -1.0, 1.0,     1,0,		0.0,  0.0,  1.0,
			-1.0, -1.0, 1.0,    0,0,		0.0,  0.0,  1.0,
			-1.0, 1.0, 1.0,     0,1,		0.0,  0.0,  1.0,

			// Back
			1.0, 1.0, -1.0,      0,0,		0.0,  0.0, -1.0,
			1.0, -1.0, -1.0,     0,1,		0.0,  0.0, -1.0,
			-1.0, -1.0, -1.0,    1,1,		0.0,  0.0, -1.0,
			-1.0, 1.0, -1.0,     1,0,		0.0,  0.0, -1.0,

			// Bottom
			-1.0, -1.0, -1.0,   1,1,		0.0, -1.0,  0.0,
			-1.0, -1.0, 1.0,    1,0,		0.0, -1.0,  0.0,
			1.0, -1.0, 1.0,     0,0,		0.0, -1.0,  0.0,
			1.0, -1.0, -1.0,    0,1,		0.0, -1.0,  0.0
		],
		indices: [
			// Top
			0, 1, 2,
			0, 2, 3,

			// Left
			5, 4, 6,
			6, 4, 7,

			// Right
			8, 9, 10,
			8, 10, 11,

			// Front
			13, 12, 14,
			15, 14, 12,

			// Back
			16, 17, 18,
			16, 18, 19,

			// Bottom
			21, 20, 22,
			22, 20, 23
		]
	}
};


var initAll = function () {
	

	canvas = document.getElementById('game-surface');
	gl = initGL(canvas);

	if(!gl) {
		return;
	}

	initShaders();
	initGame();
	let scoreElement = document.getElementById("score");
	score = document.createTextNode("");
	scoreElement.appendChild(score);

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	audioBack.play();

	var update = function (time) { //loop ki transformira in rise objekte

		updatePhysics(time);

		score.nodeValue = astronavtek.data.score;

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.cullFace(gl.BACK);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		gl.frontFace(gl.CCW);

		gameplay();

		okolje.forEach(function(object) {
			if(object.visible) draw(object);
		});

		requestAnimationFrame(update);
	};

	// gravitacija, collision detection
	var fixedTimeStep = 1.0 / 60.0;
	var maxSubSteps = 3;
	var lastTime;
	var updatePhysics = function(time) {
		if(lastTime !== undefined) {
			var dt = (time - lastTime) / 1000;

			world.step(fixedTimeStep, dt, maxSubSteps);
		}
		lastTime = time;
	};

	requestAnimationFrame(update);
};

var gameplay = function() {
	handleKeys();

	if(astronavtek.body.position.y < -10) {
		audioFall.play();
		if(!alert('Padel si v črno luknjo! Poskusi znova.')){window.location.reload();}
		astronavtek.actions.kill();
		
		
	}
	else if(astronavtek.body.position.x >= 359) {

		audioEnd.play();  
		if(!alert("VRAČAMO SE NA ZEMLJO, dosegel si " + astronavtek.data.score + " točk!")){window.location.reload();}
		astronavtek.actions.kill();
		
	}

	zvezdice.forEach(function(zvezda) {
		// animiraj zvezdo
		zvezda.rotation[1] += 1;

		// Plus točke ko poberemo zvezdico
		if(zvezda.visible && razdalja(astronavtek, zvezda) < 1) {
			audioStar.play();
			zvezda.visible = false;

				astronavtek.data.score += 10;
				console.log("score: ", astronavtek.data.score)
 
		}
	});

	//Minus točke ko poberemo asteroid -20
	asteroids.forEach(function(asteroid) {

		if(asteroid.visible && razdalja(astronavtek, asteroid) < 1) {
			audioAsteroid.play();
			asteroid.visible = false;
				astronavtek.data.score -= 20;
				if(astronavtek.data.score < 0) {
					audioFall.play();
					//asteroid.visible = false;
					if(!alert("KONEC IGRE, zadelo te je preveč asteroidov! Poskusi znova.")){window.location.reload();}
					astronavtek.actions.kill();
				}
				console.log("score: ", astronavtek.data.score)
 
		}
	});

};

function razdalja(object1, object2) {
	let distance = (object1.body.position.x - object2.body.position.x) * (object1.body.position.x - object2.body.position.x) +
		(object1.body.position.y - object2.body.position.y) * (object1.body.position.y - object2.body.position.y) +
		(object1.body.position.z - object2.body.position.z) * (object1.body.position.z - object2.body.position.z);
	return distance;
}


function initPhysics() {
	world = new CANNON.World();
	world.gravity.set(0, -10, 0);

	// Materiali
	materials.frictionless = new CANNON.Material("frictionlessMaterial");
	let mat_frictionless = new CANNON.ContactMaterial(materials.frictionless, materials.frictionless, {
		friction: 0,
		restitution: 0,
	});

	world.addContactMaterial(mat_frictionless);
}

// keira objekt s podanimi parametri (obvezno podati vertice in indice)
function createObject({vertices, indices}, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], texture) {
	// Create buffers for object
	let boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	let boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	//create texture ----------------------------
	let boxTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, boxTexture); //st = uv da imajo drugacn ime texturnih koordinat
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	if(texture != undefined) {
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture);
	} else {
		// default texture
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,document.getElementById('texture_platform'));
	}

	let shaderProgram = createShaderProgram();

	var object = {
		prog: shaderProgram,
		indicesLen: indices.length,
		rotation: rotation,
		scale: scale,
		body: undefined,
		gltexture: boxTexture,
		vertexBuffer: boxVertexBufferObject,
		indexBuffer: boxIndexBufferObject,
		visible: true,
		giveBody: function(mass = 0, material = undefined, colGroups, colGroupsMask) {
			let body = new CANNON.Body({
				mass: mass, 
				position: new CANNON.Vec3(position[0], position[1], position[2]),
				shape: new CANNON.Box(new CANNON.Vec3(scale[0], scale[1], scale[2])), 
				fixedRotation: true,
				material: material, 
				collisionFilterGroup: colGroups,
				collisionFilterMask: colGroupsMask,
			});
			this.body = body;
			body.parentObject = this;
			world.addBody(body);
		}
	};

	okolje.push(object);
	return object;
}

var initObjFiles = function() {
	var objectsImport = [
		'./astronavt.obj',
		'./zvezda.obj',
		'./asteroid.obj',
		'./shuttle.obj'
		
	];

	let client;
	let objForIm;
	let name;
	for(let k = 0; k < objectsImport.length; k++) {
		client = new XMLHttpRequest();
		objForIm = objectsImport[k];
		name = objForIm.substring(2, objForIm.length - 4);

		client.open('GET', objForIm, false);
		client.addEventListener("load", function() {
			let mesh = new OBJ.Mesh(client.responseText);
			mesh.vertices = fixVertices(mesh.vertices);
			let vertices = [];
			for(let i = 0; i < mesh.vertices.length; i += 3) {
				for(let j = 0; j < 3; j++) {
					vertices.push(mesh.vertices[i + j]);
				}
				//rgb -> uv
				for(let j = 0; j < 2; j++) {
					if(k < 1) {
						vertices.push(mesh.textures[i + j]);
					}
					else{
						vertices.push(0.5);
					}
				}

				for(let j = 0; j < 3; j++){
					vertices.push(mesh.vertexNormals[i+j]);
				}
			}

			kocka[name] = {};
			kocka[name].vertices = vertices;
			kocka[name].indices = mesh.indices;
		});
		client.send();
	}

	// createObject(...) funkcija pricakuje vertice na obmocju (-1, 1). Ta funckija podane vertice
	// popravi (t.j. resizea objekt, da pase v obmocje (-1, 1) )
	function fixVertices(vertices) {
		// poiscemo najmanjso vertico in najvecjo vertico
		let min = vertices[0];
		let max = vertices[0];
		for(let i = 0; i < vertices.length; i++) {
			if(vertices[i] < min) min = vertices[i];
			if(vertices[i] > max) max = vertices[i];
		}

		//pogledamo katera absolutna vrednost je vecja
		min *= -1;
		if(min > max) max = min;
		// vse vertice delimo z max, da zmanjsamo predmet na (-1, 1) - to kar smo hoteli.
		for(let i = 0; i < vertices.length; i++) {
			vertices[i] /= max;
		}
		return vertices;
	}
};

function loadStars() {
	let starPositions = [
		[2, -1.5, 0], 
		[5, -1.5, 0], 
		[21, -1.5, 2], 
		[32, -1.5, -2], 
		[40, -1.5, 2], 
		[47, -1.5, 0], 
		[56, -1.5, 2],
		[59, -1.5, -2], 
		[70, -1.5, 2], 
		[73, -1.5, 0], 
		[86, -1.5, 0],
		[100, -1.5, 2],
		[108, -1.5, -2],
		[115, -1.5, -2],
		[136, -1.5, -2],
		[150, -1.5, 2],
		[170, -1.5, 0],
		[190, -1.5, 0],
		[195, -1.5, 0],
		[230, -1.5, 2],
		[233, -1.5, 0],
		[255, -1.5, 0],
		[288, -1.5, -2],
		[304, -1.5, 2],
		[307, -1.5, 0],
		[322, -1.5, 0],
		[330, -1.5, 0]

	];


	for(let i = 0; i < starPositions.length; i++) {
		let b = createObject(kocka.zvezda, starPositions[i], [0, Math.random() * 180, 30], [1, 1, 1], document.getElementById("texture_star"));
		b.giveBody();
		zvezdice.push(b);
	}
}
function loadAsteroids() {
	var pozicijeAsteoridov = [
		[8, -1.5, 0], 
		[25, -1.5, -2], 
	  	[44, -1.5, 2], 
		[76, -1.5, -2], 
		[88, -1, 0],  
	  	[106, -1.5, 2],
	  	[134, -1.5, -2],
		[153, -1.5, 0],
		[177, -1.5, 1],  
	  	[200, -1.5, -2],
	  	[233, -1.5, 0],
		[270, -1.5, 2],
		[278, -1.5, 1],  
		[295, -1.5, -2],
		[302, -1.5, 0],
	  	[327, -1.5, 0],
	];
  
	for(var i = 0; i < pozicijeAsteoridov.length; i++) {
	  let c = createObject(kocka.asteroid, pozicijeAsteoridov[i], [0, 0, 0], [3, 3, 3], document.getElementById("texture_stone"));
	  c.giveBody();
	  asteroids.push(c);
	}
  }

 function naloziRaketo() {
 	var pozicijeRakete = [
		[359, -1.5, 1.5]
	 ];
	 
	 for(var i = 0; i < pozicijeRakete.length; i++) {
		 let d = createObject(kocka.shuttle, pozicijeRakete[i], [0, 90, 0], [4.5, 4.5, 4.5], document.getElementById("texture_raketa"));
		 d.giveBody();
		raketa.push(d);
	 }
	}

function loadPlatforms() {
	function createPlatform(position, rotation, scale) {
		return {
			position: position,
			rotation: rotation,
			scale: scale
		};
	}
	let platforms = [];

	for(var i = 0; i < 360; i += 6) {
	
		if(i == 90 || i == 120 || i == 240 || i == 300) {
			continue
		}
		platforms.push(createPlatform([i, -3, 0], [0, 0, 0], [3, 0.5, 3]))

	  }

	for(let i = 0; i < platforms.length; i++) {
		createObject(kocka.box, platforms[i].position, platforms[i].rotation, platforms[i].scale, document.getElementById("texture_path"))
			.giveBody(0, materials.frictionless, collisionD.GROUND, collisionD.OBJECT | collisionD.GROUND);
	}
}


var initGame = function() {
	camera = {
		position:[-14, 14, 14]
	};

	initPhysics();
	initObjFiles();

	loadPlatforms();
	loadStars();
	loadAsteroids();
	naloziRaketo();
	initPlayer();
};

// izrise objekt


function initPlayer() {
	
	astronavtek = createObject(kocka.astronavt, [0, 0, 0], [0, 90, 0], [1.3, 1.3, 1.3], document.getElementById('texture_player'));
	astronavtek.giveBody(30, materials.frictionless, collisionD.OBJECT, collisionD.GROUND | collisionD.OBJECT);

	astronavtek.data = {};
	astronavtek.data.lookDirectionX = +1;
	astronavtek.data.speed = 10;
	astronavtek.data.canJump = true;
	astronavtek.data.score = 0;

	astronavtek.actions = {
		kill: function() {  
			astronavtek.body.position = new CANNON.Vec3(0, 0, 0);
			audioFall.play();
			astronavtek.data.score = 0;
		}
	};
}

var currentlyPressedKeys = {};

function handleKeys() {
	
	if (currentlyPressedKeys["ArrowUp"]) {
		astronavtek.body.velocity.x = +astronavtek.data.speed;
		astronavtek.data.lookDirectionX = +1;
	}
	if (currentlyPressedKeys["ArrowLeft"]) {
		if(astronavtek.body.position.z > -2)
			astronavtek.body.velocity.z = -astronavtek.data.speed;
		else
			astronavtek.body.velocity.z = 0;
	}
	if (currentlyPressedKeys["ArrowRight"]) {
		if(astronavtek.body.position.z < 2)
			astronavtek.body.velocity.z = +astronavtek.data.speed;
		else
			astronavtek.body.velocity.z = 0;
	}
	if (!currentlyPressedKeys["ArrowLeft"] && !currentlyPressedKeys["ArrowRight"]) {
		astronavtek.body.velocity.z = 0;
	}

}

function handleKeyDown(event) {
	// storing the pressed state for individual key
	currentlyPressedKeys[event.code] = true;
	if (astronavtek.data.canJump && event.code == "Space") {
		astronavtek.body.velocity.y = 5.5;
	}
}

function handleKeyUp(event) {
	// reseting the pressed state for individual key
	currentlyPressedKeys[event.code] = false;
}

function initGL(canvas) {
	let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	if (!gl) {
		alert('No WebGL context found.');
	}
	return gl;
}

function initShaders() {
	fragmentShader = getShader(gl, "shader-fs");
	vertexShader = getShader(gl, "shader-vs");

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}
}

function createShaderProgram() {
	let prog = gl.createProgram();
	gl.attachShader(prog, vertexShader);
	gl.attachShader(prog, fragmentShader);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(prog));
		return;
	}
	gl.validateProgram(prog);
	if (!gl.getProgramParameter(prog, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(prog));
		return;
	}
	return prog;
}

// _v

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  if (!shaderScript) {
	return null;
  }

  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
	if (currentChild.nodeType == 3) {
		shaderSource += currentChild.textContent;
	}
	currentChild = currentChild.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
	shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
	shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
	return null; 
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	alert(gl.getShaderInfoLog(shader));
	return null;
  }

  return shader;
}
