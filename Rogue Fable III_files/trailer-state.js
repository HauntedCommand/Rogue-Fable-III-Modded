/*global game, Phaser, localStorage, gs, console, util*/
/*global ClassSelectMenu, RaceSelectMenu*/
/*global LARGE_WHITE_FONT, TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, SCALE_FACTOR*/
/*global PLAYER_FRAMES, HUGE_WHITE_FONT, ITEM_SLOT_FRAME, NUM_SCREEN_TILES_X, SMALL_WHITE_FONT, ZONE_FADE_TIME*/
/*global MUSIC_ON_BUTTON_FRAME, MUSIC_OFF_BUTTON_FRAME*/
'use strict';

var trailerState = {};

// PRELOAD:
// ************************************************************************************************
trailerState.preload = function () {
	game.time.advancedTiming = true;
	
};

// CREATE:
// ************************************************************************************************
trailerState.create = function () {
	var tileIndex;
	
	NUM_SCREEN_TILES_X = 27;
	
	
	
	gs.help = {
		soundsOn: false,
		musicOn: false
	};
	gs.initialize();
	gs.loadRandomMapAsBackground();
	gs.shadowMaskSprite.visible = true;
	
	this.group = game.add.group();
	//this.group.fixedToCamera = true;
	this.sprite = gs.createSprite(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'Tileset', this.group);
	this.sprite.anchor.setTo(0.5, 0.5);
	this.sprite.visible = false;

	// Music:
	gs.stopAllMusic();
	
	this.camVelocity = gs.getNormalFromAngle(util.randInt(0, 360));
	tileIndex = gs.getOpenIndexInLevel();
	this.camPos = {x: tileIndex.x * TILE_SIZE - TILE_SIZE / 2, y: tileIndex.y * TILE_SIZE - TILE_SIZE / 2};
	this.camDestIndex = gs.getOpenIndexInLevel();
	this.camVelocity = gs.getNormal(gs.toTileIndex(this.camPos), this.camDestIndex);
	this.count = 0;
};


// UPDATE:
// ************************************************************************************************
trailerState.update = function () {	
	// Changing background levels:
	this.count += 1;
	if (this.count >= 300) {
		this.count = 0;
		gs.destroyLevel();
		gs.loadRandomMapAsBackground();
		
		this.camDestIndex = gs.getOpenIndexInLevel();
		this.camVelocity = gs.getNormal(gs.toTileIndex(this.camPos), this.camDestIndex);
	}
	
	if (gs.vectorEqual(gs.toTileIndex(this.camPos), this.camDestIndex)) {
		this.camDestIndex = gs.getOpenIndexInLevel();
		this.camVelocity = gs.getNormal(gs.toTileIndex(this.camPos), this.camDestIndex);
	}

	// Panning Camera:
	this.camPos.x += this.camVelocity.x * 1.5;
	this.camPos.y += this.camVelocity.y * 1.5;
	game.camera.focusOnXY(this.camPos.x, this.camPos.y);
	gs.shadowMaskSprite.x = game.camera.x;
	gs.shadowMaskSprite.y = game.camera.y;
	
	gs.updateTileMapSprites();
	
	this.sprite.x = this.camPos.x;
	this.sprite.y = this.camPos.y;

	gs.objectSpritesGroup.sort('y', Phaser.Group.SORT_ASCENDING);

};