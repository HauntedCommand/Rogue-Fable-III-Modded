/*global game, gs, console, Phaser, menuState*/
/*global SCALE_FACTOR, SCREEN_WIDTH, ZONE_FADE_TIME, SMALL_WHITE_FONT*/

'use strict';

// CONSTRUCTOR:
// ************************************************************************************************
function RaceSelectMenu () {
	var sprite,
		startX = 720,
		width = SCREEN_WIDTH - startX,
		iconSpaceY = 30;
	
	// Group:
	this.group = game.add.group();
	this.group.fixedToCamera = true;

	// Menu Sprite:
	sprite = gs.createSprite(0, 0, 'HUD', this.group);
	sprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	
	// Text:
	this.text = gs.createText(startX + 4, 400, '', SMALL_WHITE_FONT, this.group); 
	
	// Create Race Buttons:
	this.raceButtons = [];
	gs.playerRaceList.forEach(function (playerRace, i) {
		var button;
		button = gs.createTextButton(startX + width / 2, 20 + i * iconSpaceY, playerRace.name, this.raceClicked, this, this.group);
		button.button.playerRace = playerRace;
		this.raceButtons.push(button);
	}, this);
	
	
	this.group.visible = false;
}

// UPDATE:
RaceSelectMenu.prototype.update = function () {
	this.raceButtons.forEach(function (textButton) {
		if (textButton.button.input.checkPointerOver(game.input.activePointer)) {
			this.text.setText(textButton.button.playerRace.desc());
		}
	}, this);
};

// RACE_CLICKED:
// ************************************************************************************************
RaceSelectMenu.prototype.raceClicked = function (button) {
	// Clearing game data to start the new game
	gs.clearGameData();
	
	gs.startDailyChallenge = false;
	
	// Set Race:
	gs.playerRace = button.playerRace;
	
	// Starting a fade:
	game.camera.fade('#000000', ZONE_FADE_TIME * 2);
    game.camera.onFadeComplete.add(menuState.startGame, menuState);
};


// OPEN:
// ************************************************************************************************
RaceSelectMenu.prototype.open = function () {
	this.group.visible = true;
};

// CLOSE:
// ************************************************************************************************
RaceSelectMenu.prototype.close = function () {
	this.group.visible = false;
};