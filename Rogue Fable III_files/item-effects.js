/*global game, gs, util*/
/*global TILE_SIZE, HELL_FIRE_DAMAGE, RED_TARGET_BOX_FRAME, SHROOM_HP, SHROOM_EP, FACTION, RED_BOX_FRAME*/
/*jshint esversion: 6, laxbreak: true*/
'use strict';

// CREATE_WEAPON_EFFECTS:
// ********************************************************************************************
gs.createWeaponEffects = function () {
	this.weaponEffects = {};

    // WEAPON_EFFECT_MELEE:
    // ********************************************************************************************
	this.weaponEffects.Melee = {};
	this.weaponEffects.Melee.effect = function (tileIndex, item) {
		var flags = {};
		
		if (item.type.knockBack && util.frac() < 0.25) {
			flags.knockBack = 1;
		}
		
		// Melee Attack:
        gs.meleeAttack(gs.pc, tileIndex, gs.pc.weaponDamage(item), flags);
		
		// Play Sound:
		gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
	};
	this.weaponEffects.Melee.showTarget = function (tileIndex, weapon) {
		gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
		gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
		gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
		gs.targetSprites[0].visible = true;
	};
	this.weaponEffects.Melee.skill = 'Melee';
	
	// WEAPON_EFFECTS_POLEARM:
	// ********************************************************************************************
	this.weaponEffects.PoleArm = {};
	this.weaponEffects.PoleArm.effect = function (tileIndex, item) {
		var flags = {};
		
		// Weapon Knock Back:
		if (item.type.knockBack && util.frac() < 0.25) {
			flags.knockBack = 1;
		}
		
		// Polearm Attack:
		this.getTargetList(tileIndex).forEach(function (index) {
			gs.meleeAttack(gs.pc, index, gs.pc.weaponDamage(item), flags);
		}, this);
		
		// Play Sound:
		gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
	};
	this.weaponEffects.PoleArm.showTarget = function (tileIndex, weapon) {
		var i = 0;
		
		this.getTargetList(tileIndex).forEach(function (index) {
			gs.targetSprites[i].x = index.x * TILE_SIZE;
			gs.targetSprites[i].y = index.y * TILE_SIZE;
			gs.targetSprites[i].frame = RED_TARGET_BOX_FRAME;
			gs.targetSprites[i].visible = true;
			i += 1;
		}, this);
		
		if (i === 0 && gs.canShootTrap(tileIndex)) {
			gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
			gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
			gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
			gs.targetSprites[0].visible = true;
		}
		
	};
	this.weaponEffects.PoleArm.getTargetList = function (tileIndex) {
		var list, normal, newTileIndex;
		
		normal = gs.getNormal(gs.pc.tileIndex, tileIndex);
		newTileIndex = {x: gs.pc.tileIndex.x + normal.x * 2, y: gs.pc.tileIndex.y + normal.y * 2};
		
		list = gs.getIndexInRay(gs.pc.tileIndex, newTileIndex);
		list = list.filter(index => gs.getChar(index) && (gs.pc.isHostileToMe(gs.getChar(index)) || gs.getChar(index).faction === FACTION.DESTRUCTABLE));
		
		return list;
	};
	
	this.weaponEffects.PoleArm.skill = 'Melee';
	
	
	 // WEAPON_EFFECT_FLAME:
    // ********************************************************************************************
	this.weaponEffects.Flame = {};
	this.weaponEffects.Flame.effect = function (tileIndex, item) {
		gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
		
		// Crit unaware characters:
		let isCrit = false;
		if (!gs.getChar(tileIndex).isAgroed) {
			isCrit = true;
		}
		
		gs.createFire(tileIndex, Math.ceil(item.getModdedStat('damage') * gs.pc.meleeDamageMultiplier), {killer: gs.pc, isCrit: isCrit});
	};
	this.weaponEffects.Flame.showTarget = function (tileIndex, weapon) {
		gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
		gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
		gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
		gs.targetSprites[0].visible = true;
	};
	this.weaponEffects.Flame.skill = 'Melee';
    
	

    
    // WEAPON_EFFECT_CLEAVE:
    // ************************************************************************************************
	this.weaponEffects.Cleave = {};
	this.weaponEffects.Cleave.effect = function (tileIndex, item) {
        // Cleave Hit:
		this.getTargetList(tileIndex).forEach(function (index) {
			gs.meleeAttack(gs.pc, index, gs.pc.weaponDamage(item));
		}, this);
		
		// Sound:
        gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
        
	};
	this.weaponEffects.Cleave.showTarget = function (tileIndex, weapon) {
		var i = 0;
		
		this.getTargetList(tileIndex).forEach(function (index) {
			gs.targetSprites[i].x = index.x * TILE_SIZE;
			gs.targetSprites[i].y = index.y * TILE_SIZE;
			gs.targetSprites[i].frame = RED_TARGET_BOX_FRAME;
			gs.targetSprites[i].visible = true;
			i += 1;
		}, this);
	};
	this.weaponEffects.Cleave.getTargetList = function (tileIndex) {
		var list = gs.getIndexInRadius(gs.pc.tileIndex, 1.5);
		list = list.filter(index => gs.getChar(index) && (gs.pc.isHostileToMe(gs.getChar(index)) || gs.getChar(index).faction === FACTION.DESTRUCTABLE));
		return list;
	};
	this.weaponEffects.Cleave.skill = 'Melee';

	// WEAPON_EFFECT_STORM_CHOPPER:
    // ************************************************************************************************
	this.weaponEffects.StormChopper = {};
	this.weaponEffects.StormChopper.effect = function (tileIndex, item) {
        // Cleave Hit:
		this.getTargetList(tileIndex).forEach(function (index) {
			let isCrit = false;
			
			// Crit unaware characters:
			// Must recheck for char existance in case he was killed by previous part of the cleave
			// Ex. consider hitting a bloat, that explodes, killing his friend, and then trying to hit the now dead
			if (gs.getChar(index) && !gs.getChar(index).isAgroed) {
				isCrit = true;
			}
			
			gs.createShock(index, Math.ceil(item.getModdedStat('damage') * gs.pc.meleeDamageMultiplier), {killer: gs.pc, isCrit: isCrit});
		}, this);
		
		// Sound:
        gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
	};
	this.weaponEffects.StormChopper.showTarget = this.weaponEffects.Cleave.showTarget;
	this.weaponEffects.StormChopper.getTargetList = this.weaponEffects.Cleave.getTargetList;
	this.weaponEffects.StormChopper.skill = 'Melee';
	
	// WEAPON_EFFECT_MOB_FUCKER:
	// ********************************************************************************************
	this.weaponEffects.MobFucker = {};
	this.weaponEffects.MobFucker.effect = function (tileIndex, item) {
		var i;

		for (i = 0; i < gs.characterList.length; i += 1) {
			if (gs.getTile(gs.characterList[i].tileIndex).visible && gs.characterList[i].isAlive && gs.characterList[i] !== gs.pc) {
				gs.createFire(gs.characterList[i].tileIndex, 100, {killer: gs.pc});
			}
		}
	};
	this.weaponEffects.MobFucker.showTarget = function (tileIndex, weapon) {
		gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
		gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
		gs.targetSprites[0].visible = true;
	};
	this.weaponEffects.MobFucker.skill = 'Range';

	
	 // WEAPON_EFFECT_POISON_DAGGER:
    // ********************************************************************************************
	this.weaponEffects.PoisonDagger = {};
	this.weaponEffects.PoisonDagger.effect = function (tileIndex, item) {
		// Melee Attack:
        gs.meleeAttack(gs.pc, tileIndex, gs.pc.weaponDamage(item));
		
		// Play Sound:
		gs.playSound(gs.sounds.melee, gs.pc.tileIndex);
		
		// Apply Poison:
		if (gs.getChar(tileIndex) && gs.getChar(tileIndex).isAlive) {
			gs.getChar(tileIndex).addPoisonDamage(10);
		}
	};
	this.weaponEffects.PoisonDagger.showTarget = function (tileIndex, weapon) {
		gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
		gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
		gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
		gs.targetSprites[0].visible = true;
	};
	this.weaponEffects.PoisonDagger.skill = 'Melee';
	 


	// SINGLE_PROJECTILE_WEAPON_EFFECT:
	// ********************************************************************************************
	this.weaponEffects.SingleProjectile = {};
	this.weaponEffects.SingleProjectile.effect = function (tileIndex, item, flags) {
		var projectile;
		
		flags = flags || {};
		flags.killer = gs.pc;
		flags.isCrit = flags.isCrit || gs.pc.alwaysProjectileCrit;
		
		if (gs.pc.hasTalent('PerfectAim')) {
			flags.perfectAim = true;
		}
		
		gs.playSound(item.type.shootSound || gs.sounds.throw, gs.pc.tileIndex);
		
		projectile = gs.createProjectile(gs.pc, tileIndex, item.type.projectileName, gs.pc.weaponDamage(item), flags);
			
		// Consuming Ammo:
		if (!item.type.noAmmo) {
			if (game.rnd.frac() <= gs.pc.saveAmmoChance) {
				gs.pc.popUpText('Saved Ammo', '#ffffff');
			} 
			else {
				if (item.amount === 1) {
					gs.pc.popUpText('Out of Ammo', '#ffffff');
				}

				gs.pc.inventory.removeItem(item, 1);
			}
		}
		
		// Character bounce:
		gs.pc.body.faceTileIndex(tileIndex);
		gs.pc.body.bounceTowards(tileIndex);
		
		return projectile;
		
	};
	this.weaponEffects.SingleProjectile.showTarget = function (tileIndex, weapon) {
		// Show red X line if target blocked:
		if (gs.pc.hasTalent('PerfectAim')) {
			if (gs.distance(gs.pc.tileIndex, tileIndex) > gs.pc.weaponRange(weapon)
				|| !gs.isRayClear(gs.pc.tileIndex, tileIndex)
				|| !gs.isRayStaticPassable(gs.pc.tileIndex, tileIndex)) {
				gs.showTargetLine(tileIndex);
			}
		}
		else {
			if (gs.distance(gs.pc.tileIndex, tileIndex) > gs.pc.weaponRange(weapon)
				|| gs.distance(gs.pc.tileIndex, tileIndex) < gs.pc.weaponMinRange(weapon)
				|| (!gs.isRayClear(gs.pc.tileIndex, tileIndex) && !gs.getTile(tileIndex).visible)
				|| !gs.isRayPassable(gs.pc.tileIndex, tileIndex)) {
				gs.showTargetLine(tileIndex);
			}
		}
	
		// Show red target:
		gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
		gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
		gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
		gs.targetSprites[0].visible = true;
	};
	this.weaponEffects.SingleProjectile.skill = 'Range';
	
	// MAGIC_STAFF:
	// ********************************************************************************************
	this.weaponEffects.MagicStaff = {};
	this.weaponEffects.MagicStaff.skill = 'Range';
	this.weaponEffects.MagicStaff.effect = function (tileIndex, item, flags = {}) {
		flags.killer = gs.pc;
		
		// Sound:
		gs.playSound(gs.sounds.throw, gs.pc.tileIndex);
		
		// Projectile:
		gs.createProjectile(gs.pc, tileIndex, item.type.projectileName, gs.pc.weaponDamage(item), flags);
		
		// Character bounce:
		gs.pc.body.faceTileIndex(tileIndex);
		gs.pc.body.bounceTowards(tileIndex);
		
		// Shoot effect:
		if (item.type.shootEffect) {
			gs.createMagicShootEffect(gs.pc, tileIndex, item.type.shootEffect);
		}
	};
	this.weaponEffects.MagicStaff.showTarget = function (tileIndex, weapon) {
		var indexList, i = 0;
		
		// Show red X line if target blocked:
		if (gs.distance(gs.pc.tileIndex, tileIndex) > gs.pc.weaponRange(weapon)
			|| (!gs.isRayClear(gs.pc.tileIndex, tileIndex) && !gs.getTile(tileIndex).visible)
			|| !gs.isRayPassable(gs.pc.tileIndex, tileIndex)) {
			gs.showTargetLine(tileIndex);
			
			// Show red target:
			gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
			gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
			gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
			gs.targetSprites[0].visible = true;
		}
		else if (weapon.type === gs.itemTypes.GreaterStaffOfStorms) {
			indexList = gs.getIndexInRadius(tileIndex, 1.0);
			indexList = indexList.filter(index => gs.isStaticPassable(index));
			
			indexList.forEach(function (index) {
				gs.targetSprites[i].x = index.x * TILE_SIZE;
				gs.targetSprites[i].y = index.y * TILE_SIZE;
				gs.targetSprites[i].visible = true;
				gs.targetSprites[i].frame = RED_TARGET_BOX_FRAME;
				i += 1;
			}, this);
		}
		else {
			// Show red target:
			gs.targetSprites[0].x = tileIndex.x * TILE_SIZE;
			gs.targetSprites[0].y = tileIndex.y * TILE_SIZE;
			gs.targetSprites[0].frame = RED_TARGET_BOX_FRAME;
			gs.targetSprites[0].visible = true;
		}
		
			
		
		
	};
};

