// ============ МОДУЛЬ БОЕВОЙ СИСТЕМЫ ============

class CombatSystem {
    constructor(game, player, ui) {
        this.game = game;
        this.player = player;
        this.ui = ui;
        this.inCombat = false;
        this.currentEnemy = null;
        this.attackCooldown = 0;
        this.enemyAttackCooldown = 0;
        this.isMovingToEnemy = false;
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.enemyX = CONFIG.BACKGROUND_POSITIONS.ENEMY_X;
        this.crosshairWobble = 0;
        this.crosshairWobbleTime = 0;
    }

    startBattle(enemy) {
        console.log('CombatSystem.startBattle called');
        this.inCombat = true;
        this.currentEnemy = {
            ...enemy,
            hp: enemy.hp,
            maxHp: enemy.hp,
            isMovingToPlayer: enemy.range === 'melee'
        };
        this.attackCooldown = 0;
        this.enemyAttackCooldown = 0;
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.isMovingToEnemy = false;
        this.crosshairWobble = 0;
        
        this.game.canvas.classList.add('combat-overlay');
        
        // ПОКАЗЫВАЕМ ПРИЦЕЛ И ЦЕНТРИРУЕМ ЕГО
        if (this.game.crosshair) {
            console.log('Showing crosshair');
            this.game.crosshair.style.display = 'block';
            this.game.crosshair.classList.add('crosshair-wobble');
            
            // Центрируем прицел на канвасе
            const rect = this.game.canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            this.game.crosshair.style.left = centerX + 'px';
            this.game.crosshair.style.top = centerY + 'px';
        } else {
            console.warn('Crosshair not found!');
        }
        
        this.ui.addLog(`⚔️ Начало боя с ${enemy.icon || '👾'} ${enemy.name}!`, 'combat');
        if (this.player.weapons[this.player.currentWeapon].range === 'ranged') {
            this.ui.addLog(`🎯 Наведите прицел на врага и кликните для атаки!`, 'combat');
        }
    }
    
    update() {
        if (!this.inCombat || !this.currentEnemy) return;
        
        // Обновляем wobble прицела
        this.crosshairWobbleTime += CONFIG.GAME.TICK_INTERVAL;
        this.crosshairWobble = Math.sin(this.crosshairWobbleTime * 0.008) * CONFIG.COMBAT.CROSSHAIR_WOBBLE;
        
        if (this.game.crosshair && this.game.crosshair.style.display === 'block') {
            const wobbleX = this.crosshairWobble * 15;
            const wobbleY = this.crosshairWobble * 8;
            this.game.crosshair.style.transform = `translate(-50%, -50%) translate(${wobbleX}px, ${wobbleY}px)`;
        }
        
        // Движение врага к игроку
        if (this.currentEnemy.range === 'melee' && this.currentEnemy.isMovingToPlayer) {
            const step = 2;
            if (this.enemyX > this.currentHeroX + 50) {
                this.enemyX -= step;
            } else {
                this.currentEnemy.isMovingToPlayer = false;
                this.ui.addLog(`${this.currentEnemy.name} подбежал вплотную!`, 'combat');
            }
        }
        
        const weapon = this.player.weapons[this.player.currentWeapon];
        
        if (weapon.range === 'melee' && this.isMovingToEnemy) {
            const step = 3;
            if (this.currentHeroX < this.enemyX - 40) {
                this.currentHeroX += step;
            } else {
                this.isMovingToEnemy = false;
                this.performMeleeAttack();
            }
        }
        
        if (this.enemyAttackCooldown <= 0 && this.currentEnemy.hp > 0) {
            this.enemyAttack();
            const attackDelay = this.currentEnemy.range === 'melee' ? 2000 : 2500;
            this.enemyAttackCooldown = attackDelay;
        } else {
            this.enemyAttackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= CONFIG.GAME.TICK_INTERVAL;
        }
    }
    
