/*global game, gs, console, SCREEN_HEIGHT*/
/*global UIItemSlot, UITextButtonList*/
/*global LARGE_WHITE_FONT, HUGE_WHITE_FONT, SKILL_NAMES, LARGE_WHITE_FONT, SCALE_FACTOR, MAX_SKILL*/
/*global UIItemSlotList, NUM_EQUIPMENT_SLOTS, SLOT_SELECT_BOX_FRAME, SKILL_DESC, RIGHT_RING_SELECT_BOX_FRAME, LEFT_RING_SELECT_BOX_FRAME*/
/*global TILE_SIZE, SMALL_WHITE_FONT, SMALL_GREEN_FONT*/
/*global EQUIPMENT_SLOT_NAMES, EQUIPMENT_SLOT_FRAMES, INVENTORY_WIDTH, INVENTORY_HEIGHT*/
/*jshint esversion: 6, laxbreak: true*/
'use strict';

// CONSTRUCTOR
// ************************************************************************************************
function UICharacterMenu() {
	var startX = 2,
		startY = 0,
		sprite;

	this.group = game.add.group();
	this.group.fixedToCamera = true;
	
	// Menu Sprite:
	sprite = gs.createSprite(2, 2, 'Menu', this.group);
	sprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	
	// PANELS:
	// ***************************************
	this.createStatPanel(startX + 4, startY + 4);
	this.createTalentPanel(startX + 324, startY);
	this.createInventoryPanel(startX + 464, startY + 488);
	this.createSkillPanel(startX + 324, startY + 434);
	
	// Close Button:
	// ***************************************
	this.closeButton = gs.createButton(688, -6, 'Tileset', this.close, this, this.group);
	this.closeButton.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.closeButton.setFrames(1251, 1250);
	
	// Rearanging abilities:
	// ***************************************
	this.abilityIndexOnCursor = -1;
	this.cursorSprite = gs.createSprite(0, 0, 'Tileset', this.group);
	this.cursorSprite.scale.setTo(SCALE_FACTOR, SCALE_FACTOR);
	this.cursorSprite.visible = false;
	
	// Moving items:
	this.itemOnCursor = null;
	
	
	this.group.visible = false;
}

// CREATE_SKILL_PANEL:
// ************************************************************************************************
UICharacterMenu.prototype.createSkillPanel = function (startX, startY) {
	//gs.createText(startX - 100, startY, 'Skills', HUGE_WHITE_FONT, this.group);
	this.skillPointText = gs.createText(startX - 100, startY + 30, 'Skill Points', LARGE_WHITE_FONT, this.group);
	
	
	this.skillButtonList = new UITextButtonList(startX, startY + 66, SKILL_NAMES.length, this.group, this, this.skillClicked);
	this.skillButtonList.upArrow.visible = false;
	this.skillButtonList.downArrow.visible = false;
	
};

// REFRESH_SKILL_PANEL:
// ************************************************************************************************
UICharacterMenu.prototype.refreshSkillPanel = function () {
	this.skillPointText.setText('Skill Points: ' + gs.pc.skillPoints);
	
	SKILL_NAMES.forEach(function (skillName, i) {
		this.skillButtonList.buttons[i].text.setText(gs.capitalSplit(skillName));
		this.skillButtonList.buttons[i].numText.setText(gs.pc.skills[skillName]);
		this.skillButtonList.buttons[i].button.skillName = skillName;
	}, this);
};



// CREATE_TALENT_PANEL:
// ************************************************************************************************
UICharacterMenu.prototype.createTalentPanel = function (startX, startY) {
	var buttonSpace = 30;
	
	//this.talentTitle = gs.createText(startX - 54, startY, 'Talents', HUGE_WHITE_FONT, this.group);
	this.talentPointText = gs.createText(startX + 40, startY + 4, 'Talent Points', LARGE_WHITE_FONT, this.group);
	//gs.centerText(this.talentPointText);
	
	gs.createText(startX - 100, startY + 30, 'Known Talents', LARGE_WHITE_FONT, this.group);
	gs.createText(startX + 140, startY + 30, 'Available Talents', LARGE_WHITE_FONT, this.group);
	
	this.talentButtonList = new UITextButtonList(startX, startY + 66, 10, this.group, this, this.talentClicked);
	this.availableTalentButtonList = new UITextButtonList(startX + 240, startY + 66, 10, this.group, this, this.talentClicked);
		
};

