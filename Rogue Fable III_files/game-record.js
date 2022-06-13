/*global gs, localStorage, console, LZString*/
/*jshint esversion: 6*/
'use strict';

// GAME_RECORD:
// ************************************************************************************************
function GameRecord () {}

// LOAD_GAME_RECORDS:
// ************************************************************************************************
gs.loadGameRecords = function () {
	var data;
		
	// Load records:
	if (localStorage.getItem('GameRecords')) {
		let rawData;
		
		// User is using latest compression:
		if (localStorage.getItem('hasUTF16Compressed')) {
			console.log('Loading from UTF16 Compressed');
			rawData = LZString.decompressFromUTF16(localStorage.getItem('GameRecords'));
			
		}
		// User is using old compression:
		else if (localStorage.getItem('hasCompressed')) {
			console.log('Loading from old Compressed');
			rawData = LZString.decompress(localStorage.getItem('GameRecords'));
		}
		// The user has never performed compression:
		else {
			console.log('Loading from never compressed');
			rawData = localStorage.getItem('GameRecords');
		}
		
		try {
			data = JSON.parse(rawData);
		}
		catch (err) {
			console.log('ERROR: Corrupted GameRecords please contact Justin Wang');
		}
	}
	
	gs.gameRecords = [];
	
	if (data) {
		data.forEach(function (e) {
			gs.gameRecords.push(gs.loadGameRecord(e));
		}, this);
	}
};

// LOG_GAME_RECORD:
// Call this to create a new game record:
// ************************************************************************************************
gs.logGameRecord = function (text, isWin) {
	var gameRecord = new GameRecord();
	
	gameRecord.date = Date.now();
	gameRecord.isChallenge = gs.isDailyChallenge;
	gameRecord.gameTime = gs.gameTime();
	gameRecord.zoneName = gs.capitalSplit(gs.zoneName);
	gameRecord.zoneLevel = gs.niceZoneLevel(gs.zoneName, gs.zoneLevel);
	gameRecord.playerClass = gs.pc.characterClass;
	gameRecord.playerRace = gs.pc.race.name;
	gameRecord.playerLevel = gs.pc.level;
	gameRecord.isWin = isWin;
	gameRecord.text = text;
	
	this.gameRecords.push(gameRecord);
	
	console.log('creating game record...');
	
	localStorage.setItem('GameRecords', LZString.compressToUTF16(JSON.stringify(this.gameRecords)));
	localStorage.setItem('hasCompressed', 1);
	localStorage.setItem('hasUTF16Compressed', 1);
};

// LOAD_GAME_RECORD:
// ************************************************************************************************
gs.loadGameRecord = function (data) {
	var gameRecord = new GameRecord();
	
	gameRecord.date = data.date;
	gameRecord.isChallenge = data.isChallenge;
	gameRecord.gameTime = data.gameTime;
	gameRecord.zoneName = data.zoneName;
	gameRecord.zoneLevel = data.zoneLevel;
	gameRecord.playerClass = data.playerClass;
	gameRecord.playerRace = data.playerRace;
	gameRecord.playerLevel = data.playerLevel;
	gameRecord.isWin = data.isWin;
	gameRecord.text = data.text || "";
	
	return gameRecord;
};



// TO_STRING:
// ************************************************************************************************
GameRecord.prototype.toString = function () {
	var str = '', date;
	
	// Date Title:
	date = new Date(this.date);
	str += date.toDateString();
	if (this.isChallenge) {
		str += ' - daily challenge';
	}
	str += ':\n';
	
	
	str += 'lvl ' + this.playerLevel + ' ';
	str += gs.capitalSplit(this.playerClass) + ' ';
	
	
	if (this.isWin) {
		str += 'Successfully retrieved the goblet.';
	}
	else if (this.text && this.text.length > 0) {
		str += this.text + ' in ' + gs.capitalSplit(this.zoneName) + ' ' + this.zoneLevel + '.';
	}
	else {
		str += 'Was killed in ' + gs.capitalSplit(this.zoneName) + ' ' + this.zoneLevel + '.';
	}

	str += ' Time: ' + gs.timeToString(this.gameTime) + '.';
	
	return str;
};
