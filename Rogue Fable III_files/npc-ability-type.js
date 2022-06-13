/*global gs, game, util, console*/
/*global LOS_DISTANCE, ABILITY_RANGE, FACTION*/
/*global SPIDER_EGG_HATCH_TURNS*/
/*global FIRE_POT_MIN_DAMAGE, FIRE_POT_MAX_DAMAGE*/
/*global GAS_POT_MIN_DAMAGE, GAS_POT_MAX_DAMAGE*/
/*jshint esversion: 6, laxbreak: true*/
'use strict';

// CREATE_NPC_ABILITY_TYPES:
// ********************************************************************************************
gs.createNPCAbilityTypes = function () {
	// MELEE_ATTACK:
	// Used by NPCs to give them melee attacks
	// Note that player melee attacks are handled by weaponEffectTypes
	// ****************************************************************************************
	this.abilityTypes.MeleeAttack = {};
	this.abilityTypes.MeleeAttack.attributes = {damage: {}};
	this.abilityTypes.MeleeAttack.onHitFunc = null;
	this.abilityTypes.MeleeAttack.range = 1.5;
	this.abilityTypes.MeleeAttack.canUseOn = this.abilityCanUseOn.SingleTileRay;
	this.abilityTypes.MeleeAttack.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.MeleeAttack.useOn = function (character, targetTileIndex) {
		var damage, onHitFunc = null;
		
		// Attributes:
		damage = this.attributes.damage.value(character);
		
		if (this.onHitFunc) {
			onHitFunc = this.onHitFunc.bind(this);
		}
		
		// Melee Attack:
		gs.meleeAttack(character, targetTileIndex, damage, {effectFunc: onHitFunc});
		
		// Play Sound:
		gs.playSound(gs.sounds.melee, character.tileIndex);
	};
	
	// VAMPIRE_ATTACK:
	// Used by NPCs to give them a vampire attack which heals and raises their max hp
	// ****************************************************************************************
	this.abilityTypes.VampireAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.VampireAttack.onHitFunc = function (defender, attacker, damage) {
		attacker.healHp(Math.ceil(damage / 2));
	};
	
	// EXP_DRAIN_ATTACK:
	// Used by NPCs to give them a exp draining melee attacks
	// Note that player melee attacks are handled by weaponEffectTypes
	// ****************************************************************************************
	this.abilityTypes.EXPDrainAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.EXPDrainAttack.onHitFunc = function (defender, attacker, damage) {
		defender.loseExp(5);
	};
	
	
	// MANA_DRAIN_ATTACK:
	// Used by NPCs to give them a mana draining melee attacks
	// Note that player melee attacks are handled by weaponEffectTypes
	// ****************************************************************************************
	this.abilityTypes.ManaDrainAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.ManaDrainAttack.onHitFunc = function (defender, attacker, damage) {
		defender.loseMp(5);
		defender.queuePopUpText('Mana Drain!', '#ffffff');
	};
	
	
	// POISON_ATTACK:
	// ********************************************************************************************
	this.abilityTypes.PoisonAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.PoisonAttack.onHitFunc = function (defender, attacker, damage) {
		var poisonDamage;
		
		poisonDamage = this.attributes.damage.value(attacker) * 2;
		
		if (util.frac() < 0.25) {
			defender.addPoisonDamage(poisonDamage);
		}
	};
	
	
	// DRAINING_ATTACK:
	// ********************************************************************************************
	this.abilityTypes.DrainingAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.DrainingAttack.onHitFunc = function (defender, attacker, damage) {
		if (util.frac() < 0.25) {
			defender.statusEffects.add('Draining');
		}	
	};
	
	// TRAMPLE_ATTACK:
	// ********************************************************************************************
	this.abilityTypes.TrampleAttack = Object.create(this.abilityTypes.MeleeAttack);
	this.abilityTypes.TrampleAttack.canUse = function (actingChar) {
		return !actingChar.isImmobile;
	};
	this.abilityTypes.TrampleAttack.useOn = function (character, targetTileIndex) {
		var onHit, damage;
		
		damage = this.attributes.damage.value(character);
		
		onHit = function (targetChar) {
			character.popUpText('Trample!', '#ffffff');
		}.bind(this);
		
		// Melee Attack:
		gs.meleeAttack(character, targetTileIndex, damage, {effectFunc: onHit, knockBack: 1});
		
		if (gs.isPassable(targetTileIndex)) {
			character.moveTo(targetTileIndex);
		}
		
		// Play Sound:
		gs.playSound(gs.sounds.melee, character.tileIndex);	
	};
	
	// PROJECTILE_ATTACK:
	// Used by NPCs to give them projectile attacks
	// Note that player projectile attacks are handled by weaponEffectTypes
	// ********************************************************************************************
	this.abilityTypes.ProjectileAttack = {};
	this.abilityTypes.ProjectileAttack.attributes = {damage: {}};
	this.abilityTypes.ProjectileAttack.canUseOn = this.abilityCanUseOn.NPCProjectileAttack;
	this.abilityTypes.ProjectileAttack.range = 5.0;
	this.abilityTypes.ProjectileAttack.sound = gs.sounds.throw;
	this.abilityTypes.ProjectileAttack.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.ProjectileAttack.useOn = function (character, targetTileIndex) {
		var damage;
		
		damage = this.attributes.damage.value(character);
		
		// Create Projectile:
		gs.createProjectile(character, targetTileIndex, this.projectileTypeName, damage, {killer: character});
		
		// Character bounce and face:
		character.body.faceTileIndex(targetTileIndex);
		character.body.bounceTowards(targetTileIndex);
		
		// Effect:
		if (this.shootEffect) {
			gs.createMagicShootEffect(character, targetTileIndex, this.shootEffect);
		}
		
		// Play Sound:
		gs.playSound(this.sound, character.tileIndex);
	};
	
	// PROJECTILE_KITE:
	// Used by NPCs to give them projectile attacks
	// The NPC will take a step away from their target while firing if possible
	// ********************************************************************************************
	this.abilityTypes.ProjectileKite = {};
	this.abilityTypes.ProjectileKite.attributes = {damage: {}};
	this.abilityTypes.ProjectileKite.canUseOn = this.abilityCanUseOn.NPCProjectileAttack;
	this.abilityTypes.ProjectileKite.range = 5.0;
	this.abilityTypes.ProjectileKite.sound = gs.sounds.throw;
	this.abilityTypes.ProjectileKite.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.ProjectileKite.useOn = function (actingChar, targetTileIndex) {
		var tileIndex;
		
		gs.abilityTypes.ProjectileAttack.useOn.call(this, actingChar, targetTileIndex);
		
		if (gs.getChar(targetTileIndex)) {	
			tileIndex = actingChar.getMoveAwayIndex(gs.getChar(targetTileIndex));
			if (tileIndex) {
				actingChar.moveTo(tileIndex);
			}
		}
	};
	
	// HIDE_IN_SHELL:
	// ********************************************************************************************
	this.abilityTypes.HideInShell = {};
	this.abilityTypes.HideInShell.range = 1.5;
	this.abilityTypes.HideInShell.canUseOn = this.abilityCanUseOn.SingleCharacterRay;
	this.abilityTypes.HideInShell.canUse = function (actingChar) {
		return !actingChar.statusEffects.has('HideInShell');
	};
	this.abilityTypes.HideInShell.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.HideInShell.useOn = function (character, targetTileIndex) {
		character.statusEffects.add('HideInShell');
	};
	
	// SUICIDE:
	// Used by NPCs which kill themselves when in range
	// Note that the actual effects upon death are handled by onNPCDeath
	// ********************************************************************************************
	this.abilityTypes.Suicide = {};
	this.abilityTypes.Suicide.range = 1.5;
	this.abilityTypes.Suicide.canUseOn = this.abilityCanUseOn.SingleCharacterRay;
	this.abilityTypes.Suicide.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.Suicide.useOn = function (character, targetTileIndex) {
		character.death();
	};
	
	// SPAWN_NPC:
	// Used by NPC spawners
	// ********************************************************************************************
	this.abilityTypes.SpawnNPC = {};
	this.abilityTypes.SpawnNPC.attributes = {damage: {}};
	this.abilityTypes.SpawnNPC.range = LOS_DISTANCE;
	this.abilityTypes.SpawnNPC.mana = 1;
	this.abilityTypes.SpawnNPC.numSpawned = 1;
	this.abilityTypes.SpawnNPC.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.SpawnNPC.getSpawnIndex = function (actingChar, targetTileIndex) {
		var indexList;
		
		indexList = gs.getIndexInRadius(actingChar.tileIndex, 1.5);
		indexList = indexList.filter(index => gs.isPassable(index));
		indexList = indexList.filter(index => gs.isIndexSafe(index));
		indexList = indexList.filter(index => !gs.getTile(index).type.isPit);
		
		// Sort by nearest to target:
		indexList.sort((a, b) => gs.distance(targetTileIndex, a) - gs.distance(targetTileIndex, b));
		return indexList.length > 0 ? indexList[0] : null;
	};
	this.abilityTypes.SpawnNPC.canUseOn = function (actingChar, targetTileIndex) {
    	return gs.distance(actingChar.tileIndex, targetTileIndex) <= this.range()
			&& this.getSpawnIndex(actingChar, targetTileIndex);
	};
	this.abilityTypes.SpawnNPC.useOn = function (actingChar, targetTileIndex) {
		var tileIndex, npc, flags = {};
		
		for (let i = 0; i < this.numSpawned; i += 1) {
			tileIndex = this.getSpawnIndex(actingChar, targetTileIndex);
			if (tileIndex) {
				if (this.npcTypeName === 'FireBall') {
					flags.burstDamage = this.attributes.damage.value(actingChar);
				}
				
				npc = gs.createNPC(tileIndex, this.npcTypeName, flags);
				npc.spotAgroPlayer();
				npc.waitTime = 100;
				npc.faction = actingChar.faction;
				gs.playSound(gs.sounds.spell, actingChar.tileIndex);
				gs.createParticlePoof(tileIndex, 'WHITE');
			}
		}
		
		// Destroy spawner type NPCs (immobile) that are out of mana:
		if (actingChar.type.cantMove && actingChar.currentMp === 1) {
			actingChar.death();
		}
	};
	
	// SPIDER_WEB
	// ********************************************************************************************
	this.abilityTypes.SpiderWeb = {};
	this.abilityTypes.SpiderWeb.range = 2;
	this.abilityTypes.SpiderWeb.shouldUseOn = function (character, targetTileIndex) {
		return game.rnd.frac() < 0.5;
	};
	this.abilityTypes.SpiderWeb.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.SpiderWeb.canUseOn = function (character, targetTileIndex) {
		return gs.abilityCanUseOn.SingleCharacterRay.call(this, character, targetTileIndex)
			&& !gs.getChar(targetTileIndex).isImmobile;
	};
	this.abilityTypes.SpiderWeb.useOn = function (character, targetTileIndex) {
		gs.createProjectile(character, targetTileIndex, 'SpiderWeb');
		
		// Character bounce and face:
		character.body.faceTileIndex(targetTileIndex);
		character.body.bounceTowards(targetTileIndex);
	};
	
	// THROW_NET:
	// ********************************************************************************************
	this.abilityTypes.ThrowNet = {};
	this.abilityTypes.ThrowNet.range = 4;
	this.abilityTypes.ThrowNet.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.ThrowNet.canUseOn = this.abilityTypes.SpiderWeb.canUseOn;
	this.abilityTypes.ThrowNet.useOn = function (character, targetTileIndex) {
		gs.createProjectile(character, targetTileIndex, 'ThrowingNet');
	};

	// CONSTRICT:
	// ********************************************************************************************
	this.abilityTypes.Constrict = {};
	this.abilityTypes.Constrict.range = 1.5;
	this.abilityTypes.Constrict.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.Constrict.canUseOn = this.abilityCanUseOn.SingleTileRay;
	this.abilityTypes.Constrict.canUse = function (actingChar) {
		return !actingChar.statusEffects.has('Constricting');
	};
	this.abilityTypes.Constrict.useOn = function (character, targetTileIndex) {
		var targetChar = gs.getChar(targetTileIndex);
		
		if (targetChar) {
			targetChar.statusEffects.add('Constricted', {duration: 5, constrictingCharId: character.id});
			character.statusEffects.add('Constricting' , {duration: 5, targetCharId: targetChar.id});
		}
		
		character.body.faceTileIndex(targetTileIndex);
		character.body.bounceTowards(targetTileIndex);
	};

	// REVIVE_SKELETON:
	// ****************************************************************************************
	this.abilityTypes.ReviveSkeleton = {};
	this.abilityTypes.ReviveSkeleton.range = LOS_DISTANCE;
	this.abilityTypes.ReviveSkeleton.aoeRange = 5;
	this.abilityTypes.ReviveSkeleton.canUse = function (actingChar) {
		// Charmed NPCs should never revive skeletons:
		return actingChar.faction === FACTION.HOSTILE;
	};
	this.abilityTypes.ReviveSkeleton.canUseOn = function (actingChar, targetTileIndex) {
		return gs.abilityCanUseOn.SingleTileSmite.call(this, actingChar, targetTileIndex) 
			&& gs.getObj(targetTileIndex, 'SkeletonCorpse') 
			&& gs.isPassable(targetTileIndex);
	};
	this.abilityTypes.ReviveSkeleton.getTarget = function (actingChar) {
		var indexList = gs.getIndexInRadius(actingChar.tileIndex, this.aoeRange(actingChar));
		
		indexList = indexList.filter(index => this.canUseOn(actingChar, index));
		
		return indexList.length > 0 ? indexList[0] : null;
	};
	this.abilityTypes.ReviveSkeleton.useOn = function (character, targetTileIndex) {
		var object = gs.getObj(targetTileIndex),
			npc;
		
		// Revive Skeleton:
		npc = gs.createNPC(object.tileIndex, object.npcTypeName || 'SkeletonWarrior');
		npc.popUpText('Revived', '#ffffff');
		gs.createParticlePoof(object.tileIndex, 'PURPLE');
		gs.destroyObject(object);
		
		// Caster:
		gs.createParticlePoof(character.tileIndex, 'PURPLE');
		character.popUpText('Revive Skeleton', '#ffffff');
	};
	

	// SUMMON_ICE_BOMB:
	// ****************************************************************************************
	this.abilityTypes.SummonIceBomb = {};
	this.abilityTypes.SummonIceBomb.attributes = {damage: {}};
	this.abilityTypes.SummonIceBomb.range = ABILITY_RANGE;
	this.abilityTypes.SummonIceBomb.aoeRange = 1.5; // Used by getTarget.TBAoE to select tiles adjacent to hostiles
	this.abilityTypes.SummonIceBomb.getTarget = this.abilityGetTarget.TBAoE;
	this.abilityTypes.SummonIceBomb.canUseOn = function (actingChar, targetTileIndex) {
		return gs.abilityCanUseOn.SingleTileSmite.call(this, actingChar, targetTileIndex)
			&& !gs.getObj(targetTileIndex)
			&& !gs.getTile(targetTileIndex).type.isPit
			&& gs.isPassable(targetTileIndex);
	};
	this.abilityTypes.SummonIceBomb.useOn = function (character, targetTileIndex) {
		var object;
		
		// Character:
		character.popUpText('Summon Ice Bomb', '#ffffff');
		gs.createParticlePoof(character.tileIndex, 'WHITE');
		
		// Bomb:
		gs.createSummonEffect(targetTileIndex, function () {
			object = gs.createObject(targetTileIndex, 'IceBomb');
			object.damage = this.attributes.damage.value(character);
		}, this);
		
		// Sound:
		gs.playSound(gs.sounds.cure, character.tileIndex);
	};
	
	// THROW_BOMB:
	// ****************************************************************************************
	this.abilityTypes.ThrowBomb = {};
	this.abilityTypes.ThrowBomb.attributes = {damage: {}};
	this.abilityTypes.ThrowBomb.range = LOS_DISTANCE;
	this.abilityTypes.ThrowBomb.aoeRange = 1.0; // Used by getTarget.TBAoE to select tiles adjacent to hostiles
	this.abilityTypes.ThrowBomb.getTarget = this.abilityGetTarget.TBAoE;
	this.abilityTypes.ThrowBomb.canUseOn = function (actingChar, targetTileIndex) {
		return gs.abilityCanUseOn.SingleTileSmite.call(this, actingChar, targetTileIndex)
			&& !gs.getObj(targetTileIndex)
			&& !gs.getTile(targetTileIndex).type.isPit
			&& gs.isPassable(targetTileIndex);
	};
	this.abilityTypes.ThrowBomb.useOn = function (character, targetTileIndex) {
		var damage;
		
		damage = this.attributes.damage.value(character);
		
		gs.createProjectile(character, targetTileIndex, 'Bomb', damage, {killer: character});
		
		// Character bounce and face:
		character.body.faceTileIndex(targetTileIndex);
		character.body.bounceTowards(targetTileIndex);
	};
	
	// NPC_POISON_CLOUD:
	// ****************************************************************************************
	this.abilityTypes.NPCPoisonCloud = {};
	this.abilityTypes.NPCPoisonCloud.attributes = {damage: {}};
	this.abilityTypes.NPCPoisonCloud.range = ABILITY_RANGE;
	this.abilityTypes.NPCPoisonCloud.aoeRange = 1.5; // Used by getTarget.TBAoE to select tiles adjacent to hostiles
	this.abilityTypes.NPCPoisonCloud.getTarget = this.abilityGetTarget.TBAoE;
	this.abilityTypes.NPCPoisonCloud.canUseOn = this.abilityCanUseOn.SingleTileSmite;
	this.abilityTypes.NPCPoisonCloud.useOn = function (character, targetTileIndex) {
		var damage, position;
		
		damage = this.attributes.damage.value(character);
		
		// Caster:
		character.popUpText('Poison Cloud', '#ffffff');
		gs.createParticlePoof(character.tileIndex, 'PURPLE');
		
		// Cloud:
		gs.createCloud(targetTileIndex, 'PoisonGas', damage, 15);
		gs.createParticlePoof(targetTileIndex, 'PURPLE');
		
		// Sound:
		gs.playSound(gs.sounds.fire, targetTileIndex);
	};
	
	// SUMMON_MONSTERS:
	// Summons a group of monsters in a radius around the caster.
	// These monsters are flagged as summoned and have a reference to the summoner.
	// If the summoner is killed then the monsters poof automatically.
	// Note: never save summoned creatures when zoning
	// ********************************************************************************************
	this.abilityTypes.SummonMonsters = {};
	this.abilityTypes.SummonMonsters.range = LOS_DISTANCE;
	this.abilityTypes.SummonMonsters.num = 4;
	this.abilityTypes.SummonMonsters.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.SummonMonsters.canUseOn = function (actingChar, targetTileIndex) {
		var indexList;
		
		// Find adjacent indices in which to summon:
		indexList = gs.getIndexInRadius(actingChar.tileIndex, 2);
		indexList = indexList.filter(index => gs.isPassable(index));
		indexList = indexList.filter(index => gs.isRayPassable(actingChar.tileIndex, index));
		
		return indexList.length > 0
			&& gs.distance(actingChar.tileIndex, targetTileIndex) <= this.range()
			&& gs.isRayClear(actingChar.tileIndex, targetTileIndex);	
	};
	this.abilityTypes.SummonMonsters.useOn = function (actingChar, targetTileIndex) {
		var indexList;
		
		// Find adjacent indices in which to summon:
		indexList = gs.getIndexInRadius(actingChar.tileIndex, 2);
		indexList = indexList.filter(index => gs.isPassable(index));
		indexList = indexList.filter(index => gs.isRayPassable(actingChar.tileIndex, index));
		
		// Sort by nearest to target:
		indexList.sort((a, b) => gs.distance(targetTileIndex, a) - gs.distance(targetTileIndex, b));
		indexList = indexList.slice(0, this.num);
		
		// Spawn summoned npcs:
		indexList.forEach(function (index) {
			gs.createSummonEffect(index, function () {
				var npc = gs.createNPC(index, this.npcTypeName, {summonerID: actingChar.id});
				npc.waitTime = 100;
				npc.isAgroed = true;
				npc.faction = actingChar.faction;
				actingChar.summonIDList.push(npc.id);
				npc.popUpText('Summoned', '#ffffff');
			}, this);
		}, this);
		
		// Sound:
		gs.playSound(gs.sounds.cure, actingChar.tileIndex);
	};
	

	// WATCH_PLAYER:
	// ********************************************************************************************
	this.abilityTypes.WatchPlayer = {};
	this.abilityTypes.WatchPlayer.range = LOS_DISTANCE;
	this.abilityTypes.WatchPlayer.canUseOn = this.abilityCanUseOn.SingleCharacterSmite;
	this.abilityTypes.WatchPlayer.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.WatchPlayer.useOn = function (character, targetTileIndex) {
		gs.pc.statusEffects.add('Marked');
	};
	
	// WALL_OF_FIRE:
	// The NPC summons a 1x3 flaming clouds behind the player
	// ********************************************************************************************
	this.abilityTypes.WallOfFire = {};
	this.abilityTypes.WallOfFire.attributes = {damage: {}};
	this.abilityTypes.WallOfFire.range = ABILITY_RANGE;
	this.abilityTypes.WallOfFire.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.WallOfFire.getIndexList = function (character, targetTileIndex) {
		var indexList;
		
		indexList = gs.getIndexListAdjacent(targetTileIndex);
		indexList = indexList.filter(index => gs.isStaticPassable(index) && !gs.getCloud(index));
		indexList = indexList.filter(index => gs.distance(index, character.tileIndex) > gs.distance(targetTileIndex, character.tileIndex));
		
		return indexList;
	};
	this.abilityTypes.WallOfFire.canUseOn = function (character, targetTileIndex) {
		return gs.abilityCanUseOn.SingleCharacterSmite.call(this, character, targetTileIndex)
			&& this.getIndexList(character, targetTileIndex).length > 0;
	};
	this.abilityTypes.WallOfFire.useOn = function (character, targetTileIndex) {
		var indexList, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(character);
		
		// Caster:
		character.popUpText('Wall Of Fire', '#ffffff');
		gs.createParticlePoof(character.tileIndex, 'RED');
		
		// Targets:
		indexList = this.getIndexList(character, targetTileIndex);
		
		// Create Clouds:
		indexList.forEach(function (tileIndex) {
			gs.createParticlePoof(tileIndex, 'RED');
			gs.createCloud(tileIndex, 'FlamingCloud', damage, 10);			  
		}, this);
		
		// Sound:
		gs.playSound(gs.sounds.cure, character.tileIndex);
	};
	
	// WALL_OF_POISON_GAS:
	// The NPC summons a 1x3 flaming clouds behind the player
	// ********************************************************************************************
	this.abilityTypes.WallOfPoisonGas = {};
	this.abilityTypes.WallOfPoisonGas.attributes = {damage: {}};
	this.abilityTypes.WallOfPoisonGas.range = ABILITY_RANGE;
	this.abilityTypes.WallOfPoisonGas.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.WallOfPoisonGas.getIndexList = function (character, targetTileIndex) {
		var indexList;
		
		indexList = gs.getIndexListAdjacent(targetTileIndex);
		indexList = indexList.filter(index => gs.isStaticPassable(index) && !gs.getCloud(index));
		indexList = indexList.filter(index => gs.distance(index, character.tileIndex) > gs.distance(targetTileIndex, character.tileIndex));
		
		return indexList;
	};
	this.abilityTypes.WallOfPoisonGas.canUseOn = function (character, targetTileIndex) {
		return gs.abilityCanUseOn.SingleCharacterSmite.call(this, character, targetTileIndex)
			&& this.getIndexList(character, targetTileIndex).length > 0;
	};
	this.abilityTypes.WallOfPoisonGas.useOn = function (character, targetTileIndex) {
		var indexList, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(character);
		
		// Caster:
		gs.createParticlePoof(character.tileIndex, 'PURPLE');
		
		// Targets:
		indexList = this.getIndexList(character, targetTileIndex);
		
		// Create Clouds:
		indexList.forEach(function (tileIndex) {
			gs.createParticlePoof(tileIndex, 'PURPLE');
			gs.createCloud(tileIndex, 'PoisonCloud', damage, 10);			  
		}, this);
		
		// Sound:
		gs.playSound(gs.sounds.cure, character.tileIndex);
	};
	
	
	// HEAL:
	// ********************************************************************************************
	this.abilityTypes.Heal = {};
	this.abilityTypes.Heal.range = LOS_DISTANCE;
	this.abilityTypes.Heal.healPercent = 0.25;
	this.abilityTypes.Heal.getTarget = this.abilityGetTarget.SingleAlly;
	this.abilityTypes.Heal.canUseOn = function (actingCharacter, targetTileIndex) {
		return gs.abilityCanUseOn.SingleCharacterSmite.call(this, actingCharacter, targetTileIndex)
			&& gs.getChar(targetTileIndex).currentHp < gs.getChar(targetTileIndex).maxHp
			&& !gs.getChar(targetTileIndex).type.noRegen;
	};
	this.abilityTypes.Heal.useOn = function (actingCharacter, targetTileIndex) {
		var npc = gs.getChar(targetTileIndex);

		// Caster:
		actingCharacter.popUpText('Casting Heal', '#ffffff');
		gs.createParticlePoof(actingCharacter.tileIndex, 'GREEN');
		
		
		// Target Char:
		npc.healHp(Math.round(npc.maxHp * this.healPercent));
		npc.popUpText('Healed!', '#ffffff');
		gs.createHealingEffect(npc.tileIndex);
		gs.playSound(gs.sounds.cure, npc.tileIndex);
		
	};
	
	// HASTE:
	// ********************************************************************************************
	this.abilityTypes.Haste = {};
	this.abilityTypes.Haste.range = LOS_DISTANCE;
	this.abilityTypes.Haste.getTarget = this.abilityGetTarget.SingleAlly;
	this.abilityTypes.Haste.canUseOn = function (actingCharacter, targetTileIndex) {
		return gs.abilityCanUseOn.SingleCharacterSmite.call(this, actingCharacter, targetTileIndex)
			&& !gs.getChar(targetTileIndex).statusEffects.has('Haste')
			&& !gs.getChar(targetTileIndex).type.cantMove;
	};
	this.abilityTypes.Haste.canUse = function (actingCharacter) {
		if (actingCharacter.faction === FACTION.HOSTILE) {
			return true;
		}
		// Player allies should only cast haste on the player when there are hostiles agroed
		else {
			return gs.agroedHostileList().length > 0;
		}
	};
	this.abilityTypes.Haste.useOn = function (actingCharacter, targetTileIndex) {
		var npc = gs.getChar(targetTileIndex);
		
		npc.statusEffects.add('Haste');
		
		// Pop Up Text:
		actingCharacter.popUpText('Casting Haste', '#ffffff');
		
		// Particles:
		gs.createYellowMagicEffect(npc.tileIndex);
		
		gs.createParticlePoof(actingCharacter.tileIndex, 'PURPLE');
	};
	
	// SMITE:
	// ********************************************************************************************
	this.abilityTypes.Smite = {};
	this.abilityTypes.Smite.attributes = {damage: {}};
	this.abilityTypes.Smite.canUseOn = this.abilityCanUseOn.SingleCharacterSmite;
	this.abilityTypes.Smite.range = ABILITY_RANGE;
	this.abilityTypes.Smite.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.Smite.useOn = function (actingChar, targetTileIndex) {
		var damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingChar);
		
		// Status Effect:
		actingChar.statusEffects.add('CastingSmite', {damage: damage, tileIndex: {x: targetTileIndex.x, y: targetTileIndex.y}});
		
		// Set Facing:
		actingChar.body.faceTileIndex(targetTileIndex);
	};
	
	
	
	// SLOW_CHARGE:
	// ********************************************************************************************
	this.abilityTypes.SlowCharge = {};
	this.abilityTypes.SlowCharge.attributes = {damage: {}};
	this.abilityTypes.SlowCharge.range = LOS_DISTANCE;
	this.abilityTypes.SlowCharge.canUseOn = this.abilityCanUseOn.SingleCharacterStraightRay;
	this.abilityTypes.SlowCharge.shouldUseOn = function (actingCharacter, targetTileIndex) {
		return gs.distance(actingCharacter.tileIndex, targetTileIndex) >= 4;
	};
	this.abilityTypes.SlowCharge.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.SlowCharge.useOn = function (actingChar, targetTileIndex) {
		var delta, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingChar);
		
		delta = gs.get8WayVector(actingChar.tileIndex, targetTileIndex);
		
		// Status Effect:
		actingChar.moveDelta = {x: delta.x, y: delta.y};
		actingChar.statusEffects.add('SlowCharge', {damage: damage});
	};
	
	// ORB_OF_FIRE:
	// ********************************************************************************************
	this.abilityTypes.OrbOfFire = {};
	this.abilityTypes.OrbOfFire.attributes = {damage: {}};
	this.abilityTypes.OrbOfFire.range = LOS_DISTANCE;
	this.abilityTypes.OrbOfFire.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.OrbOfFire.canUseOn = function (actingCharacter, targetTileIndex) {
		var delta = gs.get8WayVector(actingCharacter.tileIndex, targetTileIndex);
		
		
		return gs.isPassable(actingCharacter.tileIndex.x + delta.x, actingCharacter.tileIndex.y + delta.y)
			&& gs.distance(actingCharacter.tileIndex, targetTileIndex) <= this.range()
			&& gs.isStraight(actingCharacter.tileIndex, targetTileIndex)
			&& gs.isRayPassable(actingCharacter.tileIndex, targetTileIndex);
	};
	this.abilityTypes.OrbOfFire.useOn = function (actingCharacter, targetTileIndex) {
		var delta, proj, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingCharacter);
		
		// Direction:
		delta = gs.get8WayVector(actingCharacter.tileIndex, targetTileIndex);
		
		// Projectile:
		proj = gs.createNPC({x: actingCharacter.tileIndex.x + delta.x, y: actingCharacter.tileIndex.y + delta.y}, 'OrbOfFire', {burstDamage: damage});
		proj.moveDelta = {x: delta.x, y: delta.y};
		proj.waitTime = 100;
		proj.isAgroed = true;
		
		// Caster:
		actingCharacter.popUpText('Orb of Fire', '#ffffff');
		gs.createParticlePoof(actingCharacter.tileIndex, 'RED');
		
		// Character bounce and face:
		actingCharacter.body.faceTileIndex(targetTileIndex);
		actingCharacter.body.bounceTowards(targetTileIndex);
	};
	
	
	// SLIDE:
	// ********************************************************************************************
	this.abilityTypes.Slide = {};
	this.abilityTypes.Slide.range = LOS_DISTANCE;
	this.abilityTypes.Slide.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.Slide.canUseOn = function (actingCharacter, targetTileIndex) {
		var toTileIndex = actingCharacter.body.getKnockBackIndex(gs.getNormal(targetTileIndex, actingCharacter.tileIndex), 4);
		return gs.distance(actingCharacter.tileIndex, targetTileIndex) <= 2
			&& gs.distance(actingCharacter.tileIndex, toTileIndex) > 1.5;
	};
	this.abilityTypes.Slide.useOn = function (actingCharacter, targetTileIndex) {
		var toTileIndex = actingCharacter.body.getKnockBackIndex(gs.getNormal(targetTileIndex, actingCharacter.tileIndex), 4);
		
		actingCharacter.popUpText('Slide!', '#ffffff');
		actingCharacter.body.moveToTileIndex(toTileIndex);
		actingCharacter.sprite.frame = actingCharacter.sprite.frame + 1;
	};
	
	// SEAL_DOORS:
	// ********************************************************************************************
	this.abilityTypes.SealDoors = {};
	this.abilityTypes.SealDoors.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.SealDoors.range = ABILITY_RANGE;
	this.abilityTypes.SealDoors.getTargetList = function (actingChar) {
		var indexList;
		
		indexList = gs.getIndexInRadius(actingChar.tileIndex, this.range());
		indexList = indexList.filter(index => gs.getObj(index, obj => obj.type.name === 'Door' || obj.isZoneLine()));
		indexList = indexList.filter(index => gs.getObj(index, obj => obj.isZoneLine()) || !gs.getChar(index));
		indexList = indexList.filter(index => gs.isRayClear(actingChar.tileIndex, index));
		
		return indexList;
	};
	this.abilityTypes.SealDoors.canUseOn = function (actingChar, targetTileIndex) {
		return this.getTargetList(actingChar).length > 0;
	};
	
	this.abilityTypes.SealDoors.useOn = function (actingChar, targetTileIndex) {
		var indexList = this.getTargetList(actingChar);
		
		gs.createParticlePoof(actingChar.tileIndex, 'PURPLE');
		
		actingChar.statusEffects.add('SealDoors', {indexList: indexList});
		
		indexList.forEach(function (tileIndex) {	
			gs.createParticlePoof(tileIndex, 'PURPLE');
			gs.createDamageText(util.toPosition(tileIndex).x, util.toPosition(tileIndex).y - 12, 'Sealed', '#ffffff');
		}, this);
	};
	
	// FLAMING_CLOUD_BOLT:
	// ********************************************************************************************
	this.abilityTypes.FlamingCloudBolt = {};
	this.abilityTypes.FlamingCloudBolt.attributes = {damage: {}};
	this.abilityTypes.FlamingCloudBolt.range = 5.5;
	this.abilityTypes.FlamingCloudBolt.showTarget = this.abilityShowTarget.Bolt;
	this.abilityTypes.FlamingCloudBolt.canUseOn = this.abilityCanUseOn.Bolt;
	this.abilityTypes.FlamingCloudBolt.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.FlamingCloudBolt.useOn = function (actingChar, targetTileIndex) {
		var indexList, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingChar);
		
		// Targets:
		indexList = gs.getIndexInBRay(actingChar.tileIndex, targetTileIndex);
		
		// Effect (using events):
		indexList.forEach(function (tileIndex) {
			var event;
			
			// Create event:
			event = {delay: 5};
			event.effect = function () {
				if (!gs.getCloud(tileIndex)) {
					gs.createCloud(tileIndex, 'FlamingCloud', damage, 10);
					gs.playSound(gs.sounds.fire, tileIndex);
				}
			}.bind(this);
			
			// Push event:
			actingChar.addEvent(event);
		}, this);
		
		// Character bounce and face:
		actingChar.body.faceTileIndex(targetTileIndex);
		actingChar.body.bounceTowards(targetTileIndex);
	};
	
	// POISON_CLOUD_BOLT:
	// ********************************************************************************************
	this.abilityTypes.PoisonCloudBolt = {};
	this.abilityTypes.PoisonCloudBolt.attributes = {damage: {}};
	this.abilityTypes.PoisonCloudBolt.range = 5.5;
	this.abilityTypes.PoisonCloudBolt.showTarget = this.abilityShowTarget.Bolt;
	this.abilityTypes.PoisonCloudBolt.canUseOn = this.abilityCanUseOn.Bolt;
	this.abilityTypes.PoisonCloudBolt.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.PoisonCloudBolt.useOn = function (actingChar, targetTileIndex) {
		var indexList, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingChar);
		
		// Targets:
		indexList = gs.getIndexInBRay(actingChar.tileIndex, targetTileIndex);
		
		// Effect (using events):
		indexList.forEach(function (tileIndex) {
			var event;
			
			// Create event:
			event = {delay: 5};
			event.effect = function () {
				if (!gs.getCloud(tileIndex)) {
					gs.createCloud(tileIndex, 'PoisonCloud', damage, 10);
				}
			}.bind(this);
			
			// Push event:
			actingChar.addEvent(event);
		}, this);
	};
	
	// NPC_CHARM:
	// ********************************************************************************************
	this.abilityTypes.NPCCharm = {};
	this.abilityTypes.NPCCharm.range = ABILITY_RANGE;
	this.abilityTypes.NPCCharm.canUseOn = this.abilityCanUseOn.SingleCharacterSmite;
	this.abilityTypes.NPCCharm.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.NPCCharm.useOn = function (character, targetTileIndex) {
		gs.pc.statusEffects.add('NPCCharm', {npcId: character.id});
	};
	
	// NPC_CONFUSION:
	// ********************************************************************************************
	this.abilityTypes.NPCConfusion = {};
	this.abilityTypes.NPCConfusion.range = ABILITY_RANGE;
	this.abilityTypes.NPCConfusion.canUseOn = this.abilityCanUseOn.SingleCharacterSmite;
	this.abilityTypes.NPCConfusion.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.NPCConfusion.useOn = function (character, targetTileIndex) {
		gs.pc.statusEffects.add('Confusion');
	};
	
	// BUFFET:
	// ********************************************************************************************
	this.abilityTypes.Buffet = {};
	this.abilityTypes.Buffet.range = 3.0;
	this.abilityTypes.Buffet.aoeRange = 3.0;
	this.abilityTypes.Buffet.canUseOn = this.abilityCanUseOn.SingleCharacterRay;
	this.abilityTypes.Buffet.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.Buffet.useOn = function (actingCharacter, targetTileIndex) {
		var indexList;
		
		indexList = gs.getIndexInRadius(actingCharacter.tileIndex, this.aoeRange(actingCharacter));
		
		indexList.forEach(function (tileIndex) {
			var char = gs.getChar(tileIndex);
			
			if (char && char !== actingCharacter && gs.isRayPassable(actingCharacter.tileIndex, tileIndex)) {
				char.body.applyKnockBack(gs.getNormal(actingCharacter.tileIndex, tileIndex), 3);
				gs.createParticleBurst(char.sprite.position, gs.getNormal(actingCharacter.tileIndex, char.tileIndex), 'WHITE');
			}
		}, this);
		
		actingCharacter.popUpText('Buffet!', '#ffffff');
	};
	
	// FIRE_STORM:
	// ********************************************************************************************
	this.abilityTypes.FireStorm = {};
	this.abilityTypes.FireStorm.attributes = {damage: {}};
	this.abilityTypes.FireStorm.range = ABILITY_RANGE;
	this.abilityTypes.FireStorm.getTarget = this.abilityGetTarget.SingleTarget;
	this.abilityTypes.FireStorm.canUseOn = function (actingCharacter, targetTileIndex) {
		var delta = gs.get8WayVector(actingCharacter.tileIndex, targetTileIndex);
		return gs.isPassable(actingCharacter.tileIndex.x + delta.x, actingCharacter.tileIndex.y + delta.y)
			&& gs.distance(actingCharacter.tileIndex, targetTileIndex) <= this.range()
			&& gs.isStraight(actingCharacter.tileIndex, targetTileIndex);
	};
	this.abilityTypes.FireStorm.useOn = function (actingChar, targetTileIndex) {
		var delta, proj, damage;
		
		// Attributes:
		damage = this.attributes.damage.value(actingChar);
		
		// Direction:
		delta = gs.get8WayVector(actingChar.tileIndex, targetTileIndex);
		
		// Status Effect:
		actingChar.statusEffects.add('CastingFireStorm', {
			damage: damage,
			tileIndex: {x: actingChar.tileIndex.x + delta.x, y: actingChar.tileIndex.y + delta.y},
			delta: {x: delta.x, y: delta.y}
		});
		
		// Set Facing:
		actingChar.body.faceTileIndex(targetTileIndex);
	};
	
	
	

	
    // ********************************************************************************************
    // UPDATE_TURN:
    // Special functionality that NPCs call every turn to update themselves.
    // ********************************************************************************************
	this.npcUpdateTurn = {};

	// PLANT_SPITTER_SPROUT:
	// ********************************************************************************************
	this.npcUpdateTurn.PlantSpitterSprout = function () {
		if (this.growTime === undefined) {
			this.growTime = 10;
		} else if (this.growTime > 0) {
			this.growTime -= 1;
		} else {
			this.destroy();
			gs.createNPC(this.tileIndex, 'PlantSpitter');
		}
	};

	// PLANT_SPITTER:
	// ********************************************************************************************
	this.npcUpdateTurn.PlantSpitter = function () {
		if (this.growTime === undefined) {
			this.growTime = 10;
		} else if (this.growTime > 0) {
			this.growTime -= 1;
		} else {
			this.destroy();
			gs.createNPC(this.tileIndex, 'MaturePlantSpitter');
		}
	};
	
	// FIRE_BALL:
	// ********************************************************************************************
	this.npcUpdateTurn.FireBall = function () {
		this.currentHp -= 1;
		if (this.currentHp <= 0) {
			this.death();
		}
	};
	
	// SPIDER_EGG:
	// ********************************************************************************************
	this.npcUpdateTurn.SpiderEgg = function () {
		var npc;
		
		if (this.timeToHatch < SPIDER_EGG_HATCH_TURNS) {
			this.timeToHatch += 1;
		} 
		else {
			this.death();
			npc = gs.createNPC(this.tileIndex, 'Spider');
			npc.isAgroed = true;
		}
	};
	

	// REGENERATE:
	// ********************************************************************************************
	this.npcUpdateTurn.Regenerate = function () {
		this.healHp(Math.ceil(this.maxHp * 0.05));
	};
	
	// ********************************************************************************************
    // ON_HIT:
    // Special functionality that NPCs call when they are hit.
    // ********************************************************************************************
	this.npcOnHit = {};
	
	// SLIME_SPLIT:
	// ********************************************************************************************
	this.npcOnHit.SlimeSplit = function (character) {
		var newNpc;

		if (gs.getPassableAdjacentIndex(character.tileIndex) && character.currentHp > 1 && character.sprite.frame < character.type.frame + 3) {
			newNpc = gs.createNPC(gs.getPassableAdjacentIndex(character.tileIndex), 'Slime');

			// First Split:
			if (character.sprite.frame === character.type.frame) {
				newNpc.sprite.frame = character.type.frame + 1;
				character.sprite.frame = character.type.frame + 1;
			}
			// Second Split:
			else if (character.sprite.frame === character.type.frame + 1) {
				newNpc.sprite.frame = character.type.frame + 2;
				character.sprite.frame = character.type.frame + 2;

			} 
			// Third Split:
			else {
				newNpc.sprite.frame = character.type.frame + 3;
				character.sprite.frame = character.type.frame + 3;
			}

			newNpc.currentHp = Math.floor(character.currentHp / 2);
			character.currentHp = Math.floor(character.currentHp / 2);
		}
	};
	
	this.npcOnHit.BaseBlink = function (character, preBlinkFunc = null) {
		var indexList;
		
		if (character.isImmobile || character.isStunned) {
			return;
		}
		
		// Finding a valid destination:
		indexList = gs.getIndexInRadius(character.tileIndex, LOS_DISTANCE);
		indexList = indexList.filter(index => gs.getTile(index).visible);
		indexList = indexList.filter(index => gs.isPassable(index) && character.canMoveTo(index));
		
		if (indexList.length > 0) {
			if (preBlinkFunc) {
				preBlinkFunc.call(this, character);
			}
			
			gs.createParticlePoof(character.tileIndex, 'PURPLE');
			character.popUpText('Blink', '#ffffff');
			gs.playSound(gs.sounds.teleport, character.tileIndex);
			
			character.body.snapToTileIndex(util.randElem(indexList));
			
			gs.createParticlePoof(character.tileIndex, 'PURPLE');
			character.popUpText('Blink', '#ffffff');
			
			character.waitTime = 100;
		}
	};
	
	// BLINK_FROG:
	// ********************************************************************************************
	this.npcOnHit.BlinkFrog = function (character) {
		if (game.rnd.frac() < 0.75) {
			gs.npcOnHit.BaseBlink(character);
		}
	};
	
	// IMP_BLINK:
	// ********************************************************************************************
	this.npcOnHit.ImpBlink = function (character) {
		if (game.rnd.frac() < 0.50) {
			gs.npcOnHit.BaseBlink(character);
		}
	};
	
	// FIRE_BLINK:
	// ********************************************************************************************
	this.npcOnHit.FireBlink = function (character) {
		if (game.rnd.frac() < 0.75) {
			gs.npcOnHit.BaseBlink(character, function (char) {
				if (!gs.getCloud(char.tileIndex)) {
					gs.createCloud(char.tileIndex, 'FlamingCloud', gs.npcDamage(char.level, 'MLOW'), 10);
				}
			});
		}
	};
};

