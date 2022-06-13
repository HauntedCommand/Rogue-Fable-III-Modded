/*global game, gs, console, Phaser, localStorage*/
/*global menuState*/
/*global SMALL_WHITE_FONT, LARGE_WHITE_FONT, CLASS_LIST*/
/*global SCALE_FACTOR, ITEM_SLOT_FRAME, PLAYER_FRAMES, SCREEN_WIDTH, SCREEN_HEIGHT, ZONE_FADE_TIME*/
/*jshint esversion: 6*/

'use strict';

// CONSTRUCTOR:
// ************************************************************************************************
function ClassSelectMenu () {
	var sprite, 
		iconSpaceY, 
		i = 0, 
		startX = 720, 
		startY = 0,
		width = SCREEN_WIDTH - startX,
		str;
	
	// Group:
	this.group = game.add.group();
	this.group.fixedToCamera = true;

	// Menu Sprite:
	sprite = gs.createSprite(0, 0, 'HUD', this.group);
	sprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	
	this.totalAchievements = 0;
	iconSpaceY = 50;
	
	// Create class panels:
	this.classPanelList = [];
	CLASS_LIST.forEach(function (className, i) {
		this.classPanelList.push(this.createClassPanel(startX + 6, startY + 4 + i * iconSpaceY, className));
	}, this);
	
	
	// Daily Challenge:
	this.createChallengePanel(startX + 6, 454);
	
	// Submit total achievements:
	/*
	if (this.totalAchievements > 0) {
		gs.kongSubmit('TotalAchievements', this.totalAchievements);
	}
	*/
	
	// Achievement Text:
	this.achievementText = gs.createText(startX + 4, SCREEN_HEIGHT, '', SMALL_WHITE_FONT, this.group);
	this.achievementText.lineSpacing = -5;
	this.achievementText.anchor.setTo(0, 1);
	
	// Records Button:
	this.recordsButton = gs.createTextButton(startX + width / 2, 520, 'Game Records', this.recordsClicked, this, this.group);
	
	
	// Continue Button:
	if (gs.playerDataExists()) {
		this.continueButton = gs.createTextButton(startX + width / 2, 550, 'Continue Save', this.continueClicked, this, this.group);
		this.saveData = JSON.parse(localStorage.getItem('PlayerData'));
	}
	
	
	this.group.visible = false;
}

// RECORDS_CLICKED:
// ************************************************************************************************
ClassSelectMenu.prototype.recordsClicked = function () {
	if (menuState.recordMenu.group.visible) {
		menuState.recordMenu.close();
	}
	else {
		menuState.recordMenu.open();
	}
};

// CREATE_CHALLENGE_PANEL:
// ************************************************************************************************
ClassSelectMenu.prototype.createChallengePanel = function (x, y) {
	this.challengeButton = gs.createButton(x, y, 'BigSlot', this.challengeClicked, this, this.group);
	this.challengeButton.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.challengeButton.setFrames(1, 0);
	
	this.challengeSprite = gs.createSprite(x + 4, y + 4, 'Tileset', this.group);
	this.challengeSprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.challengeSprite.frame = 1226;
	
	this.challengeText = gs.createText(x + 60, y - 2, 'Daily Challenge', LARGE_WHITE_FONT, this.group);
	
	this.challengeAchivements = [];
	for (let i = 0; i < 3; i += 1) {
		this.challengeAchivements[i] = gs.createSprite(x + 54 + i * 32, y + 14, 'Tileset', this.group);
		this.challengeAchivements[i].frame = 1269 + i;
		this.challengeAchivements[i].scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
		this.challengeAchivements[i].inputEnabled = true;
	}
	
	if (gs.bestChallengeWinStreak() < 2) {
		this.challengeAchivements[0].tint = 0x555555;
	}
	
	if (gs.bestChallengeWinStreak() < 3) {
		this.challengeAchivements[1].tint = 0x555555;
	}
	
	if (gs.bestChallengeWinStreak() < 5) {
		this.challengeAchivements[2].tint = 0x555555;
	}
};

