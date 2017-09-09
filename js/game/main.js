(function(){
var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];
var NPCs = [];
var NPCObjects = [];
var grasses = [];

var raycaster;
var facecaster;
var	forwardcaster;
var backcaster;
var leftcaster;
var rightcaster;

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var dialogue = {
	main: document.getElementById( 'dialogue' ),
	name: document.getElementById( 'name' ),
	portrait: document.getElementById( 'portrait' ),
	text: document.getElementById( 'dialogue-box-text' )
}

dialogue.main.style.display = 'none';

var item = {
	image: document.getElementById( 'item-pic' )
}

item.image.src = "images/sword.png";

/*
var footsteps = new Audio("sounds/footsteps-1.mp3");
var backgroundMusic = new Audio("sounds/MartyGotsaPlan.mp3");
var backgroundSounds = new Audio("sounds/forestAmbience.mp3");
*/

//Create an AudioListener and add it to the camera
var listener = new THREE.AudioListener();
var audioLoader = new THREE.AudioLoader();



// create a global audio source
var footsteps = new THREE.Audio( listener );
var backgroundMusic = new THREE.Audio( listener );
var backgroundSounds = new THREE.Audio( listener );

footsteps.loop = true;
footsteps.muted = true;
backgroundMusic.loop = true;
backgroundSounds.loop = true;









var renderDistance = 750;


const movementSpeed = 30;
const jumpHeight = 75;
const characterSize = 10;

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

	var element = document.body;

	var pointerlockchange = function ( event ) {

		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

			controlsEnabled = true;
			controls.enabled = true;

			blocker.style.display = 'none';

		} else {

			controls.enabled = false;

			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';

			instructions.style.display = '';

		}

	};

	var pointerlockerror = function ( event ) {

		instructions.style.display = '';

	};



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
		element.requestPointerLock();

	}, false );

} else {

	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}


var controlsEnabled = false;
var speaking = false;
var stopSpeaking = false;

var clicking = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();



function random(a, b) {
	if (a > b) {
		var t = a;
		a = b;
		b = t;
	}
	var dist = Math.abs(b - a);
	return (Math.random() * dist) + a;
}

var NPCWanderRange = 50;
var NPCMaxWaitTime = 5000;
var NPCMinWaitTime = 500;

function NPC(npcObject){
	this.object = npcObject;
	this.goal = new THREE.Vector3();
	var waitTime = random(NPCMinWaitTime, NPCMaxWaitTime);
	var lastTime = performance.now();

	var generateGoal = function(goal, objectPos){
		goal.copy(objectPos);
		
		goal.x += random(-NPCWanderRange, NPCWanderRange);
		goal.z += random(-NPCWanderRange, NPCWanderRange);

	}
	generateGoal(this.goal, this.object.position);

	var waiting = false;

	this.think = function(delta) {
		var distance = this.goal.distanceTo(this.object.position);
		if (!waiting) {
				waiting = true;
				//console.log(this.object + " has began waiting");
				lastTime = performance.now();
				waitTime = random(NPCMinWaitTime, NPCMaxWaitTime);
		} else {
			if (distance <= 20) {
				if (performance.now() - lastTime >= waitTime) {
					waiting = false;
					generateGoal(this.goal, this.object.position);
					//console.log(this.object + " stopped waiting");
				}
			} else {
				var direction = (new THREE.Vector3()).copy(this.object.position);
				direction.sub(this.goal);
				//direction.normalize();
				direction.x = -Math.sign(direction.x);
				direction.z = -Math.sign(direction.z);
				direction.x = direction.x * Math.min(Math.abs(this.goal.x - this.object.position.x), movementSpeed * delta);
				direction.z = direction.z * Math.min(Math.abs(this.goal.z - this.object.position.z), movementSpeed * delta);
				this.object.position.add(direction);
				//console.log(this.object + "is moving");
			}
		}
	}
}


