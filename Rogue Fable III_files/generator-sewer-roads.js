/*global game, gs, Phaser, console, BaseGenerator, util*/
/*jshint esversion: 6*/
'use strict';

// CONSTRUCTOR:
// ************************************************************************************************
function SewerRoadsGenerator() {}
SewerRoadsGenerator.prototype = new BaseGenerator();
var sewerRoadsGenerator = new SewerRoadsGenerator();

// GENERATE:
// ************************************************************************************************
SewerRoadsGenerator.prototype.generate = function (flags) {
	var x, y, i, area;

	this.flags = flags || {};
	gs.areaList = [];

	// Properties:
	this.ROAD_SPACING = 10;
	this.ROAD_WIDTH = 2;
		
	// Initial Fill:
	this.placeTileSquare({x: 0, y: 0}, {x: this.numTilesX, y: this.numTilesY}, gs.tileTypes.Floor);
	
	
	// Roads:
	this.placeRoads();
	this.fillBorderWall();
	
	// Building Areas:
	this.buildingAreaList = [];
	this.createBuildingAreas();
	
	// Remove area flags (placeBuildings is going to flag all rooms)
	this.removeAllAreaFlags();
	
	// Place Buildings:
	this.roomAreaList = [];
	this.placeBuildings();
	
	this.placeTileSquare({x: 1, y: 1}, {x: this.numTilesX - 1, y: this.numTilesY - 1}, gs.tileTypes.Wall, true);
	
	gs.areaList = this.roomAreaList;
	
	return true;
};

// PLACE_ROADS:
// Partition the map with a set of intersecting roads
// The partition refers to the land in between in which buildings will be places
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeRoads = function () {
	var possibleVerticalIndices,
		possibleHorizontalIndices;
	
	// Full Vertical Road:
	possibleVerticalIndices = gs.range(this.ROAD_SPACING, this.numTilesX - this.ROAD_SPACING, this.ROAD_SPACING);
	possibleVerticalIndices = gs.randSubset(possibleVerticalIndices, 3);
	this.placeTileLine({x: possibleVerticalIndices[0], y: 0}, {x: possibleVerticalIndices[0], y: this.numTilesY - 1}, this.ROAD_WIDTH, gs.tileTypes.Water);
	
	// Full Horizontal Road:
	possibleHorizontalIndices = gs.range(this.ROAD_SPACING, this.numTilesY - this.ROAD_SPACING, this.ROAD_SPACING);
	possibleHorizontalIndices = gs.randSubset(possibleHorizontalIndices, 3);
	this.placeTileLine({x: 0, y: possibleHorizontalIndices[0]}, {x: this.numTilesX - 1, y: possibleHorizontalIndices[0]}, this.ROAD_WIDTH, gs.tileTypes.Water);
	
	// Half Vertical Road:
	if (game.rnd.frac() < 0.75) {
		this.placeTileLine({x: possibleVerticalIndices[1], y: 0}, {x: possibleVerticalIndices[1], y: possibleHorizontalIndices[0]}, this.ROAD_WIDTH, gs.tileTypes.Water);
	}
	// Half Vertical Road:
	if (game.rnd.frac() < 0.25) {
		this.placeTileLine({x: possibleVerticalIndices[2], y: this.numTilesY}, {x: possibleVerticalIndices[2], y: possibleHorizontalIndices[0]}, this.ROAD_WIDTH, gs.tileTypes.Water);
	}
	
	// Half Horizontal Road:
	if (game.rnd.frac() < 0.75) {
		this.placeTileLine({x: 0, y: possibleHorizontalIndices[1]}, {x: possibleVerticalIndices[0], y: possibleHorizontalIndices[1]}, this.ROAD_WIDTH, gs.tileTypes.Water);
	}
	// Half Horizontal Road:
	if (game.rnd.frac() < 0.25) {
		this.placeTileLine({x: this.numTilesX, y: possibleHorizontalIndices[2]}, {x: possibleVerticalIndices[0], y: possibleHorizontalIndices[2]}, this.ROAD_WIDTH, gs.tileTypes.Water);
	}
};

