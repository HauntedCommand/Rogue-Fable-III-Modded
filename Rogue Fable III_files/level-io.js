/*global gs, game, console, localStorage*/
/*global levelController, Item, frameSelector*/
/*global TILE_SIZE, SCALE_FACTOR, PLAYER_FRAMES*/
/*jshint esversion: 6, loopfunc: true*/
'use strict';

// LOAD_JSON_LEVEL:
// Load a level from a .json file
// ************************************************************************************************
gs.loadJSONLevel = function (levelName) {
	var tileTypeMap, data, object, frame, x, y, frameOffset;
	
	data = game.cache.getJSON(levelName);
	
	if (data.tilesets[1]) {
		frameOffset = data.tilesets[1].firstgid - 1;
	}
	
	
	tileTypeMap = this.parseJSONMap(levelName);
	this.numTilesX = tileTypeMap.length;
	this.numTilesY = tileTypeMap[0].length;
	this.initiateTileMap();
	this.createTileMap({x: 0, y: 0}, tileTypeMap);
	
	// Load NPCs and Items:
	for (let i = 0; i < data.layers[1].objects.length; i += 1) {
		object = data.layers[1].objects[i];
		frame = object.gid - 1;
		x = Math.round(object.x / (TILE_SIZE / SCALE_FACTOR));
		y = Math.round(object.y / (TILE_SIZE / SCALE_FACTOR)) - 1;
		
		
		if (data.tilesets[1]) {
			// Loading Characters:
			if ((gs.debugProperties.spawnMobs || gs.zoneName === 'TestLevel') && this.getNameFromFrame(frame - frameOffset, this.npcTypes)) {
				gs.createNPC({x: x, y: y}, this.getNameFromFrame(frame - frameOffset, this.npcTypes));
			}
			
			// Load Items:
			if (this.getNameFromFrame(frame - frameOffset, this.itemTypes)) {
				gs.createFloorItem({x: x, y: y}, Item.createItem(this.getNameFromFrame(frame - frameOffset, this.itemTypes)));
			}
		}
	}
	
	
	
	// Spawn NPCS:
	if (gs.debugProperties.spawnMobs) {
		
		for (let x = 0; x < this.numTilesX; x += 1) {
			for (let y = 0; y < this.numTilesY; y += 1) {
				let tileIndex = {x: x, y: y};
				
				// Zoo Mob:
				if (tileTypeMap[x][y].zooMob) {	
					gs.spawnMonsterZooNPC(tileIndex);
					gs.getChar(tileIndex).isAsleep = false;
				}

				// Spawn Mob:
				if (tileTypeMap[x][y].spawnMob) {
					gs.spawnRandomNPC(tileIndex);
					gs.getChar(tileIndex).isAsleep = false;
				}

			}			
		}
	}
};