function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, renderDistance);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x33bbff, 0, renderDistance);

	var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
	light.position.set( 0.5, 1, 0.75 );
    scene.add(light);

   

	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );

	var onKeyDown = function ( event ) {

		if (controlsEnabled) {
			switch ( event.keyCode ) {

				case 38: // up
				case 87: // w
					moveForward = true;
					break;

				case 37: // left
				case 65: // a
					moveLeft = true; break;

				case 40: // down
				case 83: // s
					moveBackward = true;
					break;

				case 39: // right
				case 68: // d
					moveRight = true;
					break;

				case 32: // space
					if ( canJump === true ) velocity.y += (jumpHeight);
					canJump = false;
					break;
			}

		}

		var muted = !(moveForward || moveLeft || moveBackward || moveRight);
		footsteps.setVolume(muted ? 0 : .5);

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}
		var muted = !(moveForward || moveLeft || moveBackward || moveRight);
		footsteps.setVolume(muted ? 0 : .5);

	};

	var onMouseDown = function ( event ) {
		clicking = true;
		item.image.src = "images/sword-swing.png";
		if (speaking) {
			stopSpeaking = true;
		}
	}

	var onMouseUp = function ( event ) {
		clicking = false;
		item.image.src = "images/sword.png";
		if (stopSpeaking) {
			speaking = false;
			controlsEnabled	= true;
			dialogue.main.style.display = 'none';
			stopSpeaking = false;
		}
	}

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mouseup', onMouseUp, false );

	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, characterSize);
	facecaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 1 );
	

	// floor

	geometry = new THREE.PlaneBufferGeometry( 20000, 20000 );
	geometry.rotateX(- Math.PI / 2 );

	material = new THREE.MeshBasicMaterial( { color: 0x00AF11 } );

	ground = new THREE.Mesh( geometry, material );
	ground.receiveShadow = true;
	scene.add( ground );

	// other floor 

	/*
	geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	geometry.rotateX( - Math.PI / 2 );

	for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

		var vertex = geometry.vertices[ i ];
		vertex.x += Math.random() * 20 - 10;
		vertex.y += Math.random() * 2;
		vertex.z += Math.random() * 20 - 10;

	}

	for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

		var face = geometry.faces[ i ];
		face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
		face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
		face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

	}

	material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
	*/

	// objects

	var trunk = new THREE.MeshPhongMaterial( { color: 0x7f3300, shininess: 30 } );
	var leaf = new THREE.MeshPhongMaterial( { color: 0x007f0e, shininess: 30 } );
	var castleMaterial = new THREE.MeshPhongMaterial( { color: 0xeeeeee, shininess: 0 } );
	var tree;

	var manager = new THREE.LoadingManager();
	var loader = new THREE.OBJLoader( manager );


	loader.load(
		'models/PineTree2.obj',
		function ( object ) {
			tree = object;
			tree.children[1].material = trunk;
			tree.children[0].material = leaf;
			for (var i = 0; i < 1000; i++) {
				var newTree = tree.clone();
				newTree.castShadow = true;
				rScale = (Math.random()*20) + 5;
				newTree.scale.x = rScale;
				newTree.scale.y = rScale;
				newTree.scale.z = rScale;
				newTree.position.x = (Math.random()*5000) - 2500;
				newTree.position.z = (Math.random()*5000) - 2500;
				newTree.position.y = rScale/10;
				scene.add( newTree );
				objects.push( newTree.children[1] );
			}
		}
	);



	loader.load(
		'models/Castle2.obj',
		function ( object ) {
			castle = object;
			
			console.log(castle.children);

			castle.children[0].material = castleMaterial;
			var origin = new THREE.Vector3();
			for (var i = 0; i < 100; i++) {
				var newCastle = castle.clone();
				newCastle.castShadow = true;
				newCastle.receiveShadow = true;
				rScale = (Math.random()*20) + 10;
				newCastle.scale.x = rScale;
				newCastle.scale.y = rScale;
				newCastle.scale.z = rScale;
				newCastle.position.x = (Math.random()*5000) - 2500;
				newCastle.position.z = (Math.random()*5000) - 2500;
				while (newCastle.position.distanceTo(origin) <= rScale * 2 + 200) {
					newCastle.position.x = (Math.random()*5000) - 2500;
					newCastle.position.z = (Math.random()*5000) - 2500;
				}
				newCastle.position.y = rScale/2;
				scene.add( newCastle );
				objects.push( newCastle);
			}
		}
	);

	//NPCs

	function loadcreature(name, image, x, y, scale) {
		var creatureMap = new THREE.TextureLoader().load( image );
		//creatureMap.magFilter = THREE.NearestFilter;
		//creatureMap.minFilter = THREE.NearestFilter;
		var creatureMaterial = new THREE.SpriteMaterial( { map: creatureMap, color: 0xffffff, fog: true } );
		var creature = new THREE.Sprite( creatureMaterial );
		creature.scale.set(scale, scale, scale);
		creature.position.y = scale / 2;
		creature.position.z = x;
		creature.position.x = y;
		scene.add(creature);
		NPCs.push(new NPC(creature));
		NPCObjects.push( creature );
		creature.name = name;
		return creature;
	}



	var fraknoon = loadcreature("fraknoon", "images/Fraknoon2.png", -30, 0, 16)
	fraknoon.speak = function() {
		controlsEnabled = false;
		speaking = true;
		dialogue.name.innerHTML = "Fraknoon";
		dialogue.portrait.src = "images/FraknoonD.png"
		dialogue.text.innerHTML = "Ow, don't hit me!";
		dialogue.main.style.display = '';
	}

	var shane = loadcreature("Shane", "images/Shane.png", 50, 0, 16)
	//shane.health = 50;
	shane.speak = function() {
		//
	}

	//for (var i = 0; i < 1; i++) {
		//var bubdergle = loadcreature("Bubdergle", "images/Bubdergle.png", (Math.random()*500) - 250, (Math.random()*500) - 250, 10)
		//bubdergle.health = 10;
		//bubdergle.speak = function() {
			//
		//}
	//}

	

	var gorgo = loadcreature("gorgo", "images/gorgo.png", 0, -100, 30)
	//gorgo.health = 1000;
	gorgo.speak = function() {
		//gorgo.health -= 1;
		//if (gorgo.health == 0) {
		//	scene.remove(gorgo)
		//}
	}



	//Grass

	var grassMap = new THREE.TextureLoader().load( "images/Grass.png" );
	grassMap.magFilter = THREE.NearestFilter;
	grassMap.minFilter = THREE.NearestFilter;
	var grassMaterial = new THREE.SpriteMaterial( { map: grassMap, color: 0xffffff, fog: true } );
	var grass = new THREE.Sprite( grassMaterial );
	for (var i = 0; i < 10000; i++) {
		var newGrass = grass.clone();
		newGrass.position.x = (Math.random()*5000) - 2500;
		newGrass.position.z = (Math.random()*5000) - 2500;
		newGrass.position.y = 0;
		newGrass.scale.set(6,12,6);
		scene.add( newGrass );
		grasses.push(newGrass);
	}


	// other objects

	

	geometry = new THREE.BoxGeometry( 20, 20, 20 );

	for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

		var face = geometry.faces[ i ];
		face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
		face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
		face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

	}

	for ( var i = 0; i < 500; i ++ ) {

		material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.x = (Math.random()*5000) - 2500;//Math.floor( Math.random() * 20 - 10 ) * 20;
		mesh.position.y = (Math.random()*5) + 1;//Math.floor( Math.random() * 20 ) * 20 + 10;
		mesh.position.z = (Math.random()*5000) - 2500;//Math.floor( Math.random() * 20 - 10 ) * 20;
		var rot = new THREE.Euler(random(-1, 1), random(-1, 1), random(-1, 1),'XYZ');
		mesh.setRotationFromEuler(rot);
		//mesh.rotation.x = rot.x;
		//mesh.rotation.y = rot.y;
		//mesh.rotation.z = rot.z;
		scene.add( mesh );

		material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

		objects.push( mesh );

	}

	

	//

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0x33bbff );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

