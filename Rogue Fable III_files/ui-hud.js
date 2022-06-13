/*global game, gs, Phaser*/
/*global SCREEN_HEIGHT, TILE_SIZE, SCALE_FACTOR, HUD_START_X, WIDE_SCREEN*/
/*global INVENTORY_SIZE, LARGE_RED_FONT, LARGE_WHITE_FONT, SMALL_WHITE_FONT, NUM_DAMAGE_TEXT_SPRITES, MAX_STATUS_EFFECTS, LARGE_WHITE_FONT, FONT_NAME*/
/*global UIToggleButton, UIMap, UIAbilityBar, UIItemSlot, UIItemSlotList, NUM_EQUIPMENT_SLOTS, SCREEN_WIDTH, localStorage*/
/*global MINI_MAP_SIZE_X, MINI_MAP_TILE_SIZE, MAX_COLD_LEVEL, MAX_LEVEL*/
/*global POISON_BAR_FRAME*/
/*global HEALTH_BAR_FRAME, MANA_BAR_FRAME, FOOD_BAR_FRAME, EXP_BAR_FRAME, SLOT_SELECT_BOX_FRAME, COLD_BAR_FRAME, HUGE_WHITE_FONT, LARGE_BOLD_WHITE_FONT*/
/*global CHARACTER_BUTTON_FRAME, CLOSE_BUTTON_FRAME, OPTIONS_BUTTON_FRAME, SOUND_ON_BUTTON_FRAME, MUSIC_ON_BUTTON_FRAME*/
/*global QUIT_BUTTON_FRAME, EXPLORE_BUTTON_FRAME, SOUND_OFF_BUTTON_FRAME, MUSIC_OFF_BUTTON_FRAME*/
/*global WEAPON_HOT_BAR_WIDTH, WEAPON_HOT_BAR_HEIGHT*/
/*global CONSUMABLE_HOT_BAR_WIDTH, CONSUMABLE_HOT_BAR_HEIGHT*/
/*global TIER_II_ZONES, TIER_III_ZONES*/
/*jshint laxbreak: true, esversion: 6*/
'use strict';

