(function(){

var objects = [];
var grasses = [];

var raycaster;
var facecaster;

var blocker = document.getElementById( 'blocker' );

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

var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var renderDistance = 750;

const movementSpeed = 30;
const jumpHeight = 75;
const characterSize = 10;

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

var currentDialog = null;

// clicking is a state. 0 for mouse up edge, 1 for mouse up idle, 2 for mouse Down edge, 3 for mouse Down idle
var clicking = 0;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;


var prevTime = performance.now();
var velocity = new THREE.Vector3();

var sword = new Item("Sword", "Weapon", ["images/sword.png", "images/sword-swing.png", "images/sword-hit.png"],
    function(objectClicked, imageHolder, images){ // onMouseDown
        if (objectClicked !== null && objectClicked.isNPC !== null) {
            imageHolder.src = images[2];
        } else {
            imageHolder.src = images[1];
        }
    },
    function(objectClicked, imageHolder, images){ // onMouseUp
        imageHolder.src = images[0];
    }
);

var character = new Character();
character.currentItem = sword;

function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, renderDistance);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x33bbff, 0, renderDistance);

	var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
	light.position.set( 0.5, 1, 0.75 );
    scene.add(light);

   

	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );

	pointerlocksetup(controls);



	var onKeyDown = function ( event ) {

		if (controls.canMove) {
			switch ( event.keyCode ) {

				case 38: // up
				case 87: // w
					moveForward = true;
					break;

				case 37: // left
				case 65: // a
					moveLeft = true; 
					break;

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

	var onMouseDown = function ( ) {
		clicking = 2;
		/*
		item.image.src = "images/sword-swing.png";
		if (speaking) {
			stopSpeaking = true;
		}
		*/

	};

	var onMouseUp = function ( ) {
		clicking = 0;
		/*
		item.image.src = "images/sword.png";
		if (stopSpeaking) {
			speaking = false;
			controls.canMove = true;
			dialogue.main.style.display = 'none';
			stopSpeaking = false;
		}
		*/
	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mouseup', onMouseUp, false );

	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, characterSize);
	facecaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 1 );
	facecaster.near = 0;
	facecaster.far = 1;
	

	// floor

	geometry = new THREE.PlaneBufferGeometry( 20000, 20000 );
	geometry.rotateX(- Math.PI / 2 );

	material = new THREE.MeshBasicMaterial( { color: 0x00AF11 } );

	ground = new THREE.Mesh( geometry, material );
	ground.receiveShadow = true;
	scene.add( ground );

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
			for (var i = 0; i < 600; i++) {
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
			
			//console.log(castle.children);

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

	function loadNPC(name, image, x, z, scale, isSpeaker) {
		var creatureMap = new THREE.TextureLoader().load( image );
		//creatureMap.magFilter = THREE.NearestFilter;
		//creatureMap.minFilter = THREE.NearestFilter;
		var creatureMaterial = new THREE.SpriteMaterial( { map: creatureMap, color: 0xffffff, fog: true } );
		var creature = new THREE.Sprite( creatureMaterial );
		creature.scale.set(scale, scale, 0);
        creature.position.x = x;
        creature.position.y = scale / 2;
		creature.position.z = z;
		scene.add(creature);
		var creaturenpc;
		if (isSpeaker) {
		    creaturenpc = new Speaker(creature);
        } else {
		    creaturenpc = new NPC(creature);
        }
        creature.isNPC = true;
		creature.NPC = creaturenpc;
		console.log("creature NPC flag set: " + creature.isNPC);
		NPCs.push(creaturenpc);
		objects.push(creature);
		creature.name = name;
		return creaturenpc;
	}



	var fraknoon = loadNPC("fraknoon", "images/Fraknoon2.png", -30, 0, 16, true);
	fraknoon.dialog = new Dialog("Fraknoon", "images/FraknoonD.png", "Ow, don't hit me!!!");

	var shane = loadNPC("Shane", "images/Shane.png", 50, 0, 16);

	var gorgo = loadNPC("gorgo", "images/gorgo.png", 0, -100, 20);



	//Grass

	var grassMap = new THREE.TextureLoader().load( "images/Grass.png" );
	grassMap.magFilter = THREE.NearestFilter;
	grassMap.minFilter = THREE.NearestFilter;
	var grassMaterial = new THREE.SpriteMaterial( { map: grassMap, color: 0xffffff, fog: true } );
	var grass = new THREE.Sprite( grassMaterial );
	for (var i = 0; i < 4000; i++) {
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

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0x33bbff );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );


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

    renderer.setSize(window.innerWidth, window.innerHeight);

}

var camPos = new THREE.Vector3();
var moveDirection = new THREE.Vector3();
var adjustedDirection = new THREE.Vector3();
var forwardcaster = new THREE.Raycaster(camPos, adjustedDirection, 0, characterSize);

Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};