    calculateHitChance(clickX, clickY) {
        const enemyCanvasX = this.enemyX;
        const enemyCanvasY = CONFIG.BACKGROUND_POSITIONS.ENEMY_Y;
        const enemyCenterX = enemyCanvasX + CONFIG.SPRITE_SIZES.ENEMY_WIDTH / 2;
        const enemyCenterY = enemyCanvasY + CONFIG.SPRITE_SIZES.ENEMY_HEIGHT / 2;
        
        const distanceToCenter = Math.hypot(clickX - enemyCenterX, clickY - enemyCenterY);
        const maxDistance = 50;
        
        let hitChance = 1 - (distanceToCenter / maxDistance);
        hitChance = Math.max(0.1, Math.min(0.95, hitChance));
        
        const wobblePenalty = Math.abs(this.crosshairWobble) * 0.3;
        hitChance -= wobblePenalty;
        
        hitChance *= this.player.weapons[this.player.currentWeapon].accuracy || 1;
        hitChance -= this.currentEnemy.dodge || 0;
        
        return Math.max(0.05, Math.min(0.95, hitChance));
    }
    
    playerAttack(clickX, clickY) {
        if (this.attackCooldown > 0 || !this.inCombat) {
            if (this.attackCooldown > 0) {
                this.ui.addLog(`⏳ Перезарядка...`, 'combat');
            }
            return;
        }
        
        const weapon = this.player.weapons[this.player.currentWeapon];
        
        if (weapon.range === 'ranged') {
            if (weapon.ammo <= 0) {
                this.ui.addLog('Нет патронов!', 'combat');
                return;
            }
            weapon.ammo--;
            
            const hitChance = this.calculateHitChance(clickX, clickY);
            const isHit = Math.random() < hitChance;
            
            this.rangedAttack(isHit, weapon, hitChance);
        } else {
            this.meleeAttack(weapon);
        }
        
        const cooldown = CONFIG.COMBAT.MELEE_ATTACK_DELAY / this.player.attackSpeedBonus;
        this.attackCooldown = cooldown;
        
        if (this.currentEnemy.hp <= 0) {
            this.endBattle(true);
        }
    }
    
    rangedAttack(isHit, weapon, hitChance) {
        this.game.shootAnimation = true;
        this.createMuzzleFlash();
        setTimeout(() => { this.game.shootAnimation = false; }, 150);
        
        const accuracyPercent = Math.floor(hitChance * 100);
        
        if (isHit) {
            let damage = weapon.damage * this.player.rangedDamageBonus;
            if (this.player.hp < this.player.maxHp * 0.3) damage *= this.player.lowHpBonus;
            
            const isCritical = Math.random() < 0.15;
            if (isCritical) {
                damage *= 2;
                this.ui.addLog('💥 КРИТИЧЕСКИЙ ВЫСТРЕЛ!', 'combat');
            }
            
            this.currentEnemy.hp -= damage;
            this.game.addDamageNumber(Math.floor(damage), this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y);
            this.ui.addLog(`🎯 Попадание! ${weapon.name} наносит ${Math.floor(damage)} урона (точность: ${accuracyPercent}%)`, 'combat');
            this.game.addHitIndicator(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
        } else {
            this.ui.addLog(`❌ Промах! ${weapon.name} не попал (точность: ${accuracyPercent}%)`, 'combat');
            this.game.addMissIndicator(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
        }
    }
    
    meleeAttack(weapon) {
        if (this.currentHeroX < this.enemyX - 40) {
            this.isMovingToEnemy = true;
            this.ui.addLog(`${weapon.name}: приближается к врагу...`, 'combat');
        } else {
            this.performMeleeAttack();
        }
    }
    
    performMeleeAttack() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        let damage = weapon.damage * this.player.meleeDamageBonus;
        
        if (this.player.hp < this.player.maxHp * 0.3) damage *= this.player.lowHpBonus;
        
        const isCritical = Math.random() < 0.2;
        if (isCritical) {
            damage *= 2;
            this.ui.addLog('💪 СИЛЬНЫЙ УДАР!', 'combat');
        }
        
        this.currentEnemy.hp -= damage;
        this.game.addDamageNumber(Math.floor(damage), this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y);
        this.ui.addLog(`${weapon.name} наносит ${Math.floor(damage)} урона!`, 'combat');
        
        this.game.meleeAnimation = true;
        setTimeout(() => { this.game.meleeAnimation = false; }, 200);
        this.game.addMeleeSwipe(this.enemyX + 40, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y + 40);
    }
    
    enemyAttack() {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;
        
        let damage = this.currentEnemy.damage;
        const isCritical = Math.random() < 0.1;
        
        if (isCritical) {
            damage *= 1.5;
            this.ui.addLog(`${this.currentEnemy.name} наносит КРИТИЧЕСКИЙ урон!`, 'combat');
        }
        
        const finalDamage = Math.max(1, Math.floor(damage - this.player.armor));
        this.player.hp = Math.max(0, this.player.hp - finalDamage);
        
        this.game.addDamageNumber(finalDamage, CONFIG.BACKGROUND_POSITIONS.HERO_X + 40, CONFIG.BACKGROUND_POSITIONS.HERO_Y);
        this.ui.addLog(`${this.currentEnemy.name} наносит ${finalDamage} урона!`, 'combat');
        
        this.game.canvas.style.animation = 'hitFlash 0.2s';
        setTimeout(() => { this.game.canvas.style.animation = ''; }, 200);
        
        if (this.player.hp <= 0) {
            this.endBattle(false);
        }
    }
    
    createMuzzleFlash() {
        const flash = document.createElement('div');
        flash.className = 'muzzle-flash';
        const heroCanvasX = this.inCombat ? this.currentHeroX : CONFIG.BACKGROUND_POSITIONS.HERO_X;
        flash.style.left = (heroCanvasX + 60) + 'px';
        flash.style.top = (CONFIG.BACKGROUND_POSITIONS.HERO_Y + 70) + 'px';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 150);
    }
    