// HUD_CONSTRUCTOR:
// ************************************************************************************************
function HUD() {
	var i, startX = HUD_START_X, width = SCREEN_WIDTH - startX;
	
	// Group:
	this.group = game.add.group();
	this.group.fixedToCamera = true;
	
	// Background Sprite:
	this.menu = gs.createSprite(0, 0, 'HUD', this.group);
	this.menu.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	
	
	// Bars:
	this.hpBar = gs.createBar(startX + 18, 6, HEALTH_BAR_FRAME, this.group);
	this.mpBar = gs.createBar(startX + 158, 6, MANA_BAR_FRAME, this.group);
	this.foodBar = gs.createBar(startX + 18, 32, FOOD_BAR_FRAME, this.group);
	this.expBar = gs.createBar(startX + 158, 32, EXP_BAR_FRAME, this.group);
	this.expBar.text.setStyle(LARGE_BOLD_WHITE_FONT);
	this.expBar.text.x += 8;
	
	this.coldBar = gs.createBar(60, 32, COLD_BAR_FRAME, this.group);
	this.rageBar = gs.createBar(startX + 158, 6, FOOD_BAR_FRAME, this.group);
	
	this.poisonBar = gs.createSprite(startX + 10, 8, 'Tileset', this.hpBar.group);
	this.poisonBar.frame = POISON_BAR_FRAME;
	this.poisonBar.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.hpBar.group.moveUp(this.hpBar.text);
	
	// Dungeon Level Text:
    this.zoneLevelText = gs.createText(startX + width / 2, 64, '', LARGE_WHITE_FONT, this.group);
   
	// Mini Map:
	this.miniMap = new UIMap(startX + (width - (MINI_MAP_SIZE_X * MINI_MAP_TILE_SIZE)) / 2, 74, this.group);
	
	
	// Chat Log:
	this.chatLogTitle = gs.createText(startX + 6, 316, '', LARGE_WHITE_FONT, this.group);
    this.chatLogText = gs.createText(startX + 6, 334, '', SMALL_WHITE_FONT, this.group);
	this.chatLogText.lineSpacing = -5;
	
	let y = 60;
	if (WIDE_SCREEN) {
		y = 80;
	}
	
	// Gold:
	this.goldText = gs.createText(startX + 4, 448 + y, 'Gold: ', SMALL_WHITE_FONT, this.group);
	
	// Top Row Buttons:
	this.helpButton = gs.createSmallButton(startX + 236, 406 + y, 1301, this.helpClicked, this, this.group);
	this.quitButton = gs.createSmallButton(startX + 266, 406 + y, QUIT_BUTTON_FRAME, this.quitClicked, this, this.group);
	
	// Buttons:
	this.downStairsButton = gs.createSmallButton(startX + 146, 436 + y, 1297, this.useZoneLineClicked, this, this.group);
	this.upStairsButton = gs.createSmallButton(startX + 146, 436 + y, 1299, this.useZoneLineClicked, this, this.group);
	this.exploreButton = gs.createSmallButton(startX + 176, 436 + y, EXPLORE_BUTTON_FRAME, this.exploreClicked, this, this.group);
	this.characterMenuButton = gs.createSmallButton(startX + 206, 436 + y, CHARACTER_BUTTON_FRAME, this.characterMenuClicked, this, this.group);
	this.soundButton = gs.createSmallButton(startX + 236, 436 + y, SOUND_ON_BUTTON_FRAME, this.toggleSoundClicked, this, this.group);
	this.musicButton = gs.createSmallButton(startX + 266, 436 + y, MUSIC_ON_BUTTON_FRAME, this.toggleMusicClicked, this, this.group);
	
	if (!gs.musicOn) {
		this.musicButton.setFrames(MUSIC_OFF_BUTTON_FRAME + 1, MUSIC_OFF_BUTTON_FRAME);
	}
	
	if (!gs.soundOn) {
		this.soundButton.setFrames(SOUND_OFF_BUTTON_FRAME + 1, SOUND_OFF_BUTTON_FRAME);
	}
	
	// Ability Bar:
	this.abilityBar = new UIAbilityBar(startX + 6, 470 + y, 4, 2, this.group);
	
	// Weapon List:
	this.weaponList = new UIItemSlotList(startX + 174, 470 + y, WEAPON_HOT_BAR_WIDTH, WEAPON_HOT_BAR_HEIGHT, gs.pc.inventory.weaponHotBar.itemSlots, this.weaponSlotClicked, this, this.group, 5);
	
	// Quick Weapon Slot:
	this.quickWeaponSlot = new UIItemSlot(startX + 258, 512 + y, gs.pc.inventory.quickWeaponSlot, 1288, this.weaponSlotClicked, this, this.group);
	
	// Consumable List:
	this.consumableList = new UIItemSlotList(startX + 6, 554 + y, CONSUMABLE_HOT_BAR_WIDTH, CONSUMABLE_HOT_BAR_HEIGHT, gs.pc.inventory.consumableHotBar.itemSlots, this.consumableSlotClicked, this, this.group);
	
	// Weapon Slot Selector:
	this.weaponSlotSelector = gs.createSprite(0, 0, 'Tileset', this.group);
	this.weaponSlotSelector.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.weaponSlotSelector.frame = SLOT_SELECT_BOX_FRAME;
	this.weaponSlotSelector.visible = true;
	
	this.consumableSlotSelector = gs.createSprite(0, 0, 'Tileset', this.group);
	this.consumableSlotSelector.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.consumableSlotSelector.frame = SLOT_SELECT_BOX_FRAME;
	this.consumableSlotSelector.visible = true;
	
	// State Text:
	this.stateText = gs.createText(390, 24, 'STATE', HUGE_WHITE_FONT, this.group);
	this.stateText.visible = false;
	
	
	// Status Effects:
	this.statusEffectText = [];
	for (i = 0; i < MAX_STATUS_EFFECTS; i += 1) {
		this.statusEffectText[i] = gs.createText(6, 4 + i * 20, '',  LARGE_WHITE_FONT, this.group);
		this.statusEffectText[i].inputEnabled = true;
	}

	// DebugText:
	this.debugText = gs.createText(5, SCREEN_HEIGHT - 23, '', LARGE_WHITE_FONT);
	this.debugText.fixedToCamera = true;
}

