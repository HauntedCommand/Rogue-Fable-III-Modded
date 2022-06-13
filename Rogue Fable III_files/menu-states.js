/*global game, Phaser, localStorage, gs, console, util, document, navigator*/
/*global ClassSelectMenu, RaceSelectMenu, UIRecordMenu*/
/*global LARGE_WHITE_FONT, TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, SCALE_FACTOR*/
/*global PLAYER_FRAMES, HUGE_WHITE_FONT, ITEM_SLOT_FRAME, NUM_SCREEN_TILES_X, SMALL_WHITE_FONT, ZONE_FADE_TIME, LARGE_RED_FONT*/
/*global MUSIC_ON_BUTTON_FRAME, MUSIC_OFF_BUTTON_FRAME, CHARACTER_BUTTON_FRAME*/
/*jshint esversion: 6*/

'use strict';

var menuState = {};


// PRELOAD:
// ************************************************************************************************
menuState.preload = function () {
	game.time.advancedTiming = true;
	
};

// CREATE:
// ************************************************************************************************
menuState.create = function () {
	var startY = 0,
		startX = 720,
		width = SCREEN_WIDTH - startX,
		menuGroup,
		sprite,
		textBox,
		i = 0,
		tileIndex,
		onComplete,
		iconSpaceY,
		str;
	
	// Data (Achievements and Help):
	this.loadData();
	
	// Setting an initial seed:
	gs.seed = '' + Date.now();
	gs.setDebugProperties();
	gs.initialize();
	
	// Random Map Background:
	if (gs.debugProperties.menuMap) {
		gs.loadRandomMapAsBackground();
		gs.shadowMaskSprite.visible = false;
	}
	
	// Creating the menu HUD:
	menuGroup = game.add.group();
	menuGroup.fixedToCamera = true;
	
	this.classSelectMenu = new ClassSelectMenu();
	this.raceSelectMenu = new RaceSelectMenu();
	this.recordMenu = new UIRecordMenu();
	
	// Game Title:
	gs.createSprite(0, 20, 'Title', menuGroup);
	
	// Version Text:
	this.versionText = gs.createText(4, 0, 'Version: ' + gs.versionStr, SMALL_WHITE_FONT, menuGroup);
	
	// Credits Text:
	this.creditsText = gs.createText(4, SCREEN_HEIGHT - 44, 'Now available on steam early access\nFor Windows and Mac OS', LARGE_WHITE_FONT, menuGroup);
	
	//\nProgramming by: Justin Wang\nArt by: Justin Wang and TheBlackHand\nSound: www.kenney.nl and ArtisticDude\nMusic: Nooskewl Games
	
	// Music Button:
	this.musicButton = gs.createSmallButton(SCREEN_WIDTH - 36, -4, MUSIC_ON_BUTTON_FRAME, this.toggleMusicClicked, this);
	this.musicButton.fixedToCamera = true;
	
	// Credits Button:
	this.creditsButton = gs.createSmallButton(SCREEN_WIDTH - 64, -4, CHARACTER_BUTTON_FRAME, this.creditsClicked, this);
	this.creditsButton.fixedToCamera = true;
	
	
	// Music:
	gs.stopAllMusic();
	
	// Music On:
	if (gs.musicOn) {
		this.musicButton.setFrames(MUSIC_ON_BUTTON_FRAME + 1, MUSIC_ON_BUTTON_FRAME);
		gs.music.MainMenu.loopFull();
	}
	// Music Off:
	else {
		this.musicButton.setFrames(MUSIC_OFF_BUTTON_FRAME + 1, MUSIC_OFF_BUTTON_FRAME);
		gs.stopAllMusic();
	}
	
	this.classSelectMenu.open();
	
	
	if (gs.debugProperties.menuMap) {
		tileIndex = gs.getOpenIndexInLevel();
		this.camPos = {x: tileIndex.x * TILE_SIZE - TILE_SIZE / 2, y: tileIndex.y * TILE_SIZE - TILE_SIZE / 2};

		// Get dest (not same as pos):
		this.camDestIndex = gs.getOpenIndexInLevel();
		while (gs.vectorEqual(this.camDestIndex, gs.toTileIndex(this.camPos))) {
			this.camDestIndex = gs.getOpenIndexInLevel();
		}

		this.camVelocity = gs.getNormal(gs.toTileIndex(this.camPos), this.camDestIndex);
		this.count = 0;
	}
	
	
	// Forcing quick start:
	if (gs.debugProperties.startClass) {
		gs.clearGameData();
		gs.playerClass = gs.debugProperties.startClass;
		gs.playerRace = gs.playerRaces[gs.debugProperties.startRace];
		game.state.start('game');
	}

	gs.submitKongStats();
};


