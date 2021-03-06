/*global gs, console, debug*/
/*global ItemSlotList, ItemSlot, CharacterInventory*/
/*global STATIC_LEVEL_CHANCE, VAULT_ROOM_PERCENT, FLOATING_FEATURE_PERCENT*/
/*jshint esversion: 6*/
'use strict';

// SET_DEBUG_PROPERTIES:
// ************************************************************************************************
gs.setDebugProperties = function () {
	this.versionStr = '0.50';
	
	this.debugProperties = {
		throwExceps: true,
		showAreas: false,
		mapVisible: false,
		showCharactersOnMap: true,
		npcCanAgro: true, // true
		dressRooms: true,
		generateGlobalStuff: true,
		allowRespawn: false,
		useLighting: true,
		saveLevels: true,
		testLevel: false, // false (generates a flat level)
		allowFastTravel: false, // false
		spawnUniques: true,
		logAStarTunnels: false,
		
		// Commonly used:
		startClass: 'FireMage',//,//'Rogue', //'FireMage',
		startRace: 'Human',
		startZoneName: 'TheUpperDungeon', //TestLevel',
		startZoneLevel: 1, // 1
		mapExplored: true, // false
		spawnMobs: false, // true
		disableMana: true, // false
		noDamage: true, // false
		logStats: false,
		warpStairs: true,
		showDebugText: true,
		
		onNewGame: true,
		
		seed: null,
		
		forceSideFeature: 'ChoiceTreasureRoom'
	};
	
	
	
	this.clearDebugProperties();
	//this.debugProperties.showDebugText = true;
	
	// 1542943238824, TheCrypt, 1
	// 1542940152196, TheOrcFortress, 4 (streamer)
	/*
	this.debugProperties.seed = "1542943238824";
	this.debugProperties.startZoneName = 'TheCrypt';
	this.debugProperties.startZoneLevel = 1;
	this.debugProperties.startClass = 'FireMage';
	this.debugProperties.startRace = 'Human';
	this.debugProperties.mapExplored = true;
	*/

	//STATIC_LEVEL_CHANCE = 1.0;
	
	if (STATIC_LEVEL_CHANCE !== 0.1) {
		console.log('REMEMBER TO CHANGE STATIC_LEVEL_CHANCE!');
	}
	
	if (VAULT_ROOM_PERCENT !== 0.5) {
		console.log('REMEMBER TO CHANGE VAULT_ROOM_PERCENT!');
	}
	
	if (FLOATING_FEATURE_PERCENT !== 0.25) {
		console.log('REMEMBER TO CHANGE FLOATING_FEATURE_PERCENT!');
	}
};

gs.onNewGame = function () {
	
	console.log('Num Items: ' + this.countTypes(this.itemTypes) + '/160');
	console.log('Num Abilities: ' + this.countPlayerAbilities() + '/40');
	console.log('Num Talents: ' + this.countTypes(this.talents) + '/60');
	console.log('Num Mobs: ' + this.countTypes(this.npcTypes) + '/110');
	
	gs.pc.learnTalent('FlashFreeze');
	gs.pc.learnTalent('ToxicAttunement');
	
	gs.pc.talentPoints = 10;
	
	// UNIT_TESTS:
	ItemSlot.UnitTests();
	ItemSlotList.UnitTests();
	CharacterInventory.UnitTests();
};

// CLEAR_DEBUG_PROPERTIES:
// ************************************************************************************************
gs.clearDebugProperties = function () {
	this.debugProperties = {
		throwExceps: true,
		showAreas: false,
		mapVisible: false,
		showCharactersOnMap: false,
		npcCanAgro: true, // true
		dressRooms: true,
		generateGlobalStuff: true,
		allowRespawn: false,
		useLighting: true,
		saveLevels: true,
		testLevel: false, // false (generates a flat level)
		allowFastTravel: false, // false
		spawnUniques: true,
		menuMap: true,
		
		// Commonly used:
		startClass: null ,//'FireMage', //'Ranger', //'FireMage',
		startZoneName: 'TheUpperDungeon',
		startZoneLevel: 1, // 1
		mapExplored: false, // false
		spawnMobs: true, // true
		disableMana: false, // false
		noDamage: false, // false
		logStats: true,
	};
};

// ASSERT_EQUAL:
// ************************************************************************************************
var ASSERT_EQUAL = function (value, expected, message = "") {
	if (value !== expected) {
		throw 'ASSERT_EQUAL: ' + message;
	}
};

// ASSERT_THROW:
// Make sure the function throws an exception
// ************************************************************************************************
var ASSERT_THROW = function (func, message) {
	try {
		func.apply(this);
	}
	catch (msg) {
		return;
	}
	
	throw 'ASSERT_THROW: ' + message;
};