// REFRESH:
// ************************************************************************************************
HUD.prototype.refresh = function () {
	this.refreshDebugText();
	

	this.menu.frame = gs.pc.currentHp <= gs.pc.maxHp / 3 && gs.state !== 'CHARACTER_MENU_STATE '? 1 : 0;
	
	this.updateStateText();
	this.weaponList.refresh();
	this.abilityBar.refresh();
	this.consumableList.refresh();
	this.quickWeaponSlot.refresh();
	this.updateSlotSelectors();
	

	// Chat Log:
	this.refreshChatLog();
	
	// Button visibility:
	this.downStairsButton.visible = gs.getObj(gs.pc.tileIndex, 'DownStairs');
	this.upStairsButton.visible = gs.getObj(gs.pc.tileIndex, 'UpStairs');
	
	this.refreshBars();
	this.refreshStatusEffects();
	this.refreshZoneTitle();
	
	
};

// UPDATE_SLOT_SELECTORS:
// ************************************************************************************************
HUD.prototype.updateSlotSelectors = function () {
	// Show weapon slot selector:
	if (gs.pc.inventory.quickWeaponEquipped) {
		this.weaponSlotSelector.visible = true;
		this.weaponSlotSelector.x = this.quickWeaponSlot.x;
		this.weaponSlotSelector.y = this.quickWeaponSlot.y;
	}
	else if (gs.pc.inventory.weaponIndex !== -1 && gs.pc.inventory.weaponHotBar.itemAtIndex(gs.pc.inventory.weaponIndex) !== null) {
		this.weaponSlotSelector.visible = true;
		this.weaponSlotSelector.x = this.weaponList.uiItemSlots[gs.pc.inventory.weaponIndex].x;
		this.weaponSlotSelector.y = this.weaponList.uiItemSlots[gs.pc.inventory.weaponIndex].y;
	} 
	else {
		this.weaponSlotSelector.visible = false;
	}
	
	// Show consumable slot selector:
	if (gs.pc.selectedItem) {
		this.consumableSlotSelector.visible = true;
		this.consumableSlotSelector.x = this.consumableList.uiItemSlots[gs.pc.inventory.consumableHotBar.itemSlotIndex(gs.pc.selectedItem)].x;
		this.consumableSlotSelector.y = this.consumableList.uiItemSlots[gs.pc.inventory.consumableHotBar.itemSlotIndex(gs.pc.selectedItem)].y;
	}
	else {
		this.consumableSlotSelector.visible = false;
	}
};

// UPDATE_STATE_TEXT:
// ************************************************************************************************
HUD.prototype.updateStateText = function () {
	if (gs.state === 'USE_ABILITY_STATE') {
		this.stateText.visible = true;
		this.stateText.setText(gs.pc.selectedAbility.type.niceName);
		gs.centerText(this.stateText);
	}
	else if (gs.getObj(gs.pc.tileIndex, 'DownStairs')) {
		this.stateText.visible = true;
		this.stateText.setText('Use s or > to descend stairs');
		gs.centerText(this.stateText);
	}
	else if (gs.getObj(gs.pc.tileIndex, 'UpStairs')) {
		this.stateText.visible = true;
		this.stateText.setText('Use s or < to ascend stairs');
		gs.centerText(this.stateText);
	}
	else {
		this.stateText.visible = false;
	}
};

// REFRESH_CHAT_LOG:
// ************************************************************************************************
HUD.prototype.refreshChatLog = function () {
	var lines = gs.wrapText(this.getDescUnderPointer(), 32);
	
	this.chatLogTitle.setText(lines[0] || '');
	this.chatLogText.setText(lines.slice(1).join('\n') || '');
};