// CREATE_CLASS_PANEL:
// ************************************************************************************************
ClassSelectMenu.prototype.createClassPanel = function (x, y, className) {
	var classPanel = {}, str;
	
	classPanel.button = gs.createButton(x, y, 'BigSlot', this.classClicked, this, this.group);
	classPanel.button.className = className;
	classPanel.button.scale.setTo(2, 2);
	classPanel.button.setFrames(1, 0);

	// Class Image: 
	classPanel.image =  gs.createSprite(x + 4, y + 4, 'Tileset', this.group);
	classPanel.image.scale.setTo(2, 2);
	classPanel.image.frame = PLAYER_FRAMES[className];

	// Class Name Text:
	str = gs.capitalSplit(className);
	if (gs.achievements[className] > 0) {
		str += ' [' + gs.timeToString(gs.achievements[className]) + ']';
	}
	classPanel.text = gs.createText(x + 60, y - 2, str, LARGE_WHITE_FONT, this.group);

	
	// Achievements:
	classPanel.achievementIcons = [];
	classPanel.achievementIcons[0] = gs.createSprite(x + 54, y + 14, 'Tileset', this.group);
	classPanel.achievementIcons[0].frame = 1266;
	classPanel.achievementIcons[0].scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	classPanel.achievementIcons[0].inputEnabled = true;
	// Locked:
	if (gs.achievements[className] === 0) {
		classPanel.achievementIcons[0].tint = 0x555555;
	}
	// Unlocked:
	else {
		this.totalAchievements += 1;
	}

	classPanel.achievementIcons[1] = gs.createSprite(x + 54 + 32, y + 14, 'Tileset', this.group);
	classPanel.achievementIcons[1].frame = 1267;
	classPanel.achievementIcons[1].scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	classPanel.achievementIcons[1].inputEnabled = true;
	// Locked:
	if (gs.achievements[className] === 0 || gs.achievements[className] > 60 * 60 * 1000) {
		classPanel.achievementIcons[1].tint = 0x555555;
	}
	// Unlocked:
	else {
		this.totalAchievements += 1;
	}

	classPanel.achievementIcons[2] = gs.createSprite(x + 54 + 64, y + 14, 'Tileset', this.group);
	classPanel.achievementIcons[2].frame = 1268;
	classPanel.achievementIcons[2].scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	classPanel.achievementIcons[2].inputEnabled = true;
	// Locked:
	if (gs.achievements[className] === 0 || gs.achievements[className] > 45 * 60 * 1000) {
		classPanel.achievementIcons[2].tint = 0x555555;
	}
	// Unlocked:
	else {
		this.totalAchievements += 1;
	}
	
	return classPanel;
};

// UPDATE:
// ************************************************************************************************
ClassSelectMenu.prototype.update = function () {
	var str = '';
	this.achievementText.setText('');
	
	
	this.classPanelList.forEach(function (panel) {
		// Set Achievement Text:
		if (panel.achievementIcons[0].input.checkPointerOver(game.input.activePointer)) {
			str = 'Win for the first time.';
		}
		if (panel.achievementIcons[1].input.checkPointerOver(game.input.activePointer)) {
			str = 'Win in under 60 minutes.';
		}
		if (panel.achievementIcons[2].input.checkPointerOver(game.input.activePointer)) {
			str = 'Win in under 45 minutes.';
		}
		
		// Set Class Text:
		if (panel.button.input.checkPointerOver(game.input.activePointer)) {
			str = gs.capitalSplit(panel.button.className);
			
			if (panel.button.className === 'Barbarian') {
				str += '\nAbility cooldowns only recharge when killing enemies.';
			}
			
			str += this.getStatsFor(panel.button.className);
		}
	}, this);
	
	// Set Continue Text:
	if (this.continueButton && this.continueButton.button.input.checkPointerOver(game.input.activePointer)) {
		str = 'level ' + this.saveData.level + ' ' + gs.capitalSplit(this.saveData.characterClass) + '\n';
		str += gs.capitalSplit(this.saveData.zoneName) + ' ';
		str += gs.niceZoneLevel(this.saveData.zoneName, this.saveData.zoneLevel);
	}
	
	// Set Daily Challenge Text:
	if (this.challengeButton.input.checkPointerOver(game.input.activePointer)) {
		let date = new Date();
		
		// Already completed challenge:
		if (this.isChallengeComplete()) {
			str = "Daily Challenge Complete for : " + date.toDateString();
		}
		// Challenge not started:
		else {
			str = "Start Daily challenge for: " + date.toDateString();
		}
		
		str += '\nBest Win Streak: ' + gs.bestChallengeWinStreak();
		str += '\nCurrent Win Streak: ' + gs.currentChallengeWinStreak();
	}
	
	// Set Achievement Text:
	if (this.challengeAchivements[0].input.checkPointerOver(game.input.activePointer)) {
		str = 'Win 2 daily challenges in a row.';
	}
	if (this.challengeAchivements[1].input.checkPointerOver(game.input.activePointer)) {
		str = 'Win 3 daily challenges in a row.';
	}
	if (this.challengeAchivements[2].input.checkPointerOver(game.input.activePointer)) {
		str = 'Win 5 daily challenges in a row.';
	}
	
	// Credits:
	if (menuState.creditsButton.input.checkPointerOver(game.input.activePointer)) {
		str = 'Programming by: Justin Wang\n';
		str += 'Art by: Justin Wang and TheBlackHand\n';
		str += 'Sound: www.kenney.nl and ArtisticDude\n';
		str += 'Music: Nooskewl Games';
	
	}
	
	this.achievementText.setText(gs.wrapText(str, 32).join('\n'));
	
	
};