// CREATE_BUILDING_AREAS:
// Creates a list of areas in which a building could exist between roads
// ************************************************************************************************
SewerRoadsGenerator.prototype.createBuildingAreas = function () {
	// Find unmarked floor tiles and expand an area on it:
	for (let x = 0; x < this.numTilesX; x += 1) {
		for (let y = 0; y < this.numTilesY; y += 1) {
			if (gs.getTile(x, y).type.name === 'Floor' && !gs.getTile(x, y).area) {
				this.createBuildingArea({x: x, y: y});
			}
		}
	}
};

// CREATE_BUILDING_AREA:
// ************************************************************************************************
SewerRoadsGenerator.prototype.createBuildingArea = function (tileIndex) {
	var endX, endY, width, height;

	// Find width:
	for (endX = tileIndex.x; endX < this.numTilesX; endX += 1) {
		if (gs.getTile(endX, tileIndex.y).type.name !== 'Floor' || gs.getTile(endX, tileIndex.y).area) {
			break;
		}
	}

	// Find height:
	for (endY = tileIndex.y; endY < this.numTilesY; endY += 1) {
		if (gs.getTile(tileIndex.x, endY).type.name !== 'Floor' || gs.getTile(tileIndex.x, endY).area) {
			break;
		}
	}
	
	width = endX - tileIndex.x;
	height = endY - tileIndex.y;
	
	
	// Split Vertical:
	if (height > 16 || height > 2 * width) {
		this.buildingAreaList.push(this.createArea(tileIndex.x, tileIndex.y, endX, tileIndex.y + Math.floor(height / 2)));
	} 
	// Split Horizontal:
	else if (width > 16 || width > 2 * height) {
		this.buildingAreaList.push(this.createArea(tileIndex.x, tileIndex.y, tileIndex.x + Math.floor(width / 2), endY));
	}
	// Single Area:
	else {
		this.buildingAreaList.push(this.createArea(tileIndex.x, tileIndex.y, endX, endY));
	}
};

// PLACE_BULDINGS:
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeBuildings = function () {
	for (let i = 0; i < this.buildingAreaList.length; i += 1) {
		this.placeBuilding(this.buildingAreaList[i]);
	}
};

// PLACE_BUILDING:
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeBuilding = function (area) {

	// Never place buildings with no access to road
	if (!this.isRoad(area, 'RIGHT') &&
		!this.isRoad(area, 'LEFT') &&
		!this.isRoad(area, 'UP') &&
		!this.isRoad(area, 'DOWN')) {
		return;
	}
	
	// Possible chance to place solid wall:
	if (game.rnd.frac() < 0.30) {
		this.placeTileSquare({x: area.startX + 1, y: area.startY + 1}, {x: area.endX - 1, y: area.endY - 1}, gs.tileTypes.Wall);
		return;
	}
	
	// Possible chance to place nothing:
	if (game.rnd.frac() < 0.10) {
		return;
	}
	
	// Hallway Building:
	if (area.width > 12 && area.height > 12) {
		this.placeHallwayBuilding(area);
		
	// Partition Building:
	} else if (area.width >= area.height * 1.5 || area.height >= area.width * 1.5) {
		this.placePartitionedBuilding(area);
		
	} else {
		this.placeSimpleBuilding(area);
	}
};

// PLACE_HALLWAY_BUILDING:
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeHallwayBuilding = function (area) {
	var rand = util.randInt(0, 2);
	
	// Walls:
	this.placeTileSquare({x: area.startX + 1, y: area.startY + 1}, {x: area.endX - 1, y: area.endY - 1}, gs.tileTypes.Wall);
	this.placeTileSquare({x: area.startX + 2, y: area.startY + 2}, {x: area.endX - 2, y: area.endY - 2}, gs.tileTypes.Floor);
	
	if (rand === 0) {
		this.placeSquareHallwayBuilding(area);
	} else if (rand === 1) {
		this.placeWideHallwayBuilding(area);
	} else {
		this.placeTallHallwayBuilding(area);
	}
};
	