// REFRESH_DEBUG_TEXT:
// ************************************************************************************************
HUD.prototype.refreshDebugText = function () {
	var str;
	
	if (gs.debugProperties.showDebugText) {
		str = '';
		str += 'X: ' + gs.pointerTileIndex().x;
		str += ', Y: ' + gs.pointerTileIndex().y;
		str += ', T: ' + gs.turn;
		str += ', [' + gs.timeToString(gs.gameTime()) + ']';
		str += ', FPS: ' + game.time.fps || '--';
		
		this.debugText.setText(str);
	}
	else {
		this.debugText.visible = false;
	}
	
};


// REFRESH_BARS:
// ************************************************************************************************
HUD.prototype.refreshBars = function () {
	// Update Text:
	
    this.hpBar.text.setText('HP: ' + gs.pc.currentHp + '/' + gs.pc.maxHp);
	this.mpBar.text.setText('MP: ' + gs.pc.currentMp + '/' + gs.pc.maxMp);
	this.foodBar.text.setText('FD: ' + gs.pc.currentFood + '/' + gs.pc.maxFood);
	this.goldText.setText('GOLD: ' + gs.pc.inventory.gold + '  KEYS: ' + gs.pc.inventory.keys);
	this.coldBar.text.setText('COLD: ' + gs.pc.coldLevel + '/' + MAX_COLD_LEVEL);
	this.rageBar.text.setText('RAGE: ' + gs.pc.rage + '/' + gs.pc.maxRage);
	
	if (gs.pc.level < MAX_LEVEL) {
		this.expBar.text.setText('LVL: ' + gs.pc.level + ' ['+ gs.pc.expPercent() + '%]');
	}
	else {
		this.expBar.text.setText('LVL: ' + gs.pc.level);
	}
	
	// Update Bars:
	this.mpBar.bar.scale.setTo(Math.max(0, (gs.pc.currentMp / gs.pc.maxMp) * 63 * SCALE_FACTOR) - 1, SCALE_FACTOR);
	this.foodBar.bar.scale.setTo(Math.max(0, (gs.pc.currentFood / gs.pc.maxFood) * 63 * SCALE_FACTOR) - 1, SCALE_FACTOR);
	this.expBar.bar.scale.setTo(Math.max(0, gs.pc.expPercent() * 0.01 * 63 * SCALE_FACTOR) - 1, SCALE_FACTOR);
	this.coldBar.bar.scale.setTo(Math.max(0, (gs.pc.coldLevel / MAX_COLD_LEVEL) * 63 * SCALE_FACTOR) - 1, SCALE_FACTOR);
	this.rageBar.bar.scale.setTo(Math.max(0, (gs.pc.rage / gs.pc.maxRage) * 63 * SCALE_FACTOR) - 1, SCALE_FACTOR);
	
	// Cold Bar:
	if (gs.zoneType().isCold) {
		this.coldBar.group.visible = true;
	} else {
		this.coldBar.group.visible = false;
	}
	
	// Rage Bar:
	if (gs.pc.hasRage) {
		this.rageBar.group.visible = true;
		this.mpBar.group.visible = false;
	} 
	else {
		this.rageBar.group.visible = false;
		this.mpBar.group.visible = true;
	}
   
	
	// Update Bar Scale:
	this.hpBar.bar.scale.setTo(Math.max(0, (gs.pc.currentHp / gs.pc.maxHp) * 62 * SCALE_FACTOR), SCALE_FACTOR);
	
	// Poison Bar:
	if (gs.pc.poisonDamage > 0) {
		this.poisonBar.visible = true;
		this.poisonBar.x = this.hpBar.bar.x + Math.max(0, ((gs.pc.currentHp - gs.pc.poisonDamage) / gs.pc.maxHp) * 62 * SCALE_FACTOR);
		this.poisonBar.scale.setTo(Math.max(0, (gs.pc.poisonDamage / gs.pc.maxHp) * 62 * SCALE_FACTOR), SCALE_FACTOR);
	}
	else {
		this.poisonBar.visible = false;
	}
	
	// Update Text Color:
	this.hpBar.text.setStyle(gs.pc.currentHp < gs.pc.maxHp / 4 ? LARGE_RED_FONT : LARGE_BOLD_WHITE_FONT);
	this.mpBar.text.setStyle(gs.pc.currentMp < gs.pc.maxMp / 4 ? LARGE_RED_FONT : LARGE_BOLD_WHITE_FONT);
	this.foodBar.text.setStyle(gs.pc.currentFood <= 3 ? LARGE_RED_FONT : LARGE_BOLD_WHITE_FONT);
    this.coldBar.text.setStyle(gs.pc.coldLevel === MAX_COLD_LEVEL ? LARGE_RED_FONT : LARGE_BOLD_WHITE_FONT);
	
	// Mummy has no food:
	if (gs.pc.race && gs.pc.race.name === 'Mummy') {
		this.foodBar.group.visible = false;
	}
};

