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
    
    EVENTS: {
        FLAVOR: [
            '🌵 Вдали виднеются руины старого города',
            '💨 Ветер гоняет облака радиоактивной пыли',
            '🥫 На земле ржавая консервная банка',
            '🐺 Слышен далекий вой мутантов',
            '🐀 Мимо пробежала крыса-мутант',
            '☁️ Небо затянуто радиоактивными облаками',
            '🛣️ Пустошь простирается до горизонта',
            '🚗 Старый дорожный знак указывает в никуда',
            '🚘 Из земли торчат остовы машин',
            '🍄 Радиоактивные грибы светятся в темноте',
            '⚡ Вдали сверкнула молния',
            '🏚️ Заброшенная ферма на горизонте'
        ],
        
        ENCOUNTERS: [
            { type: 'friendly', text: '👴 Старый сталкер делится припасами', reward: { food: 15, water: 15 } },
            { type: 'friendly', text: '🏕️ Нашли заброшенный лагерь', reward: { exp: 30 } },
            { type: 'dangerous', text: '💀 Попали в засаду мутантов', penalty: { hp: 15 } },
            { type: 'neutral', text: '📻 Нашли работающее радио', reward: { exp: 20 } },
            { type: 'friendly', text: '💊 Нашли тайник с медикаментами', reward: { item: 'Аптечка' } },
            { type: 'dangerous', text: '⚠️ Радиоактивное облако накрыло', penalty: { hp: 10, radiation: true } }
        ],
        
        LOOT_DESC: {
            food: 'консервы',
            water: 'бутылку воды',
            medkit: 'аптечку',
            scrap: 'металлолом',
            ammo: 'патронов'
        },
        
        ENEMIES: [
            { name: 'Рейдер', hp: 35, damage: 7, level: 1, range: 'melee', exp: 40, icon: '🏴‍☠️' },
            { name: 'Мутант', hp: 50, damage: 10, level: 2, range: 'melee', exp: 60, icon: '👾' },
            { name: 'Бешеная собака', hp: 25, damage: 5, level: 1, range: 'melee', exp: 30, icon: '🐕' },
            { name: 'Снайпер', hp: 30, damage: 12, level: 2, range: 'ranged', exp: 50, icon: '🎯' },
            { name: 'Бандит', hp: 40, damage: 8, level: 1, range: 'melee', exp: 45, icon: '🔫' },
            { name: 'Гигантский скорпион', hp: 60, damage: 11, level: 2, range: 'melee', exp: 70, icon: '🦂' }
        ]
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
    }
};