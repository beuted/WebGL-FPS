function Ai() {
    this.geo = new t.CubeGeometry(20, 20, 20);
    this.material = new t.MeshBasicMaterial({/*color: 0xEE3333,*/
	map: t.ImageUtils.loadTexture('images/face.png')}); // Attention : on le charge plusieurs fois ?

    this.hitbox = new t.Mesh(aiGeo, this.material);
    this.hitbox.position.set(3*UNITSIZE,1.40*UNITSIZE,3*UNITSIZE); // Attention : a changer
    this.dimensions = new THREE.Vector3(20,20,20); // TODO : devrait etre contenu dans hitbox
    
    
    this.health = 100;
    this.lastShot = Date.now();

    this.pathPos = 1;
    this.lastRandomX = Math.random();
    this.lastRandomZ = Math.random();
}

Ai.prototype.updateAi = function(scene, delta) {
    var aispeed = delta * MOVESPEED;

    // Move AI
    var r = Math.random();
    if (r > 0.995) {
		this.hitbox.lastRandomX = Math.random() * 2 - 1;
		this.hitbox.lastRandomZ = Math.random() * 2 - 1;
    }
    this.hitbox.translateX(aispeed * this.lastRandomX);
    this.hitbox.translateZ(aispeed * this.lastRandomZ);
    var c = getMapSector(this.hitbox.position);
    if (c.x < 0 || c.x >= map.size[1] || c.y < 0 || c.y >= map.size[2] || checkWallCollision(this) ) {
		this.hitbox.translateX(-2 * aispeed * this.lastRandomX);
		this.hitbox.translateZ(-2 * aispeed * this.lastRandomZ);
		this.lastRandomX = Math.random() * 2 - 1;
		this.lastRandomZ = Math.random() * 2 - 1;
    }
    if (c.x < -1 || c.x > map.size[1] || c.z < -1 || c.z > map.size[2]) {
	// TODO : ca a rien a faire là
	//ai.splice(i, 1);
	//scene.remove(a);
	//addAI();
    }
    /*
      var c = getMapSector(this.position);
      if (this.pathPos == this.path.length-1) {
      console.log('finding new path for '+c.x+','+c.z);
      this.pathPos = 1;
      this.path = getAIpath(a);
      }
      var dest = this.path[this.pathPos], proportion = (c.z-dest[1])/(c.x-dest[0]);
      this.translateX(aispeed * proportion);
      this.translateZ(aispeed * 1-proportion);
      console.log(c.x, c.z, dest[0], dest[1]);
      if (c.x == dest[0] && c.z == dest[1]) {
      console.log(c.x+','+c.z+' reached destination');
      this.PathPos++;
      }
    */
    var cc = getMapSector(hero.hitbox.position);
	
    if (Date.now() > this.lastShot + 1500 && distance(this.hitbox.position, hero.hitbox.position) < 4*UNITSIZE) {
		console.log("shot fire !"); //TRACE
		createBullet(this.hitbox);
		this.lastShot = Date.now();
    }


    return true;
}