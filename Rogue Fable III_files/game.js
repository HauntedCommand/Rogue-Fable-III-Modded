/*global game, Phaser, localStorage, menuState, loseState, console, winState, XMLHttpRequest, util*/
/*global PlayerCharacter, NPC, Container, Shop, gameMetric, ItemSlotList, frameSelector, levelController*/
/*global UIStatMenu, UICharacterMenu, UIShopMenu, UIDialogMenu, UIEnchantmentMenu, UIAcquirementMenu, UITransferanceMenu, HUD*/
/*global UIHelpMenu*/
/*global featureGenerator, roomGenerator*/
/*global SPAWN_ENEMY_TURNS*/
/*global NUM_SCREEN_TILES_X, PLAYER_FRAMES, TILE_SIZE, LOS_DISTANCE, HUGE_WHITE_FONT*/
/*global TIER_II_ZONES, TIER_III_ZONES, BRANCH_I_ZONES, BRANCH_II_ZONES*/
/*global MERCHANT_INVENTORY_WIDTH, MERCHANT_INVENTORY_HEIGHT*/
/*jshint white: true, laxbreak: true, esversion: 6*/
'use strict';


var gs = {};

// PRELOAD:
// ************************************************************************************************
gs.preload = function () {};

// CREATE:
// ************************************************************************************************
gs.create = function () {
	this.initialize();
	
	// Player:
	this.createKeys();
	this.createPlayerCharacter();
	this.createPlayerCharacterInput();
	this.createLoSRays();
	
	// Merchent Inventory (shared between all merchants):
	this.merchantInventory = new ItemSlotList(MERCHANT_INVENTORY_WIDTH * MERCHANT_INVENTORY_HEIGHT);

	// Interface:
	this.createHUDSprites();
	this.HUD = new HUD();
	
	// Fixes issue w/ firefox cropping text:
	this.HUD.stateText.updateFont(HUGE_WHITE_FONT);
	
	this.shopMenu = new UIShopMenu();
	this.characterMenu = new UICharacterMenu();
	this.enchantmentMenu = new UIEnchantmentMenu();
	this.acquirementMenu = new UIAcquirementMenu();
	this.transferanceMenu = new UITransferanceMenu();
	this.helpMenu = new UIHelpMenu();
	
	// Timing:
	this.pauseTime = 0;
	
	// New Game or Load Game:
	if (this.playerDataExists()) {
		this.loadGame();
	} 
	else {
		this.newGame();
	}
	this.activeCharacter = this.characterList[0];
	
	this.pc.updateStats();
	this.HUD.refresh();
	this.HUD.miniMap.refresh(true);
	this.startTime = Date.now();
};

// INIT:
// Moving most creation stuff here so that the entire gs can be inited in menu state in order to display backgrounds
// This should only ever be called once
// ************************************************************************************************
gs.initialize = function () {
	//console.log("gs.initialize called");
	this.setDebugProperties();
	
	// Game proporties:
	this.setState('GAME_STATE');
	this.turn = 0;
	this.globalTurnTimer = 0;
	this.activeCharacterIndex = 0;
	
	// Lists:
	this.floorItemList = [];
	this.characterList = [];
	this.projectileList = [];
	this.particleList = [];
	this.cloudList = [];
	this.damageText = [];
	this.objectList = [];
	this.particleGeneratorList = [];

	// Sprite Groups (for layering):
	this.tileMapSpritesGroup = game.add.spriteBatch();
	this.floorObjectSpritesGroup = game.add.spriteBatch();
	this.objectSpritesGroup = game.add.group();
	this.shadowSpritesGroup = game.add.group();
	this.projectileSpritesGroup = game.add.group();
	this.hudTileSpritesGroup = game.add.spriteBatch();
	this.characterHUDGroup = game.add.group();
	
	this.popUpTextSpritesGroup = game.add.group();
	
	// Create Abilties:
	this.createAbilityTypes();
	
	
	// Create Types:
	this.createPlayerType();
	this.createNPCTypes();
	this.createAnimEffectTypes();
	this.createStatusEffectTypes();
	this.createTileTypes();
	this.createProjectileTypes();
	this.createLevelTypes();
	this.createVaultTypes();
	this.createObjectTypes();
	this.createUniqueNPCTypes();
	this.createTalents();
	this.setAbilityTypeDefaults();
	this.createItemTypes();
	this.createItemDropTables();
	this.createReligionTypes();
	this.createCloudTypes();
	this.createPlayerClasses();
	this.createPlayerRaces();
	this.createNPCClassTypes();
	featureGenerator.createTypes();
	roomGenerator.createRoomTypes();
	
	frameSelector.init();
	
	// Create Pools:
	this.createParticlePool();
	this.createObjectPool();
	this.createNPCPool();
	this.createProjectilePool();
	
	// Initiate Zone:
	this.createTileMapSprites();
	
	this.dialogMenu = new UIDialogMenu();
	
	// Sound:
	this.soundOn = this.help.soundOn;
	this.musicOn = this.help.musicOn;
	
	// Light:
    //this.initLighting();
};

