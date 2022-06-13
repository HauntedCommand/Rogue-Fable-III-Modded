/*global game, gs, Phaser, console, util*/
/*global Item*/
/*global NUM_TILES_X*/
/*global MIN_ELITE_LEVEL, NPC_ELITE_CHANCE, TIMED_GATE_TIME*/
/*jshint white: true, laxbreak: true, esversion: 6 */
'use strict';

// CREATE_ROOM_DRESSING_TABLES:
// ********************************************************************************************
gs.createRoomDressingTables = function () {
	
	
	this.roomDressingTypes = {
		// LargeRoom:
		Tomb:				{areaType: 'LargeRoom', func: this.dressTomb},
		
		// Cave:
	  	CrystalCave:		{areaType: 'Cave', func: this.dressCrystalCave},
	  	WaterCave:			{areaType: 'Cave', func: this.dressWaterCave},
	  	GrassCave:			{areaType: 'Cave', func: this.dressGrassCave},
		LavaCave:			{areaType: 'Cave', func: this.dressLavaCave},
		GroveCave:			{areaType: 'Cave', func: this.dressGroveCave},
		GroveWaterCave: 	{areaType: 'Cave', func: this.dressGroveWaterCave},
		DesertCave:			{areaType: 'Cave', func: this.dressDesertCave},
		
	};

	// Default Dressing Properties:
	this.forEachType(this.roomDressingTypes, function (element) {
		element.minSize = element.minSize || 0;
		element.maxSize = element.maxSize || NUM_TILES_X;
		element.maxCount = element.maxCount || 1000;
	}, this);
	
	this.nameTypes(this.roomDressingTypes);
};

// DRESS_ROOMS:
// ************************************************************************************************
gs.dressRooms = function () {
	
	if (this.debugProperties.dressRooms && this.areaList) {
		for (let i = 0; i < this.areaList.length; i += 1) {
			if (this.areaList[i].type === 'Cave' || this.areaList[i].type === 'Crypt') {
				this.dressRoom(this.areaList[i]);
			}
			
		}
	}
};

// DRESS_ROOM:
// ************************************************************************************************
gs.dressRoom = function (area) {	
	var roomDressingType = this.getRoomDressingType(area);
	
	if (roomDressingType) {
		roomDressingType.func.call(this, area);
		
		if (!this.dressingTypeCounts[roomDressingType.name]) {
			this.dressingTypeCounts[roomDressingType.name] = 0;
		}
		this.dressingTypeCounts[roomDressingType.name] += 1;
	}
};

// GET_ROOM_DRESSING_TYPE:
// Given an area, determine based on its areaType what random roomDressing to use.
// This function uses the dressingTable specified and defined in level-type.js.
// If no appropriate dressingType is available or NONE is randomly chosen then return null indicating no dressing for the area.
// ************************************************************************************************
gs.getRoomDressingType = function (area) {
	var roomDressingTypeName, dressingTable;

	// The zone has no dressing table:
	if (!this.zoneType().dressingTable) {
		throw this.zoneName + ' does not have a valid dressing table';
	}

	// A valid dressing table exists based on the area type:
	if (this.zoneType().dressingTable[area.type] && this.zoneType().dressingTable[area.type].length > 0) {
		dressingTable = this.zoneType().dressingTable[area.type].filter(function (element) {
			var dressingType = this.roomDressingTypes[element.name];
			
			return element.name === 'NONE'
				|| ((!element.minLevel || this.dangerLevel() >= element.minLevel)
					&& area.width >= dressingType.minSize
					&& area.height >= dressingType.minSize
				   	&& area.width <= dressingType.maxSize
				   	&& area.height <= dressingType.maxSize
					&& (!this.dressingTypeCounts[element.name] || this.dressingTypeCounts[element.name] < dressingType.maxCount)
				   	&& (!dressingType.validFunc || dressingType.validFunc(area)));	
		}, this);
		
		if (dressingTable.length === 0) {
			return null;
		}
		
		roomDressingTypeName = this.chooseRandom(dressingTable);

		if (roomDressingTypeName === 'NONE') {
			return null;
		}
		else {
			return this.roomDressingTypes[roomDressingTypeName];
		}
	}
	// No valid dressing table exists based on the area type:
	else {
		return null;
	}
};