// REFRESH_TALENT_PANEL:
// ************************************************************************************************
UICharacterMenu.prototype.refreshTalentPanel = function () {
	var i, str;
	
	// Talent Point Text:
	this.talentPointText.setText('Talent Points: ' + gs.pc.talentPoints);
	
	for (let i = 0; i < this.talentButtonList.buttons.length; i += 1) {
		if (this.talentButtonList.startIndex + i < gs.pc.talents.length) {
			let talentName = gs.pc.talents[this.talentButtonList.startIndex + i].type.name;
			
			this.talentButtonList.buttons[i].button.talentName = talentName;
			this.talentButtonList.buttons[i].text.setText(gs.capitalSplit(talentName));
			this.talentButtonList.buttons[i].numText.setText(gs.pc.getTalent(talentName).level + '/' + gs.talents[talentName].level.length);
			this.talentButtonList.buttons[i].group.visible = true;
			
			// Color learnable talents:
			if (gs.pc.canLearnTalent(talentName)) {
				this.talentButtonList.buttons[i].text.setStyle(SMALL_GREEN_FONT);
				this.talentButtonList.buttons[i].numText.setStyle(SMALL_GREEN_FONT);
			}
			else {
				this.talentButtonList.buttons[i].text.setStyle(SMALL_WHITE_FONT);
				this.talentButtonList.buttons[i].numText.setStyle(SMALL_WHITE_FONT);
			}
			
		}
		else {
			this.talentButtonList.buttons[i].group.visible = false;
		}
	}
	
	this.talentButtonList.upArrow.visible = this.talentButtonList.startIndex > 0;
	this.talentButtonList.downArrow.visible = gs.pc.talents.length > this.talentButtonList.startIndex + this.talentButtonList.buttons.length;
	

	// Set available talent buttons:
	for (let j = 0; j < this.availableTalentButtonList.buttons.length; j += 1) {
		if (this.availableTalentButtonList.startIndex + j < gs.pc.availableTalents.length) {
			let talentName = gs.pc.availableTalents[this.availableTalentButtonList.startIndex + j];
			
			this.availableTalentButtonList.buttons[j].button.talentName = talentName;
			this.availableTalentButtonList.buttons[j].text.setText(gs.capitalSplit(talentName));
			this.availableTalentButtonList.buttons[j].numText.setText('0/' + gs.talents[talentName].level.length);
			this.availableTalentButtonList.buttons[j].group.visible = true;
			
			// Color learnable talents:
			if (gs.pc.canLearnTalent(talentName)) {
				this.availableTalentButtonList.buttons[j].text.setStyle(SMALL_GREEN_FONT);
				this.availableTalentButtonList.buttons[j].numText.setStyle(SMALL_GREEN_FONT);
			}
			else {
				this.availableTalentButtonList.buttons[j].text.setStyle(SMALL_WHITE_FONT);
				this.availableTalentButtonList.buttons[j].numText.setStyle(SMALL_WHITE_FONT);
			}
		}
		else {
			this.availableTalentButtonList.buttons[j].group.visible = false;
		}
	}
	
	this.availableTalentButtonList.upArrow.visible = this.availableTalentButtonList.startIndex > 0;
	this.availableTalentButtonList.downArrow.visible = gs.pc.availableTalents.length > this.availableTalentButtonList.startIndex + this.availableTalentButtonList.buttons.length;
};






// CREATE_INVENTORY_PANEL:
// ************************************************************************************************
UICharacterMenu.prototype.createInventoryPanel = function (startX, startY) {
	// Equipment:
	this.equipmentSlots = new UIItemSlotList(startX, startY, 4, 2, gs.pc.inventory.equipment.itemSlots, this.slotClicked, this, this.group);
	
	// Inventory:
	this.inventorySlots = new UIItemSlotList(startX, startY + 84, INVENTORY_WIDTH, INVENTORY_HEIGHT, gs.pc.inventory.inventory.itemSlots, this.slotClicked, this, this.group);
	
	// Drop Button:
	this.dropButton =  game.add.button(startX + 189, startY + 21, 'Tileset', this.dropClicked, this, 1225, 1224);	
	this.dropButton.scale.setTo(2, 2);
	this.group.add(this.dropButton);
};