// LOAD_GAME:
// ************************************************************************************************
gs.loadGame = function () {
	this.pc.load();
};

// NEW_GAME:
// ************************************************************************************************
gs.newGame = function () {
	
	
	// Force a seed from debugProperties:
	if (this.debugProperties.seed) {
		this.seed = this.debugProperties.seed;
		this.isDailyChallenge = false;
	}
	// Daily challenge seed:
	else if (this.startDailyChallenge) {
		let date = new Date();
		this.playerRace = this.playerRaces.Human;
		
		this.seed = "" + date.getFullYear() + date.getMonth() + date.getDate();
		this.achievements.lastChallenge = this.seed;
		this.isDailyChallenge = true;
		localStorage.setItem('Achievements', JSON.stringify(gs.achievements));
		
		game.rnd.sow(this.seed);
		this.playerClass = util.randElem(['Warrior', 'Barbarian', 'Ranger', 'Rogue', 'FireMage', 'IceMage', 'StormMage', 'Necromancer', 'Enchanter']);
	}
	// Random seed:
	else {	
		this.seed = '' + Date.now();
		this.isDailyChallenge = false;
	}
	
	// Logging:
	this.eventLog = [];
	
	this.nextCrystalChestGroupId = 0;
	this.crystalChestGroupIsOpen = [];
	
	
	// Branches:
	this.branches = [];
	this.branches.push('TheUpperDungeon');
	this.branches.push(util.randElem(TIER_II_ZONES));
	//this.branches.push('TheIronFortress');
	this.branches.push(util.randElem(TIER_III_ZONES));
	this.branches.push(util.randElem(BRANCH_I_ZONES));
	this.branches.push(util.randElem(BRANCH_II_ZONES));
	this.branches.push('VaultOfYendor');
	
	// Altars:
	this.remainingAltars = [];
	this.forEachType(this.religionTypes, function (religionType) {
		gs.remainingAltars.push(religionType.name);
	});
	
	// Level features:
	this.levelFeatures = {
		// The Ice Caves:
		BearCave: true,
		
		// The Iron Fortress:
		PitTurret: true,
		
		// The Arcane Tower:
		GolemWorkshop: true,
	};
	
	// Keeping track of generated stuff to never double gen:
	this.previouslySpawnedFeatures = [];
	this.previouslySpawnedUniques = [];
	this.previouslySpawnedStaticLevels = [];
	
	

	// Setup Level:
	this.zoneName = null;
	if (gs.debugProperties.startZoneName) {
		this.changeLevel(gs.debugProperties.startZoneName, gs.debugProperties.startZoneLevel);
	}
	else {
		this.changeLevel('TheUpperDungeon', 1);
	}
	this.savedTime = 0;
	
	// Setup Player:
	if (gs.zoneName === 'TestLevel') {
		this.pc.body.snapToTileIndex({x: 2, y: 20});
		
	}
	else {
		this.pc.body.snapToTileIndex(gs.getSafestIndex() || gs.getOpenIndexInLevel());
	}
	
	// Set default class:
	this.pc.race = this.playerRace;
	this.pc.setClass(this.playerClass);
	
	// Save in case the player dies right away:
	this.saveLevel();
	this.pc.save();

	if (gs.debugProperties.onNewGame) {
		this.onNewGame();
	}

	
	//gameMetric.run();
	
	//gameMetric.testLevel();
	
	//gameMetric.analyseAllSpawnTables();
	
	//gameMetric.testLevels();
	
};