// PLACE_SQUARE_HALLWAY_BUIDLING:
// XXXXXXX
// XXX XXX
// XXX XXX
// X     X
// XXX XXX
// XXX XXX
// XXXXXXX
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeSquareHallwayBuilding = function (area) {
	// Horizontal Hallway:
	this.placeTileLine({x: area.startX + 2, y: area.centerY - 2}, {x: area.endX - 2, y: area.centerY - 2}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.startX + 2, y: area.centerY + 2}, {x: area.endX - 2, y: area.centerY + 2}, 1, gs.tileTypes.Wall);
	
	// Vertical Hallway:
	this.placeTileLine({x: area.centerX - 2, y: area.startY + 2}, {x: area.centerX - 2, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.centerX + 2, y: area.startY + 2}, {x: area.centerX + 2, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	
	// CrossRoad:
	this.placeTileSquare({x: area.centerX - 2, y: area.centerY - 1},
						 {x: area.centerX + 3, y: area.centerY + 2},
						 gs.tileTypes.Floor);
	
	this.placeTileSquare({x: area.centerX - 1, y: area.centerY - 2},
						 {x: area.centerX + 2, y: area.centerY + 3},
						 gs.tileTypes.Floor);
	
	// Horizontal Internal Doors:
	this.placeDoor({x: area.startX + Math.round(area.width * 0.25), y: area.centerY - 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.75), y: area.centerY - 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.25), y: area.centerY + 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.75), y: area.centerY + 2});
	
	// Vertical Internal Doors:
	this.placeDoor({x: area.centerX - 2, y: area.startY + Math.round(area.height * 0.25)});
	this.placeDoor({x: area.centerX - 2, y: area.startY + Math.round(area.height * 0.75)});
	this.placeDoor({x: area.centerX + 2, y: area.startY + Math.round(area.height * 0.25)});
	this.placeDoor({x: area.centerX + 2, y: area.startY + Math.round(area.height * 0.75)});
	
	// Outside Doors:
	if (this.isRoad(area, 'RIGHT')) {
		this.placeDoor({x: area.endX - 2, y: area.centerY});
	}
	if (this.isRoad(area, 'LEFT')) {
		this.placeDoor({x: area.startX + 1, y: area.centerY});
	}
	if (this.isRoad(area, 'DOWN')) {
		this.placeDoor({x: area.centerX, y: area.endY - 2});
	}
	if (this.isRoad(area, 'UP')) {
		this.placeDoor({x: area.centerX, y: area.startY + 1});
	}
	
	// Flag Areas:
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.centerX - 2, area.centerY - 2));
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.centerY + 3, area.centerX - 2, area.endY - 2));
	
	this.roomAreaList.push(this.createRoomArea(area.centerX + 3, area.startY + 2, area.endX - 2, area.centerY - 2));
	this.roomAreaList.push(this.createRoomArea(area.centerX + 3, area.centerY + 3, area.endX - 2, area.endY - 2));
};

// PLACE_WIDE_HALLWAY_BUILDING:
// XXXXXXXXXXXXXXXXXX
// X				X
// XXXXXXXXXXXXXXXXXX
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeWideHallwayBuilding = function (area) {
	// Hallway:
	this.placeTileLine({x: area.startX + 2, y: area.centerY - 2}, {x: area.endX - 2, y: area.centerY - 2}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.startX + 2, y: area.centerY + 2}, {x: area.endX - 2, y: area.centerY + 2}, 1, gs.tileTypes.Wall);
	
	// Room Partitions:
	this.placeTileLine({x: area.centerX, y: area.startY + 2}, {x: area.centerX, y: area.centerY - 3}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.centerX, y: area.centerY + 2}, {x: area.centerX, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	
	// Internal Doors:
	this.placeDoor({x: area.startX + Math.round(area.width * 0.25), y: area.centerY - 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.75), y: area.centerY - 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.25), y: area.centerY + 2});
	this.placeDoor({x: area.startX + Math.round(area.width * 0.75), y: area.centerY + 2});
	
	// External Doors:
	// Placing doorway regardless of road (otherwise the door may not spawn)
	if (this.isRoad(area, 'RIGHT')) {
		this.placeDoor({x: area.endX - 2, y: area.centerY});
	}
	if (this.isRoad(area, 'LEFT')) {
		this.placeDoor({x: area.startX + 1, y: area.centerY});
	}
	

	
	// Flag Areas:
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.centerX, area.centerY - 2));
	this.roomAreaList.push(this.createRoomArea(area.centerX + 1, area.startY + 2, area.endX - 2, area.centerY - 2));
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.centerY + 3, area.centerX, area.endY - 2));
	this.roomAreaList.push(this.createRoomArea(area.centerX + 1, area.centerY + 3, area.endX - 2, area.endY - 2));
};