// DROP_CLICKED:
// ************************************************************************************************
UICharacterMenu.prototype.dropClicked = function () {
	if (!gs.pc.isAlive) {
		return;
	}
	
	if (!this.itemOnCursor) {
		return;
	}
	
	if (!gs.pc.canDropItem()) {
		return;
	}
	
	gs.pc.dropItem(this.itemOnCursor);
	this.itemOnCursor = null;
};

// REFRESH_INVENTORY:
// ************************************************************************************************
UICharacterMenu.prototype.refreshInventory = function () {
	this.equipmentSlots.refresh();
	this.inventorySlots.refresh();
};

// UPDATE:
// ************************************************************************************************
UICharacterMenu.prototype.update = function () {
	// Rearanging abilities:
	if (this.abilityIndexOnCursor !== -1) {
		this.cursorSprite.visible = true;
		this.cursorSprite.frame = gs.pc.abilities.abilityInSlot(this.abilityIndexOnCursor).type.frame;
		this.cursorSprite.x = game.input.activePointer.x;
		this.cursorSprite.y = game.input.activePointer.y;
	}
	// Item on cursor:
	else if (this.itemOnCursor) {
		this.cursorSprite.visible = true;
		this.cursorSprite.frame = this.itemOnCursor.type.frame;
		this.cursorSprite.x = game.input.activePointer.x;
		this.cursorSprite.y = game.input.activePointer.y;
	}
	else {
		this.cursorSprite.visible = false;
	}
	
	this.refreshStats();
};

// REFRESH:
// ************************************************************************************************
UICharacterMenu.prototype.refresh = function () {
	var i, str;

	// UI Stat Menu:
	this.refreshTalentPanel();
	this.refreshStats();
	this.refreshInventory();
	this.refreshSkillPanel();
};

// CREATE_STAT_PANEL
// ************************************************************************************************
UICharacterMenu.prototype.createStatPanel = function (startX, startY) {
	// Text:
	this.statsNameText = gs.createText(startX, startY, 'Stats', SMALL_WHITE_FONT, this.group);
	this.statsNameText.lineSpacing = -5;
	this.statsText = gs.createText(startX + 116, startY, 'Stats', SMALL_WHITE_FONT, this.group);
	this.statsText.lineSpacing = -5;	
};

