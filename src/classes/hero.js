// The hero class contain all the information about the player

UNITSIZE = 100; // TODO : Centraliser ces var qui se baladent

function Hero(name, mesh) {
	// standard attributs
	this.name = name;
	
	// aspect attributs
	this.hitbox = new THREE.Mesh(); // The hitbox also give the orientation, and position of the hero
	this.hitbox.position = new THREE.Vector3(400,600,400); // Starting position
	this.dimensions = new THREE.Vector3(UNITSIZE*0.4,UNITSIZE*0.8,UNITSIZE*0.4); // TODO : devrait etre contenu dans hitbox
	this.eyesPosition = new THREE.Vector3(0,UNITSIZE*0.6,0); //eyes position relativly to the hero
	
}

// Hero herite des methodes de Collidable
jQuery.extend( Hero.prototype, new Collidable());