// UPDATE:
// ************************************************************************************************
gs.update = function () {
	this.updateProjectiles();
	this.updateParticles();
	this.updateParticleGenerators();
	
	if (this.pauseTime > 0) {
		this.pauseTime -= 1;
	}
	
	// NPCs will pause before using abilities until the player finishes moving:
	if (this.activeCharacter.state === 'PAUSE' && gs.pc.body.state === 'WAITING') {
		this.activeCharacter.state = 'WAITING';
	}
	
	if (this.state === 'END_TURN') {
		if (this.allCharactersReady()) {
			this.startTurn();
			this.setState('GAME_STATE');
		}
	}
	else if (gs.pc.currentHp > 0 && gs.pauseTime === 0) {
		
		// Player chooseAction:
		if (this.activeCharacter === this.pc && this.canCharacterAct(this.pc)) {
			this.pc.chooseAction();
		}

		// NPC chooseAction:
		// As long as a character does not perform a blocking action, many characters can chooseAction in the same frame
		// This makes turns much faster
		while (this.canCharacterAct(this.activeCharacter) && (this.activeCharacter !== this.pc || this.pc.actionQueue.length > 0 && this.pc.actionQueue[0].type === 'WAIT')) {
			this.activeCharacter.chooseAction();
		}
	}
	
	

	// Update sprites:
	this.updateCharacterFrames();
	this.HUD.refresh();
	this.updateDamageText();
	this.updateHUDTileSprites();
	
	
	// Update Shop Menu:
	if (this.state === 'SHOP_MENU_STATE') {
		this.shopMenu.update();
	}
	
	if (this.state === 'CHARACTER_MENU_STATE') {
		this.characterMenu.update();
	}
	
	if (this.state === 'TRANSFERANCE_MENU_STATE') {
		this.transferanceMenu.update();
	}

	// Update camera:s
	game.camera.focusOnXY(this.pc.body.position.x + 128 + 20, this.pc.body.position.y); // 128
	//game.camera.focusOnXY(this.pc.body.position.x + 148 + 20, this.pc.body.position.y); // 128
	
	this.shadowMaskSprite.x = this.pc.body.position.x;//game.camera.x;
	this.shadowMaskSprite.y = this.pc.body.position.y;//game.camera.y;
	
	
	this.updateTileMapSprites();
	
	gs.objectSpritesGroup.sort('y', Phaser.Group.SORT_ASCENDING);
	
	
};

// CAN_CHARACTER_ACT:
// ************************************************************************************************
gs.canCharacterAct = function (character) {
	return this.projectileList.length === 0
		&& this.state === 'GAME_STATE'
		&& character.state === 'WAITING'
		&& character.body.state === 'WAITING';
};



// ALL_CHARACTERS_READY:
// Use this to determine if all characters have completed movement
// ************************************************************************************************
gs.allCharactersReady = function () {
	for (let i = 0; i < this.characterList.length; i += 1) {
		if (this.characterList[i].isAlive && (this.characterList[i].body.state !== 'WAITING' || this.characterList[i].eventQueue.length > 0)) {
			return false;
		}
	}
	
	if (this.projectileList.length > 0) {
		return false;
	}

	
	return true;
};

// END_TURN:
// ************************************************************************************************
gs.endTurn = function () {
	if (this.state !== 'DIALOG_MENU_STATE' && (this.projectileList.length > 0 || this.activeCharacter.eventQueue.length > 0)) {
		this.setState('END_TURN');
	}
	else {
		this.startTurn();
	}
};

gs.removeDeadCharacters = function () {
	// Remove dead Characters:
    for (let i = this.characterList.length - 1; i >= 0; i -= 1) {
        if (!this.characterList[i].isAlive && this.characterList[i] !== gs.pc) {
            this.characterList.splice(i, 1);
        }
    }
};

