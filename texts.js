// ============ ТЕКСТОВЫЕ ДАННЫЕ ============

const TEXTS = {
    STATUS: {
        HEALTH: '❤️',
        FOOD: '🍖',
        WATER: '💧',
        EXP: '⭐',
        LEVEL: '🎯'
    },
    
    BUTTONS: {
        INVENTORY: 'Инвентарь',
        CRAFT: 'Крафт',
        REST: 'Отдых',
        PERKS: 'Перки',
        CLOSE: 'Закрыть'
    },
    
    CHAT: {
        WELCOME: 'Добро пожаловать в Пустоши!',
        WELCOME_DESC: 'Ваше путешествие начинается...',
        LEVEL_UP: '✨ ПОВЫШЕНИЕ УРОВНЯ! ✨',
        GAME_OVER: '💀 ВЫ ПОГИБЛИ В ПУСТОШИ 💀',
        TIME_PREFIX: '🕐',
        DISTANCE_REPORT: 'пройдено метров',
        FOUND: 'Нашли',
        CRAFTED: 'Скрафтили',
        RESTED: 'Отдохнули и восстановили'
    },
    
    MODAL: {
        INVENTORY_TITLE: '📦 ИНВЕНТАРЬ',
        PERKS_TITLE: '⭐ ПЕРКИ',
        EMPTY_INVENTORY: 'Пусто...',
        PERK_POINTS: 'Доступно очков перков'
    },
    
    PERKS_DESC: {
        tough: '💪 +30% к максимальному здоровью',
        strong: '🔨 +40% к урону в ближнем бою',
        sniper: '🎯 +50% к урону из дальнобойного оружия',
        lucky: '🍀 +25% шанс найти редкие предметы',
        marathon: '🏃 Снижение расхода ресурсов на 30%',
        berserk: '😈 +20% урона при низком здоровье',
        scavenger: '🔫 +50% патронов из лута',
        medic: '💊 Аптечки восстанавливают на 50% больше',
        gunslinger: '⚡ Скорострельность +25%',
        survivor: '🛡️ +15 к броне'
    },
    
    EVENTS: [
        {
            id: 'abandoned_hospital',
            title: '🏥 Заброшенная больница',
            description: 'Вы нашли старую больницу. Внутри слышны подозрительные звуки, но видны медицинские шкафы.',
            backgroundImage: 'sprites/events/hospital-bg.jpg',
            options: [
                { text: 'Обыскать аптеку', effects: ['medkit_high', 'exp'] },
                { text: 'Поискать в морге', effects: ['medkit', 'danger_low'] },
                { text: 'Уйти', effects: ['none'] }
            ]
        },
        {
            id: 'radio_signal',
            title: '📻 Таинственный радиосигнал',
            description: 'Ваше радио поймало странный сигнал. Кто-то просит о помощи.',
            backgroundImage: 'sprites/events/radio-bg.jpg',
            options: [
                { text: 'Ответить и пойти на сигнал', effects: ['exp_high', 'food'] },
                { text: 'Игнорировать', effects: ['none'] },
                { text: 'Попытаться вычислить источник', effects: ['exp', 'info'] }
            ]
        },
        {
            id: 'mutant_nest',
            title: '🕷️ Гнездо мутантов',
            description: 'Вы наткнулись на гнездо мутантов. Они ещё не заметили вас.',
            backgroundImage: 'sprites/events/mutant-bg.jpg',
            options: [
                { text: 'Атаковать внезапно', effects: ['combat_easy', 'exp_high'] },
                { text: 'Обойти стороной', effects: ['stealth'] },
                { text: 'Подбросить гранату', effects: ['combat_normal', 'exp'] }
            ]
        },
        {
            id: 'merchant_caravan',
            title: '🚚 Караван торговцев',
            description: 'Вы встретили торговый караван. У них есть редкие товары.',
            backgroundImage: 'sprites/events/caravan-bg.jpg',
            options: [
                { text: 'Обменять металлолом', effects: ['trade_ammo'] },
                { text: 'Попытаться украсть', effects: ['danger_high'] },
                { text: 'Предложить помощь', effects: ['exp', 'food'] }
            ]
        },
        {
            id: 'ancient_ruins',
            title: '🏛️ Древние руины',
            description: 'Перед вами руины древней цивилизации.',
            backgroundImage: 'sprites/events/ruins-bg.jpg',
            options: [
                { text: 'Исследовать подземелье', effects: ['artifact', 'exp_high', 'danger_high'] },
                { text: 'Осмотреть поверхность', effects: ['scrap', 'exp'] },
                { text: 'Вызвать археологов', effects: ['exp', 'info'] }
            ]
        },
        {
            id: 'radioactive_storm',
            title: '☢️ Радиоактивная буря',
            description: 'Небо окрасилось в зелёный цвет. Надвигается буря!',
            backgroundImage: 'sprites/events/storm-bg.jpg',
            options: [
                { text: 'Спрятаться в подвале', effects: ['safe', 'food_loss'] },
                { text: 'Использовать препараты', effects: ['medkit_loss', 'radiation_resist'] },
                { text: 'Переждать в машине', effects: ['radiation_damage'] }
            ]
        },
        {
            id: 'survivor_camp',
            title: '🏕️ Лагерь выживших',
            description: 'Вы нашли небольшой лагерь выживших.',
            backgroundImage: 'sprites/events/camp-bg.jpg',
            options: [
                { text: 'Предложить обмен', effects: ['trade_all', 'exp'] },
                { text: 'Помочь с ремонтом', effects: ['exp_high', 'repair'] },
                { text: 'Атаковать лагерь', effects: ['combat_hard', 'loot_high'] }
            ]
        },
        {
            id: 'military_cache',
            title: '📦 Военный склад',
            description: 'Секретный склад с военным снаряжением.',
            backgroundImage: 'sprites/events/cache-bg.jpg',
            options: [
                { text: 'Взломать замок', effects: ['weapon_rare', 'danger_medium'] },
                { text: 'Найти запасной вход', effects: ['armor', 'exp'] },
                { text: 'Устроить отвлекающий взрыв', effects: ['loot_high', 'danger_high'] }
            ]
        },
        {
            id: 'water_purifier',
            title: '💧 Водоочистительная станция',
            description: 'Работающая водоочистительная станция!',
            backgroundImage: 'sprites/events/purifier-bg.jpg',
            options: [
                { text: 'Набрать воды', effects: ['water_high'] },
                { text: 'Починить станцию', effects: ['exp_high', 'repair'] },
                { text: 'Установить свою очистку', effects: ['water_regeneration', 'scrap_loss'] }
            ]
        },
        {
            id: 'bandit_ambush',
            title: '🔫 Засада бандитов',
            description: 'Вы попали в засаду! Бандиты требуют отдать все припасы.',
            backgroundImage: 'sprites/events/bandit-bg.jpg',
            options: [
                { text: 'Сражаться', effects: ['combat_normal', 'loot_normal'] },
                { text: 'Отдать припасы', effects: ['food_loss', 'water_loss'] },
                { text: 'Попытаться сбежать', effects: ['danger_low'] }
            ]
        }
    ],
    
    EFFECTS: {
        none: { log: 'Вы решили не рисковать', type: 'neutral' },
        medkit: { log: 'Вы нашли аптечку!', item: 'Аптечка', value: 1 },
        medkit_high: { log: 'Вы нашли несколько аптечек!', item: 'Аптечка', value: 3 },
        exp: { log: 'Вы получили опыт', exp: 25, type: 'exp' },
        exp_high: { log: 'Вы получили много опыта', exp: 50, type: 'exp' },
        food: { log: 'Вы нашли еду', food: 20, type: 'food' },
        water: { log: 'Вы нашли воду', water: 20, type: 'water' },
        water_high: { log: 'Вы нашли много воды', water: 50, type: 'water' },
        scrap: { log: 'Вы нашли металлолом', item: 'Металлолом', value: 15 },
        radiation_damage: { log: 'Вы получили радиационное отравление!', hp: -20, type: 'damage' },
        danger_low: { log: 'На вас напали!', combat: 'easy', type: 'combat' },
        danger_medium: { log: 'Охрана заметила вас!', combat: 'normal', type: 'combat' },
        danger_high: { log: 'Вы попали в засаду!', combat: 'hard', type: 'combat' },
        combat_easy: { log: 'Вы атаковали врасплох', combat: 'easy', type: 'combat' },
        combat_normal: { log: 'Завязался бой', combat: 'normal', type: 'combat' },
        combat_hard: { log: 'Начался тяжелый бой', combat: 'hard', type: 'combat' },
        loot_normal: { log: 'Вы нашли припасы', loot: 'normal', type: 'loot' },
        loot_high: { log: 'Вы нашли ценные вещи', loot: 'high', type: 'loot' },
        loot_rare: { log: 'Вы нашли редкий предмет!', loot: 'rare', type: 'loot' },
        weapon_rare: { log: 'Вы нашли редкое оружие!', weapon: 'rare', type: 'weapon' },
        armor: { log: 'Вы нашли броню', armor: 'normal', type: 'armor' },
        trade_ammo: { log: 'Вы обменяли металлолом на патроны', trade: 'ammo', type: 'trade' },
        scrap_loss: { log: 'Вы потратили металлолом', scrap: -15, type: 'resource' },
        artifact: { log: 'Вы нашли древний артефакт!', artifact: true, type: 'special' },
        safe: { log: 'Вы успешно переждали бурю', type: 'neutral' },
        food_loss: { log: 'Вы потратили часть припасов', food: -10, type: 'resource' },
        water_loss: { log: 'Вы потратили часть воды', water: -10, type: 'resource' },
        radiation_resist: { log: 'Вы устойчивы к радиации', buff: 'radiation', type: 'buff' },
        repair: { log: 'Вы починили оборудование', type: 'neutral' },
        water_regeneration: { log: 'Теперь у вас есть источник воды', buff: 'water_regeneration', type: 'buff' },
        info: { log: 'Вы получили полезную информацию', exp: 15, type: 'exp' },
        stealth: { log: 'Вы незаметно прошли мимо', type: 'neutral' },
        trade_all: { log: 'Выгодный обмен состоялся', exp: 20, type: 'exp' },
        medkit_loss: { log: 'Вы использовали аптечку', item: 'Аптечка', value: -1 }
    },
    
    ENEMIES: [
        { name: 'Рейдер', hp: 35, damage: 7, level: 1, range: 'melee', exp: 40, icon: '🏴‍☠️', dodge: 0.1 },
        { name: 'Мутант', hp: 50, damage: 10, level: 2, range: 'melee', exp: 60, icon: '👾', dodge: 0.15 },
        { name: 'Бешеная собака', hp: 25, damage: 5, level: 1, range: 'melee', exp: 30, icon: '🐕', dodge: 0.2 },
        { name: 'Снайпер', hp: 30, damage: 12, level: 2, range: 'ranged', exp: 50, icon: '🎯', dodge: 0.05 },
        { name: 'Бандит', hp: 40, damage: 8, level: 1, range: 'melee', exp: 45, icon: '🔫', dodge: 0.12 },
        { name: 'Гигантский скорпион', hp: 60, damage: 11, level: 2, range: 'melee', exp: 70, icon: '🦂', dodge: 0.25 }
    ]
};