/*
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap; // default THREE.PCFShadowMap

	//Create a DirectionalLight and turn on shadows for the light
	var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
	light.position.set( 0, 1, 0); 			//default; light shining from top
	light.castShadow = true;            // default false
	scene.add( light );

	//Set up shadow properties for the light
	light.shadow.mapSize.width = 512;  // default
	light.shadow.mapSize.height = 512; // default
	light.shadow.camera.near = 0.5;       // default
	light.shadow.camera.far = 500      // default
*/
	//

/*
var footsteps = new Audio("sounds/footsteps-1.mp3");
var backgroundMusic = new Audio("sounds/MartyGotsaPlan.mp3");
var backgroundSounds = new Audio("sounds/forestAmbience.mp3");
*/


	// setup audio
	camera.add( listener );
	//Load a sound and set it as the Audio object's buffer
	audioLoader.load( 'sounds/footsteps-1.mp3', function( buffer ) {
		footsteps.setBuffer(buffer);
		backgroundSounds.setLoop(true);
		footsteps.setVolume(0);
		footsteps.play();
	});
	audioLoader.load( 'sounds/forestAmbience.mp3', function( buffer ) {
		backgroundSounds.setBuffer(buffer);
		backgroundSounds.setLoop(true);
		backgroundSounds.setVolume(0.25);
		backgroundSounds.play();
	});
	audioLoader.load( 'sounds/MartyGotsaPlan.mp3', function( buffer ) {
		backgroundMusic.setBuffer(buffer);
		backgroundMusic.setLoop(true);
		backgroundMusic.setVolume(0.5);
		backgroundMusic.play();
	});



	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function perp( v ) {
	var tmp = v.x;
	v.x = v.z;
	v.z = tmp;
	return v;
}


