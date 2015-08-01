/**
 * Notes:
 * - Coordinates are specified as (X, Y, Z) where X and Z are horizontal and Y
 *   is vertical
 */

// Creation of the map object
var map = new Map("test");

// Creation of the hero object
var hero = new Hero("beuted");

// Semi-constants
var WIDTH = window.innerWidth,
HEIGHT = window.innerHeight,
ASPECT = WIDTH / HEIGHT,
UNITSIZE = 100, // attention aussi dans map et hero ! (?)
WALLHEIGHT = UNITSIZE,
MOVESPEED = 100, //NOT CONNECTED ANYMORE !
LOOKSPEED = 0.075,
BULLETMOVESPEED = MOVESPEED * 3,
NUMAI = 1,
PROJECTILEDAMAGE = 20,
FPSMAX = 60;
// Global vars
var t = THREE, scene, cam, renderer, controls, clock, projector, model, skin;
var runAnim = true, mouse = { x: 0, y: 0 }, kills = 0, health = 10000;
var prevT;
var healthCube, lastHealthPickup = 0;
/*
  var finder = new PF.AStarFinder({ // Defaults to Manhattan heuristic
  allowDiagonal: true,
  }), grid = new PF.Grid(mapW, mapH, map);
*/

// Initialize and run on document ready
$(document).ready(function() {

    var blocker = document.getElementById( 'blocker' );
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) {

	var element = document.body;

	var pointerlockchange = function ( event ) {

	    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

		controls.enabled = true;

		blocker.style.display = 'none';

	    } else {

		controls.enabled = false;

		blocker.style.display = '-webkit-box';
		blocker.style.display = '-moz-box';
		blocker.style.display = 'box';

		instructions.style.display = '';

	    }

	}

	var pointerlockerror = function ( event ) {

	    instructions.style.display = '';

	}

	// Hook pointer lock state change events
	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

	instructions.addEventListener( 'click', function ( event ) {

	    instructions.style.display = 'none';

	    // Ask the browser to lock the pointer
	    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

	    if ( /Firefox/i.test( navigator.userAgent ) ) {

		var fullscreenchange = function ( event ) {

		    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

			document.removeEventListener( 'fullscreenchange', fullscreenchange );
			document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

			element.requestPointerLock();
		    }

		}

		document.addEventListener( 'fullscreenchange', fullscreenchange, false );
		document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

		element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

		element.requestFullscreen();

	    } else {

		element.requestPointerLock();

	    }

	}, false );

    } else {

	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

    }
    

    init();
    setInterval(drawRadar, 1000);
    animate();
    /*
      new t.ColladaLoader().load('models/Yoshi/Yoshi.dae', function(collada) {
      model = collada.scene;
      skin = collada.skins[0];
      model.scale.set(0.2, 0.2, 0.2);
      model.position.set(0, 5, 0);
      scene.add(model);
      });
    */
});


// Setup
function init() {
    clock = new t.Clock(); // Used in render() for controls.update()
    projector = new t.Projector(); // Used in bullet projection
    scene = new t.Scene(); // Holds all objects in the canvas
    scene.fog = new t.FogExp2(0xD6F1FF, 0.0005); // color, density
    
    // Set up camera
    cam = new t.PerspectiveCamera(60, ASPECT, 0.2, 10000); // FOV, aspect, near, far
    //cam.position = hero.eyesPosition;
    controls = new THREE.PointerLockControls( hero, cam );
    
    scene.add(controls.getObject());
    
    
    // Camera moves with mouse, flies around with WASD/arrow keys
    /*controls = new t.FirstPersonControls(cam);
    controls.movementSpeed = MOVESPEED;
    controls.lookSpeed = LOOKSPEED;
    controls.lookVertical = false; // Temporary solution; play on flat surfaces only
    controls.noFly = true;*/

    // World objects
    setupScene();
    
    // Artificial Intelligence
    ai.init(scene);
    
    // Handle drawing as WebGL (faster than Canvas but less supported)
    renderer = new t.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);
    
    // Add the canvas to the document
    renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
    document.body.appendChild(renderer.domElement);
    
    // Track mouse position so we know where to shoot
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    
    // Shoot on click
    $(document).click(function(e) {
	e.preventDefault;
	if (e.which === 1) { // Left click only
	    createBullet();
	}
    });
    
    // Display HUD
    $('body').append('<canvas id="radar" width="200" height="200"></canvas>');
    $('body').append('<div id="hud"><p>Health: <span id="health">100</span><br />Score: <span id="score">0</span><br />FPS: <span id="fps">0</span></p></div>');
    //$('body').append('<div id="credits"><p>WASD to move, mouse to look, click to shoot</p></div>');
    
    // Set up "hurt" flash
    $('body').append('<div id="hurt"></div>');
    $('#hurt').css({width: WIDTH, height: HEIGHT,});
}