// REFRESH_STATUS_EFFECTS:
// ************************************************************************************************
HUD.prototype.refreshStatusEffects = function () {
	var i, j = 0;

	
	for (i = 0; i < gs.pc.statusEffects.list.length; i += 1) {
		if (!gs.pc.statusEffects.list[i].dontShowOnHUD) {
			this.statusEffectText[j].visible = true;
			this.statusEffectText[j].setText(gs.pc.statusEffects.list[i].toShortDesc());
			j += 1;
		}
	}
	
	// Show it poisoned:
	if (gs.pc.poisonDamage > 0) {
		this.statusEffectText[j].setText('Poisoned');
		this.statusEffectText[j].visible = true;
		j += 1;
	}
	
	// Show is asleep:
	if (gs.pc.isAsleep) {
		this.statusEffectText[j].setText('Sleeping');
		this.statusEffectText[j].visible = true;
		j += 1;
	}

	// Hide remaining status effect text:
	for (j = j; j < MAX_STATUS_EFFECTS; j += 1) {
		this.statusEffectText[j].visible = false;
	}
	
};

// REFRESH_ZONE_TITLE:
// ************************************************************************************************
HUD.prototype.refreshZoneTitle = function () {
	var str;
	
	str = gs.capitalSplit(gs.zoneName) + ': ' + gs.niceZoneLevel(gs.zoneName, gs.zoneLevel);
	
	if (gs.inArray(gs.zoneName, ['TheUpperDungeon', 'VaultOfYendor'].concat(TIER_II_ZONES).concat(TIER_III_ZONES))) {
		str += '/16';
	}
	else {
		str += '/' + gs.zoneType().numLevels;
	}
	
	str += ' [' + gs.timeToString(gs.gameTime()) + ']';
	this.zoneLevelText.setText(str);
	gs.centerText(this.zoneLevelText);
};

// USE_ZONE_LINE_CLICKED:
// ************************************************************************************************
HUD.prototype.useZoneLineClicked = function () {
	gs.pc.useZoneLine();
	
};

// SKILL_CLICKED:
// ************************************************************************************************
HUD.prototype.skillClicked = function () {
	gs.pc.actionQueue = [];
	
	if (gs.state !== 'SHOP_MENU_STATE' && gs.state !== 'DIALOG_MENU_STATE') {
		if (gs.state === 'GAME_STATE') {
			gs.statMenu.open();
		} else if (gs.state === 'SKILL_MENU_STATE') {
			gs.statMenu.close();
		}
	}
};

// WEAPON_SLOT_CLICKED:
// ************************************************************************************************
HUD.prototype.weaponSlotClicked = function (slot) {
	
	if (gs.state === 'CHARACTER_MENU_STATE') {
		gs.characterMenu.slotClicked(slot);
	}
	else if (gs.state === 'GAME_STATE') {
		if (slot !== gs.pc.inventory.quickWeaponSlot) {
			gs.pc.weaponSlotClicked(slot);
		}
	}
	
};

// CONSUMABLE_SLOT_CLICKED:
// ************************************************************************************************
HUD.prototype.consumableSlotClicked = function (slot) {
	if (gs.state === 'CHARACTER_MENU_STATE') {
		gs.characterMenu.slotClicked(slot);
	}
	else if (gs.state === 'GAME_STATE' || gs.state === 'USE_ABILITY_STATE') {
		if (slot.hasItem()) {
			gs.pc.consumableSlotClicked(slot);
		}
	}
};