// CREATE_ITEM_EFFECTS:
// ************************************************************************************************
gs.createItemEffects = function () {
	
	this.itemEffects = {};
	
	// SCROLL_OF_TELEPORTATION:
	// ********************************************************************************************
	this.itemEffects.Teleportation = {};
	this.itemEffects.Teleportation.useImmediately = true;
	this.itemEffects.Teleportation.useOn = function (actingCharacter, targetTileIndex) {
		gs.createParticlePoof(gs.pc.tileIndex, 'PURPLE');
		gs.playSound(gs.sounds.teleport, gs.pc.tileIndex);
		gs.pc.randomTeleport();
		gs.pc.popUpText('Teleport!', '#ffffff');
		gs.createParticlePoof(gs.pc.tileIndex, 'PURPLE');
	};

	// SCROLL_OF_ENCHANTMENT:
	// ********************************************************************************************
	this.itemEffects.ScrollOfEnchantment = {};
	this.itemEffects.ScrollOfEnchantment.useImmediately = true;
	this.itemEffects.ScrollOfEnchantment.useOn = function () {
		gs.enchantmentMenu.open();
	};
	
	// SCROLL_OF_ACQUIREMENT:
	// ********************************************************************************************
	this.itemEffects.ScrollOfAcquirement = {};
	this.itemEffects.ScrollOfAcquirement.useImmediately = true;
	this.itemEffects.ScrollOfAcquirement.useOn = function () {
		gs.acquirementMenu.open();
	};
	
	// ********************************************************************************************
	// POTIONS:
	// ********************************************************************************************
	// HEALING_SHROOM:
	// ********************************************************************************************
	this.itemEffects.HealingShroom = {};
	this.itemEffects.HealingShroom.useImmediately = true;
	this.itemEffects.HealingShroom.useOn = function () {
		gs.pc.healHp(SHROOM_HP);
		gs.createParticlePoof(gs.pc.tileIndex, 'GREEN');
	};
	
	// ENERGY_SHROOM:
	// ********************************************************************************************
	this.itemEffects.EnergyShroom = {};
	this.itemEffects.EnergyShroom.useImmediately = true;
	this.itemEffects.EnergyShroom.useOn = function () {
		gs.pc.gainMp(SHROOM_EP);
		gs.createParticlePoof(gs.pc.tileIndex, 'PURPLE');
	};

	// EAT:
	// ********************************************************************************************
	this.itemEffects.Eat = {};
	this.itemEffects.Eat.useImmediately = true;
	this.itemEffects.Eat.useOn = function (item) {
		gs.pc.currentFood = gs.pc.maxFood;
		gs.pc.healHp(Math.ceil(gs.pc.maxHp / 2));
		gs.pc.gainMp(Math.ceil(gs.pc.maxMp / 2));
	};

	// POTION_OF_HEALING:
	// ********************************************************************************************
	this.itemEffects.PotionOfHealing = {};
	this.itemEffects.PotionOfHealing.useImmediately = true;
	this.itemEffects.PotionOfHealing.useOn = function () {		
		if (gs.pc.currentHp === gs.pc.maxHp) {
			gs.pc.permanentHpBonus += 4;
			gs.pc.popUpText('+4 Max HP', '#ffffff');
			gs.pc.updateStats();
		}
		else {
			gs.pc.popUpText('Fully Healed', '#ffffff');
		}
		// Full Heal:
		gs.pc.healHp(gs.pc.maxHp);
		gs.pc.cure();
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
	
		// Effect:
		gs.createHealingEffect(gs.pc.tileIndex);
		
	};
	
	// POTION_OF_ENERGY:
	// ********************************************************************************************
	this.itemEffects.PotionOfEnergy = {};
	this.itemEffects.PotionOfEnergy.useImmediately = true;
	this.itemEffects.PotionOfEnergy.useOn = function () {
		if (gs.pc.currentMp === gs.pc.maxMp) {
			gs.pc.permanentMpBonus += 1;
			gs.pc.popUpText('+1 Max MP', '#ffffff');
			gs.pc.updateStats();
		}
		else {
			gs.pc.popUpText('Full Energy', '#ffffff');
		}
		
		// Full Mana and cool Downs:
		gs.pc.gainMp(gs.pc.maxMp);
		gs.pc.mentalCure();
		gs.pc.resetAllCoolDowns();
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
		
		// Effect:
		gs.createManaEffect(gs.pc.tileIndex);
	};
	
	// POTION_OF_EXPERIENCE:
	// ********************************************************************************************
	this.itemEffects.PotionOfExperience = {};
	this.itemEffects.PotionOfExperience.useImmediately = true;
	this.itemEffects.PotionOfExperience.useOn = function () {
		// Status Effect:
		gs.pc.statusEffects.add('ExperienceBoost');
		
		// Spell Effect:
		gs.createEXPEffect(gs.pc.tileIndex);
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
	};
	
	// POTION_OF_POWER:
	// ********************************************************************************************
	this.itemEffects.PotionOfPower = {};
	this.itemEffects.PotionOfPower.useImmediately = true;
	this.itemEffects.PotionOfPower.useOn = function () {
		// Full Mana and cool Downs:
		gs.pc.gainMp(gs.pc.maxMp);
		gs.pc.mentalCure();
		gs.pc.resetAllCoolDowns();
		
		// Status Effect:
		gs.pc.statusEffects.add('Power');
		
		// Spell Effect:
		gs.createIceEffect(gs.pc.tileIndex);
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
	};
	
	// POTION_OF_RESISTANCE:
	// ********************************************************************************************
	this.itemEffects.PotionOfResistance = {};
	this.itemEffects.PotionOfResistance.useImmediately = true;
	this.itemEffects.PotionOfResistance.useOn = function () {
		// Full Heal:
		gs.pc.healHp(gs.pc.maxHp);
		gs.pc.cure();
		
		// Status Effect:
		gs.pc.statusEffects.add('Resistance');
		
		// Spell Effect:
		gs.createIceEffect(gs.pc.tileIndex);
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
	};
	
	// POTION_OF_GAIN_ATTRIBUTE:
	// ********************************************************************************************
	this.itemEffects.PotionOfGainAttribute = {};
	this.itemEffects.PotionOfGainAttribute.useImmediately = true;
	this.itemEffects.PotionOfGainAttribute.useOn = function () {
		gs.openAttributeGainMenu();
		
		// Spell Effect:
		gs.createFireEffect(gs.pc.tileIndex);
		
		// Sound:
		gs.playSound(gs.sounds.cure, gs.pc.tileIndex);
	};
};

