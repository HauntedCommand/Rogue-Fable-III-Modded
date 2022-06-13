/*global game, gs, console*/
/*global LARGE_WHITE_FONT, HUGE_WHITE_FONT, SCALE_FACTOR*/
'use strict';

// CONSTRUCTOR
// ************************************************************************************************
function UIOptionsMenu() {
	var startX = 2,
		startY = 10,
		width = 720,
        height = 636,
		sprite;
	
	this.group = game.add.group();
	this.group.fixedToCamera = true;
	
	sprite = gs.createSprite(2, 2, 'Menu', this.group);
	sprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	
	this.group.visible = false;
}

// REFRESH:
// ************************************************************************************************
UIOptionsMenu.prototype.refresh = function () {

};

// OPEN:
// ************************************************************************************************
UIOptionsMenu.prototype.open = function () {
	this.refresh();
	gs.state = 'OPTIONS_MENU_STATE';
	this.group.visible = true;
	gs.playSound(gs.sounds.scroll);
};

// CLOSE:
// ************************************************************************************************
UIOptionsMenu.prototype.close = function () {
	gs.state = 'GAME_STATE';
	this.group.visible = false;
	gs.playSound(gs.sounds.scroll);
};