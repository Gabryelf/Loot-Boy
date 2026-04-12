// ============ КОНФИГУРАЦИЯ ИГРЫ ============

const CONFIG = {
    WINDOW: {
        WIDTH: 600,
        HEIGHT: 500
    },
    
    BACKGROUND_POSITIONS: {
        GROUND_Y: 280,
        RUINS_Y: 160,
        SKY_Y: 0,
        HERO_X: 80,           // Герой слева
        HERO_Y: 210,
        ENEMY_X: 460,
        ENEMY_Y: 210,
        WEAPON_X: 110,
        WEAPON_Y: 250
    },
    
    GAME: {
        TICK_INTERVAL: 100,
        EVENT_INTERVAL: 15000,
        BACKGROUND_SPEED: 1.5,
        WALK_ANIMATION_SPEED: 0.15,
        DISTANCE_SPEED: 0.5,    // метры за тик
        DISTANCE_REPORT_INTERVAL: 300000, // 5 минут в мс
        BASE_EXP_PER_KILL: 50,
        BASE_EXP_PER_EVENT: 20
    },
    
    PLAYER: {
        START_HP: 100,
        MAX_HP: 100,
        START_FOOD: 100,
        START_WATER: 100,
        START_ARMOR: 2,
        START_LEVEL: 1,
        START_EXP: 0,
        START_DISTANCE: 0,
        START_WEAPON: 'knife',
        WEAPONS: {
            knife: { name: 'Ржавый нож', damage: 8, range: 'melee', ammo: null, maxAmmo: null, sprite: 'knife.png', icon: '🔪' },
            pistol: { name: 'Пистолет', damage: 15, range: 'ranged', ammo: 30, maxAmmo: 30, sprite: 'pistol.png', icon: '🔫' },
            rifle: { name: 'Винтовка', damage: 25, range: 'ranged', ammo: 20, maxAmmo: 20, sprite: 'rifle.png', icon: '🔫' },
            shotgun: { name: 'Дробовик', damage: 35, range: 'ranged', ammo: 12, maxAmmo: 12, sprite: 'shotgun.png', icon: '🔫' }
        }
    },
    
    RESOURCE_DRAIN: {
        FOOD_PER_TICK: 0.003,
        WATER_PER_TICK: 0.003,
        STARVE_DAMAGE: 0.15,
        THIRST_DAMAGE: 0.15
    },
    
    COMBAT: {
        ATTACK_COOLDOWN: 800,
        ENEMY_ATTACK_COOLDOWN: 1000,
        MELEE_RANGE: 50,
        AMMO_DROP_CHANCE: 0.3,
        AMMO_DROP_AMOUNT: { min: 5, max: 15 }
    },
    
    LEVELS: {
        1: { expRequired: 0, perkPoints: 0 },
        2: { expRequired: 80, perkPoints: 1 },
        3: { expRequired: 180, perkPoints: 1 },
        4: { expRequired: 300, perkPoints: 1 },
        5: { expRequired: 450, perkPoints: 2 },
        6: { expRequired: 650, perkPoints: 1 },
        7: { expRequired: 900, perkPoints: 1 },
        8: { expRequired: 1200, perkPoints: 1 },
        9: { expRequired: 1550, perkPoints: 2 },
        10: { expRequired: 1950, perkPoints: 3 }
    },
    
    SPRITES: {
        CHARACTERS: {
            HERO_IDLE: 'sprites/characters/hero-idle.png',
            HERO_WALK1: 'sprites/characters/hero-walk1.png',
            HERO_WALK2: 'sprites/characters/hero-walk2.png',
            HERO_SHOOT: 'sprites/characters/hero-shoot.png',
            HERO_MELEE: 'sprites/characters/hero-melee.png',
            ENEMY_RAIDER: 'sprites/characters/enemy-raider.png',
            ENEMY_MUTANT: 'sprites/characters/enemy-mutant.png',
            ENEMY_DOG: 'sprites/characters/enemy-dog.png',
            ENEMY_BANDIT: 'sprites/characters/enemy-bandit.png'
        },
        WEAPONS: {
            KNIFE: 'sprites/weapons/knife.png',
            PISTOL: 'sprites/weapons/pistol.png',
            RIFLE: 'sprites/weapons/rifle.png',
            SHOTGUN: 'sprites/weapons/shotgun.png'
        },
        BACKGROUND: {
            GROUND: 'sprites/background/ground.png',
            RUINS: 'sprites/background/ruins.png',
            SKY: 'sprites/background/sky.png'
        },
        ICONS: {
            INVENTORY: 'sprites/icons/inventory.png',
            CRAFT: 'sprites/icons/craft.png',
            REST: 'sprites/icons/rest.png',
            PERKS: 'sprites/icons/perks.png',
            CHAT_OPEN: 'sprites/icons/chat-open.png',
            CHAT_CLOSE: 'sprites/icons/chat-close.png',
            HEALTH: 'sprites/icons/health.png',
            FOOD: 'sprites/icons/food.png',
            WATER: 'sprites/icons/water.png',
            EXP: 'sprites/icons/exp.png'
        }
    }
};