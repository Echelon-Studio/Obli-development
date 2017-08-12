var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];
var NPCs = [];

var raycaster;
var facecaster;
var	forwardcaster;
var backcaster;
var leftcaster;
var rightcaster;

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var footsteps = new Audio("sounds/footsteps-1.mp3");
var backgroundMusic = new Audio("sounds/MartyGotsaPlan.mp3");
footsteps.loop = true;
footsteps.muted = true;
backgroundMusic.loop = true;
backgroundMusic.play();
footsteps.play();


const movementSpeed = 20;
const jumpHeight = 50;
const characterSize = 10;

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

init();
animate();

var controlsEnabled = false;

var clicking = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x33bbff, 0, 750 );

	var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
	light.position.set( 0.5, 1, 0.75 );
	scene.add( light );

	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );

	var onKeyDown = function ( event ) {

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
		footsteps.muted = !(moveForward || moveLeft || moveBackward || moveRight);

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
		footsteps.muted = !(moveForward || moveLeft || moveBackward || moveRight);

	};

	var onMouseDown = function ( event ) {
		console.log("CLICK");
		clicking = true;
	}

	var onMouseUp = function ( event ) {
		clicking = false;
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

			for (var i = 0; i < 100; i++) {
				var newCastle = castle.clone();
				rScale = (Math.random()*20) + 10;
				newCastle.scale.x = rScale;
				newCastle.scale.y = rScale;
				newCastle.scale.z = rScale;
				newCastle.position.x = (Math.random()*5000) - 2500;
				newCastle.position.z = (Math.random()*5000) - 2500;
				newCastle.position.y = rScale/2;
				scene.add( newCastle );
				objects.push( newCastle.children[0] );
			}
		}
	);

	var fraknoonMap = new THREE.TextureLoader().load( "images/Fraknoon2.png" );
	//fraknoonMap.magFilter = THREE.NearestFilter;
	//fraknoonMap.minFilter = THREE.NearestFilter;
	var fraknoonMaterial = new THREE.SpriteMaterial( { map: fraknoonMap, color: 0xffffff, fog: true } );
	var fraknoon = new THREE.Sprite( fraknoonMaterial );
	fraknoon.scale.set(16,16,16);
	fraknoon.position.y = 8;
	fraknoon.position.z = -20;
	scene.add(fraknoon);
	NPCs.push( fraknoon );
	fraknoon.name = "fraknoon";

	var fraknoon2 = new THREE.Sprite( fraknoonMaterial );
	fraknoon2.scale.set(16,16,16);
	fraknoon2.position.y = 8;
	fraknoon2.position.z = -40;
	scene.add(fraknoon2);
	NPCs.push( fraknoon2 );
	fraknoon2.name = "fraknoon2";

	var grassMap = new THREE.TextureLoader().load( "images/Grass.png" );
	grassMap.magFilter = THREE.NearestFilter;
	grassMap.minFilter = THREE.NearestFilter;
	var grassMaterial = new THREE.SpriteMaterial( { map: grassMap, color: 0xffffff, fog: true } );
	var grass = new THREE.Sprite( grassMaterial );
	for (var i = 0; i < 10000; i++) {
		var newGrass = grass.clone();
		newGrass.position.x = (Math.random()*5000) - 2500;
		newGrass.position.z = (Math.random()*5000) - 2500;
		newGrass.position.y = 3;
		newGrass.scale.set(6,6,6);
		scene.add( newGrass );
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
		var rot = new THREE.Euler(Math.random(),Math.random(),Math.random(),'XYZ');
		mesh.rotation.x = rot.x;
		mesh.rotation.y = rot.y;
		mesh.rotation.z = rot.z;
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

	//

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

function animate() {

	requestAnimationFrame( animate );
	

	if ( controlsEnabled ) {
		var controlObject = controls.getObject();

		raycaster.ray.origin.copy( controlObject.position );
		//raycaster.ray.origin.y -= 5;

		var moveDirection = new THREE.Vector3();
		if (moveForward) {
			moveDirection.add(new THREE.Vector3(0, 0, -1));
		}
		if (moveBackward) {
			moveDirection.add(new THREE.Vector3(0, 0, 1));
		}
		if (moveLeft) {
			moveDirection.add(new THREE.Vector3(-1, 0, 0));
		}
		if (moveRight) {
			moveDirection.add(new THREE.Vector3(1, 0, 0));
		}

		var adjustedDirection = (new THREE.Vector3()).copy(moveDirection);
		adjustedDirection.applyQuaternion(controlObject.quaternion);


		forwardcaster = new THREE.Raycaster( controlObject.position, adjustedDirection, 0, characterSize);

		var intersections 		= raycaster.intersectObjects( objects );
		var forwardintersects 	= forwardcaster.intersectObjects( objects );
		
		var isOnObject	= intersections.length > 0;
		var isForwardClear 	= forwardintersects.length == 0;

		facecaster.setFromCamera( new THREE.Vector2() , camera, 0, characterSize);
		var intersects = facecaster.intersectObjects( NPCs );

		// TODO: NPC dialog
		if (intersects.length > 0 && clicking && intersects[0].distance < 3 ) console.log( "Hi, this is " + intersects[0].object.name );

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x = 0;
		velocity.z = 0;

		//velocity.y -= 9.8 * 100.0; // 100.0 = mass
		velocity.y -= (jumpHeight / 9.8);

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

	}

	renderer.render( scene, camera );

}