// DRESS_TOMB:
// The Tomb is a large room with caskets placed down the center in one or more columns providing cover from projectiles.
// ************************************************************************************************
gs.dressTomb = function (area) {
	var indexList;
	// end - 1 so that caskets do not spawn against end walls
	indexList = this.getIndexInBox(area.startX, area.startY, area.endX - 1, area.endY - 1);
	
	// startX + 1 so that caskets do not spawn against start walls
	indexList = indexList.filter(index => index.x % 2 === (area.startX + 1) % 2 && index.y % 2 === (area.startY + 1) % 2);
	
	indexList = indexList.filter(index => game.rnd.frac() < 0.5);
	
	indexList.forEach(function (index) {
		gs.createObject(index, 'Casket');
	});
};





// DRESS_WATER_CAVE:
// ************************************************************************************************
gs.dressWaterCave = function (area) {
	var i, tileIndex, num;

	this.createLakes(area, util.randInt(3, 6));

	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	// Rubble:
	if (game.rnd.frac() < 0.25) {
		num = util.randInt(1, [4, 2, 1][area.depth]);
		for (i = 0; i < num; i += 1) {
			tileIndex = gs.getOpenIndexInArea(area);
			if (tileIndex) {
				this.createVinePatch(tileIndex, util.randInt(1, 4), 'Rubble', 0.75);
			}
		}
	}
};


// CREATE_LAKES:
// ************************************************************************************************
gs.createLakes = function (area, num) {
	var i, x, y, tileIndex, waterTileIndexes = [], path;

	// Water:
	for (i = 0; i < num; i += 1) {
		tileIndex = gs.getOpenIndexInArea(area);
		if (tileIndex) {
			this.floodTiletype(tileIndex, gs.tileTypes.Water, util.randInt(3, 7));
			waterTileIndexes.push(tileIndex);
		}
	}

	// First River:
	if (game.rnd.frac() < 0.75) {
		path = this.findPath(waterTileIndexes[0], waterTileIndexes[1], {allowDiagonal: false, maxDepth: 1000});
		if (path && path.length > 0) {
			for (i = 0; i < path.length; i += 1) {
				gs.setTileType(path[i], gs.tileTypes.Water);
			}
		}
	}

	// Second River:
	if (game.rnd.frac() < 0.50) {
		path = this.findPath(waterTileIndexes[1], waterTileIndexes[2], {allowDiagonal: false, maxDepth: 1000});
		if (path && path.length > 0) {
			for (i = 0; i < path.length; i += 1) {
				gs.setTileType(path[i], gs.tileTypes.Water);
			}
		}
	}

	// Grass around water:
	for (x = area.startX + 1; x < area.endX - 1; x += 1) {
		for (y = area.startY + 1; y < area.endY - 1; y += 1) {
			if (this.isIndexOpen(x, y)
				&& (this.tileMap[x + 1][y].type.name === 'Water'
					|| this.tileMap[x - 1][y].type.name === 'Water'
					|| this.tileMap[x][y + 1].type.name === 'Water'
					|| this.tileMap[x][y - 1].type.name === 'Water')) {
				this.createVinePatch({x: x, y: y}, util.randInt(1, 3), 'LongGrass');
			}
		}
	}
};

// DRESS_DESERT_CAVE:
// ************************************************************************************************
gs.dressDesertCave = function (area) {
	var num, tileIndex;
	
	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (let i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	// Rubble:
	if (game.rnd.frac() < 0.5) {
		num = util.randInt(1, [4, 2, 1][area.depth]);
		for (let i = 0; i < num; i += 1) {
			tileIndex = gs.getOpenIndexInArea(area);
			if (tileIndex) {
				this.createVinePatch(tileIndex, util.randInt(1, 4), 'Rubble', 0.75);
			}
		}
	}
};

// DRESS_GRASS_CAVE:
// ************************************************************************************************
gs.dressGrassCave = function (area) {
	var tileIndex,
		num,
		indexList,
		i;

	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	// Grass:
	num = util.randInt(1, [4, 2, 1][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = gs.getOpenIndexInArea(area);
		if (tileIndex) {
			gs.createVinePatch(tileIndex, util.randInt(2, 4), 'LongGrass', 0.5);
		}
	}
	
	// Rubble:
	if (game.rnd.frac() < 0.5) {
		num = util.randInt(1, [4, 2, 1][area.depth]);
		for (i = 0; i < num; i += 1) {
			tileIndex = gs.getOpenIndexInArea(area);
			if (tileIndex) {
				this.createVinePatch(tileIndex, util.randInt(1, 4), 'Rubble', 0.75);
			}
		}
	}
};


// DRESS_GROVE_CAVE:
// ************************************************************************************************
gs.dressGroveCave = function (area) {
	var num, i, tileIndex;
	
	// Ferns:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Fern');
		}
	}
	
	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	// Grass:
	num = util.randInt(1, [4, 2, 1][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = gs.getOpenIndexInArea(area);
		if (tileIndex) {
			gs.createVinePatch(tileIndex, util.randInt(2, 6), 'LongGrass', 0.50);
		}
	}
};

// DRESS_GROVE_WATER_CAVE:
// ************************************************************************************************
gs.dressGroveWaterCave = function (area) {
	var num, i, tileIndex;
	
	this.createLakes(area, util.randInt(3, 6));
	
	// Ferns:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Fern');
		}
	}
	
	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	
	// Grass:
	num = util.randInt(1, [4, 2, 1][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = gs.getOpenIndexInArea(area);
		if (tileIndex) {
			gs.createVinePatch(tileIndex, util.randInt(2, 6), 'LongGrass', 0.50);
		}
	}
};