// START_TURN:
// ************************************************************************************************
gs.startTurn = function () {
	var lastActiveCharacter = this.activeCharacter;
	
	this.removeDeadCharacters();
	
	if (this.activeCharacterIndex >= this.characterList.length) {
		this.activeCharacterIndex = 0;
	}

	// Ticking the global clock:
	if (lastActiveCharacter === this.pc) {
		this.globalTurnTimer += gs.pc.waitTime;
	}

	// Dead player:
	if (!gs.pc.isAlive) {
		this.activeCharacterIndex = 0;
		this.activeCharacter = gs.pc;
		return;
	}
	
	// Find the next active character:
	while (this.characterList[this.activeCharacterIndex].waitTime > 0) {
		this.characterList[this.activeCharacterIndex].waitTime -= 50;
		this.activeCharacterIndex += 1;
		if (this.activeCharacterIndex >= this.characterList.length) {
			this.activeCharacterIndex = 0;
		}
	}

	this.activeCharacter = this.characterList[this.activeCharacterIndex];
	
	// Global Turns:
	if (this.activeCharacter === this.pc) {
		while (this.globalTurnTimer >= 100) {
			this.globalTurnTimer -= 100;
			this.updateGlobalTurn();
		}
	}
	
	// The player has just started his turn so we set hasNPCActed to false
	// If an npc acts in between then we stop the player from moving
	if (this.activeCharacter === this.pc) {
		gs.HUD.miniMap.refresh();
		gs.pc.previousTileIndex = {x: gs.pc.tileIndex.x, y: gs.pc.tileIndex.y};
		gs.pc.inventory.quickWeaponEquipped = false;
		
		if (this.hasNPCActed || this.numVisibleNPCs() > 0) {
			gs.pc.stopExploring();
		}
		this.hasNPCActed = false;
	}
};

// UPDATE_GLOBAL_TURN:
// ************************************************************************************************
gs.updateGlobalTurn = function () {
	
	gs.turn += 1;

	// Update effect:
	// Reverse order so that adding new effects won't immediately update
	for (let i = this.cloudList.length - 1; i >= 0 ; i -= 1) {
		if (this.cloudList[i].isAlive) {
			this.cloudList[i].updateTurn();
		}
	}

	// Update objects:
	this.objectList.forEach(function (object) {
		if (object.updateTurn) {
			object.updateTurn();
		}
	}, this);

	// Update Characters:
	for (let i = 0; i < this.characterList.length; i += 1) {
		if (this.characterList[i].isAlive) {
			this.characterList[i].updateTurn();
		}
	}
	
	// Level Controller:
	levelController.updateTurn();
	
	this.calculateLoS();
};

// CLEAR_GAME_DATA:
// Clear all game data from localStorage (use this instead of localStorage.clear()
// This DOES NOT clear the score table
// ************************************************************************************************
gs.clearGameData = function () {
	for (let key in localStorage) {
		if (localStorage.hasOwnProperty(key)) {
			if (key !== 'Achievements' && key !== 'Help' && key !== 'GameRecords' && key !== 'hasCompressed' && key !== 'hasUTF16Compressed') {
				localStorage.removeItem(key);
			}
		}
	}
	
	// Just in case theres some fiddle fuckery here:
	game.camera.onFadeComplete.removeAll();
};

// START_MUSIC:
// Starts the appropriate music for the zone:
// ************************************************************************************************
gs.startMusic = function () {
	if (this.zoneType().musicTrack) {
		this.getZoneMusic(this.zoneName).fadeIn(1000, true);
	}
};

// STOP_ALL_MUSIC:
// ************************************************************************************************
gs.stopAllMusic = function () {
	this.musicList.forEach(function (track) {
		track.stop();
	}, this);
};