// PARSE_JSON_MAP:
// Parses the data in a .JSON file, converting it to a tileTypeMap in the internal format
// This tileTypeMap is the same internal format as the game saves to and can then be passed to createTileMap to be created
// So the purpose of this function is simply to convert the static .JSON files produced by Tiled into our internal format
// It does not actually do any loading itself.
// ************************************************************************************************
gs.parseJSONMap = function (fileName, rotate) {
	var tileTypeMap,
		data,
		object,
		frame,
		numTilesX,
		numTilesY,
		frameOffset,
		objData,
		dataHeight,
		dataWidth,
		getTileTypeMap,
		typeName;

	data = game.cache.getJSON(fileName);
	if (rotate) {
		dataWidth = data.width;
		dataHeight = data.height;
		numTilesX = data.height;
		numTilesY = data.width;
	}
	else {
		dataWidth = data.width;
		dataHeight = data.height;
		numTilesX = data.width;
		numTilesY = data.height;
	}
	
	if (data.tilesets[1]) {
		frameOffset = data.tilesets[1].firstgid - 1;
	}
	
	getTileTypeMap = function (x, y) {
		if (rotate) {
			return tileTypeMap[y][x];
		}
		else {
			return tileTypeMap[x][y];
		}
	};
	
	// INIT_TILE_TYPE_MAP:
	// ********************************************************************************************
	tileTypeMap = [];
	for (let x = 0; x < numTilesX; x += 1) {
		tileTypeMap[x] = [];
		for (let y = 0; y < numTilesY; y += 1) {
			tileTypeMap[x][y] = {};
		}
	}
	
	// LOADING_TILE_LAYER:
	// ********************************************************************************************
	for (let y = 0; y < dataHeight; y += 1) {
		for (let x = 0; x < dataWidth; x += 1) {
			frame = data.layers[0].data[y * data.width + x] - 1;
			typeName = this.getNameFromFrame(frame, this.tileTypes);
			
			getTileTypeMap(x, y).f = frame;
			
			if (frame === 480) {
				getTileTypeMap(x, y).f = frameSelector.selectFrame(gs.tileTypes.Wall);
			}
			
			if (frame === 481) {
				getTileTypeMap(x, y).f = frameSelector.selectFrame(gs.tileTypes.CaveWall);
			}
			
			if (frame === 482) {
				getTileTypeMap(x, y).f = frameSelector.selectFrame(gs.tileTypes.Floor);
			}
			
			if (frame === 483) {
				getTileTypeMap(x, y).f = frameSelector.selectFrame(gs.tileTypes.CaveFloor);
			}
			
			// Error Checking:
			if (!typeName) {
				throw 'parseJSONMap() failed, ' + frame + ' is not a valid frame. Index: ' + x + ',' + y;
			}
		}
	}
	
	// LOADING_FLAG_LAYER:
	// ********************************************************************************************
	if (data.layers[2]) {
		for (let y = 0; y < dataHeight; y += 1) {
			for (let x = 0; x < dataWidth; x += 1) {
				frame = data.layers[2].data[y * data.width + x] - 1;
				
				// isSolidWall flag:
				if (frame === 2016) {
					getTileTypeMap(x, y).s = true;
				}
				
				// Zoo flag:
				if (frame === 2017) {
					getTileTypeMap(x, y).zooMob = true;
				}
				
				// Mob Flag:
				if (frame === 2020) {
					getTileTypeMap(x, y).spawnMob = true;
				}
				
				// Closed:
				if (frame === 2019) {
					getTileTypeMap(x, y).c = true;
				}
				
				// Trigger Tiles:
				if (frame >= 2023 && frame <= 2033) {
					getTileTypeMap(x, y).t = frame - 2022;
				}
			}
		}
	}
	
	// LOADING_OBJECT_LAYER:
	// ********************************************************************************************
	if (data.layers[1]) {
		for (let i = 0; i < data.layers[1].objects.length; i += 1) {
			object = data.layers[1].objects[i];
			frame = object.gid - 1;
			let x = Math.round(object.x / (TILE_SIZE / SCALE_FACTOR));
			let y = Math.round(object.y / (TILE_SIZE / SCALE_FACTOR)) - 1;

			// Loading Objects
			if (this.getNameFromFrame(frame, this.objectTypes)) {
				// Creating objData:
				objData = {
					frame: frame,
					typeFrame: this.objectTypes[this.getNameFromFrame(frame, this.objectTypes)].frame
				};
				
				// Adding additional properties:
				if (object.properties) {
					for (let key in object.properties) {
						if (object.properties.hasOwnProperty(key)) {
							objData[key] = object.properties[key];
						}
					}
				}
				
				// Parse trigger:
				if (objData.hasOwnProperty('triggerTileIndex')) {
					objData.triggerTileIndex = JSON.parse(objData.triggerTileIndex);
				}
				
				// Parse toTileIndex:
				if (objData.hasOwnProperty('toTileIndex')) {
					objData.toTileIndex = JSON.parse(objData.toTileIndex);
				}
				
				getTileTypeMap(x, y).obj = objData;
			}
			// Loading Characters:
			else if (data.tilesets[1] && this.getNameFromFrame(frame - frameOffset, this.npcTypes)) {
				// Pass, handled elsewhere
			}
			// Loading Items:
			else if (data.tilesets[1] && this.getNameFromFrame(frame - frameOffset, this.itemTypes)) {
				// Pass, handled elsewhere
			}
			// Unknown Frame:
			else {
				throw fileName + ' Unknown frame: ' + frame + ', at tileIndex: ' + x + ', ' + y;
			}
		}
	}
	
	return tileTypeMap;
};