// Helper function for browser frames
function animate() {
    if (runAnim) {
	requestAnimationFrame(animate);
    }
    render();
}

// Update and display
function render() {
    var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
    $('#fps').html(Math.floor(1/delta));
    var aispeed = delta * MOVESPEED;
    controls.update(delta); // Move camera
    
    // Rotate the health cube
    healthcube.rotation.x += 0.004
    healthcube.rotation.y += 0.008;
    // Allow picking it up once per minute
    if (Date.now() > lastHealthPickup + 60000) {
	if (distance(controls.getObject().position, healthcube.position) < 15 && health != 100) {
	    health = Math.min(health + 50, 100);
	    $('#health').html(health);
	    lastHealthPickup = Date.now();
	}
	healthcube.material.wireframe = false;
    }
    else {
	healthcube.material.wireframe = true;
    }

    // Update bullets. Walk backwards through the list so we can remove items.
    for (var i = bullets.length-1; i >= 0; i--) {
	var b = bullets[i], p = b.hitbox.position, d = b.hitbox.ray.direction;
	if (checkWallCollision(b)) {
	    bullets.splice(i, 1);
	    scene.remove(b.hitbox);
	    continue;
	}
	// Collide with AI
	var hit = false;
	for (var j = ai.list.length-1; j >= 0; j--) {
	    var a = ai.list[j];
	    var v = a.hitbox.geometry.vertices[0];
	    var c = a.hitbox.position;
	    var x = Math.abs(v.x), z = Math.abs(v.z), y = Math.abs(v.y);
	    //console.log(Math.round(p.x), Math.round(p.z), c.x, c.z, x, z);
	    if (p.x < c.x + x && p.x > c.x - x &&
			p.z < c.z + z && p.z > c.z - z &&
			p.y < c.y + y && p.y > c.y - y &&
			b.owner != a.hitbox) {
			bullets.splice(i, 1);
			scene.remove(b.hitbox);
			a.health -= PROJECTILEDAMAGE;
			var color = a.material.color, percent = a.health / 100;
			a.material.color.setRGB(
				percent * color.r,
				percent * color.g,
				percent * color.b
			);
			hit = true;
			break;
	    }
	}
	// Bullet hits player
	if (distance(p, controls.getObject().position) < 25 && b.owner != controls.getObject()) {
	    $('#hurt').fadeIn(75);
	    health -= 10;
	    if (health < 0) health = 0;
	    val = health < 25 ? '<span style="color: darkRed">' + health + '</span>' : health;
	    $('#health').html(val);
	    bullets.splice(i, 1);
	    scene.remove(b.hitbox);
	    $('#hurt').fadeOut(350);
	}
	if (!hit) {
		console.log("on avance"); //TRACE
	    b.hitbox.translateX(speed * d.x);
	    //bullets[i].translateY(speed * bullets[i].direction.y);
	    b.hitbox.translateY(speed * d.y);
	    b.hitbox.translateZ(speed * d.z);
	}
    }
    
    // Update AI.
    for (var i = ai.list.length-1; i >= 0; i--) {
	var a = ai.list[i];
	if (a.health <= 0) {
	    ai.list.splice(i, 1);
	    scene.remove(a.hitbox);
	    kills++;
	    $('#score').html(kills * 100);
	    ai.addAI(scene);
	}
	// Move AI
	a.updateAi(scene, delta);
	
    }

    renderer.render(scene, cam); // Repaint
    
    // Death
    if (health <= 0) {
	runAnim = false;
	$(renderer.domElement).fadeOut();
	$('#radar, #hud, #credits').fadeOut();
	$('#introduction').fadeIn();
	$('#introduction').html('Ouch! Click to restart...');
	$('#introduction').one('click', function() {
	    location = location;
	    /*
	      $(renderer.domElement).fadeIn();
	      $('#radar, #hud, #credits').fadeIn();
	      $(this).fadeOut();
	      runAnim = true;
	      animate();
	      health = 100;
	      $('#health').html(health);
	      kills--;
	      if (kills <= 0) kills = 0;
	      $('#score').html(kills * 100);
	      cam.translateX(-controls.getObject().position.x);
	      cam.translateZ(-controls.getObject().position.z);
	    */
	});
    }
}

