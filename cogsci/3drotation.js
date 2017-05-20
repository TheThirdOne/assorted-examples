// ## Now lets start

// declare a bunch of variable we will need later
var startTime	= Date.now();
var container;
var camera, scene, renderer, stats;
var cube, left, right;

// ## bootstrap functions
// initialiaze everything
init();

// ## Initialize everything
function init() {
	// test if webgl is supported
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	// create the camera
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 500;

	// create the Scene
	scene = new THREE.Scene();
	
	//add the object to the scene
	
	left = new THREE.Group();
  scene.add( left );
  left.add(makeObject(false));
  left.add(makeObject(true));
  left.position.x = -200;
	left.position.y = -100;
	left.position.z = -75;
  left.rotation.x += 0;
  
  right = new THREE.Group();
  scene.add( right );
  right.add(makeObject(false));
  right.add(makeObject(true));
  right.position.x = 200;
	right.position.y = -100;
	right.position.z = -75;
  right.rotation.x += 0;
  
	// create the container element
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// init the WebGL renderer and append it to the Dom
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	container.appendChild( renderer.domElement );
}
function makeObject(flipped){
  var cube, geo;
  cube = new THREE.Mesh( new THREE.BoxGeometry( 150, 50, 50 ));
	cube.position.x = flipped?50:-50;
	cube.position.y = 0;
	cube.position.z = 100;
	geo = new THREE.BoxGeometry( 50, 50, 150 );
  THREE.GeometryUtils.merge(geo, cube);
  cube = new THREE.Mesh(geo);
  cube.position.x = 0;
	cube.position.y = 50;
	cube.position.z = 50;
	geo = new THREE.BoxGeometry( 50, 50, 50 );
  THREE.GeometryUtils.merge(geo, cube);
  cube = new THREE.Mesh(geo);
  cube.position.x = 0;
	cube.position.y = 50;
	cube.position.z = 25;
	geo = new THREE.BoxGeometry( 50, 50, 100);
  THREE.GeometryUtils.merge(geo, cube);
  cube = new THREE.Mesh(geo,new THREE.MeshNormalMaterial());
  center(cube);
  return cube;
}
function center(obj){
  var box = new THREE.Box3().setFromObject( obj );
  box.center( obj.position ); // this re-sets the mesh position
  obj.position.multiplyScalar( - 1 );
}

var flip, deg, time;
function start(){
  var l = Math.random() > .5, r = Math.random() > .5;
  flip = l^r;
  direction = Math.random()>.666?0:(Math.random() > .5 ? 1:-1);
  deg = Math.floor(Math.random()*19)/18;
  left.children[0].visible = !l;
  left.children[1].visible = l;
  right.children[0].visible = !r;
  right.children[1].visible = r;
  right.rotation.x = left.rotation.x + (direction === 1?deg*Math.PI:0);
  right.rotation.y = left.rotation.y + (direction === 0?deg*Math.PI:0);
  right.rotation.z = left.rotation.z + (direction ===-1?deg*Math.PI:0);
  time = new Date().getTime();
  renderer.render( scene, camera );
}

var text = "";
var log = function(flip, deg, success, time){
  text += flip + "," + (deg*180) + "," + success + "," + time + "\n";
};
document.onkeydown = function(e){
  if(deg !== undefined && (e.keyCode === 65 || e.keyCode === 68)){
    var success = (e.keyCode === 68) ^ flip;
    log(flip, deg, success, new Date().getTime() - time);
    renderer.render( new THREE.Scene(), camera );
    setTimeout(start,1000);
  }
};
start();