// CREATE_KEYS:
// ************************************************************************************************
gs.createKeys = function () {
	this.keys = {
		a: game.input.keyboard.addKey(Phaser.Keyboard.A),
		w: game.input.keyboard.addKey(Phaser.Keyboard.W),
		s: game.input.keyboard.addKey(Phaser.Keyboard.S),
		d: game.input.keyboard.addKey(Phaser.Keyboard.D),
		e: game.input.keyboard.addKey(Phaser.Keyboard.E),
		r: game.input.keyboard.addKey(Phaser.Keyboard.R),
		t: game.input.keyboard.addKey(Phaser.Keyboard.T),
		i: game.input.keyboard.addKey(Phaser.Keyboard.I),
		c: game.input.keyboard.addKey(Phaser.Keyboard.C),
		o: game.input.keyboard.addKey(Phaser.Keyboard.O),
		q: game.input.keyboard.addKey(Phaser.Keyboard.Q),
		
		num1: game.input.keyboard.addKey(Phaser.Keyboard.ONE),
		num2: game.input.keyboard.addKey(Phaser.Keyboard.TWO),
		num3: game.input.keyboard.addKey(Phaser.Keyboard.THREE),
		num4: game.input.keyboard.addKey(Phaser.Keyboard.FOUR),
		num5: game.input.keyboard.addKey(Phaser.Keyboard.FIVE),
		num6: game.input.keyboard.addKey(Phaser.Keyboard.SIX),
		num7: game.input.keyboard.addKey(Phaser.Keyboard.SEVEN),
		num8: game.input.keyboard.addKey(Phaser.Keyboard.EIGHT),
		esc: game.input.keyboard.addKey(Phaser.Keyboard.ESC),
		space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
		enter: game.input.keyboard.addKey(Phaser.Keyboard.ENTER),
		p: game.input.keyboard.addKey(Phaser.Keyboard.P),
		shift: game.input.keyboard.addKey(Phaser.Keyboard.SHIFT),
		period: game.input.keyboard.addKey(Phaser.Keyboard.PERIOD),
		comma: game.input.keyboard.addKey(Phaser.Keyboard.COMMA),
		tab: game.input.keyboard.addKey(Phaser.Keyboard.TAB),
		
		// NUMPAD:
		up: game.input.keyboard.addKey(Phaser.Keyboard.UP),
		down: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
		left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
		right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
		home: game.input.keyboard.addKey(Phaser.Keyboard.HOME),
		pageUp: game.input.keyboard.addKey(Phaser.Keyboard.PAGE_UP),
		pageDown: game.input.keyboard.addKey(Phaser.Keyboard.PAGE_DOWN),
		end: game.input.keyboard.addKey(Phaser.Keyboard.END),
		
		numPad1: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_1),
		numPad2: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_2),
		numPad3: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_3),
		numPad4: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_4),
		numPad5: game.input.keyboard.addKey(12),
		numPad6: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_6),
		numPad7: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_7),
		numPad8: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_8),
		numPad9: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_9),
	};
};

// DESCRIPTION_OF_TILE_INDEX:
// Return a textual description of the tile located at tileIndex
// ************************************************************************************************
gs.descriptionOfTileIndex = function (tileIndex) {
	// Offscreen:
    if (!gs.isInBounds(tileIndex)) {
        return null;
    }
	// Unexplored:
	else if (!gs.getTile(tileIndex).explored) {
        return 'Unexplored';
    }
	// Character:
	else if (gs.getChar(tileIndex) && gs.pc.canSeeCharacter(gs.getChar(tileIndex))) {
		return gs.characterDesc(gs.getChar(tileIndex));
    }
	// Merchant:
	else if (gs.getChar(tileIndex) && gs.inArray(gs.getChar(tileIndex).type.name, ['Merchant', 'SkillTrainer', 'TalentTrainer', 'Priest'])) {
		return gs.characterDesc(gs.getChar(tileIndex));
    }
	// Effect:
	else if (gs.getCloud(tileIndex) && gs.getTile(tileIndex).visible) {
		return gs.capitalSplit(gs.getCloud(tileIndex).name) || 'Effect';
    }
	// Item:
	else if (gs.getItem(tileIndex)) {
        return gs.getItem(tileIndex).item.toLongDesc();
	}
	// Object:
	else if (gs.getTile(tileIndex).object && !gs.getTile(tileIndex).object.type.isHidden) {
		return gs.objectDesc(gs.getTile(tileIndex).object);
	}	
	// Tile:
	else {
		return gs.tileDesc(gs.getTile(tileIndex));
	}
};