// UPDATE:
// ************************************************************************************************
menuState.update = function () {
	
	/*
	if (gs.help.userName && gs.help.userName.length >= 1) {
		this.userNameText.setText('User Name: ' + gs.help.userName);
		this.userNameText.setStyle(LARGE_WHITE_FONT);
	}
	else {
		this.userNameText.setText('Not logged in (see discord FAQ)');
		this.userNameText.setStyle(LARGE_RED_FONT);
	}
	*/
	
	this.classSelectMenu.update();
	this.raceSelectMenu.update();
	
	if (gs.debugProperties.menuMap) {
		// Changing background levels:
		this.count += 1;
		if (gs.vectorEqual(gs.toTileIndex(this.camPos), this.camDestIndex)) {
			// Only change level if enough time has passed:
			if (this.count >= 300) {
				this.count = 0;
				gs.destroyLevel();
				gs.loadRandomMapAsBackground();
			}

			// Get new destIndex:
			this.camDestIndex = gs.getOpenIndexInLevel();
			while( gs.vectorEqual(this.camDestIndex, gs.toTileIndex(this.camPos))) {
				this.camDestIndex = gs.getOpenIndexInLevel();
			}
			this.camVelocity = gs.getNormal(gs.toTileIndex(this.camPos), this.camDestIndex);

		}

		// Panning Camera:
		this.camPos.x += this.camVelocity.x * 2;
		this.camPos.y += this.camVelocity.y * 2;
		game.camera.focusOnXY(this.camPos.x + 124, this.camPos.y);
		gs.updateTileMapSprites();

		gs.objectSpritesGroup.sort('y', Phaser.Group.SORT_ASCENDING);
	}
	
	
};

// LOAD_DATA:
// ************************************************************************************************
menuState.loadData = function () {
	// Achievements:
	gs.achievements = JSON.parse(localStorage.getItem('Achievements'));
	
	if (!gs.achievements) {
		// Achivements stores the fastest time the player has completed the game.
		// If an achievement is equal to 0 it means the player never won the game with that class.
		gs.achievements = {
			Warrior: 0,
			Barbarian: 0,
			Ranger: 0,
			Rogue: 0,
			FireMage: 0,
			StormMage: 0,
			IceMage: 0,
			Necromancer: 0,
			Enchanter: 0,
		};
	}
	
	if (!gs.achievements.lastChallenge) {
		gs.achievements.lastChallenge = null;
	}
	
	gs.help = JSON.parse(localStorage.getItem('Help'));
	
	// Default help:
	if (!gs.help) {
		gs.help = {
			items: false,
			skills: false,
			books: false,
			stairs: false,
			rest: false,
			unsafeMove: false,
			musicOn: true,
			soundOn: true,
			userName: "",
		};
	}
	
	if (!gs.help.userName) {
		gs.help.userName = "";
	}
	
	// Game Records:
	gs.loadGameRecords();
	
	
};


// TOGGLE_MUSIC_CLICKED:
// ************************************************************************************************
menuState.toggleMusicClicked = function () {
	// Toggle music off:
	if (gs.musicOn) {
		gs.musicOn = false;
		gs.help.musicOn = false;
		this.musicButton.setFrames(MUSIC_OFF_BUTTON_FRAME + 1, MUSIC_OFF_BUTTON_FRAME);
		gs.stopAllMusic();
	}
	// Toggle music on:
	else {
		gs.musicOn = true;
		gs.help.musicOn = true;
		this.musicButton.setFrames(MUSIC_ON_BUTTON_FRAME + 1, MUSIC_ON_BUTTON_FRAME);
		gs.music.MainMenu.loopFull();
	}
	
	localStorage.setItem('Help', JSON.stringify(gs.help));
};

// START_GAME:
// ************************************************************************************************
menuState.startGame = function () {
	game.state.start('game');
	game.camera.flash('#ffffff', ZONE_FADE_TIME * 4);
	game.camera.onFadeComplete.removeAll();
};


