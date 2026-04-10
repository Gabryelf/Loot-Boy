// ============ КОНФИГУРАЦИЯ ИГРЫ ============

const CONFIG = {
    // Размеры окна
    WINDOW: {
        WIDTH: 600,
        HEIGHT: 400
    },
    
    // Координаты фона (для ручной настройки)
    BACKGROUND_POSITIONS: {
        GROUND_Y: 200,      // Y координата земли
        RUINS_Y: 190,       // Y координата руин
        SKY_Y: 50,           // Y координата неба
        HERO_X: 260,        // X координата героя
        HERO_Y: 210,        // Y координата героя
        ENEMY_X: 460,       // X координата врага
        ENEMY_Y: 210,       // Y координата врага
        WEAPON_X: 290,      // X координата оружия
        WEAPON_Y: 250       // Y координата оружия
    },
    
    // Игровые параметры
    GAME: {
        TICK_INTERVAL: 50,
        EVENT_INTERVAL: 15000,
        BACKGROUND_SPEED: 1.5,
        WALK_ANIMATION_SPEED: 0.15,
        DISTANCE_SPEED: 0.1,
        BASE_EXP_PER_KM: 10,
        BASE_EXP_PER_KILL: 50
    },
    
    // Параметры игрока
    PLAYER: {
        START_HP: 100,
        MAX_HP: 100,
        START_FOOD: 100,
        START_WATER: 100,
        START_ARMOR: 2,
        START_LEVEL: 1,
        START_EXP: 0,
        START_WEAPON: 'knife',
        WEAPONS: {
            knife: { name: 'Ржавый нож', damage: 8, range: 'melee', ammo: null, sprite: 'knife.png' },
            pistol: { name: 'Пистолет', damage: 15, range: 'ranged', ammo: 30, maxAmmo: 30, sprite: 'pistol.png' },
            rifle: { name: 'Винтовка', damage: 25, range: 'ranged', ammo: 20, maxAmmo: 20, sprite: 'rifle.png' },
            shotgun: { name: 'Дробовик', damage: 35, range: 'ranged', ammo: 12, maxAmmo: 12, sprite: 'shotgun.png' }
        }
    },
    
    // Ресурсы
    RESOURCE_DRAIN: {
        FOOD_PER_TICK: 0.006,
        WATER_PER_TICK: 0.006,
        STARVE_DAMAGE: 0.2,
        THIRST_DAMAGE: 0.2
    },
    
    // Динамический бой
    COMBAT: {
        ATTACK_COOLDOWN: 800,     // мс между атаками
        ENEMY_ATTACK_COOLDOWN: 1000,
        MELEE_RANGE: 50,          // расстояние для ближнего боя
        AMMO_DROP_CHANCE: 0.3,
        AMMO_DROP_AMOUNT: { min: 3, max: 10 }
    },
    
    // Уровни и опыт
    LEVELS: {
        1: { expRequired: 0, perkPoints: 0 },
        2: { expRequired: 1000, perkPoints: 1 },
        3: { expRequired: 2500, perkPoints: 1 },
        4: { expRequired: 4500, perkPoints: 1 },
        5: { expRequired: 7000, perkPoints: 2 },
        6: { expRequired: 10000, perkPoints: 1 },
        7: { expRequired: 13500, perkPoints: 1 },
        8: { expRequired: 17500, perkPoints: 1 },
        9: { expRequired: 22000, perkPoints: 2 },
        10: { expRequired: 27000, perkPoints: 3 }
    },
    
    // Спрайты
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
            ENEMY_BOSS: 'sprites/characters/enemy-boss.png'
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
            EXP: 'sprites/icons/exp.png',
            DISTANCE: 'sprites/icons/distance.png'
        }
    }
};