// DRESS_LAVA_CAVE:
// ************************************************************************************************
gs.dressLavaCave = function (area) {
	var i, tileIndex, num;

	this.createLavaLakes(area, util.randInt(3, 6));

	// Stalagmites:
	num = util.randInt(1, [16, 8, 4][area.depth]);
	for (i = 0; i < num; i += 1) {
		tileIndex = this.getWideOpenIndexInArea(area);
		if (tileIndex) {
			gs.createObject(tileIndex, 'Stalagmite');
		}
	}
	
	// Rubble:
	if (game.rnd.frac() < 0.25) {
		num = util.randInt(1, [4, 2, 1][area.depth]);
		for (i = 0; i < num; i += 1) {
			tileIndex = gs.getOpenIndexInArea(area);
			if (tileIndex) {
				this.createVinePatch(tileIndex, util.randInt(1, 4), 'Rubble', 0.75);
			}
		}
	}
};


// CREATE_LAVA_LAKES:
// ************************************************************************************************
gs.createLavaLakes = function (area, num) {
	var i, x, y, tileIndex, lavaTileIndexes = [], path;

	// Lava Lake:
	for (i = 0; i < num; i += 1) {
		tileIndex = gs.getOpenIndexInArea(area);
		if (tileIndex) {
			this.floodTiletype(tileIndex, gs.tileTypes.Lava, util.randInt(3, 7));
			lavaTileIndexes.push(tileIndex);
		}
	}

	// First River:
	if (game.rnd.frac() < 0.75) {
		path = this.findPath(lavaTileIndexes[0], lavaTileIndexes[1], {allowDiagonal: false, maxDepth: 1000});
		if (path && path.length > 0) {
			for (i = 0; i < path.length; i += 1) {
				gs.setTileType(path[i], gs.tileTypes.Lava);
			}
		}
	}

	// Second River:
	if (game.rnd.frac() < 0.50) {
		path = this.findPath(lavaTileIndexes[1], lavaTileIndexes[2], {allowDiagonal: false, maxDepth: 1000});
		if (path && path.length > 0) {
			for (i = 0; i < path.length; i += 1) {
				gs.setTileType(path[i], gs.tileTypes.Lava);
			}
		}
	}
};


// IS_GOOD_WALL_INDEX:
// ************************************************************************************************
gs.isGoodWallIndex = function (tileIndex) {
	// No adjacent wall:
	if (!this.getIndexListCardinalAdjacent(tileIndex).some(function (tileIndex) {return gs.getTile(tileIndex).type.name === 'Wall'; })) {
		return false;	
	}
	
	// Has adjacent door:
	if (this.getIndexListCardinalAdjacent(tileIndex).some(function (tileIndex) {return gs.getObj(tileIndex, obj => obj.isDoor()); })) {
		return false;
	}
	
	return true;
};

