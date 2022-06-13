/*global game, gs, console*/
'use strict';

gs.createPlayerRaces = function () {
	this.playerRaces = {};
	
	// HUMAN:
	this.playerRaces.Human = {};
	this.playerRaces.Human.effect = function (character) {
		
	};
	this.playerRaces.Human.desc = function () {
		var str = 'Human\n';
		str += 'Medium Size\n';
		return str;
	};
	
	// OGRE:
	this.playerRaces.Ogre = {};
	this.playerRaces.Ogre.effect = function (character) {
		character.strength += 3;
		character.intelligence -= 3;
		
		character.bonusMovementSpeed -= 1;
		character.size += 1;
	};
	this.playerRaces.Ogre.desc = function () {
		var str = 'Ogre\n';
		str += 'Large Size\n';
		str += '+3 Strength\n';
		str += '-3 Intelligence\n';
		str += 'Slow Movement speed\n';
		
		return str;
	};
	
	// TROLL:
	this.playerRaces.Troll = {};
	this.playerRaces.Troll.effect = function (character) {
		character.bonusHpRegenTime += 5;
		character.intelligence -= 3;
		character.resistance.Fire -= 1;
	};
	this.playerRaces.Troll.desc = function () {
		var str = 'Troll\n';
		str += 'Medium Size\n';
		str += '-3 Intelligence\n';
		str += '-50% Fire Resistance\n';
		str += 'Double regen speed\n';
		return str;
	};
	
	// MUMMY:
	this.playerRaces.Mummy = {};
	this.playerRaces.Mummy.effect = function (character) {
		character.resistance.Fire -= 1;
		character.resistance.Toxic += 1;
	};
	this.playerRaces.Mummy.desc = function () {
		var str = 'Mummy\n';
		str += 'Medium Size\n';
		str += 'No hunger\n';
		str += '-50% Fire Resistance\n';
		str += '+50% Toxic Resistance\n';
		str += 'Cannot consume potions or food\n';
		return str;
	};
	
	// ELF:
	this.playerRaces.Elf = {};
	this.playerRaces.Elf.effect = function (character) {
		character.dexterity += 3;
		character.strength -= 3;
	};
	this.playerRaces.Elf.desc = function () {
		var str = 'Elf\n';
		str += 'Medium Size\n';
		str += '+3 Dexterity\n';
		str += '-3 Strength\n';
		str += 'No min range for bows\n';
		return str;
	};
	
	// GNOME:
	this.playerRaces.Gnome = {};
	this.playerRaces.Gnome.effect = function (character) {
		character.intelligence += 3;
		character.strength -= 3;
		character.size -= 1;
	};
	this.playerRaces.Gnome.desc = function () {
		var str = 'Gnome\n';
		str += 'Small Size\n';
		str += '+3 Intelligence\n';
		str += '-3 Strength\n';
		return str;
	};
	
	this.playerRaceList = [];
	this.forEachType(this.playerRaces, function (playerRace) {
		this.playerRaceList.push(playerRace);
	}, this);
	
	this.nameTypes(this.playerRaces);
};