// GET_STATS_FOR:
// ************************************************************************************************
ClassSelectMenu.prototype.getStatsFor = function (className) {
	var str = '\n';
	if (gs.achievements[className] > 0) {
		str += 'Best Win Time: ' + gs.timeToString(gs.achievements[className]) + '\n';
	}
	
	str += 'Num Wins: ' + gs.numWinsWithClass(className) + '\n';
	str += 'Num Deaths: ' + gs.numDeathsWithClass(className) + '\n';
	str += 'Best Win Streak: ' + gs.bestWinStreakWithClass(className) + '\n';
	str += 'Current Win Streak: ' + gs.currentWinStreakWithClass(className);
	return str;
};

// IS_CHALLENGE_COMPLETE:
// ************************************************************************************************
ClassSelectMenu.prototype.isChallengeComplete = function () {
	let date = new Date();
	return gs.achievements.lastChallenge === "" + date.getFullYear() + date.getMonth() + date.getDate();
};

// CLASS_CLICKED:
// ************************************************************************************************
ClassSelectMenu.prototype.classClicked = function (button) {
	var dialog = [{}], onYes;
	
	menuState.recordMenu.close();
	
	onYes = function () {
		/*
		gs.playerClass = button.className;
		this.close();
		menuState.raceSelectMenu.open();
		*/
		
		gs.playerClass = button.className;
		gs.playerRace = gs.playerRaces.Human;
		gs.clearGameData();
		gs.startDailyChallenge = false;
	
		game.camera.fade('#000000', ZONE_FADE_TIME * 2);
		game.camera.onFadeComplete.add(menuState.startGame, menuState);
	}.bind(this);
	
	dialog[0].text = 'You currently have a saved game stored. Are you sure you want to start a new game?';
	dialog[0].responses = [
		{text: 'Yes', nextLine: 'exit', func: onYes},
		{text: 'No', nextLine: 'exit'},
	];
	
	if (gs.playerDataExists() && !gs.debugProperties.startClass) {
		gs.dialogMenu.open(dialog);
	}
	else {
		onYes();
	}
};

// CONTINUE_CLICKED:
// ************************************************************************************************
ClassSelectMenu.prototype.continueClicked = function () {
	gs.startDailyChallenge = false;
	
	game.camera.fade('#000000', ZONE_FADE_TIME * 2);
    game.camera.onFadeComplete.add(menuState.startGame, menuState);
};

// OPEN:
// ************************************************************************************************
ClassSelectMenu.prototype.open = function () {
	this.group.visible = true;
};

// CLOSE:
// ************************************************************************************************
ClassSelectMenu.prototype.close = function () {
	this.group.visible = false;
};

// CHALLENGE_CLICKED:
// ************************************************************************************************
ClassSelectMenu.prototype.challengeClicked = function () {
	var dialog = [{}], onYes;
	
	if (!this.isChallengeComplete()) {
		onYes = function () {
			// Clearing game data to start the new game:
			gs.clearGameData();

			gs.startDailyChallenge = true;
			game.camera.fade('#000000', ZONE_FADE_TIME * 2);
			game.camera.onFadeComplete.add(menuState.startGame, menuState);
		}.bind(this);

		dialog[0].text = 'You currently have a saved game stored. Are you sure you want to start a new game?';
		dialog[0].responses = [
			{text: 'Yes', nextLine: 'exit', func: onYes},
			{text: 'No', nextLine: 'exit'},
		];

		if (gs.playerDataExists()) {
			gs.dialogMenu.open(dialog);
		}
		else {
			onYes();
		}
	}
};