// PICK_UP_CLICKED:
// ************************************************************************************************
HUD.prototype.pickUpClicked = function () {
	if (gs.getItem(gs.pc.tileIndex)) {
		gs.pc.pickUpItem(gs.getItem(gs.pc.tileIndex));
	}
};

// EXPLORE_CLICKED:
// ************************************************************************************************
HUD.prototype.exploreClicked = function () {
	gs.pc.startExploring();
};


// CHARACTER_MENU_CLICKED:
// ************************************************************************************************
HUD.prototype.characterMenuClicked = function () {
	gs.pc.actionQueue = [];
	gs.onCharacterMenuClicked();
};

// OPTIONS_MENU_CLICKED:
// ************************************************************************************************
HUD.prototype.optionsMenuClicked = function () {
	gs.pc.actionQueue = [];
	gs.openOptionsMenu();
};

// TOGGLE_SOUND_CLICKED:
// ************************************************************************************************
HUD.prototype.toggleSoundClicked = function () {
	// Toggle sound off:
	if (gs.soundOn) {
		gs.soundOn = false;
		this.soundButton.setFrames(SOUND_OFF_BUTTON_FRAME + 1, SOUND_OFF_BUTTON_FRAME);
	}
	// Toggle sound on:
	else {
		gs.soundOn = true;
		this.soundButton.setFrames(SOUND_ON_BUTTON_FRAME + 1, SOUND_ON_BUTTON_FRAME);
	}
	
	gs.help.soundOn = gs.soundOn;
	localStorage.setItem('Help', JSON.stringify(gs.help));
};

// TOGGLE_MUSIC_CLICKED:
// ************************************************************************************************
HUD.prototype.toggleMusicClicked = function () {
	// Toggle music off:
	if (gs.musicOn) {
		gs.musicOn = false;
		this.musicButton.setFrames(MUSIC_OFF_BUTTON_FRAME + 1, MUSIC_OFF_BUTTON_FRAME);
		gs.stopAllMusic();
	}
	// Toggle music on:
	else {
		gs.musicOn = true;
		this.musicButton.setFrames(MUSIC_ON_BUTTON_FRAME + 1, MUSIC_ON_BUTTON_FRAME);
		gs.startMusic();
	}
	
	gs.help.musicOn = gs.musicOn;
	localStorage.setItem('Help', JSON.stringify(gs.help));
};

// HELP_CLICKED:
// ************************************************************************************************
HUD.prototype.helpClicked = function () {
	if (gs.state === 'GAME_STATE') {
		gs.helpMenu.open();
	}
	else if (gs.state === 'HELP_MENU_STATE') {
		gs.helpMenu.close();
	}
};

// QUIT_CLICKED:
// ************************************************************************************************
HUD.prototype.quitClicked = function () {
	if (gs.activeCharacter === gs.pc) {
		gs.saveLevel();
		gs.pc.save();
		game.state.start('menu');
	}
	
};
// GET_DESC_UNDER_POINTER:
// ************************************************************************************************
HUD.prototype.getDescUnderPointer = function () {
	
	// Ability Bar:
	if (this.abilityBar.getAbilityUnderPointer()) {
		return gs.abilityDesc(this.abilityBar.getAbilityUnderPointer());
	}
	// Items:
	else if (this.getItemUnderPointer()) {
		return this.getItemUnderPointer().toLongDesc();
	}
	// Quick Weapon slot:
	else if (this.quickWeaponSlot.isPointerOver()) {
		if (gs.pc.inventory.quickWeaponSlot.hasItem()) {
			return gs.pc.inventory.quickWeaponSlot.item.toLongDesc();
		}
		else {
			return 'Quick Weapon Slot:\nPlace a weapon here to use when right clicking.';
		}
		
	}
	// Mini-Map:
	else if (this.miniMap.getDescUnderPointer()) {
		return this.miniMap.getDescUnderPointer();
	}
	// Status Effect:
	else if (this.getStatusEffectDescUnderPointer()) {
		return this.getStatusEffectDescUnderPointer();
	}
	// Button:
	else if (this.getButtonDescUnderPointer()) {
		return this.getButtonDescUnderPointer();
	}
	// Talent:
	else if (gs.state === 'CHARACTER_MENU_STATE' && gs.characterMenu.getTalentDescUnderPointer()) {
		return gs.characterMenu.getTalentDescUnderPointer();
    }
	// Skills:
	else if (gs.state === 'CHARACTER_MENU_STATE' && gs.characterMenu.getSkillDescUnderPointer()) {
		return gs.characterMenu.getSkillDescUnderPointer();
	}
	// Stats:
	else if (gs.state === 'CHARACTER_MENU_STATE' && gs.characterMenu.isPointerOverStats()) {
		return gs.characterMenu.getStatDescUnderPointer();
	}
	// Dialog:
	else if (gs.state === 'DIALOG_MENU_STATE' && gs.dialogMenu.getDescUnderPointer()) {
		return gs.dialogMenu.getDescUnderPointer();
	}
	// Tile, Object, Item, Character (in world):
	else if (this.getTileDescUnderCursor()) {
        return this.getTileDescUnderCursor();
	}
	else {
		return '';
	}
};