// CREATE_VINE_PATCH:
// ************************************************************************************************
gs.createVinePatch = function (tileIndex, maxDepth, objectName, percent) {
	var iterFunc;

	percent = percent || 1;
	
	// ITER FUNC:
	// *********************************************************************
	iterFunc = function (x, y, depth) {
		if (depth > maxDepth) {
			return;
		}

		if (gs.isInBounds(x, y)
			&& gs.getTile(x, y).type.passable
			&& !gs.getObj(x, y)
			&& gs.getTile(x, y).type.name !== 'Water'
			&& game.rnd.frac() <= percent) {
			
			if (objectName === 'Water') {
				gs.setTileType({x: x, y: y}, gs.tileTypes.Water);
			} else {
				gs.createObject({x: x, y: y}, objectName);
			}
		}

		if (gs.isIndexOpen(x + 1, y) || gs.getChar(x + 1, y)) {
			iterFunc(x + 1, y, depth + 1);
		}
		if (gs.isIndexOpen(x - 1, y) || gs.getChar(x - 1, y)) {
			iterFunc(x - 1, y, depth + 1);
		}
		if (gs.isIndexOpen(x, y + 1) || gs.getChar(x, y + 1)) {
			iterFunc(x, y + 1, depth + 1);
		}
		if (gs.isIndexOpen(x, y - 1) || gs.getChar(x, y - 1)) {
			iterFunc(x, y - 1, depth + 1);
		}
	};


	iterFunc(tileIndex.x, tileIndex.y, 0);
};


// FLOOD_TILE_TYPE:
// *****************************************************************************
gs.floodTiletype = function (tileIndex, tileType, maxDepth) {
	var area = this.getTile(tileIndex).area,
		floodFunc,
		index,
		fillSpaces;


	// FLOOD FUNC:
	// *************************************************************************
	floodFunc = function (startX, startY) {
		var x, y, iterFunc;

		// ITER FUNC:
		// *********************************************************************
		iterFunc = function (x, y, depth) {
			if (depth > maxDepth) {
				return;
			}

			gs.setTileType({x: x, y: y}, tileType);

			if (gs.isIndexOpen(x + 1, y)) {
				iterFunc(x + 1, y, depth + 1);
			}
			if (gs.isIndexOpen(x - 1, y)) {
				iterFunc(x - 1, y, depth + 1);
			}
			if (gs.isIndexOpen(x, y + 1)) {
				iterFunc(x, y + 1, depth + 1);
			}
			if (gs.isIndexOpen(x, y - 1)) {
				iterFunc(x, y - 1, depth + 1);
			}
		};

		iterFunc(startX, startY, 0);
	};

	// FILL SPACES:
	// *************************************************************************
	fillSpaces = function () {
		var numWaterNeighbours, numWaterWallNeighbours, x, y;

		// NUM WATER WALL NEIGHBOURS:
		// *************************************************************************
		numWaterWallNeighbours = function (x, y) {
			var count = 0;
			count += gs.isInBounds(x + 1, y) && (gs.getTile(x + 1, y).type === tileType || !gs.isIndexOpen(x + 1, y)) ? 1 : 0;
			count += gs.isInBounds(x - 1, y) && (gs.getTile(x - 1, y).type === tileType || !gs.isIndexOpen(x - 1, y)) ? 1 : 0;
			count += gs.isInBounds(x, y + 1) && (gs.getTile(x, y + 1).type === tileType || !gs.isIndexOpen(x, y + 1)) ? 1 : 0;
			count += gs.isInBounds(x, y - 1) && (gs.getTile(x, y - 1).type === tileType || !gs.isIndexOpen(x, y - 1)) ? 1 : 0;
			return count;
		};

		// NUM WATER NEIGHBOURS:
		// *************************************************************************
		numWaterNeighbours = function (x, y) {
			var count = 0;
			count += gs.isInBounds(x + 1, y) && gs.getTile(x + 1, y).type === tileType ? 1 : 0;
			count += gs.isInBounds(x - 1, y) && gs.getTile(x - 1, y).type === tileType ? 1 : 0;
			count += gs.isInBounds(x, y + 1) && gs.getTile(x, y + 1).type === tileType ? 1 : 0;
			count += gs.isInBounds(x, y - 1) && gs.getTile(x, y - 1).type === tileType ? 1 : 0;
			return count;
		};

		
        for (x = 0; x < gs.numTilesX; x += 1) {
            for (y = 0; y < gs.numTilesY; y += 1) {
                if (gs.isIndexOpen(x, y) && numWaterNeighbours(x, y) >= 1 && numWaterWallNeighbours(x, y) >= 3) {
                    gs.setTileType({x: x, y: y}, tileType);
                }
            }
        }
		
	};

	floodFunc(tileIndex.x, tileIndex.y);
	fillSpaces();
};