// The Map classe contain all the information about about a specifique map
// including enemis initial position  (which will be compute in the game_engine)
//

function Map(nom) {

    this.loadJson = function(file) {

	// ========= Lecture de la premiere map dans fichier json =============
	var xhr = getXMLHttpRequest();
		
	// Chargement du fichier
	xhr.open("GET", './maps/' + file + '.json', false);
	xhr.send(null);
	if(xhr.readyState != 4 || (xhr.status != 200 && xhr.status != 0)) { // Code == 0 en local
		throw new Error("Failed to charge the map named \"" + file + "\" (HTTP code : " + xhr.status + ").");
	}
	var mapJsonData = xhr.responseText;
	
	// Analyse des données
	var mapData = JSON.parse(mapJsonData);
	this.blocsMap = mapData.terrain;
	this.size = mapData.size;

        xhr.abort(); // On ferme la connection
 
    }

    this.nom = nom;

    this.blocsMap = [];
    this.size = [0,0,0];

    this.loadJson(nom);
    
}

Map.prototype.setup = function(scene) {

    var UNITSIZE = 100, units = this.size[1];
    
    // Geometry: blocs
    var cube = new t.CubeGeometry(UNITSIZE, UNITSIZE, UNITSIZE);
    var materials = [
	new t.MeshLambertMaterial({/*color: 0x00CCAA,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg')}),
	new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-2.jpg')}),
	new t.MeshLambertMaterial({color: 0xFBEBCD}),
    ];
    for (var k = 0; k < this.size[0]; k++) { //z
	for (var i = 0; i < this.blocsMap[k].length; i++) {
	    for (var j = 0, m = this.blocsMap[k][i].length; j < m; j++) {
		if (this.blocsMap[k][i][j]) {
		    var bloc = new t.Mesh(cube, materials[this.blocsMap[k][i][j]-1]);
		    bloc.position.x = (i + 0.5) * UNITSIZE;
		    bloc.position.y = (k + 0.5) * UNITSIZE;
		    bloc.position.z = (j + 0.5) * UNITSIZE;
		    scene.add(bloc);
		}
	    }
	}
    }


    return true;
};