HUD.prototype.getItemUnderPointer = function () {
	// Inventory:
	if (gs.state === 'CHARACTER_MENU_STATE' && gs.characterMenu.getItemUnderPointer()) {
		return gs.characterMenu.getItemUnderPointer();
	}
	// Enchantment:
	else if (gs.state === 'ENCHANTMENT_MENU_STATE' && gs.enchantmentMenu.getItemUnderPointer()) {
		return gs.enchantmentMenu.getItemUnderPointer();
	}
	// Transferance:
	else if (gs.state === 'TRANSFERANCE_MENU_STATE' && gs.transferanceMenu.getItemUnderPointer()) {
		return gs.transferanceMenu.getItemUnderPointer();
	}
	// HUD Weapon:
	else if (this.weaponList.getItemUnderPointer()) {
		return this.weaponList.getItemUnderPointer();
	}
	// HUD Consumable:
	else if (this.consumableList.getItemUnderPointer()) {
		return this.consumableList.getItemUnderPointer();
	}
	// Shop:
	else if (gs.state === 'SHOP_MENU_STATE' && gs.shopMenu.getItemUnderPointer()) {
		return gs.shopMenu.getItemUnderPointer();
	}
	else {
		return null;
	}
};

// GET_BUTTON_DESC_UNDER_POINTER:
// ************************************************************************************************
HUD.prototype.getButtonDescUnderPointer = function () {
	
	if (this.characterMenuButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Open character menu\nKeyboard shortcut: C.';
	} 
	else if (this.soundButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Toggle Sound';
	} 
	else if (this.musicButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Toggle Music';
	} 
	else if (this.exploreButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Auto Explore\nKeyboard shortcut: E.';
	} 
	else if (this.quitButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Save and Quit';
	}
	else if (this.downStairsButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Descend Stairs\nKeyboard shortcut: >\nThe > key Can also be used to fast travel to down stairs once discovered.';
	}
	else if (this.downStairsButton.input.checkPointerOver(game.input.activePointer)) {
		return 'Ascend Stairs\nKeyboard shortcut: <\nThe < key Can also be used to fast travel to up stairs once discovered.';
	}
	return null;
};



// GET_STATUS_EFFECT_DESC_UNDER_POINTER:
// ************************************************************************************************
HUD.prototype.getStatusEffectDescUnderPointer = function () {
	for (let i = 0; i < MAX_STATUS_EFFECTS; i += 1) {
		if (i < gs.pc.statusEffects.list.length && this.statusEffectText[i].input.checkPointerOver(game.input.activePointer)) {
			return gs.pc.statusEffects.list[i].toLongDesc();
		}
	}
	
	return null;
};


// GET_TILE_DESC_UNDER_CURSOR:
// ************************************************************************************************
HUD.prototype.getTileDescUnderCursor = function () { 
	// In a menu:
	if (gs.state !== 'GAME_STATE' && gs.state !== 'USE_ABILITY_STATE') {
		return null;
	}
	// Offscreen:
    else if (!gs.isPointerInWorld()) {
		return null;
	}
	else {
		return gs.descriptionOfTileIndex(gs.cursorTileIndex);
	}
};