function animate() {




    stats.begin();
		velocity.x = 0;
		velocity.z = 0;

		//velocity.y -= 9.8 * 100.0; // 100.0 = mass
		velocity.y -= (jumpHeight / 9.8);
		var controlObject = controls.getObject();
			camPos = controlObject.position;



		if (controls.canMove) {
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
			forwardcaster.ray.direction = (adjustedDirection);

			var isForwardClear = true;
			// TEST RENDER DISTANCE
		    for (var i = 0; i < objects.length; i++) {
		    	var obj = objects[i];
		    	var pos = obj.position;
		    	var distance = pos.distanceTo(controlObject.position);
		    	var canRender = (distance < renderDistance);
		    	var canCollide = (obj.isNPC == null);
		    	//obj.visible = canRender;
		    	if (canCollide && canRender && isForwardClear) {
		    		var intersected = forwardcaster.intersectObject(obj, true);
		    		isForwardClear = (intersected.length === 0);
		    		if (!isForwardClear) {
		    			break;
		    		}
		    	}
		    }
			if (isForwardClear) {
				velocity.x = moveDirection.x * movementSpeed;
				velocity.z = moveDirection.z * movementSpeed;
			}

		}

		
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;
		

		for (var i = 0; i < NPCs.length; i++) {
			NPCs[i].think(delta);
		}


		//var grassRot = new THREE.Euler(0, 0, Math.cos(time / 2),'XYZ');
		grasses[1].material.rotation = Math.radians(15) * Math.cos(time / 1000);


		var intersections 		= raycaster.intersectObjects( objects );
		
		var isOnObject	= intersections.length > 0;

		facecaster.setFromCamera( new THREE.Vector2() , camera, 0, characterSize);
		var intersects = facecaster.intersectObjects( objects );
		var objectInFront = null;
		var interactionObject = null;
		if (intersects.length > 0) {
		    objectInFront = intersects[0];
		    for (var i=0; i < intersects.length; i++) {
		        console.log(intersects[i]);
		        if (intersects[i].object.isNPC != null && intersects[i].distance <= DEFAULT_TOOL_DISTANCE){
		            interactionObject = intersects[i].object;
		            break;
                }
            }
        }

		// handle clicking
        if (clicking === 0) {
            if (character.currentItem != null) {
                character.currentItem.onMouseUp(objectInFront);
            }
            clicking = 1;
        } else if (clicking === 2) {
		    // do npc dialog

            if (currentDialog != null) {
                currentDialog.hide();
                currentDialog = null;
                controls.canMove = true;
            } else if (interactionObject !== null && interactionObject.NPC instanceof Speaker) {
                currentDialog = interactionObject.NPC.dialog;
                currentDialog.show();
                controls.canMove = false;
            }  else if (character.currentItem != null) {
                character.currentItem.onMouseDown(interactionObject);
            }
            clicking = 3;
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
	renderer.render( scene, camera );

	requestAnimationFrame(animate);
}

init();
animate();	
})();