function animNPCs(){

}

	var forwardVector = new THREE.Vector3(0, 0, -1);
	var backwardVector = new THREE.Vector3(0, 0, 1);
	var leftVector = new THREE.Vector3(-1, 0, 0);
	var rightVector = new THREE.Vector3(1, 0, 0);
	var camPos = new THREE.Vector3();
	var moveDirection = new THREE.Vector3();
	var adjustedDirection = new THREE.Vector3();
	var forwardcaster = new THREE.Raycaster(camPos, adjustedDirection, 0, characterSize);

	Math.radians = function(degrees) {
  		return degrees * Math.PI / 180;
	};

function animate() {

    stats.begin();



	if ( controlsEnabled ) {

		velocity.x = 0;
		velocity.z = 0;

		//velocity.y -= 9.8 * 100.0; // 100.0 = mass
		velocity.y -= (jumpHeight / 9.8);
		var controlObject = controls.getObject();
			camPos = controlObject.position;



		raycaster.ray.origin.copy( controlObject.position );
		//raycaster.ray.origin.y -= 5;
		moveDirection.set(0, 0, 0);
		
		if (moveForward) {
			moveDirection.z += -1;
		}
		if (moveBackward) {
			moveDirection.z += 1;
		}
		if (moveLeft) {
			moveDirection.x += -1;
		}
		if (moveRight) {
			moveDirection.x += 1;
		}



		adjustedDirection.copy(moveDirection);
		adjustedDirection.applyQuaternion(controlObject.quaternion);
		forwardcaster.ray.origin = (camPos);
		//forwardcaster.ray.origin.y -= 5;
		forwardcaster.ray.direction = (adjustedDirection);

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		for (var i = 0; i < NPCs.length; i++) {
			NPCs[i].think(delta);
		}


		var isForwardClear = true;
		//var grassRot = new THREE.Euler(0, 0, Math.cos(time / 2),'XYZ');
		var grassRot = Math.radians(15) * Math.cos(time / 1000);
		grasses[1].material.rotation = grassRot;

		// TEST RENDER DISTANCE
	    for (var i = 0; i < objects.length; i++) {
	    	var obj = objects[i];
	    	var pos = obj.position;
	    	var distance = pos.distanceTo(controlObject.position);
	    	var canRender = (distance < renderDistance);
	    	//obj.visible = canRender;
	    	if (canRender && isForwardClear) {
	    		var intersected = forwardcaster.intersectObject(obj, true);
	    		isForwardClear = (intersected.length == 0);
	    		if (!isForwardClear) {
	    			//break;
	    		}
	    	}



	    }

		var intersections 		= raycaster.intersectObjects( objects );
		
		var isOnObject	= intersections.length > 0;

		facecaster.setFromCamera( new THREE.Vector2() , camera, 0, characterSize);
		var intersects = facecaster.intersectObjects( NPCObjects );

		// TODO: NPC dialog
		if (intersects.length > 0 && clicking && !stopSpeaking && intersects[0].distance < 3 ) {
			item.image.src = "images/sword-hit.png";
			//console.log( intersects[0].object.name );
			intersects[0].object.speak();
		}



		

		if (isForwardClear) {
			velocity.x = moveDirection.x * movementSpeed;
			velocity.z = moveDirection.z * movementSpeed;
		}

		if ( isOnObject) {
			velocity.y = Math.max(0, Math.min(velocity.y, (jumpHeight)));
			canJump = true;
		}

		

		controlObject.translateX( velocity.x * delta );
		controlObject.translateY( velocity.y * delta );
		controlObject.translateZ( velocity.z * delta );

		if ( controlObject.position.y < 10 ) {

			velocity.y = 0;
			controlObject.position.y = 10;

			canJump = true;

		}

		prevTime = time;
        stats.end();
	}

	renderer.render( scene, camera );
	requestAnimationFrame(animate);
}




//backgroundSounds.play();
//backgroundMusic.play();
//footsteps.play();

init();
animate();	
})();