// CREATE_NPC_ABILITY_TYPES:
// Special functionality that NPCs call when they die.
// ********************************************************************************************
gs.createNPCOnDeathTypes = function () {
	
	// EXPLODE:
	// ****************************************************************************************
	this.abilityTypes.Explode = {};
	this.abilityTypes.Explode.attributes = {damage: {}};
	this.abilityTypes.Explode.use = function (actingChar) {
		var damage = actingChar.burstDamage || this.attributes.damage.value(actingChar);
		
		gs.createExplosion(actingChar.tileIndex, 1.5, damage, {killer: actingChar});
	};
	
	// BIG_EXPLODE:
	// ****************************************************************************************
	this.abilityTypes.BigExplode = {};
	this.abilityTypes.BigExplode.attributes = {damage: {}};
	this.abilityTypes.BigExplode.use = function (actingChar) {
		var damage = actingChar.burstDamage || this.attributes.damage.value(actingChar);
		
		gs.createExplosion(actingChar.tileIndex, 2, damage, {killer: actingChar});
	};
	
	// EXPLODE_CROSS:
	// ****************************************************************************************
	this.abilityTypes.FirePotExplode = {};
	this.abilityTypes.FirePotExplode.use = function (actingChar) {		
		gs.createExplosionCross(actingChar.tileIndex, 3, gs.getScaledTrapDamage(FIRE_POT_MIN_DAMAGE, FIRE_POT_MAX_DAMAGE), {killer: actingChar});
	};
	
	// BREAK_GAS_POT:
	// ****************************************************************************************
	this.abilityTypes.BreakGasPot = {};
	this.abilityTypes.BreakGasPot.use = function (actingChar) {
		gs.createCloud(actingChar.tileIndex, 'PoisonGas', gs.getScaledTrapDamage(GAS_POT_MIN_DAMAGE, GAS_POT_MAX_DAMAGE), 15);
	};
	
	// BLOAT:
	// ****************************************************************************************
	this.abilityTypes.Bloat = {};
	this.abilityTypes.Bloat.attributes = {damage: {}};
	this.abilityTypes.Bloat.use = function (actingChar) {
		var damage = actingChar.burstDamage || this.attributes.damage.value(actingChar);
		
		//gs.createExplosion(actingChar.tileIndex, 1, damage, {killer: actingChar});
		gs.createCloud(actingChar.tileIndex, 'PoisonGas', damage, 15);
	};
	
	// SKELETON_CORPSE:
	// ****************************************************************************************
	this.abilityTypes.SkeletonCorpse = {};
	this.abilityTypes.SkeletonCorpse.use = function (actingChar) {
		var obj;
		if (!gs.getObj(actingChar.tileIndex)) {
			obj = gs.createObject(actingChar.tileIndex, 'SkeletonCorpse');
			obj.npcTypeName = actingChar.type.name;
		}
	};
};