// REFRESH_STATS:
// ************************************************************************************************
UICharacterMenu.prototype.refreshStats = function () {
	var nameStr = '', statStr = '';
	
	this.statList = [];
	
	this.statList[0] = 	{name: 'Class:',		val: gs.capitalSplit(gs.pc.characterClass), tag: 'Class'};
	this.statList[1] = 	{name: 'Race:',			val: gs.capitalSplit(gs.pc.race.name), tag: 'Race'};
	this.statList[2] = 	{name: 'God:',			val: (gs.pc.religion ? gs.capitalSplit(gs.pc.religion) : 'None'), tag: 'Religion'};
	this.statList[3] = 	{name: '',				val: ''};
	
	this.statList[4] = 	{name: 'ATTRIBUTES:',	val: ''};
	this.statList[5] = 	{name: 'Strength:',		val: gs.pc.strength, tag: 'Strength'};
	this.statList[6] = 	{name: 'Dexterity:',	val: gs.pc.dexterity, tag: 'Dexterity'};
	this.statList[7] = 	{name: 'Intelligence:',	val: gs.pc.intelligence, tag: 'Intelligence'};
	this.statList[8] = 	{name: '',				val: ''};
	
	this.statList[9] = 	{name: 'DEFENSE:',		val: ''};
	this.statList[10] = {name: 'Protection:',	val: gs.pc.protection, tag: 'Protection'};
	this.statList[11] = {name: 'Evasion:',		val: gs.pc.evasion, tag: 'Evasion'};
	this.statList[12] = {name: 'Reflection:',	val: gs.pc.reflection, tag: 'Reflection'};
	this.statList[13] = {name: 'Stealth:',		val: gs.pc.stealth, tag: 'Stealth'};
	this.statList[14] = {name: '',				val: ''};
	
	this.statList[15] = {name: 'RESISTANCE:',	val: ''};
	this.statList[16] = {name: 'Fire:',			val: gs.pc.resistance.Fire, tag: 'FireResistance'};
	this.statList[17] = {name: 'Cold:',			val: gs.pc.resistance.Cold, tag: 'ColdResistance'};
	this.statList[18] = {name: 'Shock:',		val: gs.pc.resistance.Shock, tag: 'ShockResistance'};
	this.statList[19] = {name: 'Toxic:',		val: gs.pc.resistance.Toxic, tag: 'ToxicResistance'};
	this.statList[20] = {name: '',				val: ''};
	
	this.statList[21] = {name: 'OFFENSE:',		val: ''};
	this.statList[22] = {name: 'Melee:',		val: gs.pc.meleePower, tag: 'MeleePower'};
	this.statList[23] = {name: 'Range:',		val: gs.pc.rangePower, tag: 'RangePower'};
	this.statList[24] = {name: '',				val: ''};
	
	this.statList[25] = {name: 'MAGIC POWER:',	val: ''};
	this.statList[26] = {name: 'Spell:',		val: gs.pc.spellPower, tag: 'SpellPower'};
	
	if (gs.pc.firePower !== gs.pc.spellPower) {
		this.statList.push({name: 'Fire:', val: gs.pc.firePower, tag: 'FirePower'});
	}
	if (gs.pc.coldPower !== gs.pc.spellPower) {
		this.statList.push({name: 'Cold:', val: gs.pc.coldPower, tag: 'ColdPower'});
	}
	if (gs.pc.stormPower !== gs.pc.spellPower) {
		this.statList.push({name: 'Storm:', val: gs.pc.stormPower, tag: 'StormPower'});
	}
	if (gs.pc.toxicPower !== gs.pc.spellPower) {
		this.statList.push({name: 'Toxic:', val: gs.pc.toxicPower, tag: 'ToxicPower'});
	}
	
	
	if (this.isPointerOverStats()) {
		if (this.getStatLineUnderPointer() >= 0 && this.getStatLineUnderPointer() < this.statList.length) {
			this.statList[this.getStatLineUnderPointer()].val += ']';
			this.statList[this.getStatLineUnderPointer()].name = '[' + this.statList[this.getStatLineUnderPointer()].name;
		}
	}
	
	this.statsNameText.setText(this.statList.reduce((pv, nv) => pv + nv.name + '\n', ''));
	this.statsText.setText(this.statList.reduce((pv, nv) => pv + nv.val + '\n', ''));
	
	//this.statsText.setText(statStr);
	
	/*
	nameStr += 'Class:\n';			statStr += gs.capitalSplit(gs.pc.characterClass) + '\n';
	nameStr += 'Race:\n';			statStr += gs.capitalSplit(gs.pc.race.name) + '\n';
	nameStr += 'God:\n';			statStr += (gs.pc.religion ? gs.capitalSplit(gs.pc.religion) : 'None') + '\n';
	nameStr += '\n';				statStr += '\n';
	
	nameStr += 'ATTRIBUTES:\n';		statStr += '\n';
	nameStr += 'Strength:\n'; 		statStr += gs.pc.strength + '\n';
	nameStr += 'Dexterity:\n'; 		statStr += gs.pc.dexterity + '\n';
	nameStr += 'Intelligence:\n'; 	statStr += gs.pc.intelligence + '\n';
	nameStr += '\n';				statStr += '\n';
	
	nameStr += 'DEFENSE:\n';		statStr += '\n';
	nameStr += 'Protection:\n';	 	statStr += gs.pc.protection + '\n';
	nameStr += 'Evasion:\n';		statStr += gs.pc.evasion + '\n';
	nameStr += 'Reflection:\n';		statStr += gs.pc.reflection + '\n';
	nameStr += 'Stealth:\n';		statStr += gs.pc.stealth + '\n';
	nameStr += '\n';				statStr += '\n';
	
	nameStr += 'RESISTANCE:\n';		statStr += '\n';
	nameStr += 'Fire:\n';			statStr += gs.pc.resistance.Fire + '\n';
	nameStr += 'Cold:\n';			statStr += gs.pc.resistance.Cold + '\n';
	nameStr += 'Shock:\n';			statStr += gs.pc.resistance.Shock + '\n';
	nameStr += 'Toxic:\n'; 			statStr += gs.pc.resistance.Toxic + '\n';
	nameStr += '\n';				statStr += '\n';
	
	nameStr += 'OFFENSE:\n';		statStr += '\n';
	nameStr += 'Melee:\n'; 			statStr += gs.pc.meleePower + '\n';
	nameStr += 'Range:\n'; 			statStr += gs.pc.rangePower + '\n';
	
	nameStr += '\n';				statStr += '\n';
	
	nameStr += 'MAGIC POWER:\n';	statStr += '\n';
	nameStr += 'Spell:\n';			statStr += gs.pc.spellPower + '\n';
	
	if (gs.pc.firePower !== gs.pc.spellPower) {
		nameStr += 'Fire:\n'; 			statStr += gs.pc.firePower + '\n';
	}
	if (gs.pc.coldPower !== gs.pc.spellPower) {
		nameStr += 'Cold:\n'; 			statStr += gs.pc.coldPower + '\n';
	}
	if (gs.pc.stormPower !== gs.pc.spellPower) {
		nameStr += 'Storm:\n'; 			statStr += gs.pc.stormPower + '\n';
	}
	if (gs.pc.toxicPower !== gs.pc.spellPower) {
		nameStr += 'Toxic:\n'; 			statStr += gs.pc.toxicPower + '\n';
	}

	this.statsNameText.setText(nameStr);
	this.statsText.setText(statStr);
	*/
};