// SAVE_LEVEL:
// ************************************************************************************************
gs.saveLevel = function () {
    var x, y, i, j, data;
	
    data = {};
    data.numTilesX = this.numTilesX;
	data.numTilesY = this.numTilesY;
	data.levelController = levelController.toData();
	data.staticLevelName = gs.staticLevelName;
	data.levelTriggers = gs.levelTriggers;
	
	// Save tile map:
    data.tileMap = [];
    for (x = 0; x < this.numTilesX; x += 1) {
        data.tileMap[x] = [];
        for (y = 0; y < this.numTilesY; y += 1) {
            // Save Tile:
			data.tileMap[x][y] = {
				f: this.tileMap[x][y].frame,
			};
			
			// Optional Data (defaults to false on load):
			if (this.tileMap[x][y].explored)		data.tileMap[x][y].e = 1;
			if (this.tileMap[x][y].isClosed)		data.tileMap[x][y].c = 1;
			if (this.tileMap[x][y].triggerGroup) 	data.tileMap[x][y].t = this.tileMap[x][y].triggerGroup;
			
			// Save Objects:
			if (this.getObj(x, y)) {
				data.tileMap[x][y].obj = this.getObj(x, y).toData();
			}
        }
    }
	
	// Save npcs
    data.npcs = [];
	this.getAllNPCs().forEach(function (npc) {
		data.npcs.push(npc.toData());
	}, this);
    
    // Save items:
    data.items = [];
    for (i = 0; i < this.floorItemList.length; i += 1) {
        if (this.floorItemList[i].isAlive) {
            data.items.push(this.floorItemList[i].toData());
        }
    }
	
	// Save drop walls:
	data.dropWalls = [];
	for (i = 0; i < this.dropWallList.length; i += 1) {
		data.dropWalls.push(this.dropWallList[i]);
	}
	
	data.lastTurn = this.turn;
    localStorage.setItem(this.zoneName + this.zoneLevel, JSON.stringify(data));
};


// CAN_RELOAD_LEVEL:
// Can load previously saved level:
// ************************************************************************************************
gs.canReloadLevel = function (zoneName, zoneLevel) {
	return localStorage.getItem(zoneName + zoneLevel) !== null;
};

// RELOAD_LEVEL:
// Load previously saved level:
// ************************************************************************************************
gs.reloadLevel = function (zoneName, zoneLevel) {
    var i, data;
    
    data = JSON.parse(localStorage.getItem(zoneName + zoneLevel));
	this.numTilesX = data.numTilesX;
	this.numTilesY = data.numTilesY;
	levelController.loadData(data.levelController);
	gs.staticLevelName = data.staticLevelName;
	gs.levelTriggers = data.levelTriggers;
	
	// Create tile map:
	this.initiateTileMap();
	this.createTileMap({x: 0, y: 0}, data.tileMap);
	
    // load NPCs:
    for (i = 0; i < data.npcs.length; i += 1) {
		this.loadNPC(data.npcs[i]);		
    }
    
    // Load Items:
    for (i = 0; i < data.items.length; i += 1) {
		this.loadFloorItem(data.items[i]);
    }
	
	// Load Drop Walls:
	this.dropWallList = [];
	for (i = 0; i < data.dropWalls.length; i += 1) {
		this.dropWallList.push(data.dropWalls[i]);
	}
    
	this.lastTurn = data.lastTurn;
};


// CREATE_TILE_MAP:
// Given a tileTypeMap object, fill the tilemap with tiles and objects
// This function DOES NOT create NPCs
// This function DOES NOT create items
// ************************************************************************************************
gs.createTileMap = function (startTileIndex, tileTypeMap) {
    var tileIndex,
		numTilesX = tileTypeMap.length,
		numTilesY = tileTypeMap[0].length,
		obj,
		tileData;
	
    for (let x = 0; x < numTilesX; x += 1) {
        for (let y = 0; y < numTilesY; y += 1) {
			tileIndex = {x: startTileIndex.x + x, y: startTileIndex.y + y};
			tileData = tileTypeMap[x][y];
			
			// Tile Properties:
			this.getTile(tileIndex).explored = 		tileData.e || false;
			this.getTile(tileIndex).isClosed = 		tileData.c || false;
			this.getTile(tileIndex).isSolidWall = 	tileData.s || false;
			this.getTile(tileIndex).triggerGroup =	tileData.t || 0;
			
			
			
			// Tile Type:
			this.setTileType(tileIndex, this.tileTypes[this.getNameFromFrame(tileData.f, this.tileTypes)]);
			this.getTile(tileIndex).frame = tileData.f;
			
			// Objects:
			if (tileData.obj) {
				
				// Offset toTileIndex:
				if (tileData.obj.triggerTileIndex) {
					tileData.obj.triggerTileIndex.forEach(function (index) {
						index.x = index.x + startTileIndex.x;
						index.y = index.y + startTileIndex.y;
					}, this);
				}
				
				
				
				gs.loadObj(tileIndex, tileData.obj);
			}
        }
    }
};