// PLACE_TALL_HALLWAY_BUILDING:
// XXX
// X X
// X X
// X X
// X X
// XXX
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeTallHallwayBuilding = function (area) {
	// Hallway:
	this.placeTileLine({x: area.centerX - 2, y: area.startY + 2}, {x: area.centerX - 2, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.centerX + 2, y: area.startY + 2}, {x: area.centerX + 2, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	
	// Room Partitions:
	this.placeTileLine({x: area.startX + 2, y: area.centerY}, {x: area.centerX - 3, y: area.centerY}, 1, gs.tileTypes.Wall);
	this.placeTileLine({x: area.centerX + 2, y: area.centerY}, {x: area.endX - 2, y: area.centerY}, 1, gs.tileTypes.Wall);
	
	// Internal Doors:
	this.placeDoor({x: area.centerX - 2, y: area.startY + Math.round(area.height * 0.25)});
	this.placeDoor({x: area.centerX - 2, y: area.startY + Math.round(area.height * 0.75)});
	this.placeDoor({x: area.centerX + 2, y: area.startY + Math.round(area.height * 0.25)});
	this.placeDoor({x: area.centerX + 2, y: area.startY + Math.round(area.height * 0.75)});
	
	// External Doors:
	// Placing doorway regardless of road (otherwise the door may not spawn)
	if (this.isRoad(area, 'DOWN')) {
		this.placeDoor({x: area.centerX, y: area.endY - 2});
	}
	if (this.isRoad(area, 'UP')) {
		this.placeDoor({x: area.centerX, y: area.startY + 1});
	}
	
	// Flag Areas:
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.centerX - 2, area.centerY));
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.centerY + 1, area.centerX - 2, area.endY - 2));
	this.roomAreaList.push(this.createRoomArea(area.centerX + 3, area.startY + 2, area.endX - 2, area.centerY));
	this.roomAreaList.push(this.createRoomArea(area.centerX + 3, area.centerY + 1, area.endX - 2, area.endY - 2));
};

// PLACE_SIMPLE_BUILDING:
// ************************************************************************************************
SewerRoadsGenerator.prototype.placeSimpleBuilding = function (area) {
	// Walls:
	this.placeTileSquare({x: area.startX + 1, y: area.startY + 1}, {x: area.endX - 1, y: area.endY - 1}, gs.tileTypes.Wall);
	this.placeTileSquare({x: area.startX + 2, y: area.startY + 2}, {x: area.endX - 2, y: area.endY - 2}, gs.tileTypes.Floor);
	
	// Doors:
	if (this.isRoad(area, 'DOWN')) {
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) / 2), y: area.endY - 2});
	}
	if (this.isRoad(area, 'UP')) {
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) / 2), y: area.startY + 1});
	}
	if (this.isRoad(area, 'RIGHT')) {
		this.placeDoor({x: area.endX - 2, y: area.startY + Math.floor((area.endY - area.startY) / 2)});
	}
	if (this.isRoad(area, 'LEFT')) {
		this.placeDoor({x: area.startX + 1, y: area.startY + Math.floor((area.endY - area.startY) / 2)});
	}
		
	// Flag Area:
	this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.endX - 2, area.endY - 2));
};

