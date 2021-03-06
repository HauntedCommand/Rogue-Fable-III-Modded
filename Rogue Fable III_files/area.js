/*global gs*/
/*jshint esversion: 6*/
'use strict';

// AREA_CONSTRUCTOR:
// ************************************************************************************************
function Area() {
	// A list of tileIndices belonging to this area
	// This includes floor and wall tiles
	this.indexList = [];
	
	// A list of tileIndices belonging to this area that are also walls
	// Area walls must be cardinally adjacent to an areas floors
	// The wallIndexList can be generated by the Area class once its floors have been added
	// Corner walls will not be added to wallIndexList but will be added to indexList
	// This allows wallIndexList to be used as a starting point for hallways.
	this.wallIndexList = [];
	
	// The bounds of the area:
	// This will be updated every time that addTile is called
	// Note how the the values are initiated in such away that the first addTile call will successfully set the bounds
	this.startX = gs.numTilesX + 1;
	this.startY = gs.numTilesY + 1;
	this.endX = -1;
	this.endY = -1;
	
}

// ADD_TILE:
// Call to add a tile to the area
// Will mark the tile as belonging to the area by setting tile.area = this
// Will automatically update the bounds of the area
// ************************************************************************************************
Area.prototype.addTile = function (tileIndex) {
	// Testing for errors:
	if (!gs.isInBounds(tileIndex))	throw 'tileIndex is out of bounds';
	if (gs.getTile(tileIndex).area)	throw 'tile already belongs to an area';
	
	// Adding tileIndex to lists
	this.indexList.push(tileIndex);
	
	// Setting the tiles area:
	gs.getTile(tileIndex).area = this;
	
	// Adjusting bounds:
	this.startX = Math.min(this.startX, tileIndex.x);
	this.startY = Math.min(this.startY, tileIndex.y);
	this.endX = Math.max(this.endX, tileIndex.x + 1);
	this.endY = Math.max(this.endY, tileIndex.y + 1);
};

// ADD_ALL_ADJACENT_WALLS:
// Call this function once all floor tiles have been added in order to add the adjacent walls
// ************************************************************************************************
Area.prototype.addAdjacentWalls = function () {
	// First finding tiles to add to wallIndexList:
	this.indexList.forEach(function (tileIndex) {
		// Only expand on floor tiles:
		if (!gs.getTile(tileIndex).type.passable) {
			return;
		}
		
		gs.getIndexListCardinalAdjacent(tileIndex).forEach(function (index) {
			if (!gs.getTile(index).type.passable && !gs.getTile(index).area) {
				this.addTile(index);
				this.wallIndexList.push(index);
				gs.getTile(index).areaFlag = 'AREA_WALL';
			}
		}, this);
		
	}, this);
	
	// Catching the remaining tiles:
	this.indexList.forEach(function (tileIndex) {
		// Only expand on floor tiles:
		if (!gs.getTile(tileIndex).type.passable) {
			return;
		}
		
		gs.getIndexListAdjacent(tileIndex).forEach(function (index) {
			if (!gs.getTile(index).type.passable && !gs.getTile(index).area) {
				this.addTile(index);
			}
		}, this);
		
	}, this);
	
};
// UPDATE_BOUNDS:
// ************************************************************************************************
Area.prototype.updateBounds = function () {
	this.width = this.endX - this.startX;
	this.height = this.endY - this.endY;
	this.startTileIndex = {x: this.startX, y: this.startY};
	this.endTileIndex = {x: this.endX, y: this.endY};
};