// ============ МОДУЛЬ ИГРОКА ============
// Нет экспортов - просто глобальный класс

class Player {
    constructor() {
        this.hp = CONFIG.PLAYER.START_HP;
        this.maxHp = CONFIG.PLAYER.START_HP;
        this.baseMaxHp = CONFIG.PLAYER.START_HP;
        this.food = CONFIG.PLAYER.START_FOOD;
        this.water = CONFIG.PLAYER.START_WATER;
        this.level = CONFIG.PLAYER.START_LEVEL;
        this.exp = CONFIG.PLAYER.START_EXP;
        this.distance = CONFIG.PLAYER.START_DISTANCE;
        this.inventory = [];
        this.currentWeapon = CONFIG.PLAYER.START_WEAPON;
        this.currentArmor = CONFIG.PLAYER.START_ARMOR_ITEM;
        this.weapons = JSON.parse(JSON.stringify(CONFIG.PLAYER.WEAPONS));
        this.armorItems = JSON.parse(JSON.stringify(CONFIG.PLAYER.ARMOR));
        this.armor = CONFIG.PLAYER.START_ARMOR;
        this.perkPoints = 0;
        this.weaponIndex = 0;
        this.armorIndex = 0;
        
        this.meleeDamageBonus = 1;
        this.rangedDamageBonus = 1;
        this.lootChanceBonus = 1;
        this.resourceDrainBonus = 1;
        this.lowHpBonus = 1;
        this.ammoDropBonus = 1;
        this.healBonus = 1;
        this.attackSpeedBonus = 1;
    }
    
    getExpProgress() {
        const currentLevelExp = CONFIG.LEVELS[this.level]?.expRequired || 0;
        const nextLevelExp = CONFIG.LEVELS[this.level + 1]?.expRequired || currentLevelExp + 100;
        const expForCurrentLevel = this.exp - currentLevelExp;
        const expNeededForNext = nextLevelExp - currentLevelExp;
        return Math.min(1, Math.max(0, expForCurrentLevel / expNeededForNext));
    }
    
    getExpNeeded() {
        const currentLevelExp = CONFIG.LEVELS[this.level]?.expRequired || 0;
        const nextLevelExp = CONFIG.LEVELS[this.level + 1]?.expRequired || currentLevelExp + 100;
        return {
            current: this.exp - currentLevelExp,
            needed: nextLevelExp - currentLevelExp
        };
    }
    
    addExp(amount, onLevelUp) {
        this.exp += amount;
        let leveledUp = false;
        
        while (true) {
            const nextLevel = this.level + 1;
            const requiredExp = CONFIG.LEVELS[nextLevel]?.expRequired;
            if (!requiredExp || this.exp < requiredExp) break;
            
            this.level = nextLevel;
            const levelInfo = CONFIG.LEVELS[nextLevel];
            
            this.maxHp += 20;
            this.hp = this.maxHp;
            this.baseMaxHp = this.maxHp;
            this.perkPoints += levelInfo.perkPoints;
            
            if (onLevelUp) onLevelUp(nextLevel);
            leveledUp = true;
        }
        
        return leveledUp;
    }
    
    updateResources(drainMultiplier) {
        this.food = Math.max(0, this.food - CONFIG.RESOURCE_DRAIN.FOOD_PER_TICK * drainMultiplier);
        this.water = Math.max(0, this.water - CONFIG.RESOURCE_DRAIN.WATER_PER_TICK * drainMultiplier);
        this.distance += CONFIG.GAME.DISTANCE_SPEED;
        
        let died = false;
        if (this.food <= 0) {
            this.hp = Math.max(0, this.hp - CONFIG.RESOURCE_DRAIN.STARVE_DAMAGE);
            if (this.hp <= 0) died = true;
        }
        if (this.water <= 0) {
            this.hp = Math.max(0, this.hp - CONFIG.RESOURCE_DRAIN.THIRST_DAMAGE);
            if (this.hp <= 0) died = true;
        }
        
        return died;
    }
    
    switchWeapon(direction, weaponList, onSwitch) {
        this.weaponIndex = (this.weaponIndex + direction + weaponList.length) % weaponList.length;
        this.currentWeapon = weaponList[this.weaponIndex];
        if (onSwitch) onSwitch(this.weapons[this.currentWeapon].name);
    }
    
    switchArmor(direction, armorList, onSwitch) {
        this.armorIndex = (this.armorIndex + direction + armorList.length) % armorList.length;
        this.currentArmor = armorList[this.armorIndex];
        this.armor = this.armorItems[this.currentArmor].defense;
        if (onSwitch) onSwitch(this.armorItems[this.currentArmor].name);
    }
    
    rest() {
        if (this.food > 8 && this.water > 8) {
            const heal = Math.floor(Math.random() * 20) + 15;
            this.hp = Math.min(this.maxHp, this.hp + heal);
            this.food -= 8;
            this.water -= 8;
            return heal;
        }
        return 0;
    }
    
    craftKnifeUpgrade() {
        const metalCount = this.inventory.filter(i => i.name === 'Металлолом').reduce((sum, i) => sum + i.value, 0);
        
        if (metalCount >= 30) {
            let toRemove = 30;
            for (let i = 0; i < this.inventory.length && toRemove > 0; i++) {
                if (this.inventory[i].name === 'Металлолом') {
                    const removeAmount = Math.min(this.inventory[i].value, toRemove);
                    this.inventory[i].value -= removeAmount;
                    toRemove -= removeAmount;
                    if (this.inventory[i].value <= 0) {
                        this.inventory.splice(i, 1);
                        i--;
                    }
                }
            }
            this.weapons.knife.damage += 5;
            return true;
        }
        return false;
    }
}