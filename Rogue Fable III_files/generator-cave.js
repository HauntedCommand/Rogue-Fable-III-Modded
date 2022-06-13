/*global game, gs, console, Phaser, util*/
/*global BaseGenerator*/
/*jshint esversion: 6, loopfunc: true*/
'use strict';

// CONSTRUCTOR:
// ************************************************************************************************
function CaveGenerator() {}
CaveGenerator.prototype = new BaseGenerator();
var caveGenerator = new CaveGenerator();

// GENERATE:
// ************************************************************************************************
CaveGenerator.prototype.generate = function (flags) {
	var area;
	
	flags = flags || {};
	this.flags = flags;
	
	this.roomAreaList = [];
	
	// Initial Fill:
	this.placeTileSquare({x: 0, y: 0}, {x: this.numTilesX, y: this.numTilesY}, gs.tileTypes.CaveWall);
	
	// Cave fill:
	this.placeTileCave({x: 1, y: 1}, {x: this.numTilesX - 1, y: this.numTilesY - 1}, gs.tileTypes.CaveWall, this.chooseMask());
	
	if (game.rnd.frac() < 0.5 && gs.zoneName !== 'TheSunlessDesert' && !flags.neverNarrow) {
		this.makeNarrowTunnels();
	}
    
    // Area:
	this.mainCaveArea = this.createArea(0, 0, this.numTilesX, this.numTilesY);
	this.mainCaveArea.type = 'Cave';
	this.mainCaveArea.depth = 0;
	this.roomAreaList.push(this.mainCaveArea);
	
	
	gs.areaList = this.roomAreaList;
	
	return true;
};



// CHOOSE_MASK:
// *****************************************************************************
CaveGenerator.prototype.chooseMask = function () {
	if (game.rnd.frac() < 0.3) {
		return [[0, 0, 0, 0],
				[0, 0, 0, 0],
				[0, 0, 0, 0],
				[0, 0, 0, 0]];
	} 
	else {
		return util.randElem([[[1, 1, 0, 0],
									[1, 1, 0, 0],
									[0, 0, 0, 0],
									[0, 0, 0, 0]],

								   [[0, 0, 1, 1],
									[0, 0, 1, 1],
									[0, 0, 0, 0],
									[0, 0, 0, 0]],

								   [[0, 0, 0, 0],
									[0, 0, 0, 0],
									[1, 1, 0, 0],
									[1, 1, 0, 0]],

								   [[0, 0, 0, 0],
									[0, 0, 0, 0],
									[0, 0, 1, 1],
									[0, 0, 1, 1]],

								   [[1, 0, 0, 1],
									[0, 0, 0, 0],
									[0, 0, 0, 0],
									[1, 0, 0, 1]],

								   [[0, 0, 1, 0],
									[1, 0, 0, 0],
									[0, 0, 0, 1],
									[0, 1, 0, 0]],

								   [[0, 0, 0, 0],
									[0, 1, 1, 0],
									[0, 1, 1, 0],
									[0, 0, 0, 0]]

								  ]);
	}
	
};

CaveGenerator.prototype.makeNarrowTunnels = function () {
    var x, y, markedTiles, tileIndices;
    for (x = 0; x < this.numTilesX; x += 1) {
		for (y = 0; y < this.numTilesY; y += 1) {
			if (gs.isPassable(x, y) && this.clearToWall(x, y, 3)) {
				gs.getTile(x, y).clearToWall = true;
				//gs.getTile(x, y).color = 'rgb(255,0,0)';
			}
		}
	}
    
    markedTiles = gs.create2DArray(this.numTilesX, this.numTilesY, index => false);

	
	for (x = 0; x < this.numTilesX; x += 1) {
		for (y = 0; y < this.numTilesY; y += 1) {
			if (gs.getTile(x, y).clearToWall && !markedTiles[x][y]) {
				tileIndices = gs.getIndexInFlood({x: x, y: y}, function (index) {
					return gs.getTile(index).clearToWall && !markedTiles[index.x][index.y];
				});
				
				if (tileIndices.length < 100 && tileIndices.length > 2) {
					tileIndices.forEach(function(index) {
						gs.setTileType(index, gs.tileTypes.CaveWall);
					}, this);
				}
				
				tileIndices.forEach(function(index) {
					markedTiles[index.x][index.y] = true;
				}, this);
			}
		}
	}
};