// GET_STAT_LINE_UNDER_POINTER:
// Returns the line 0->n of the stat text that the cursor is over
// ************************************************************************************************
UICharacterMenu.prototype.getStatLineUnderPointer = function () {
	var lineHeight = this.statsNameText.fontSize + 2;
	
	return Math.floor((game.input.activePointer.y - this.statsNameText.y) / lineHeight);
};

// IS_POINTER_OVER_STATS:
// ************************************************************************************************
UICharacterMenu.prototype.isPointerOverStats = function () {
	return game.input.activePointer.x > this.statsNameText.x
		&& game.input.activePointer.y > this.statsNameText.y
		&& game.input.activePointer.x < 200;
};

// FLAG_STRING:
// ************************************************************************************************
UICharacterMenu.prototype.flagString = function () {
	var str = '';
	str += gs.pc.isFlying ? '- Flying\n' : '';
	str += gs.pc.isTelepathic ? '- Telepathic\n' : '';
	str += gs.pc.hasLifeSaving ? '- Life Saving\n' : '';
	return str;
};

// SKILL_CLICKED:
// ************************************************************************************************
UICharacterMenu.prototype.skillClicked = function (button) {
	if (!gs.pc.isAlive) {
		return;
	}
	
	if (this.abilityIndexOnCursor !== -1) {
		return;
	}
	
	if (gs.pc.canGainSkill(button.skillName)) {
		gs.pc.gainSkill(button.skillName);
		this.refresh();
		gs.playSound(gs.sounds.point);
	}
};

// TALENT_CLICKED:
// ************************************************************************************************
UICharacterMenu.prototype.talentClicked = function (button) {
	if (!gs.pc.isAlive) {
		return;
	}
	
	if (this.abilityIndexOnCursor !== -1) {
		return;
	}
	
	if (gs.pc.canLearnTalent(button.talentName)) {
		gs.pc.learnTalent(button.talentName);
		this.refresh();
		gs.playSound(gs.sounds.point);
	}	
};



// SLOT_CLICKED:
// ************************************************************************************************
UICharacterMenu.prototype.slotClicked = function (slot) {
	if (!gs.pc.isAlive) {
		return;
	}
	
	if (this.abilityIndexOnCursor !== -1) {
		return;
	}
	
	// Pick up item:
	if (slot.hasItem() && !this.itemOnCursor) {
		this.itemOnCursor = slot.item;
		slot.removeItem();
		
		// Unequip Item:
		if (gs.inArray(slot.itemTypeSlot, EQUIPMENT_SLOT_NAMES)) {
			gs.pc.onUnequipItem(this.itemOnCursor);
		}
	}
	// Place Item:
	else if (this.itemOnCursor && slot.isEmpty() && (!slot.itemTypeSlot || slot.itemTypeSlot === this.itemOnCursor.type.slot)) {
		slot.addItem(this.itemOnCursor);
		this.itemOnCursor = null;
		
		// Equip Item:
		if (gs.inArray(slot.itemTypeSlot, EQUIPMENT_SLOT_NAMES)) {
			gs.pc.onEquipItem(slot.item);
		}
	}
	// Swap Item:
	else if (this.itemOnCursor && (!slot.itemTypeSlot || slot.itemTypeSlot === this.itemOnCursor.type.slot)) {
		
		
		// Unequip Item:
		let tempItem = slot.item;
		slot.removeItem();
		if (gs.inArray(slot.itemTypeSlot, EQUIPMENT_SLOT_NAMES)) {
			gs.pc.onUnequipItem(tempItem);
		}
		
		// Equip Item:
		slot.addItem(this.itemOnCursor);
		this.itemOnCursor = tempItem;
		if (gs.inArray(slot.itemTypeSlot, EQUIPMENT_SLOT_NAMES)) {
			gs.pc.onEquipItem(slot.item);
		}
	}
	
	gs.pc.updateStats();
	this.refresh();
	gs.HUD.refresh();
};

