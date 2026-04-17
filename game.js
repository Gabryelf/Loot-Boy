// ============ ОСНОВНОЙ КЛАСС ИГРЫ ============

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.loadGame();
        
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
            currentArmor: CONFIG.PLAYER.START_ARMOR_ITEM,
            weapons: JSON.parse(JSON.stringify(CONFIG.PLAYER.WEAPONS)),
            armorItems: JSON.parse(JSON.stringify(CONFIG.PLAYER.ARMOR)),
            armor: CONFIG.PLAYER.START_ARMOR,
            perkPoints: 0,
            weaponIndex: 0,
            armorIndex: 0,
            isMovingToEnemy: false,
            originalHeroX: CONFIG.BACKGROUND_POSITIONS.HERO_X,
            
            meleeDamageBonus: 1,
            rangedDamageBonus: 1,
            lootChanceBonus: 1,
            resourceDrainBonus: 1,
            lowHpBonus: 1,
            ammoDropBonus: 1,
            healBonus: 1,
            attackSpeedBonus: 1
        };
        
        this.weaponList = Object.keys(this.player.weapons);
        this.armorList = Object.keys(this.player.armorItems);
        this.player.weaponIndex = this.weaponList.indexOf(this.player.currentWeapon);
        this.player.armorIndex = this.armorList.indexOf(this.player.currentArmor);
        
        this.gameTime = 0;
        this.inCombat = false;
        this.currentEnemy = null;
        this.attackCooldown = 0;
        this.enemyAttackCooldown = 0;
        this.showDamageNumbers = [];
        this.projectiles = [];
        this.meleeAttacks = [];
        
        this.backgroundX = 0;
        this.walkingCycle = 0;
        this.gameLoop = null;
        this.eventTimer = null;
        this.distanceReportTimer = null;
        this.isChatCollapsed = false;
        this.shootAnimation = false;
        this.meleeAnimation = false;
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.enemyX = CONFIG.BACKGROUND_POSITIONS.ENEMY_X;
        
        this.sprites = {};
        this.crosshair = null;
        
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
        this.setupCrosshair();
        this.addLog(TEXTS.CHAT.WELCOME, 'system');
        this.addLog(TEXTS.CHAT.WELCOME_DESC, 'system');
    }
    
    setupCrosshair() {
        this.crosshair = document.createElement('div');
        this.crosshair.className = 'custom-crosshair';
        this.crosshair.innerHTML = `
            <div class="crosshair-dot"></div>
            <div class="crosshair-line top"></div>
            <div class="crosshair-line bottom"></div>
            <div class="crosshair-line left"></div>
            <div class="crosshair-line right"></div>
        `;
        document.body.appendChild(this.crosshair);
        
        // Сохраняем координаты мыши
        this.mouseX = 0;
        this.mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            if (this.crosshair) {
                this.crosshair.style.left = e.clientX + 'px';
                this.crosshair.style.top = e.clientY + 'px';
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.inCombat && this.currentEnemy && this.attackCooldown <= 0) {
                const rect = this.canvas.getBoundingClientRect();
                const canvasMouseX = e.clientX - rect.left;
                const canvasMouseY = e.clientY - rect.top;
                
                // Получаем реальные координаты врага на канвасе
                const enemyCanvasX = this.enemyX;
                const enemyCanvasY = CONFIG.BACKGROUND_POSITIONS.ENEMY_Y;
                const enemyCenterX = enemyCanvasX + CONFIG.SPRITE_SIZES.ENEMY_WIDTH / 2;
                const enemyCenterY = enemyCanvasY + CONFIG.SPRITE_SIZES.ENEMY_HEIGHT / 2;
                
                // Рассчитываем дистанцию до врага
                const distance = Math.hypot(canvasMouseX - enemyCenterX, canvasMouseY - enemyCenterY);
                const maxDistance = 60;
                
                let hitChance = 1 - Math.min(0.8, (distance / maxDistance));
                hitChance = Math.max(0.2, Math.min(0.95, hitChance));
                hitChance *= this.player.weapons[this.player.currentWeapon].accuracy || 1;
                hitChance -= this.currentEnemy.dodge || 0;
                
                // Добавляем визуальную обратную связь
                if (distance > maxDistance) {
                    this.addLog('❌ Слишком далеко! Приблизьтесь к врагу', 'combat');
                    return;
                }
                
                const isHit = Math.random() < hitChance;
                this.playerAttack(isHit);
            }
        });
    }
    
    async loadAllSprites() {
        const spritePaths = {
            ...CONFIG.SPRITES.CHARACTERS,
            ...CONFIG.SPRITES.WEAPONS,
            ...CONFIG.SPRITES.ARMOR,
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
                let spriteKey = iconName.toUpperCase();
                // Специальная обработка для чата
                if (iconName === 'chat-open') spriteKey = 'CHAT_OPEN';
                if (iconName === 'chat-close') spriteKey = 'CHAT_CLOSE';
                if (iconName === 'inventory') spriteKey = 'INVENTORY';
                if (iconName === 'craft') spriteKey = 'CRAFT';
                if (iconName === 'rest') spriteKey = 'REST';
                if (iconName === 'perks') spriteKey = 'PERKS';
                if (iconName === 'health') spriteKey = 'HEALTH';
                if (iconName === 'food') spriteKey = 'FOOD';
                if (iconName === 'water') spriteKey = 'WATER';
                if (iconName === 'exp') spriteKey = 'EXP';
                
                if (this.sprites[spriteKey]) {
                    const ctx = iconCanvas.getContext('2d');
                    ctx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
                    ctx.drawImage(this.sprites[spriteKey], 0, 0, iconCanvas.width, iconCanvas.height);
                } else {
                    // Если спрайт не загрузился, рисуем заглушку
                    const ctx = iconCanvas.getContext('2d');
                    ctx.fillStyle = '#d4a043';
                    ctx.font = '20px monospace';
                    ctx.fillText('📦', 5, 25);
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
        this.gameTime += CONFIG.GAME.TICK_INTERVAL;
        this.backgroundX = (this.backgroundX - CONFIG.GAME.BACKGROUND_SPEED) % 600;
        this.walkingCycle = (this.walkingCycle + CONFIG.GAME.WALK_ANIMATION_SPEED) % (Math.PI * 2);
        
        const drainMultiplier = this.player.resourceDrainBonus;
        this.player.food = Math.max(0, this.player.food - CONFIG.RESOURCE_DRAIN.FOOD_PER_TICK * drainMultiplier);
        this.player.water = Math.max(0, this.player.water - CONFIG.RESOURCE_DRAIN.WATER_PER_TICK * drainMultiplier);
        this.player.distance += CONFIG.GAME.DISTANCE_SPEED;
        
        if (this.player.food <= 0) {
            this.player.hp = Math.max(0, this.player.hp - CONFIG.RESOURCE_DRAIN.STARVE_DAMAGE);
        }
        if (this.player.water <= 0) {
            this.player.hp = Math.max(0, this.player.hp - CONFIG.RESOURCE_DRAIN.THIRST_DAMAGE);
        }
        
        if (this.inCombat && this.currentEnemy) {
            this.updateCombat();
        }
        
        this.updateProjectiles();
        this.updateDamageNumbers();
        this.updateUI();
        
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }
    
    updateCombat() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        
        if (weapon.range === 'melee' && this.player.isMovingToEnemy) {
            const step = 3;
            if (this.currentHeroX < this.enemyX - 40) {
                this.currentHeroX += step;
            } else {
                this.player.isMovingToEnemy = false;
                this.performMeleeAttack();
            }
        }
        
        if (this.enemyAttackCooldown <= 0 && this.currentEnemy.hp > 0) {
            this.enemyAttack();
            this.enemyAttackCooldown = CONFIG.COMBAT.ENEMY_ATTACK_COOLDOWN;
        } else {
            this.enemyAttackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
    }
    
    playerAttack(isHit) {
        if (this.attackCooldown > 0) return;
        
        const weapon = this.player.weapons[this.player.currentWeapon];
        
        if (weapon.range === 'ranged') {
            if (weapon.ammo <= 0) {
                this.addLog('Нет патронов!', 'combat');
                return;
            }
            weapon.ammo--;
            
            this.shootAnimation = true;
            // Визуальный эффект выстрела
            const flash = document.createElement('div');
            flash.className = 'muzzle-flash';
            const heroCanvasX = this.inCombat ? this.currentHeroX : CONFIG.BACKGROUND_POSITIONS.HERO_X;
            flash.style.left = (heroCanvasX + 60) + 'px';
            flash.style.top = (CONFIG.BACKGROUND_POSITIONS.HERO_Y + 70) + 'px';
            document.body.appendChild(flash);
            setTimeout(() => { 
                this.shootAnimation = false;
                if(flash) flash.remove();
            }, 150);
            
            if (isHit) {
                let damage = weapon.damage * this.player.rangedDamageBonus;
                if (this.player.hp < this.player.maxHp * 0.3) damage *= this.player.lowHpBonus;
                
                const isCritical = Math.random() < 0.15;
                if (isCritical) {
                    damage *= 2;
                    this.addLog('КРИТИЧЕСКИЙ ВЫСТРЕЛ!', 'combat');
                }
                
                this.currentEnemy.hp -= damage;
                this.addDamageNumber(Math.floor(damage), this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y);
                this.addLog(`Попадание! ${weapon.name} наносит ${Math.floor(damage)} урона`, 'combat');
                this.addHitIndicator(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
            } else {
                this.addLog(`Промах! ${weapon.name} не попал`, 'combat');
            }
        } else {
            if (this.currentHeroX < this.enemyX - 40) {
                this.player.isMovingToEnemy = true;
                this.addLog(`${weapon.name}: приближается к врагу...`, 'combat');
                return;
            } else {
                this.performMeleeAttack();
            }
        }
        
        const cooldown = CONFIG.COMBAT.MELEE_ATTACK_DELAY / this.player.attackSpeedBonus;
        this.attackCooldown = cooldown;
        
        if (this.currentEnemy.hp <= 0) {
            this.endBattle(true);
        }
    }
    
    performMeleeAttack() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        let damage = weapon.damage * this.player.meleeDamageBonus;
        
        if (this.player.hp < this.player.maxHp * 0.3) damage *= this.player.lowHpBonus;
        
        const isCritical = Math.random() < 0.2;
        if (isCritical) {
            damage *= 2;
            this.addLog('СИЛЬНЫЙ УДАР!', 'combat');
        }
        
        this.currentEnemy.hp -= damage;
        this.addDamageNumber(Math.floor(damage), this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y);
        this.addLog(`${weapon.name} наносит ${Math.floor(damage)} урона!`, 'combat');
        
        this.meleeAnimation = true;
        setTimeout(() => { this.meleeAnimation = false; }, 200);
        this.addMeleeSwipe(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
        
        if (this.currentEnemy.hp <= 0) {
            this.endBattle(true);
        }
    }
    
    enemyAttack() {
        let damage = this.currentEnemy.damage;
        const isCritical = Math.random() < 0.1;
        
        if (isCritical) {
            damage *= 1.5;
            this.addLog(`${this.currentEnemy.name} наносит КРИТИЧЕСКИЙ урон!`, 'combat');
        }
        
        const finalDamage = Math.max(1, Math.floor(damage - this.player.armor));
        this.player.hp = Math.max(0, this.player.hp - finalDamage);
        
        this.addDamageNumber(finalDamage, CONFIG.BACKGROUND_POSITIONS.HERO_X + 40, CONFIG.BACKGROUND_POSITIONS.HERO_Y);
        this.addLog(`${this.currentEnemy.name} наносит ${finalDamage} урона!`, 'combat');
        
        this.canvas.style.animation = 'hitFlash 0.2s';
        setTimeout(() => {
            this.canvas.style.animation = '';
        }, 200);
        
        this.updateUI();
        
        if (this.player.hp <= 0) {
            this.endBattle(false);
        }
    }
    
    addHitIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'hit-indicator';
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 300);
    }
    
    addMeleeSwipe(x, y) {
        const swipe = document.createElement('div');
        swipe.className = 'melee-swipe';
        swipe.style.left = x + 'px';
        swipe.style.top = y + 'px';
        document.body.appendChild(swipe);
        setTimeout(() => swipe.remove(), 200);
    }
    
    updateProjectiles() {
        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x > 600 || p.x < 0 || p.y > 400 || p.y < 0) {
                this.projectiles.splice(i, 1);
                i--;
            }
        }
    }
    
    startBattle(enemy) {
        this.inCombat = true;
        this.currentEnemy = {
            ...enemy,
            hp: enemy.hp,
            maxHp: enemy.hp
        };
        this.attackCooldown = 0;
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.player.isMovingToEnemy = false;
        
        this.canvas.classList.add('combat-overlay');
        if (this.crosshair) this.crosshair.style.display = 'block';
        
        this.addLog(`⚔️ Начало боя с ${enemy.icon || '👾'} ${enemy.name}!`, 'combat');
        this.addLog(`🎯 Наведите прицел на врага и кликните для атаки!`, 'combat');
    }
    
    endBattle(won) {
        this.inCombat = false;
        this.canvas.classList.remove('combat-overlay');
        if (this.crosshair) this.crosshair.style.display = 'none';
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.player.isMovingToEnemy = false;
        
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
            return { name: 'Аптечка', type: 'consumable', value: 25 };
        } else if (rand < 0.45) {
            return { name: 'Металлолом', type: 'craft', value: 15 };
        } else if (rand < 0.55 && this.player.currentWeapon !== 'knife') {
            const weapon = this.player.weapons[this.player.currentWeapon];
            if (weapon && weapon.ammo !== null) {
                const amount = Math.floor(Math.random() * 15 + 5) * this.player.ammoDropBonus;
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
                return { name: `Патроны x${amount}`, type: 'ammo', value: amount };
            }
        }
        return null;
    }
    
    triggerRandomEvent() {
        const eventData = TEXTS.EVENTS[Math.floor(Math.random() * TEXTS.EVENTS.length)];
        this.showEventModal(eventData);
    }
    
    showEventModal(eventData) {
        clearInterval(this.gameLoop);
        clearInterval(this.eventTimer);
        
        const modal = document.getElementById('choiceModal');
        document.getElementById('modalText').innerHTML = `<strong>${eventData.title}</strong><br><br>${eventData.description}`;
        const optionsDiv = document.getElementById('modalOptions');
        optionsDiv.innerHTML = '';
        
        eventData.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.textContent = option.text;
            btn.className = 'option-button';
            btn.onclick = () => {
                this.applyEventEffects(option.effects);
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
    
    applyEventEffects(effects) {
        for (const effectId of effects) {
            const effect = TEXTS.EFFECTS[effectId];
            if (!effect) continue;
            
            this.addLog(effect.log, 'event');
            
            if (effect.hp) this.player.hp = Math.min(this.player.maxHp, Math.max(0, this.player.hp + effect.hp));
            if (effect.food) this.player.food = Math.min(100, Math.max(0, this.player.food + effect.food));
            if (effect.water) this.player.water = Math.min(100, Math.max(0, this.player.water + effect.water));
            if (effect.exp) this.addExp(effect.exp);
            if (effect.item) {
                for (let i = 0; i < (effect.value || 1); i++) {
                    this.player.inventory.push({ name: effect.item, type: 'consumable', value: 25 });
                }
            }
            if (effect.combat) {
                const enemies = TEXTS.ENEMIES.filter(e => e.level === (effect.combat === 'easy' ? 1 : effect.combat === 'hard' ? 2 : 1));
                const enemy = enemies[Math.floor(Math.random() * enemies.length)];
                this.startBattle(enemy);
            }
        }
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
    
    addDamageNumber(damage, x, y) {
        this.showDamageNumbers.push({
            x: x, y: y, value: Math.floor(damage), life: 1
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
        
        // Фон
        if (this.sprites.SKY) {
            this.ctx.drawImage(this.sprites.SKY, 0, CONFIG.BACKGROUND_POSITIONS.SKY_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, 200);
        }
        
        if (this.sprites.RUINS) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(this.sprites.RUINS, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.RUINS_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, CONFIG.SPRITE_SIZES.BG_HEIGHT);
            }
        }
        
        if (this.sprites.GROUND) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(this.sprites.GROUND, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.GROUND_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, CONFIG.SPRITE_SIZES.BG_HEIGHT);
            }
        }
        
        // Враг
        if (this.inCombat && this.currentEnemy) {
            const enemySpriteKey = `ENEMY_${this.currentEnemy.name.toUpperCase().replace(' ', '_')}`;
            const enemySprite = this.sprites[enemySpriteKey] || this.sprites.ENEMY_RAIDER;
            
            if (enemySprite) {
                this.ctx.drawImage(enemySprite, this.enemyX, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y, CONFIG.SPRITE_SIZES.ENEMY_WIDTH, CONFIG.SPRITE_SIZES.ENEMY_HEIGHT);
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
        const heroX = this.inCombat ? this.currentHeroX : CONFIG.BACKGROUND_POSITIONS.HERO_X;
        
        if (heroSprite) {
            this.ctx.drawImage(heroSprite, heroX, CONFIG.BACKGROUND_POSITIONS.HERO_Y + walkOffset, CONFIG.SPRITE_SIZES.HERO_WIDTH, CONFIG.SPRITE_SIZES.HERO_HEIGHT);
        }
        
        // Броня на герое 
        if (this.sprites[this.player.currentArmor.toUpperCase()]) {
            const armorSprite = this.sprites[this.player.currentArmor.toUpperCase()];
            this.ctx.drawImage(armorSprite, heroX + 20, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 30, 40, 40);
        }

        // Оружие на герое - используем спрайты
        const weapon = this.player.weapons[this.player.currentWeapon];
        // В методе draw(), замените блок с оружием:
        if (weapon) {
            const weaponSpriteKey = this.getWeaponSpriteKey(weapon.name);
            console.log('Loading weapon sprite:', weaponSpriteKey, this.sprites[weaponSpriteKey]); // Отладка
            
            if (this.sprites[weaponSpriteKey]) {
                this.ctx.drawImage(this.sprites[weaponSpriteKey], heroX + 45, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 45, 32, 32);
            } else {
                // Если спрайт не загружен, пробуем альтернативные варианты
                const altKey = weapon.name.toLowerCase();
                if (this.sprites[altKey]) {
                    this.ctx.drawImage(this.sprites[altKey], heroX + 45, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 45, 32, 32);
                } 
            }
        }
        
        // Анимация выстрела
        if (this.shootAnimation && weapon.range === 'ranged' && this.inCombat) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(heroX + 60, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 70, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Цифры урона
        for (const damage of this.showDamageNumbers) {
            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = `rgba(255, 50, 50, ${damage.life})`;
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(Math.floor(damage.value), damage.x, damage.y);
            this.ctx.shadowBlur = 0;
        }
    }
    
    // Методы инвентаря, перков и остальное (как в предыдущей версии)
    showInventory() {
        const modal = document.getElementById('inventoryModal');
        this.updateInventoryUI();
        modal.style.display = 'flex';
    }
    
    updateInventoryUI() {
        const weaponSlot = document.getElementById('currentWeaponSlot');
        const currentWeapon = this.player.weapons[this.player.currentWeapon];
        
        // Создаем canvas для иконки оружия
        const weaponIconCanvas = document.createElement('canvas');
        weaponIconCanvas.width = 32;
        weaponIconCanvas.height = 32;
        const weaponSpriteKey = this.getWeaponSpriteKey(currentWeapon.name);
        
        if (this.sprites[weaponSpriteKey]) {
            const ctx = weaponIconCanvas.getContext('2d');
            ctx.drawImage(this.sprites[weaponSpriteKey], 0, 0, 32, 32);
        } else {
            // Пробуем альтернативный ключ
            const altKey = currentWeapon.name.toLowerCase().replace(/[^a-z]/g, '');
            if (this.sprites[altKey]) {
                const ctx = weaponIconCanvas.getContext('2d');
                ctx.drawImage(this.sprites[altKey], 0, 0, 32, 32);
            } else {
                const ctx = weaponIconCanvas.getContext('2d');
                ctx.fillStyle = '#d4a043';
                ctx.font = '24px monospace';
                ctx.fillText(currentWeapon.icon || '🔫', 4, 26);
            }
        }
        
        weaponSlot.innerHTML = `
            <div class="equipment-icon"></div>
            <div class="equipment-info">
                <div>${currentWeapon.name}</div>
                <div class="equipment-stats">⚔️ ${currentWeapon.damage} урона</div>
                ${currentWeapon.ammo !== null ? `<div class="equipment-stats">🔫 ${currentWeapon.ammo}/${currentWeapon.maxAmmo}</div>` : ''}
            </div>
        `;
        weaponSlot.querySelector('.equipment-icon').appendChild(weaponIconCanvas);
        
        // Аналогично для брони
        const armorSlot = document.getElementById('currentArmorSlot');
        const currentArmor = this.player.armorItems[this.player.currentArmor];
        const armorIconCanvas = document.createElement('canvas');
        armorIconCanvas.width = 32;
        armorIconCanvas.height = 32;
        const armorSpriteKey = currentArmor.name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '');
        
        if (this.sprites[armorSpriteKey]) {
            const ctx = armorIconCanvas.getContext('2d');
            ctx.drawImage(this.sprites[armorSpriteKey], 0, 0, 32, 32);
        } else {
            const ctx = armorIconCanvas.getContext('2d');
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(4, 4, 24, 24);
        }
        
        armorSlot.innerHTML = `
            <div class="equipment-icon"></div>
            <div class="equipment-info">
                <div>${currentArmor.name}</div>
                <div class="equipment-stats">🛡️ ${currentArmor.defense} защиты</div>
            </div>
        `;
        armorSlot.querySelector('.equipment-icon').appendChild(armorIconCanvas);
        
        const inventoryDiv = document.getElementById('inventoryList');
        inventoryDiv.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            inventoryDiv.innerHTML = `<div style="text-align:center;grid-column:1/-1;">${TEXTS.MODAL.EMPTY_INVENTORY}</div>`;
        } else {
            this.player.inventory.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                itemDiv.innerHTML = `
                    <div>${item.name}</div>
                    <div class="item-actions">
                        <button class="item-action-btn use-btn" data-index="${index}">Использовать</button>
                        <button class="item-action-btn scrap-btn" data-index="${index}">Разобрать</button>
                        <button class="item-action-btn drop-btn" data-index="${index}">Выбросить</button>
                    </div>
                `;
                inventoryDiv.appendChild(itemDiv);
            });
            
            document.querySelectorAll('.use-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.useItem(parseInt(btn.dataset.index));
                };
            });
            document.querySelectorAll('.scrap-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.scrapItem(parseInt(btn.dataset.index));
                };
            });
            document.querySelectorAll('.drop-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.dropItem(parseInt(btn.dataset.index));
                };
            });
        }
    }

    getWeaponSpriteKey(weaponName) {
        // Маппинг названий на ключи в SPRITES.WEAPONS
        const mapping = {
            'Ржавый нож': 'KNIFE',
            'Пистолет': 'PISTOL',
            'Винтовка': 'RIFLE',
            'Дробовик': 'SHOTGUN'
        };
        
        // Если есть прямое соответствие в маппинге
        if (mapping[weaponName]) {
            return mapping[weaponName];
        }
        
        // Fallback: преобразуем название в верхний регистр и убираем пробелы
        return weaponName.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '');
    }
    
    prevWeapon() {
        this.player.weaponIndex = (this.player.weaponIndex - 1 + this.weaponList.length) % this.weaponList.length;
        this.player.currentWeapon = this.weaponList[this.player.weaponIndex];
        this.updateInventoryUI();
        this.addLog(`Экипировано: ${this.player.weapons[this.player.currentWeapon].name}`, 'system');
        this.saveGame();
    }
    
    nextWeapon() {
        this.player.weaponIndex = (this.player.weaponIndex + 1) % this.weaponList.length;
        this.player.currentWeapon = this.weaponList[this.player.weaponIndex];
        this.updateInventoryUI();
        this.addLog(`Экипировано: ${this.player.weapons[this.player.currentWeapon].name}`, 'system');
        this.saveGame();
    }
    
    prevArmor() {
        this.player.armorIndex = (this.player.armorIndex - 1 + this.armorList.length) % this.armorList.length;
        this.player.currentArmor = this.armorList[this.player.armorIndex];
        this.player.armor = this.player.armorItems[this.player.currentArmor].defense;
        this.updateInventoryUI();
        this.addLog(`Экипировано: ${this.player.armorItems[this.player.currentArmor].name}`, 'system');
        this.saveGame();
    }
    
    nextArmor() {
        this.player.armorIndex = (this.player.armorIndex + 1) % this.armorList.length;
        this.player.currentArmor = this.armorList[this.player.armorIndex];
        this.player.armor = this.player.armorItems[this.player.currentArmor].defense;
        this.updateInventoryUI();
        this.addLog(`Экипировано: ${this.player.armorItems[this.player.currentArmor].name}`, 'system');
        this.saveGame();
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
                const amount = item.value || 10;
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
                this.addLog(`🔫 Добавлено ${amount} патронов`, 'system');
                this.player.inventory.splice(index, 1);
            }
        }
        
        this.updateUI();
        this.updateInventoryUI();
        this.saveGame();
    }
    
    scrapItem(index) {
        const item = this.player.inventory[index];
        const scrapValue = Math.floor(item.value / 2) || 5;
        this.player.inventory.push({ name: 'Металлолом', type: 'craft', value: scrapValue });
        this.player.inventory.splice(index, 1);
        this.addLog(`🔧 Разобрали ${item.name} на металлолом`, 'system');
        this.updateInventoryUI();
        this.saveGame();
    }
    
    dropItem(index) {
        this.player.inventory.splice(index, 1);
        this.addLog(`🗑️ Предмет выброшен`, 'system');
        this.updateInventoryUI();
        this.saveGame();
    }
    
    closeInventory() {
        const modal = document.getElementById('inventoryModal');
        if (modal) modal.style.display = 'none';
    }
    
    craft() {
        const metalCount = this.player.inventory.filter(i => i.name === 'Металлолом').reduce((sum, i) => sum + i.value, 0);
        
        if (metalCount >= 30) {
            let toRemove = 30;
            for (let i = 0; i < this.player.inventory.length && toRemove > 0; i++) {
                if (this.player.inventory[i].name === 'Металлолом') {
                    const removeAmount = Math.min(this.player.inventory[i].value, toRemove);
                    this.player.inventory[i].value -= removeAmount;
                    toRemove -= removeAmount;
                    if (this.player.inventory[i].value <= 0) {
                        this.player.inventory.splice(i, 1);
                        i--;
                    }
                }
            }
            this.player.weapons.knife.damage += 5;
            this.addLog(`🔧 Улучшили нож! Урон +5`, 'system');
            this.updateUI();
            this.saveGame();
        } else {
            this.addLog(`❌ Нужно 30 металлолома для улучшения ножа! (есть ${metalCount})`, 'system');
        }
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
            
            // Создаем canvas для иконки
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 32;
            iconCanvas.height = 32;
            iconCanvas.style.marginRight = '12px';
            iconCanvas.style.flexShrink = '0';
            
            if (this.sprites[perk.iconSprite]) {
                const ctx = iconCanvas.getContext('2d');
                ctx.drawImage(this.sprites[perk.iconSprite], 0, 0, 32, 32);
            } else {
                // Fallback на эмодзи
                const ctx = iconCanvas.getContext('2d');
                ctx.fillStyle = perk.color;
                ctx.font = '24px monospace';
                ctx.fillText(perk.icon, 4, 26);
            }
            
            const textContainer = document.createElement('div');
            textContainer.style.flex = '1';
            textContainer.innerHTML = `
                <div class="perk-name" style="color: ${perk.color}">${perk.icon} ${perk.name}</div>
                <div class="perk-desc">${perk.description}</div>
                <div class="perk-desc" style="font-size: 10px; color: #8b7355; margin-top: 6px;">⭐ Требуется уровень ${perk.requiredLevel}</div>
            `;
            
            const flexContainer = document.createElement('div');
            flexContainer.style.display = 'flex';
            flexContainer.style.alignItems = 'center';
            flexContainer.appendChild(iconCanvas);
            flexContainer.appendChild(textContainer);
            
            perkDiv.appendChild(flexContainer);
            
            if (isUnlocked && !isOwned && this.player.perkPoints > 0) {
                perkDiv.style.cursor = 'pointer';
                perkDiv.onclick = () => this.unlockPerk(id);
                // Добавляем подсказку
                perkDiv.title = 'Кликните чтобы изучить перк';
            } else if (isOwned) {
                perkDiv.style.borderColor = '#4ecdc4';
                perkDiv.style.opacity = '0.8';
                perkDiv.title = 'Перк уже изучен';
            } else if (!isUnlocked) {
                perkDiv.title = `Требуется ${perk.requiredLevel} уровень`;
            }
            
            perksDiv.appendChild(perkDiv);
        }
        
        // Добавляем информацию об очках перков
        const pointsInfo = document.createElement('div');
        pointsInfo.style.cssText = 'margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 6px; text-align: center; font-size: 12px; color: #ffd700;';
        pointsInfo.innerHTML = `⭐ ОЧКИ ПЕРКОВ: ${this.player.perkPoints} ⭐`;
        perksDiv.parentNode.insertBefore(pointsInfo, perksDiv.nextSibling);
        
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
                <button id="closePerksBtn" class="modal-close">Закрыть</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.getElementById('closePerksBtn').onclick = () => {
            modal.style.display = 'none';
        };
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
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
                hp: this.player.hp, maxHp: this.player.maxHp, baseMaxHp: this.player.baseMaxHp,
                food: this.player.food, water: this.player.water, level: this.player.level,
                exp: this.player.exp, distance: this.player.distance, inventory: this.player.inventory,
                currentWeapon: this.player.currentWeapon, currentArmor: this.player.currentArmor,
                weapons: this.player.weapons, armorItems: this.player.armorItems,
                armor: this.player.armor, perkPoints: this.player.perkPoints,
                weaponIndex: this.player.weaponIndex, armorIndex: this.player.armorIndex,
                meleeDamageBonus: this.player.meleeDamageBonus, rangedDamageBonus: this.player.rangedDamageBonus,
                lootChanceBonus: this.player.lootChanceBonus, resourceDrainBonus: this.player.resourceDrainBonus,
                lowHpBonus: this.player.lowHpBonus, ammoDropBonus: this.player.ammoDropBonus,
                healBonus: this.player.healBonus, attackSpeedBonus: this.player.attackSpeedBonus
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
                this.weaponList = Object.keys(this.player.weapons);
                this.armorList = Object.keys(this.player.armorItems);
                
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
        document.getElementById('closeInventoryBtn').onclick = () => this.closeInventory();
        document.getElementById('prevWeaponBtn').onclick = () => this.prevWeapon();
        document.getElementById('nextWeaponBtn').onclick = () => this.nextWeapon();
        document.getElementById('prevArmorBtn').onclick = () => this.prevArmor();
        document.getElementById('nextArmorBtn').onclick = () => this.nextArmor();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});