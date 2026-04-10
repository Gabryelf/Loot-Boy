// ============ ПЕРКИ И СПОСОБНОСТИ ============

const PERKS = {
    // Доступные перки
    available: {
        tough: {
            id: 'tough',
            name: 'Крепкий орешек',
            description: TEXTS.PERKS_DESC.tough,
            effect: { type: 'max_hp', value: 1.3 },
            icon: '💪',
            requiredLevel: 2
        },
        strong: {
            id: 'strong',
            name: 'Силач',
            description: TEXTS.PERKS_DESC.strong,
            effect: { type: 'melee_damage', value: 1.4 },
            icon: '🔨',
            requiredLevel: 3
        },
        sniper: {
            id: 'sniper',
            name: 'Снайпер',
            description: TEXTS.PERKS_DESC.sniper,
            effect: { type: 'ranged_damage', value: 1.5 },
            icon: '🎯',
            requiredLevel: 3
        },
        lucky: {
            id: 'lucky',
            name: 'Везунчик',
            description: TEXTS.PERKS_DESC.lucky,
            effect: { type: 'loot_chance', value: 1.25 },
            icon: '🍀',
            requiredLevel: 4
        },
        marathon: {
            id: 'marathon',
            name: 'Марафонец',
            description: TEXTS.PERKS_DESC.marathon,
            effect: { type: 'resource_drain', value: 0.7 },
            icon: '🏃',
            requiredLevel: 5
        },
        berserk: {
            id: 'berserk',
            name: 'Берсерк',
            description: TEXTS.PERKS_DESC.berserk,
            effect: { type: 'low_hp_damage', value: 1.2 },
            icon: '😈',
            requiredLevel: 6
        },
        scavenger: {
            id: 'scavenger',
            name: 'Мусорщик',
            description: TEXTS.PERKS_DESC.scavenger,
            effect: { type: 'ammo_drop', value: 1.5 },
            icon: '🔫',
            requiredLevel: 4
        },
        medic: {
            id: 'medic',
            name: 'Медик',
            description: TEXTS.PERKS_DESC.medic,
            effect: { type: 'heal_boost', value: 1.5 },
            icon: '💊',
            requiredLevel: 3
        }
    },
    
    // Активные перки игрока
    active: [],
    
    // Применение эффектов перков
    applyPerkEffects(player, perkId) {
        const perk = this.available[perkId];
        if (!perk) return;
        
        switch(perk.effect.type) {
            case 'max_hp':
                player.maxHp = Math.floor(player.baseMaxHp * perk.effect.value);
                if (player.hp > player.maxHp) player.hp = player.maxHp;
                break;
            case 'melee_damage':
                player.meleeDamageBonus = perk.effect.value;
                break;
            case 'ranged_damage':
                player.rangedDamageBonus = perk.effect.value;
                break;
            case 'loot_chance':
                player.lootChanceBonus = perk.effect.value;
                break;
            case 'resource_drain':
                player.resourceDrainBonus = perk.effect.value;
                break;
            case 'low_hp_damage':
                player.lowHpBonus = perk.effect.value;
                break;
            case 'ammo_drop':
                player.ammoDropBonus = perk.effect.value;
                break;
            case 'heal_boost':
                player.healBonus = perk.effect.value;
                break;
        }
    },
    
    // Сброс эффектов
    clearPerkEffects(player) {
        player.meleeDamageBonus = 1;
        player.rangedDamageBonus = 1;
        player.lootChanceBonus = 1;
        player.resourceDrainBonus = 1;
        player.lowHpBonus = 1;
        player.ammoDropBonus = 1;
        player.healBonus = 1;
    }
};