/*global game, gs, console, util*/
/*global Item*/
/*jshint esversion: 6*/

'use strict';

// LOAD_VAULTS:
// Called from loader in order to load the json files for each vault
// ************************************************************************************************
gs.loadVaults = function () {
	this.createVaultGenerateFuncs();
	
	this.vaultTypes = {
		IronFortressBallista:		{},
		GolemWorkshop: 	{},
		Library: 		{initFunc: this.vaultGenerateFuncs.Library},
		
		// Generic Vaults:
		GenericRoom01:	{tags: ['Generic']},
		GenericRoom02:	{tags: ['Generic']},
		GenericRoom03:	{tags: ['Generic']},
		GenericRoom04:	{tags: ['Generic']},
		GenericRoom05:	{tags: ['Generic']},
		GenericRoom06:	{tags: ['Generic']},
		GenericRoom07:	{tags: ['Generic']},
		GenericRoom08:	{tags: ['Generic']},
        GenericRoom09:	{tags: ['Generic']},
        GenericRoom10:	{tags: ['Generic']},
        GenericRoom11:	{tags: ['Generic']},
        GenericRoom12:	{tags: ['Generic']},
        GenericRoom13:	{tags: ['Generic']},
        GenericRoom14:	{tags: ['Generic']},
        GenericRoom15:	{tags: ['Generic']},
        GenericRoom16:	{tags: ['Generic']},
        GenericRoom17:	{tags: ['Generic'], hasPits: true},
        GenericRoom18:	{tags: ['Generic']},
		GenericRoom19:	{tags: ['Generic']},
		
		// Dungeon (upper levels and orc fortress)
		Dungeon01: {tags: ['Dungeon']},
		Dungeon02: {tags: ['Dungeon']},
		Dungeon03: {tags: ['Dungeon'], dontRotate: true},
		Dungeon04: {tags: ['Dungeon']},
		Dungeon05: {tags: ['Dungeon']},
		Dungeon06: {tags: ['Dungeon']},
		Dungeon07: {tags: ['Dungeon'], dontRotate: true},
		Dungeon08: {tags: ['Dungeon'], dontRotate: true},
		Dungeon09: {tags: ['Dungeon']},
		Dungeon10: {tags: ['Dungeon'], dontRotate: true},
		
		// Iron Fortress:
		IronFortress01: {tags: ['TheIronFortress'], dontRotate: true},
		IronFortress02: {tags: ['TheIronFortress'], dontRotate: true},
		
		// The Crypt:
		TheCrypt01: {tags: ['TheCrypt'], dontRotate: true},
		TheCrypt02: {tags: ['TheCrypt'], dontRotate: true},
		TheCrypt03: {tags: ['TheCrypt'], dontRotate: true},
		TheCrypt04: {tags: ['TheCrypt']},
		TheCrypt05: {tags: ['TheCrypt']},
		TheCrypt06: {tags: ['TheCrypt']},
		TheCrypt07: {tags: ['TheCrypt']},
		TheCrypt08: {tags: ['TheCrypt'], dontRotate: true},
		TheCrypt09: {tags: ['TheCrypt']},
		TheCrypt10: {tags: ['TheCrypt']},
		TheCrypt11: {tags: ['TheCrypt']},
		TheCrypt12: {tags: ['TheCrypt']},
		TheCrypt13: {tags: ['TheCrypt'], dontRotate: true},
		TheCrypt14: {tags: ['TheCrypt']},
		TheCrypt15: {tags: ['TheCrypt']},
		
		// The Arcane Tower:
		TheArcaneTower01: {tags: ['TheArcaneTower']},
		TheArcaneTower02: {tags: ['TheArcaneTower']},
		
		
		// Floating Features:
		BallistaRoom: 		{isFloatingFeature: true},
		OrcPriestTemple:	{isFloatingFeature: true},
		OrcFortress:		{isFloatingFeature: true},
		GoblinFarm:			{isFloatingFeature: true},
		TreasureTrap:		{isFloatingFeature: true},
        FireTrap:           {isFloatingFeature: true},
        WishFountain:       {isFloatingFeature: true},
        MerchantShop:       {isFloatingFeature: true, initFunc: this.vaultGenerateFuncs.MerchantShop},
        PrisonRoom:         {isFloatingFeature: true},
        IceRoom:            {isFloatingFeature: true},
        BigPitTrap:         {isFloatingFeature: true},
        PitFallRoom:        {isFloatingFeature: true},
        IglooRoom:          {isFloatingFeature: true},
		
		// Feast Hall:
		FeastHallMain01:	{path: 'Rogue Fable III_files/assets/maps/vaults/FeastHall/Hall01.json'},

	};
	
	this.nameTypes(this.vaultTypes);
	
	this.forEachType(this.vaultTypes, function (vaultType) {
		if (vaultType.path) {
			game.load.json(vaultType.name, vaultType.path);
		}
		else if (vaultType.isFloatingFeature) {
			game.load.json(vaultType.name, 'Rogue Fable III_files/assets/maps/floating-features/' + vaultType.name + '.json');
		}
		else {
			game.load.json(vaultType.name, 'Rogue Fable III_files/assets/maps/vaults/' + vaultType.name + '.json');
		}
		
		
		if (!vaultType.tags) {
			vaultType.tags = [];
		}
		
		/*
		if (this.vaultGenFuncs.hasOwnProperty(vaultType.name)) {
			vaultType.genFunc = gs.vaultGenFuncs[vaultType.name];
		}
		*/
	}, this);
};

