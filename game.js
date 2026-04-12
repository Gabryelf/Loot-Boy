// ============ ОСНОВНОЙ КЛАСС ИГРЫ ============

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Загрузка сохранения
        this.loadGame();
        
        // Состояние игрока
        this.player = {
            hp: CONFIG.PLAYER.START_HP,
            maxHp: CONFIG.PLAYER.START_HP,
            baseMaxHp: CONFIG.PLAYER.START_HP,
            food: CONFIG.PLAYER.START_FOOD,
            water: CONFIG.PLAYER.START_WATER,
            level: CONFIG.PLAYER.START_LEVEL,
            exp: CONFIG.PLAYER.START_EXP,
            distance: CONFIG.PLAYER.START_DISTANCE,
            inventory: [],
            currentWeapon: CONFIG.PLAYER.START_WEAPON,
            weapons: JSON.parse(JSON.stringify(CONFIG.PLAYER.WEAPONS)),
            armor: CONFIG.PLAYER.START_ARMOR,
            perkPoints: 0,
            
            meleeDamageBonus: 1,
            rangedDamageBonus: 1,
            lootChanceBonus: 1,
            resourceDrainBonus: 1,
            lowHpBonus: 1,
            ammoDropBonus: 1,
            healBonus: 1,
            attackSpeedBonus: 1
        };
        
        // Время игры
        this.gameTime = 0;
        this.lastDistanceReport = 0;
        
        // Боевые переменные
        this.inCombat = false;
        this.currentEnemy = null;
        this.attackCooldown = 0;
        this.enemyAttackCooldown = 0;
        this.enemyX = CONFIG.BACKGROUND_POSITIONS.ENEMY_X;
        this.enemyIsMoving = false;
        this.showDamageNumbers = [];
        
        // Игровые переменные
        this.backgroundX = 0;
        this.walkingCycle = 0;
        this.gameLoop = null;
        this.eventTimer = null;
        this.distanceReportTimer = null;
        this.isChatCollapsed = false;
        this.shootAnimation = false;
        this.meleeAnimation = false;
        this.lastSecond = 0;
        
        // Спрайты
        this.sprites = {};
        
        this.init();
    }
    
    async init() {
        await this.loadAllSprites();
        this.updateUI();
        this.startGameLoop();
        this.startEventTimer();
        this.startDistanceReporter();
        this.addEventListeners();
        this.setupIcons();
        this.addLog(TEXTS.CHAT.WELCOME, 'system');
        this.addLog(TEXTS.CHAT.WELCOME_DESC, 'system');
    }
    
    async loadAllSprites() {
        const spritePaths = {
            ...CONFIG.SPRITES.CHARACTERS,
            ...CONFIG.SPRITES.WEAPONS,
            ...CONFIG.SPRITES.BACKGROUND,
            ...CONFIG.SPRITES.ICONS
        };
        
        const loadPromises = Object.entries(spritePaths).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.sprites[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    this.sprites[key] = this.createPlaceholderSprite();
                    resolve();
                };
                img.src = path;
            });
        });
        
        await Promise.all(loadPromises);
    }
    
    createPlaceholderSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(16, 16, 32, 32);
        return canvas;
    }
    
    setupIcons() {
        const icons = document.querySelectorAll('.icon-canvas, .status-icon');
        icons.forEach(iconCanvas => {
            const iconName = iconCanvas.dataset.icon;
            if (iconName) {
                const spriteKey = iconName.toUpperCase();
                if (this.sprites[spriteKey]) {
                    const ctx = iconCanvas.getContext('2d');
                    ctx.drawImage(this.sprites[spriteKey], 0, 0, iconCanvas.width, iconCanvas.height);
                }
            }
        });
    }
    
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, CONFIG.GAME.TICK_INTERVAL);
    }
    
    startEventTimer() {
        this.eventTimer = setInterval(() => {
            if (!this.inCombat) {
                this.triggerRandomEvent();
            }
        }, CONFIG.GAME.EVENT_INTERVAL);
    }
    
    startDistanceReporter() {
        this.distanceReportTimer = setInterval(() => {
            if (!this.inCombat) {
                this.reportDistance();
            }
        }, CONFIG.GAME.DISTANCE_REPORT_INTERVAL);
    }
    
    reportDistance() {
        const distanceMeters = Math.floor(this.player.distance);
        this.addLog(`${TEXTS.CHAT.TIME_PREFIX} ${distanceMeters} ${TEXTS.CHAT.DISTANCE_REPORT}`, 'time');
    }
    
    update() {
        // Время игры
        this.gameTime += CONFIG.GAME.TICK_INTERVAL;
        
        // Движение фона
        this.backgroundX = (this.backgroundX - CONFIG.GAME.BACKGROUND_SPEED) % 600;
        
        // Анимации
        this.walkingCycle = (this.walkingCycle + CONFIG.GAME.WALK_ANIMATION_SPEED) % (Math.PI * 2);
        
        // Расход ресурсов
        const drainMultiplier = this.player.resourceDrainBonus;
        this.player.food = Math.max(0, this.player.food - CONFIG.RESOURCE_DRAIN.FOOD_PER_TICK * drainMultiplier);
        this.player.water = Math.max(0, this.player.water - CONFIG.RESOURCE_DRAIN.WATER_PER_TICK * drainMultiplier);
        
        // Дистанция в метрах
        this.player.distance += CONFIG.GAME.DISTANCE_SPEED;
        
        // Голод и жажда
        if (this.player.food <= 0) {
            this.player.hp = Math.max(0, this.player.hp - CONFIG.RESOURCE_DRAIN.STARVE_DAMAGE);
        }
        if (this.player.water <= 0) {
            this.player.hp = Math.max(0, this.player.hp - CONFIG.RESOURCE_DRAIN.THIRST_DAMAGE);
        }
        
        // Боевая логика
        if (this.inCombat && this.currentEnemy) {
            this.updateCombat();
        }
        
        // Обновление анимаций урона
        this.updateDamageNumbers();
        
        this.updateUI();
        
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }
    
    updateCombat() {
        // Движение врага
        if (this.currentEnemy.range === 'melee' && this.enemyX > CONFIG.BACKGROUND_POSITIONS.HERO_X + 70) {
            this.enemyIsMoving = true;
            this.enemyX -= 1.8;
        } else if (this.currentEnemy.range === 'ranged' && this.enemyX < CONFIG.BACKGROUND_POSITIONS.ENEMY_X) {
            this.enemyIsMoving = true;
            this.enemyX += 0.5;
        } else {
            this.enemyIsMoving = false;
        }
        
        // Атака врага
        if (this.enemyAttackCooldown <= 0 && this.currentEnemy.hp > 0) {
            const isInMeleeRange = this.enemyX <= CONFIG.BACKGROUND_POSITIONS.HERO_X + 80;
            if (this.currentEnemy.range === 'melee' && isInMeleeRange || this.currentEnemy.range === 'ranged') {
                this.enemyAttack();
                const attackSpeed = this.currentEnemy.attackSpeed || 1;
                this.enemyAttackCooldown = CONFIG.COMBAT.ENEMY_ATTACK_COOLDOWN / attackSpeed;
            }
        } else {
            this.enemyAttackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
        
        // Кулдаун атаки игрока
        if (this.attackCooldown > 0) {
            this.attackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
    }
    
    enemyAttack() {
        let damage = this.currentEnemy.damage;
        const isCritical = Math.random() < 0.1;
        
        if (isCritical) {
            damage *= 1.5;
            this.addCombatLog(`${this.currentEnemy.name} наносит КРИТИЧЕСКИЙ урон!`, 'combat');
        }
        
        const finalDamage = Math.max(1, damage - this.player.armor);
        this.player.hp = Math.max(0, this.player.hp - finalDamage);
        
        this.addDamageNumber(finalDamage, CONFIG.BACKGROUND_POSITIONS.HERO_X + 40, CONFIG.BACKGROUND_POSITIONS.HERO_Y);
        this.addCombatLog(`${this.currentEnemy.name} наносит ${finalDamage} урона!`, 'combat');
        
        this.canvas.style.animation = 'hitFlash 0.2s';
        setTimeout(() => {
            this.canvas.style.animation = '';
        }, 200);
        
        this.updateUI();
        
        if (this.player.hp <= 0) {
            this.endBattle(false);
        }
    }
    
    playerAttack() {
        if (this.attackCooldown > 0) return;
        
        const weapon = this.player.weapons[this.player.currentWeapon];
        
        if (weapon.range === 'ranged') {
            if (weapon.ammo <= 0) {
                this.addCombatLog('Нет патронов!', 'combat');
                return;
            }
            weapon.ammo--;
        }
        
        let damage = weapon.damage;
        
        if (weapon.range === 'melee') {
            damage *= this.player.meleeDamageBonus;
        } else {
            damage *= this.player.rangedDamageBonus;
        }
        
        if (this.player.hp < this.player.maxHp * 0.3) {
            damage *= this.player.lowHpBonus;
        }
        
        const isCritical = Math.random() < 0.15;
        if (isCritical) {
            damage *= 2;
            this.addCombatLog('КРИТИЧЕСКИЙ УРОН!', 'combat');
        }
        
        this.currentEnemy.hp -= damage;
        this.addDamageNumber(Math.floor(damage), this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y);
        this.addCombatLog(`${weapon.name} наносит ${Math.floor(damage)} урона!`, 'combat');
        
        if (weapon.range === 'ranged') {
            this.shootAnimation = true;
            setTimeout(() => { this.shootAnimation = false; }, 150);
        } else {
            this.meleeAnimation = true;
            setTimeout(() => { this.meleeAnimation = false; }, 150);
        }
        
        const cooldown = CONFIG.COMBAT.ATTACK_COOLDOWN / this.player.attackSpeedBonus;
        this.attackCooldown = cooldown;
        
        this.updateWeaponButtons();
        
        if (this.currentEnemy.hp <= 0) {
            this.endBattle(true);
        }
    }
    
    switchWeapon(weaponId) {
        if (this.player.weapons[weaponId]) {
            this.player.currentWeapon = weaponId;
            this.addCombatLog(`Снаряжено: ${this.player.weapons[weaponId].name} ${this.player.weapons[weaponId].icon || ''}`, 'combat');
            this.updateWeaponButtons();
        }
    }
    
    startBattle(enemy) {
        this.inCombat = true;
        this.currentEnemy = {
            ...enemy,
            hp: enemy.hp,
            maxHp: enemy.hp
        };
        this.enemyX = CONFIG.BACKGROUND_POSITIONS.ENEMY_X;
        this.attackCooldown = 0;
        
        this.showCombatPanel();
        this.canvas.classList.add('combat-overlay');
        
        this.addLog(`⚔️ Начало боя с ${enemy.icon || '👾'} ${enemy.name}!`, 'combat');
    }
    
    showCombatPanel() {
        document.getElementById('chatPanel').style.display = 'none';
        
        const existingPanel = document.querySelector('.combat-panel');
        if (existingPanel) existingPanel.remove();
        
        const combatPanel = document.createElement('div');
        combatPanel.className = 'combat-panel';
        combatPanel.innerHTML = `
            <div class="combat-stats">
                <div class="combat-player-stats">
                    ❤️ ${Math.floor(this.player.hp)}/${this.player.maxHp}
                </div>
                <div class="combat-enemy-stats">
                    ${this.currentEnemy.icon || '👾'} ${this.currentEnemy.name}: ${Math.floor(this.currentEnemy.hp)}/${this.currentEnemy.maxHp}
                </div>
            </div>
            <div class="combat-actions">
                <button id="combatAttackBtn">⚔️ АТАКОВАТЬ</button>
            </div>
            <div class="weapon-select" id="weaponSelect"></div>
            <div class="combat-log" id="combatLog"></div>
        `;
        
        document.querySelector('.game-container').appendChild(combatPanel);
        
        document.getElementById('combatAttackBtn').onclick = () => this.playerAttack();
        this.updateWeaponButtons();
        document.getElementById('combatLog').innerHTML = '';
    }
    
    updateWeaponButtons() {
        const weaponSelect = document.getElementById('weaponSelect');
        if (!weaponSelect) return;
        
        weaponSelect.innerHTML = '';
        for (const [id, weapon] of Object.entries(this.player.weapons)) {
            const ammoText = weapon.ammo !== null ? `[${weapon.ammo}/${weapon.maxAmmo}]` : '';
            const btn = document.createElement('button');
            btn.className = `weapon-btn ${this.player.currentWeapon === id ? 'active' : ''}`;
            btn.innerHTML = `${weapon.icon || '🔫'} ${weapon.name} ${ammoText}`;
            btn.onclick = () => this.switchWeapon(id);
            weaponSelect.appendChild(btn);
        }
    }
    
    addCombatLog(message, type = 'combat') {
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            combatLog.appendChild(logEntry);
            combatLog.scrollTop = combatLog.scrollHeight;
        }
        this.addLog(message, type);
    }
    
    endBattle(won) {
        this.inCombat = false;
        
        const combatPanel = document.querySelector('.combat-panel');
        if (combatPanel) combatPanel.remove();
        
        document.getElementById('chatPanel').style.display = 'block';
        this.canvas.classList.remove('combat-overlay');
        
        if (won) {
            const expGain = this.currentEnemy.exp || CONFIG.GAME.BASE_EXP_PER_KILL;
            this.addExp(expGain);
            
            const loot = this.generateLoot();
            if (loot) {
                this.player.inventory.push(loot);
                this.addLog(`📦 ${TEXTS.CHAT.FOUND} ${loot.name}!`, 'event');
            }
            
            const healAmount = Math.floor(this.player.maxHp * 0.1);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            this.addLog(`После боя восстановлено ${healAmount} HP`, 'system');
            this.addLog(`✨ Победа! +${expGain} опыта`, 'system');
        } else {
            this.gameOver();
            return;
        }
        
        this.currentEnemy = null;
        this.updateUI();
        this.saveGame();
    }
    
    generateLoot() {
        const rand = Math.random() * this.player.lootChanceBonus;
        
        if (rand < 0.25) {
            return { name: 'Аптечка', type: 'consumable' };
        } else if (rand < 0.45) {
            return { name: 'Металлолом', type: 'craft' };
        } else if (rand < 0.55 && this.player.currentWeapon !== 'knife') {
            const weapon = this.player.weapons[this.player.currentWeapon];
            if (weapon && weapon.ammo !== null) {
                const amount = Math.floor(Math.random() * 
                    (CONFIG.COMBAT.AMMO_DROP_AMOUNT.max - CONFIG.COMBAT.AMMO_DROP_AMOUNT.min + 1) + 
                    CONFIG.COMBAT.AMMO_DROP_AMOUNT.min) * this.player.ammoDropBonus;
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
                return { name: `Патроны x${amount}`, type: 'ammo' };
            }
        }
        
        return null;
    }
    
    addExp(amount) {
        this.player.exp += amount;
        this.updateUI();
        
        const nextLevel = this.player.level + 1;
        const requiredExp = CONFIG.LEVELS[nextLevel]?.expRequired || Infinity;
        
        if (this.player.exp >= requiredExp) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.player.level++;
        const levelInfo = CONFIG.LEVELS[this.player.level];
        
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.player.baseMaxHp = this.player.maxHp;
        this.player.perkPoints += levelInfo.perkPoints;
        
        this.addLog(TEXTS.CHAT.LEVEL_UP, 'level');
        this.addLog(`Достигнут ${this.player.level} уровень! +20 HP`, 'level');
        
        if (this.player.perkPoints > 0) {
            this.addLog(`🎯 Доступно ${this.player.perkPoints} очков перков!`, 'system');
        }
        
        this.updateUI();
        this.saveGame();
    }
    
    triggerRandomEvent() {
        const rand = Math.random();
        
        if (rand < 0.3) {
            const text = TEXTS.EVENTS.FLAVOR[Math.floor(Math.random() * TEXTS.EVENTS.FLAVOR.length)];
            this.addLog(text, 'event');
        } else if (rand < 0.6) {
            const lootTypes = ['food', 'water', 'medkit', 'scrap'];
            const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];
            
            if (type === 'food') {
                this.player.food = Math.min(100, this.player.food + 15);
                this.addLog(`📦 Нашли консервы! +15 еды`, 'event');
            } else if (type === 'water') {
                this.player.water = Math.min(100, this.player.water + 15);
                this.addLog(`💧 Нашли бутылку воды! +15 воды`, 'event');
            } else if (type === 'medkit') {
                this.player.inventory.push({ name: 'Аптечка', type: 'consumable' });
                this.addLog(`📦 Нашли аптечку!`, 'event');
            } else if (type === 'scrap') {
                this.player.inventory.push({ name: 'Металлолом', type: 'craft' });
                this.addLog(`📦 Нашли металлолом!`, 'event');
            }
            this.addExp(CONFIG.GAME.BASE_EXP_PER_EVENT);
        } else if (rand < 0.85) {
            this.showRandomChoiceEvent();
        } else {
            const enemies = TEXTS.EVENTS.ENEMIES;
            const enemy = enemies[Math.floor(Math.random() * enemies.length)];
            this.startBattle(enemy);
        }
        
        this.updateUI();
        this.saveGame();
    }
    
    showRandomChoiceEvent() {
        const events = [
            {
                text: '👴 Раненый сталкер просит помощи',
                options: ['Помочь (+20 HP, +20 exp)', 'Пройти мимо'],
                effects: [() => {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
                    this.addExp(20);
                    this.addLog('Вы помогли сталкеру и получили опыт!', 'system');
                }, () => {
                    this.addLog('Вы прошли мимо...', 'system');
                }]
            },
            {
                text: '🏚️ Заброшенный бункер',
                options: ['Обыскать', 'Уйти'],
                effects: [() => {
                    const rand = Math.random();
                    if (rand < 0.5) {
                        this.player.food = Math.min(100, this.player.food + 30);
                        this.player.water = Math.min(100, this.player.water + 30);
                        this.addLog('Нашли припасы! +30 еды и воды', 'event');
                    } else {
                        this.player.inventory.push({ name: 'Аптечка', type: 'consumable' });
                        this.addLog('Нашли аптечку!', 'event');
                    }
                    this.addExp(15);
                }, () => {
                    this.addLog('Решили не рисковать', 'system');
                }]
            },
            {
                text: '📻 Радиосигнал о помощи',
                options: ['Ответить', 'Игнорировать'],
                effects: [() => {
                    this.addExp(30);
                    this.addLog('Вы помогли выжившим! +30 опыта', 'system');
                }, () => {
                    this.addLog('Вы проигнорировали сигнал', 'system');
                }]
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.showChoiceModal(event.text, event.options, event.effects);
    }
    
    showChoiceModal(text, options, effects) {
        clearInterval(this.gameLoop);
        clearInterval(this.eventTimer);
        
        const modal = document.getElementById('choiceModal');
        document.getElementById('modalText').textContent = text;
        const optionsDiv = document.getElementById('modalOptions');
        optionsDiv.innerHTML = '';
        
        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.textContent = option;
            btn.className = 'option-button';
            btn.onclick = () => {
                if (effects[index]) effects[index]();
                modal.style.display = 'none';
                this.startGameLoop();
                this.startEventTimer();
                this.updateUI();
                this.saveGame();
            };
            optionsDiv.appendChild(btn);
        });
        
        modal.style.display = 'flex';
    }
    
    addDamageNumber(damage, x, y) {
        this.showDamageNumbers.push({
            x: x,
            y: y,
            value: Math.floor(damage),
            life: 1
        });
    }
    
    updateDamageNumbers() {
        for (let i = 0; i < this.showDamageNumbers.length; i++) {
            this.showDamageNumbers[i].life -= 0.02;
            this.showDamageNumbers[i].y -= 1.5;
            
            if (this.showDamageNumbers[i].life <= 0) {
                this.showDamageNumbers.splice(i, 1);
                i--;
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, 600, 400);
        
        // Небо
        if (this.sprites.SKY) {
            this.ctx.drawImage(this.sprites.SKY, 0, CONFIG.BACKGROUND_POSITIONS.SKY_Y, 600, 200);
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#2a2a3e');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, 600, 200);
        }
        
        // Руины
        if (this.sprites.RUINS) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(this.sprites.RUINS, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.RUINS_Y, 600, 120);
            }
        } else {
            this.ctx.fillStyle = '#3a3a2a';
            for (let i = 0; i < 3; i++) {
                this.ctx.fillRect(this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.RUINS_Y, 600, 120);
            }
        }
        
        // Земля
        if (this.sprites.GROUND) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(this.sprites.GROUND, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.GROUND_Y, 600, 120);
            }
        } else {
            this.ctx.fillStyle = '#5a4a3a';
            for (let i = 0; i < 3; i++) {
                this.ctx.fillRect(this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.GROUND_Y, 600, 120);
            }
        }
        
        // Враг
        if (this.inCombat && this.currentEnemy) {
            const enemySpriteKey = `ENEMY_${this.currentEnemy.name.toUpperCase().replace(' ', '_')}`;
            const enemySprite = this.sprites[enemySpriteKey] || this.sprites.ENEMY_RAIDER;
            
            if (enemySprite) {
                this.ctx.drawImage(enemySprite, this.enemyX, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y, 80, 80);
            } else {
                this.ctx.fillStyle = '#8b0000';
                this.ctx.fillRect(this.enemyX, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y, 60, 70);
            }
            
            const hpPercent = this.currentEnemy.hp / this.currentEnemy.maxHp;
            this.ctx.fillStyle = '#8b0000';
            this.ctx.fillRect(this.enemyX, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 15, 80, 8);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(this.enemyX, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 15, 80 * hpPercent, 8);
        }
        
        // Герой
        let heroSprite = this.sprites.HERO_IDLE;
        if (this.shootAnimation && this.sprites.HERO_SHOOT) {
            heroSprite = this.sprites.HERO_SHOOT;
        } else if (this.meleeAnimation && this.sprites.HERO_MELEE) {
            heroSprite = this.sprites.HERO_MELEE;
        } else if (!this.inCombat) {
            const isWalking = this.walkingCycle % (Math.PI * 2) < Math.PI;
            heroSprite = this.sprites[isWalking ? 'HERO_WALK1' : 'HERO_WALK2'] || this.sprites.HERO_IDLE;
        }
        
        const walkOffset = !this.inCombat ? Math.sin(this.walkingCycle) * 2 : 0;
        if (heroSprite) {
            this.ctx.drawImage(heroSprite, CONFIG.BACKGROUND_POSITIONS.HERO_X, CONFIG.BACKGROUND_POSITIONS.HERO_Y + walkOffset, 80, 80);
        } else {
            this.ctx.fillStyle = '#8B5A2B';
            this.ctx.fillRect(CONFIG.BACKGROUND_POSITIONS.HERO_X, CONFIG.BACKGROUND_POSITIONS.HERO_Y + walkOffset, 40, 60);
            this.ctx.fillStyle = '#DEB887';
            this.ctx.fillRect(CONFIG.BACKGROUND_POSITIONS.HERO_X + 10, CONFIG.BACKGROUND_POSITIONS.HERO_Y + walkOffset - 10, 20, 20);
        }
        
        // Оружие
        const weapon = this.player.weapons[this.player.currentWeapon];
        const weaponSpriteKey = weapon.name.toUpperCase().replace(' ', '_');
        if (this.sprites[weaponSpriteKey]) {
            this.ctx.drawImage(this.sprites[weaponSpriteKey], 
                CONFIG.BACKGROUND_POSITIONS.WEAPON_X, 
                CONFIG.BACKGROUND_POSITIONS.WEAPON_Y, 32, 32);
        }
        
        // Анимация выстрела
        if (this.shootAnimation && weapon.range === 'ranged' && this.inCombat) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.moveTo(CONFIG.BACKGROUND_POSITIONS.WEAPON_X + 32, CONFIG.BACKGROUND_POSITIONS.WEAPON_Y + 16);
            this.ctx.lineTo(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
            this.ctx.lineTo(this.enemyX + 35, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 45);
            this.ctx.fill();
        }
        
        // Цифры урона
        for (const damage of this.showDamageNumbers) {
            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = `rgba(255, 50, 50, ${damage.life})`;
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = 'black';
            this.ctx.fillText(Math.floor(damage.value), damage.x, damage.y);
            this.ctx.shadowBlur = 0;
        }
    }
    
    showInventory() {
        const modal = document.getElementById('inventoryModal');
        const inventoryDiv = document.getElementById('inventoryList');
        inventoryDiv.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            inventoryDiv.innerHTML = `<div style="text-align:center;grid-column:1/-1;">${TEXTS.MODAL.EMPTY_INVENTORY}</div>`;
        } else {
            this.player.inventory.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                itemDiv.innerHTML = `<div>${item.name}</div>`;
                itemDiv.onclick = () => this.useItem(index);
                inventoryDiv.appendChild(itemDiv);
            });
        }
        
        modal.style.display = 'flex';
    }
    
    closeInventory() {
        const modal = document.getElementById('inventoryModal');
        if (modal) modal.style.display = 'none';
    }
    
    useItem(index) {
        const item = this.player.inventory[index];
        
        if (item.name === 'Аптечка') {
            const healAmount = Math.floor(25 * this.player.healBonus);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            this.addLog(`💊 Использовали аптечку +${healAmount} HP`, 'system');
            this.player.inventory.splice(index, 1);
        } else if (item.name.includes('Патроны')) {
            const weapon = this.player.weapons[this.player.currentWeapon];
            if (weapon && weapon.ammo !== null) {
                const amount = parseInt(item.name.match(/\d+/)[0]);
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
                this.addLog(`🔫 Добавлено ${amount} патронов`, 'system');
                this.player.inventory.splice(index, 1);
            }
        } else if (item.name === 'Металлолом') {
            this.craftFromInventory();
            return;
        }
        
        this.updateUI();
        this.showInventory();
        this.saveGame();
    }
    
    craftFromInventory() {
        const metalCount = this.player.inventory.filter(i => i.name === 'Металлолом').length;
        
        if (metalCount >= 2) {
            let removed = 0;
            for (let i = 0; i < this.player.inventory.length && removed < 2; i++) {
                if (this.player.inventory[i].name === 'Металлолом') {
                    this.player.inventory.splice(i, 1);
                    removed++;
                    i--;
                }
            }
            this.player.weapons.knife.damage += 5;
            this.addLog(`🔧 Улучшили нож! Урон +5`, 'system');
            this.updateUI();
            this.saveGame();
        } else {
            this.addLog('❌ Нужно 2 металлолома для улучшения ножа!', 'system');
        }
    }
    
    craft() {
        this.craftFromInventory();
    }
    
    showPerks() {
        const modal = document.getElementById('perksModal');
        if (!modal) {
            this.createPerksModal();
            return;
        }
        
        const perksDiv = document.getElementById('perksList');
        perksDiv.innerHTML = '';
        
        for (const [id, perk] of Object.entries(PERKS.available)) {
            const isUnlocked = this.player.level >= perk.requiredLevel;
            const isOwned = PERKS.active.includes(id);
            
            const perkDiv = document.createElement('div');
            perkDiv.className = `perk-item ${!isUnlocked || isOwned ? 'perk-locked' : ''}`;
            perkDiv.innerHTML = `
                <div class="perk-name" style="color: ${perk.color}">${perk.icon} ${perk.name}</div>
                <div class="perk-desc">${perk.description}</div>
                <div class="perk-desc">⭐ Требуется уровень ${perk.requiredLevel}</div>
            `;
            
            if (isUnlocked && !isOwned && this.player.perkPoints > 0) {
                perkDiv.style.cursor = 'pointer';
                perkDiv.onclick = () => this.unlockPerk(id);
            }
            
            perksDiv.appendChild(perkDiv);
        }
        
        modal.style.display = 'flex';
    }
    
    createPerksModal() {
        const modal = document.createElement('div');
        modal.id = 'perksModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>⭐ ПЕРКИ</h3>
                <div id="perksList" class="perks-grid"></div>
                <div style="margin-top: 10px; font-size: 11px; text-align: center; color: #d4a043;">
                    ${TEXTS.MODAL.PERK_POINTS}: ${this.player.perkPoints}
                </div>
                <button class="modal-close" onclick="document.getElementById('perksModal').style.display='none'">Закрыть</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.showPerks();
    }
    
    unlockPerk(perkId) {
        if (this.player.perkPoints <= 0) {
            this.addLog('Нет очков перков!', 'system');
            return;
        }
        
        const perk = PERKS.available[perkId];
        if (!perk || this.player.level < perk.requiredLevel) {
            this.addLog('Недостаточный уровень!', 'system');
            return;
        }
        
        if (PERKS.active.includes(perkId)) {
            this.addLog('Перк уже изучен!', 'system');
            return;
        }
        
        PERKS.active.push(perkId);
        this.player.perkPoints--;
        PERKS.applyPerkEffects(this.player, perkId);
        
        this.addLog(`✨ Изучен перк: ${perk.name}!`, 'level');
        this.updateUI();
        
        const modal = document.getElementById('perksModal');
        if (modal) modal.style.display = 'none';
        setTimeout(() => this.showPerks(), 100);
        this.saveGame();
    }
    
    rest() {
        if (this.player.food > 8 && this.player.water > 8) {
            const heal = Math.floor(Math.random() * 20) + 15;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            this.player.food -= 8;
            this.player.water -= 8;
            this.addLog(`🔥 ${TEXTS.CHAT.RESTED} ${heal} HP`, 'system');
            this.updateUI();
            this.saveGame();
        } else {
            this.addLog('❌ Недостаточно еды или воды для отдыха!', 'system');
        }
    }
    
    toggleChat() {
        const chatPanel = document.getElementById('chatPanel');
        this.isChatCollapsed = !this.isChatCollapsed;
        
        if (this.isChatCollapsed) {
            chatPanel.classList.add('collapsed');
        } else {
            chatPanel.classList.remove('collapsed');
        }
    }
    
    updateUI() {
        document.getElementById('hpValue').textContent = Math.floor(this.player.hp);
        document.getElementById('foodValue').textContent = Math.floor(this.player.food);
        document.getElementById('waterValue').textContent = Math.floor(this.player.water);
        document.getElementById('expValue').textContent = Math.floor(this.player.exp);
        document.getElementById('levelValue').textContent = this.player.level;
    }
    
    addLog(message, type = 'event') {
        const chatMessages = document.getElementById('chatMessages');
        const logEntry = document.createElement('div');
        logEntry.className = `chat-message ${type}`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        logEntry.textContent = `[${time}] ${message}`;
        
        chatMessages.appendChild(logEntry);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
    
    saveGame() {
        const saveData = {
            player: {
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                baseMaxHp: this.player.baseMaxHp,
                food: this.player.food,
                water: this.player.water,
                level: this.player.level,
                exp: this.player.exp,
                distance: this.player.distance,
                inventory: this.player.inventory,
                currentWeapon: this.player.currentWeapon,
                weapons: this.player.weapons,
                armor: this.player.armor,
                perkPoints: this.player.perkPoints,
                meleeDamageBonus: this.player.meleeDamageBonus,
                rangedDamageBonus: this.player.rangedDamageBonus,
                lootChanceBonus: this.player.lootChanceBonus,
                resourceDrainBonus: this.player.resourceDrainBonus,
                lowHpBonus: this.player.lowHpBonus,
                ammoDropBonus: this.player.ammoDropBonus,
                healBonus: this.player.healBonus,
                attackSpeedBonus: this.player.attackSpeedBonus
            },
            activePerks: PERKS.active,
            gameTime: this.gameTime,
            timestamp: Date.now()
        };
        chrome.storage.local.set({ gameSave: saveData });
    }
    
    loadGame() {
        chrome.storage.local.get(['gameSave'], (result) => {
            if (result.gameSave && result.gameSave.player) {
                this.player = result.gameSave.player;
                PERKS.active = result.gameSave.activePerks || [];
                this.gameTime = result.gameSave.gameTime || 0;
                
                PERKS.clearPerkEffects(this.player);
                for (const perkId of PERKS.active) {
                    PERKS.applyPerkEffects(this.player, perkId);
                }
                
                this.updateUI();
                this.addLog('Игра загружена!', 'system');
            }
        });
    }
    
    gameOver() {
        clearInterval(this.gameLoop);
        clearInterval(this.eventTimer);
        clearInterval(this.distanceReportTimer);
        
        if (this.inCombat) {
            const combatPanel = document.querySelector('.combat-panel');
            if (combatPanel) combatPanel.remove();
        }
        
        this.addLog(TEXTS.CHAT.GAME_OVER, 'system');
        this.addLog(`🏆 Пройдено: ${Math.floor(this.player.distance)} метров, Уровень: ${this.player.level}`, 'system');
        
        setTimeout(() => {
            if (confirm('Игра окончена! Начать заново?')) {
                chrome.storage.local.remove('gameSave');
                location.reload();
            }
        }, 100);
    }
    
    addEventListeners() {
        document.getElementById('inventoryBtn').onclick = () => this.showInventory();
        document.getElementById('craftBtn').onclick = () => this.craft();
        document.getElementById('restBtn').onclick = () => this.rest();
        document.getElementById('perksBtn').onclick = () => this.showPerks();
        document.getElementById('chatToggleBtn').onclick = () => this.toggleChat();
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

window.closeInventory = () => {
    if (window.game) window.game.closeInventory();
};