// PLACE_PARTITIONED_BUILDING:
// ************************************************************************************************
SewerRoadsGenerator.prototype.placePartitionedBuilding = function (area) {
	var partitionType;
	
	if (area.width > area.height) {
		partitionType = 'WIDE';
	} else {
		partitionType = 'TALL';
	}
	
	// Walls:
	this.placeTileSquare({x: area.startX + 1, y: area.startY + 1}, {x: area.endX - 1, y: area.endY - 1}, gs.tileTypes.Wall);
	this.placeTileSquare({x: area.startX + 2, y: area.startY + 2}, {x: area.endX - 2, y: area.endY - 2}, gs.tileTypes.Floor);
	
	// Internal Wall:
	if (partitionType === 'WIDE') {
		this.placeTileLine({x: area.centerX, y: area.startY + 1}, {x: area.centerX, y: area.endY - 2}, 1, gs.tileTypes.Wall);
	} else {
		this.placeTileLine({x: area.startX + 1, y: area.centerY}, {x: area.endX - 2, y: area.centerY}, 1, gs.tileTypes.Wall);
	}
	
	// Internal Door:
	this.placeDoor({x: area.centerX, y: area.centerY});
	
	// External Doors:
	if (this.isRoad(area, 'DOWN')) {
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) * 0.25), y: area.endY - 2});
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) * 0.75), y: area.endY - 2});
	}
	if (this.isRoad(area, 'UP')) {
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) * 0.25), y: area.startY + 1});
		this.placeDoor({x: area.startX + Math.floor((area.endX - area.startX) * 0.75), y: area.startY + 1});
	}
	if (this.isRoad(area, 'RIGHT')) {
		this.placeDoor({x: area.endX - 2, y: area.startY + Math.floor((area.endY - area.startY) * 0.25)});
		this.placeDoor({x: area.endX - 2, y: area.startY + Math.floor((area.endY - area.startY) * 0.75)});
	}
	if (this.isRoad(area, 'LEFT')) {
		this.placeDoor({x: area.startX + 1, y: area.startY + Math.floor((area.endY - area.startY) * 0.25)});
		this.placeDoor({x: area.startX + 1, y: area.startY + Math.floor((area.endY - area.startY) * 0.75)});
	}
	
	
	// Flag Area:
	if (partitionType === 'WIDE') {
		this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.centerX, area.endY - 2));
		this.roomAreaList.push(this.createRoomArea(area.centerX + 1, area.startY + 2, area.endX - 2, area.endY - 2));
		
	} else {
		this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.startY + 2, area.endX - 2, area.centerY));
		this.roomAreaList.push(this.createRoomArea(area.startX + 2, area.centerY + 1, area.endX - 2, area.endY - 2));
	}
};

// IS_ROAD:
// Returns true if the road exists in adjacent to area in dir: [DOWN, UP, LEFT, RIGHT]
// ************************************************************************************************
SewerRoadsGenerator.prototype.isRoad = function (area, dir) {
	if (dir === 'DOWN' && gs.isInBounds(area.startX, area.endY + 1) && gs.isPassable(area.startX, area.endY + 1)) {
		return true;
	}
	if (dir === 'UP' && gs.isInBounds(area.startX, area.startY - 1) && gs.isPassable(area.startX, area.startY - 1)) {
		return true;
	}
	if (dir === 'LEFT' && gs.isInBounds(area.startX - 1, area.startY) && gs.isPassable(area.startX - 1, area.startY)) {
		return true;
	}
	if (dir === 'RIGHT' && gs.isInBounds(area.endX + 1, area.startY) && gs.isPassable(area.endX + 1, area.startY)) {
		return true;
	}
};

// CREATE_ROOM_AREA:
// ************************************************************************************************
SewerRoadsGenerator.prototype.createRoomArea = function (startX, startY, endX, endY) {
	var area = this.createArea(startX, startY, endX, endY);
	
	// Setting properties for room dresser (depth is still pissing me off):
	if (area.width < 3 || area.height < 3) {
		area.depth = 5;
		area.type = 'SideRoom';
	} else {
		area.depth = 3;
		area.type = 'LargeRoom';
	}
	
	return area;
};

// FLAG_OUTDOOR_AREA:
// ************************************************************************************************
SewerRoadsGenerator.prototype.flagOutdoorArea = function () {
	var func,
		indexList,
		area;
	
	func = function (tileIndex) {
		return gs.isPassable(tileIndex);
	};
	
	indexList = gs.getIndexInFlood({x: 0, y: 0}, func);
	
	area = {};
	area.startX = 0;
	area.startY = 0;
	area.endX = this.numTilesX;
	area.endY = this.numTilesY;
	area.width = area.endX - area.startX;
	area.height = area.endY - area.startY;
	area.centerX = area.startX + Math.round(area.width / 2);
	area.centerY = area.startY + Math.round(area.height / 2);

	// Flag tiles as belonging to area:
	indexList.forEach(function (tileIndex) {
		gs.getTile(tileIndex).area = area;
	}, this);
	
	area.depth = 0;
	area.type = 'Cave';
	
	this.roomAreaList.push(area);
};