// CREATE_VAULT_TYPES:
// Called in gameState create, after the json for each vault has been loaded.
// ************************************************************************************************
gs.createVaultTypes = function () {
	this.forEachType(this.vaultTypes, function (vaultType) {
		var data = game.cache.getJSON(vaultType.name);
		vaultType.width = data.width;
		vaultType.height = data.height;
		vaultType.allowRotate = Boolean(!vaultType.dontRotate);
		
		// Determine if contains a pit:
		/*
		for (let x = 0; x < vaultType.width; x += 1) {
			for (let y = 0; y < vaultType.height; y += 1) {
				let frame = data.layers[0].data[y * data.width + x] - 1;
				let typeName = this.getNameFromFrame(frame, this.tileTypes);
				
				if (typeName === 'Pit' || typeName === 'CavePit') {
					vaultType.hasPits = true;
					console.log(vaultType.name);
				}
			}
		}
		*/
	}, this);
};

// CREATE_VAULT_GENERATE_FUNCS:
// ************************************************************************************************
gs.createVaultGenerateFuncs = function () {
	this.vaultGenerateFuncs = {};
	
	// Library:
	this.vaultGenerateFuncs.Library = function (area) {
		let itemNameList;
		
		gs.createCrystalChestGroup();
		
		// Select 3 different tomes:
		itemNameList = gs.itemTypeDropRate.Books.map(e => e.name);
		itemNameList = gs.randSubset(itemNameList, 3);
		
		
		gs.getIndexInBox(area).forEach(function (index) {
			if (gs.getObj(index, obj => obj.type.name === 'CrystalChest')) {
				let crystalChest = gs.getObj(index);
				
				crystalChest.groupId = gs.nextCrystalChestGroupId;
				crystalChest.item = Item.createItem(itemNameList.pop());
			}
		}, this);
	};
	
	// Merchant shop:
	this.vaultGenerateFuncs.MerchantShop = function (area) {
		gs.stockMerchant();
	};
};

// RAND_VAULT_TYPE:
// ************************************************************************************************
gs.randVaultType = function (minWidth, minHeight, maxWidth, maxHeight, tags) {
	var list = [];
	

	this.forEachType(this.vaultTypes, function (vaultType) {
		/*
		if (gs.inArray(vaultType.fileName, gs.closeVaultList)) {
			return;
		}
		*/
		// Skip pits on last levels:
		if (gs.zoneLevel === gs.zoneType().numLevels && vaultType.hasPits) {
			return;
		}
		if (!vaultType.neverChoose && (!tags || gs.arrayIntersect(tags, vaultType.tags).length > 0)) {
		
			if (vaultType.width >= minWidth && vaultType.width <= maxWidth && vaultType.height >= minHeight && vaultType.height <= maxHeight) {
				list.push({vaultTypeName: vaultType.name});
			}

			if (vaultType.allowRotate && vaultType.height >= minWidth && vaultType.height <= maxWidth && vaultType.width >= minHeight && vaultType.width <= maxHeight) {
				list.push({vaultTypeName: vaultType.name, rotate: true});
			}
		}
	}, this);
	
	return list.length > 0 ? util.randElem(list) : null;
};