// OPEN:
// ************************************************************************************************
UICharacterMenu.prototype.open = function () {
	gs.pc.stopExploring();
	
	gs.pc.updateStats();
	this.refresh();
	gs.state = 'CHARACTER_MENU_STATE';
	this.group.visible = true;
	gs.playSound(gs.sounds.scroll);
};

// CLOSE:
// ************************************************************************************************
UICharacterMenu.prototype.close = function () {
	gs.state = 'GAME_STATE';
	this.group.visible = false;
	gs.playSound(gs.sounds.scroll);
	
	if (this.abilityIndexOnCursor !== -1) {
		gs.HUD.abilityBar.addAbility(this.abilityIndexOnCursor);
		this.abilityIndexOnCursor = -1;
	}

	if (this.itemOnCursor) {
		gs.pc.inventory.addItem(this.itemOnCursor);
		this.itemOnCursor = null;
	}
	
	if (!gs.pc.isAlive) {
		gs.openDeathMenu();
	}
};

// GET_TALENT_DESC_UNDER_POINTER:
// ************************************************************************************************
UICharacterMenu.prototype.getTalentDescUnderPointer = function () {
	var i, str = '';
	for (i = 0; i < this.talentButtonList.buttons.length; i += 1) {
		if (this.talentButtonList.buttons[i].button.input.checkPointerOver(game.input.activePointer) && this.talentButtonList.buttons[i].button.visible) {
			return gs.getTalentDescription(this.talentButtonList.buttons[i].button.talentName);
		}
	}
	
	for (i = 0; i < this.availableTalentButtonList.buttons.length; i += 1) {
		if (this.availableTalentButtonList.buttons[i].button.input.checkPointerOver(game.input.activePointer) && this.availableTalentButtonList.buttons[i].button.visible) {
			return gs.getTalentDescription(this.availableTalentButtonList.buttons[i].button.talentName);
		}
	}
	
	
	
	return null;
};


// GET_SKILL_DESC_UNDER_POINTER:
// ************************************************************************************************
UICharacterMenu.prototype.getSkillDescUnderPointer = function () {
	for (let i = 0; i < this.skillButtonList.buttons.length; i += 1) {
		if (this.skillButtonList.buttons[i].button.input.checkPointerOver(game.input.activePointer) && this.skillButtonList.buttons[i].button.visible) {
			return SKILL_DESC[this.skillButtonList.buttons[i].button.skillName];
		}
	}

	
	
	return null;
};

// GET_EQUIPMENT_DESC_UNDER_POINTER:
// ************************************************************************************************
UICharacterMenu.prototype.getItemUnderPointer = function () {
	if (this.inventorySlots.getItemUnderPointer()) {
		return this.inventorySlots.getItemUnderPointer();
	}
	else if (this.equipmentSlots.getItemUnderPointer()) {
		return this.equipmentSlots.getItemUnderPointer();
	}
	else {
		return null;
	}
};

// GET_STAT_DESC_UNDER_POINTER:
// ************************************************************************************************
UICharacterMenu.prototype.getStatDescUnderPointer = function () {
	var index = this.getStatLineUnderPointer(),
		tag,
		str = '';
	
	if (index < 0 || index >= this.statList.length || !this.statList[index].tag) {
		return '';
	}
	
	return gs.pc.getStatDesc(this.statList[index].tag);
};