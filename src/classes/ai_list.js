function Ai_list() {

    this.list = [];
    this.aiGeo = new t.CubeGeometry(20, 20, 20);
}

Ai_list.prototype.init = function(scene) {
    for (var i = 0; i < NUMAI; i++) {
	this.addAI(scene);
    }
}

Ai_list.prototype.addAI = function(scene) {
    
    o = new Ai()
    this.list.push(o);
    scene.add(o.hitbox);
}



/*Ai_list.prototype.addAI = function() {
    var c = getMapSector(cam.position);
    var aiMaterial = new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/face.png')});
    var o = new t.Mesh(aiGeo, aiMaterial);
    do {
	var x = getRandBetween(0, map.size[0]-1);
	var z = getRandBetween(0, map.size[1]-1);
    } while (map.blocsMap[x][z] > 0 || (x == c.x && z == c.z));
    x = Math.floor(x - map.size[0]/2) * UNITSIZE;
    z = Math.floor(z - map.size[0]/2) * UNITSIZE;
    o.position.set(x, UNITSIZE * 0.15, z);
    o.health = 100;
    //o.path = getAIpath(o);
    o.pathPos = 1;
    o.lastRandomX = Math.random();
    o.lastRandomZ = Math.random();
    o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
    ai.push(o);
    scene.add(o);
};

Ai_list.prototype.setupAI = function() {
    for (var i = 0; i < NUMAI; i++) {
	addAI();
    }
};*/