    endBattle(won) {
        console.log('CombatSystem.endBattle called');
        this.inCombat = false;
        this.game.canvas.classList.remove('combat-overlay');
        
        // СКРЫВАЕМ ПРИЦЕЛ
        if (this.game.crosshair) {
            this.game.crosshair.style.display = 'none';
            this.game.crosshair.classList.remove('crosshair-wobble');
            this.game.crosshair.style.transform = '';
        }
        
        this.currentHeroX = CONFIG.BACKGROUND_POSITIONS.HERO_X;
        this.enemyX = CONFIG.BACKGROUND_POSITIONS.ENEMY_X;
        this.isMovingToEnemy = false;
        this.crosshairWobble = 0;
        
        if (won) {
            const expGain = this.currentEnemy.exp || CONFIG.GAME.BASE_EXP_PER_KILL;
            const leveledUp = this.player.addExp(expGain, (level) => {
                this.ui.addLog(TEXTS.CHAT.LEVEL_UP, 'level');
                this.ui.addLog(`Достигнут ${level} уровень! +20 HP`, 'level');
                if (this.player.perkPoints > 0) {
                    this.ui.addLog(`🎯 Доступно ${this.player.perkPoints} очков перков!`, 'system');
                }
            });
            
            const loot = this.generateLoot();
            if (loot) {
                this.player.inventory.push(loot);
                this.ui.addLog(`📦 ${TEXTS.CHAT.FOUND} ${loot.name}!`, 'event');
            }
            
            const healAmount = Math.floor(this.player.maxHp * 0.1);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            this.ui.addLog(`После боя восстановлено ${healAmount} HP`, 'system');
            this.ui.addLog(`✨ Победа! +${expGain} опыта`, 'system');
            
            if (leveledUp) this.game.updateUI();
        } else {
            this.game.gameOver();
            return;
        }
        
        this.currentEnemy = null;
        this.game.updateUI();
        this.game.saveGame();
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
    
    getCurrentHeroX() { return this.currentHeroX; }
    getEnemyX() { return this.enemyX; }
}