// Set up the objects in the world
function setupScene() {
    //Setup the scene
    map.setup(scene);
    
    // Health cube
    healthcube = new t.Mesh(
	new t.CubeGeometry(30, 30, 30),
	new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/health.png')})
    );
    healthcube.position.set(-UNITSIZE-15, 35, -UNITSIZE-15);
    scene.add(healthcube);
    
    // Lighting
    var directionalLight1 = new t.DirectionalLight( 0xF7EFBE, 0.7 );
    directionalLight1.position.set( 0.5, 1, 0.5 );
    scene.add( directionalLight1 );
    var directionalLight2 = new t.DirectionalLight( 0xF7EFBE, 0.5 );
    directionalLight2.position.set( -0.5, -1, -0.5 );
    scene.add( directionalLight2 );
}

var ai = new Ai_list();
var aiGeo = new t.CubeGeometry(30, 30, 30);

function getAIpath(a) {
    var p = getMapSector(a.hitbox.position);
    do { // Cop-out
	do {
	    var x = getRandBetween(0, map.size[1]-1);
	    var z = getRandBetween(0, map.size[2]-1);
	} while (map.blocsMap[0][x][z] > 0 || distance(p, new Vector3(x, 1, z)) < 3);
		var path = findAIpath(p, new Vector3(x, 1, z));
    } while (path.length == 0);
    return path;
}

/**
 * Find a path from one grid cell to another. (UNUSED)
 *
 * @param sX
 *   Starting grid x-coordinate.
 * @param sZ
 *   Starting grid z-coordinate.
 * @param eX
 *   Ending grid x-coordinate.
 * @param eZ
 *   Ending grid z-coordinate.
 * @returns
 *   An array of coordinates including the start and end positions representing
 *   the path from the starting cell to the ending cell.
 */
function findAIpath(sX, sZ, eX, eZ) {
    var backupGrid = grid.clone();
    var path = finder.findPath(sX, sZ, eX, eZ, grid);
    grid = backupGrid;
    return path;
}

function distance(P1, P2) {
    return Math.sqrt((P1.x-P2.x)*(P1.x-P2.x) + (P1.y-P2.y)*(P1.y-P2.y) + (P1.z-P2.z)*(P1.z-P2.z));
}

function getMapSector(v) {
    var x = Math.floor((v.x) / UNITSIZE );
    var y = Math.floor((v.y) / UNITSIZE);
    var z = Math.floor((v.z) / UNITSIZE );
    return {x: x, y: y, z: z};
}

/**
 * Check whether a Vector3 overlaps with a wall.
 *
 * @param v
 *   A THREE.Vector3 object representing a point in space.
 *   Passing controls.getObject().position is especially useful.
 * @returns {Boolean}
 *   true if the vector is inside a wall; false otherwise.
 */
function checkWallCollision(o) { //TODO : test de collision a chier Three.js doit en avoir un mieux
									// Il faut aussi que ca marche avec nimporte quel objet 
									// (ex : balles) la méthode doit être plus générale
    // var c = getMapSector(v);
	// var foo = new THREE.Vector3(v.x + hero.dimensions.x,v.y + hero.dimensions.y,v.z + hero.dimensions.z);
	// var c2 = getMapSector(foo);
    //console.log("avant test collision v.y = " + v.y);
	
	for(var ix=-1; ix <= 1; ix+=2){
		for(var iy=-1; iy <= 1; iy+=2) {
			for(var iz=-1; iz <= 1; iz+=2) {
				// Position v is on the middle of the bottom of the hitbox (thus "/2")
				var foo = new THREE.Vector3(o.hitbox.position.x + ix*o.dimensions.x * 0.5,
							    o.hitbox.position.y + iy*o.dimensions.y * 0.5, //TODO : changer ca pour l'instant les yeux sont à 50% de la taille...
							    o.hitbox.position.z + iz*o.dimensions.z * 0.5);
				var c2 = getMapSector(foo);
				if(c2.x < 1 || c2.y < 1 || c2.z < 1 || c2.x > map.size[1]-1 || c2.y > map.size[0]-1 || c2.z > map.size[2]-1) {
					return true;
				}
				if (map.blocsMap[c2.y][c2.x][c2.z] > 0)
					return true;	
			}
		}
	}
	
	return false;
	// }
    // if(c.x < 1 || c.y < 1 || c.z < 1 || c.x > map.size[1]-1 || c.y > map.size[0]-1 || c.z > map.size[2]-1) {
		// console.log("collision avec les bord de la map !"); //TRACE
		// return 1;
    // }
	// if(c2.x < 1 || c2.y < 1 || c2.z < 1 || c2.x > map.size[1]-1 || c2.y > map.size[0]-1 || c2.z > map.size[2]-1) {
		// console.log("collision avec les bord de la map !"); //TRACE
		// return 1;
    // }
	
	// console.log(foo.y); //TRACE
    // return map.blocsMap[c.y][c.x][c.z] > 0 || map.blocsMap[c2.y][c2.x][c2.z] > 0 ;
}