// PLAY_SOUND:
// ************************************************************************************************
gs.playSound = function (sound, tileIndex) {
	if (!tileIndex || gs.getTile(tileIndex).visible || gs.distance(gs.pc.tileIndex, tileIndex) < 10) {
		if (this.soundOn) {
			sound.play();
		}
	}
};

// GAME_TIME:
// Returns the time since starting new game.
// Takes loading and continuing into account
// ************************************************************************************************
gs.gameTime = function () {
	return (Date.now() - gs.startTime) + gs.savedTime;
};

// LOAD_RANDOM_MAP_AS_BACKGROUND:
// ************************************************************************************************
gs.loadRandomMapAsBackground = function () {	
	var camTileIndex = {};
	
	// Load Map:
	gs.debugProperties.mapExplored = true;
	gs.debugProperties.mapVisible = true;
	gs.debugProperties.dressRooms = true;
	gs.debugProperties.spawnMobs = true;
	gs.debugProperties.spawnZoos = true;
	gs.debugProperties.generateGlobalStuff = true;
	gs.debugProperties.useLighting = false;
	
	gs.previouslySpawnedFeatures = [];
	gs.crystalChestGroupIsOpen = [];
	gs.remainingAltars = [];
	gs.levelFeatures = {};
	gs.previouslySpawnedUniques = [];
	gs.previouslySpawnedStaticLevels = [];
	gs.branches = [
		'TheUpperDungeon', 
		'TheOrcFortress', 'TheIronFortress', 'TheUnderGrove', 'TheSunlessDesert', 'TheSwamp',
		'TheDarkTemple', 'TheCrypt',
		'TheArcaneTower', 'TheSewers', 'TheIceCaves', 'TheCore',
		'VaultOfYendor'
	];
	
	gs.zoneName = util.randElem(gs.branches);
	gs.zoneLevel = util.randInt(1, 4);
	gs.generateLevel();
	
	// Set map visible:
	gs.exploreMap();
	gs.getAllIndex().forEach(function (tileIndex) {
		gs.getTile(tileIndex).visible = true;
	}, this);
	
	// Focus Camera:
	game.world.bounds.setTo(-1000, -1000, (this.numTilesX - 1) * TILE_SIZE + 2000, (this.numTilesY - 1) * TILE_SIZE + 3000);
	game.camera.setBoundsToWorld();

	
	// Make sure NPCs are visible and not displaying their hud info
	gs.updateTileMapSprites();
	gs.characterList.forEach(function (npc) {
		npc.updateFrame();
		npc.statusText.visible = false;
		npc.hpText.visible = false;
		npc.ringSprite.visible = false;
	}, this);
};



gs.localStorageSpace = function() {
	var allStrings = '';
	for(var key in localStorage){
		if (localStorage.hasOwnProperty(key)){
			allStrings += localStorage[key];
		}
	}
	return allStrings ? 3 + ((allStrings.length*16)/(8*1024)) + ' KB' : 'Empty (0 KB)';
};

gs.postStats = function (text) {
	if (!gs.help.userName || gs.help.userName.length <= 3 || gs.help.userName.length > 30 || !gs.debugProperties.logStats) {
		return;
	}
	console.log('attempting to send stats to server...');
	var xhttp = new XMLHttpRequest();
	var data = {
		playerName: gs.help.userName,
		zoneName: gs.capitalSplit(this.zoneName),
		zoneLevel: this.niceZoneLevel(this.zoneName, this.zoneLevel),
		text: text,
		playerClass: gs.pc.characterClass,
		playerLevel: gs.pc.level,
		time: gs.timeToString(gs.gameTime()),
	};
	xhttp.open('POST','https://justinwang123.pythonanywhere.com/stats/submit',true);
	xhttp.send(JSON.stringify(data));
};

gs.setState = function (newState) {
	this.state = newState;
};