// Radar
function drawRadar() {
    var c = getMapSector(controls.getObject().position), context = document.getElementById('radar').getContext('2d');
    context.font = '10px Helvetica';
    for (var i = 0; i < map.size[1]; i++) {
	for (var j = 0, m = map.blocsMap[1][i].length; j < m; j++) {
	    var d = 0;
	    for (var k = 0, n = ai.list.length; k < n; k++) {
		var e = getMapSector(ai.list[k].hitbox.position);
		if (i == e.x && j == e.z) {
		    d++;
		}
	    }
	    if (i == c.x && j == c.z && d == 0) {
		context.fillStyle = '#0000FF';
		context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
	    }
	    else if (i == c.x && j == c.z) {
		context.fillStyle = '#AA33FF';
		context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
		context.fillStyle = '#000000';
		context.fillText(''+d, i*20+8, j*20+12);
	    }
	    else if (d > 0 && d < 10) {
		context.fillStyle = '#FF0000';
		context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
		context.fillStyle = '#000000';
		context.fillText(''+d, i*20+8, j*20+12);
	    }
	    else if (map.blocsMap[1][i][j] > 0) {
		context.fillStyle = '#666666';
		context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
	    }
	    else {
		context.fillStyle = '#CCCCCC';
		context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
	    }
	}
    }
}

var bullets = [];
var sphereMaterial = new t.MeshBasicMaterial({color: 0x333333});
var sphereGeo = new t.SphereGeometry(2, 6, 6);
function createBullet(obj) {
    var playerShooting = false;

    if (obj === undefined) {
		obj = controls.getObject();
		playerShooting = true;
    }
    var sphere = new t.Mesh(sphereGeo, sphereMaterial);
    sphere.position.set(obj.position.x, obj.position.y, obj.position.z);

    if (playerShooting) {
	
		var vector = controls.getDirection();
		sphere.ray = new t.Ray(
			obj.position,
			vector.normalize() //normalisation 3D pour un vecteur 2D (mais ca sera un vec3 à terme donc ...)
			);
    } else {
		var vector = hero.hitbox.position.clone();
		sphere.ray = new t.Ray(
			obj.position,
			vector.sub(obj.position).normalize()
		);
    }
    var col = new Collidable(sphere, new THREE.Vector3(3,3,3));
    col.owner = obj;
    
    bullets.push(col);
    scene.add(sphere);
    
    return sphere;
}

/*
  function loadImage(path) {
  var image = document.createElement('img');
  var texture = new t.Texture(image, t.UVMapping);
  image.onload = function() { texture.needsUpdate = true; };
  image.src = path;
  return texture;
  }
*/

function onDocumentMouseMove(e) {
    e.preventDefault();
    mouse.x = (e.clientX / WIDTH) * 2 - 1;
    mouse.y = - (e.clientY / HEIGHT) * 2 + 1;
}

// Handle window resizing
$(window).resize(function() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    ASPECT = WIDTH / HEIGHT;
    if (cam) {
	cam.aspect = ASPECT;
	cam.updateProjectionMatrix();
    }
    if (renderer) {
	renderer.setSize(WIDTH, HEIGHT);
    }
    $('#introduction, #hurt').css({width: WIDTH, height: HEIGHT,});
});

// Stop moving around when the window is unfocused (keeps my sanity!)
/*$(window).focus(function() {
    if (controls) controls.freeze = false;
});
$(window).blur(function() {
    if (controls) controls.freeze = true;
});*/

//Get a random integer between lo and hi, inclusive.
//Assumes lo and hi are integers and lo is lower than hi.
function getRandBetween(lo, hi) {
    return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
}



