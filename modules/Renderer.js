// ============ МОДУЛЬ ОТРИСОВКИ ============

class Renderer {
    constructor(game, ctx, player, combat) {
        this.game = game;
        this.ctx = ctx;
        this.player = player;
        this.combat = combat;
        this.backgroundX = 0;
        this.walkingCycle = 0;
        this.campfireAnimation = 0;
    }
    
    updateBackground() {
        // Фон двигается только если не в бою и не на отдыхе
        if (!this.combat.inCombat && !this.game.isResting) {
            this.backgroundX = (this.backgroundX - CONFIG.GAME.BACKGROUND_SPEED) % 600;
        }
        this.walkingCycle = (this.walkingCycle + CONFIG.GAME.WALK_ANIMATION_SPEED) % (Math.PI * 2);
        
        // Анимация костра
        if (this.game.showCampfire) {
            this.campfireAnimation = (this.campfireAnimation + 0.1) % (Math.PI * 2);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, 600, 400);
        this.drawBackground();
        this.drawEnemy();
        this.drawHero();
        
        if (this.game.showCampfire) {
            this.drawCampfire();
        }
        
        this.drawDamageNumbers();
    }
    
    drawBackground() {
        const sprites = this.game.sprites;
        
        if (sprites.SKY) {
            this.ctx.drawImage(sprites.SKY, 0, CONFIG.BACKGROUND_POSITIONS.SKY_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, 200);
        }
        
        if (sprites.RUINS) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(sprites.RUINS, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.RUINS_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, CONFIG.SPRITE_SIZES.BG_HEIGHT);
            }
        }
        
        if (sprites.GROUND) {
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(sprites.GROUND, this.backgroundX + i * 600, CONFIG.BACKGROUND_POSITIONS.GROUND_Y, CONFIG.SPRITE_SIZES.BG_WIDTH, CONFIG.SPRITE_SIZES.BG_HEIGHT);
            }
        }
    }
    
    drawCampfire() {
        // Рисуем костер
        const fireX = CONFIG.BACKGROUND_POSITIONS.HERO_X + 20;
        const fireY = CONFIG.BACKGROUND_POSITIONS.HERO_Y + 60;
        
        // Тени от костра
        this.ctx.fillStyle = `rgba(255, 100, 0, ${0.3 + Math.sin(this.campfireAnimation) * 0.1})`;
        this.ctx.beginPath();
        this.ctx.arc(fireX + 20, fireY + 10, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Костер
        this.ctx.fillStyle = `rgba(255, ${80 + Math.sin(this.campfireAnimation) * 30}, 0, 0.9)`;
        this.ctx.beginPath();
        this.ctx.moveTo(fireX, fireY);
        this.ctx.lineTo(fireX + 15, fireY - 25 + Math.sin(this.campfireAnimation) * 5);
        this.ctx.lineTo(fireX + 30, fireY);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(fireX + 10, fireY);
        this.ctx.lineTo(fireX + 20, fireY - 20 + Math.sin(this.campfireAnimation + 1) * 4);
        this.ctx.lineTo(fireX + 30, fireY);
        this.ctx.fill();
        
        // Дрова
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(fireX, fireY + 5, 30, 6);
        this.ctx.fillRect(fireX + 5, fireY + 2, 6, 15);
        this.ctx.fillRect(fireX + 20, fireY + 2, 6, 15);
        
        // Искры
        for (let i = 0; i < 5; i++) {
            const sparkY = Math.sin(this.campfireAnimation * 3 + i) * 10;
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(this.campfireAnimation * 5 + i) * 0.3})`;
            this.ctx.fillRect(fireX + 10 + i * 4, fireY - 15 + sparkY, 2, 2);
        }
    }
    
    drawEnemy() {
        if (!this.combat.inCombat || !this.combat.currentEnemy) return;
        
        const sprites = this.game.sprites;
        const enemySpriteKey = `ENEMY_${this.combat.currentEnemy.name.toUpperCase().replace(' ', '_')}`;
        const enemySprite = sprites[enemySpriteKey] || sprites.ENEMY_RAIDER;
        
        if (enemySprite) {
            this.ctx.drawImage(enemySprite, this.combat.getEnemyX(), CONFIG.BACKGROUND_POSITIONS.ENEMY_Y, CONFIG.SPRITE_SIZES.ENEMY_WIDTH, CONFIG.SPRITE_SIZES.ENEMY_HEIGHT);
        }
        
        const hpPercent = this.combat.currentEnemy.hp / this.combat.currentEnemy.maxHp;
        this.ctx.fillStyle = '#8b0000';
        this.ctx.fillRect(this.combat.getEnemyX(), CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 15, 80, 8);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.combat.getEnemyX(), CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 15, 80 * hpPercent, 8);
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText(this.combat.currentEnemy.name, this.combat.getEnemyX(), CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 20);
        
        // Индикатор дальности для стрельбы
        if (this.player.weapons[this.player.currentWeapon].range === 'ranged') {
            const distance = Math.abs(this.combat.getEnemyX() - this.combat.getCurrentHeroX());
            this.ctx.fillStyle = '#d4a043';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(`📏 ${Math.floor(distance)}px`, this.combat.getEnemyX() + 10, CONFIG.BACKGROUND_POSITIONS.ENEMY_Y - 25);
        }
    }
    
    drawHero() {
        const sprites = this.game.sprites;
        let heroSprite = sprites.HERO_IDLE;
        
        if (this.game.shootAnimation && sprites.HERO_SHOOT) {
            heroSprite = sprites.HERO_SHOOT;
        } else if (this.game.meleeAnimation && sprites.HERO_MELEE) {
            heroSprite = sprites.HERO_MELEE;
        } else if (!this.combat.inCombat && !this.game.isResting) {
            const isWalking = this.walkingCycle % (Math.PI * 2) < Math.PI;
            heroSprite = sprites[isWalking ? 'HERO_WALK1' : 'HERO_WALK2'] || sprites.HERO_IDLE;
        } else if (this.game.isResting) {
            heroSprite = sprites.HERO_IDLE; // В режиме отдыха стоит на месте
        }
        
        const walkOffset = (!this.combat.inCombat && !this.game.isResting) ? Math.sin(this.walkingCycle) * 2 : 0;
        const heroX = this.combat.inCombat ? this.combat.getCurrentHeroX() : CONFIG.BACKGROUND_POSITIONS.HERO_X;
        
        if (heroSprite) {
            this.ctx.drawImage(heroSprite, heroX, CONFIG.BACKGROUND_POSITIONS.HERO_Y + walkOffset, CONFIG.SPRITE_SIZES.HERO_WIDTH, CONFIG.SPRITE_SIZES.HERO_HEIGHT);
        }
        
        this.drawArmor(heroX);
        this.drawWeapon(heroX);
        
        if (this.game.shootAnimation && this.player.weapons[this.player.currentWeapon].range === 'ranged' && this.combat.inCombat) {
            this.drawMuzzleFlash(heroX);
        }
    }
    
    drawArmor(heroX) {
        const sprites = this.game.sprites;
        const armorSpriteKey = this.player.currentArmor.toUpperCase();
        if (sprites[armorSpriteKey]) {
            this.ctx.drawImage(sprites[armorSpriteKey], heroX + 20, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 30, 40, 40);
        }
    }
    
    drawWeapon(heroX) {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (!weapon) return;
        
        const sprites = this.game.sprites;
        const weaponSpriteKey = this.game.getWeaponSpriteKey(weapon.name);
        if (sprites[weaponSpriteKey]) {
            this.ctx.drawImage(sprites[weaponSpriteKey], heroX + 45, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 45, 32, 32);
        }
    }
    
    drawMuzzleFlash(heroX) {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(heroX + 60, CONFIG.BACKGROUND_POSITIONS.HERO_Y + 70, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawDamageNumbers() {
        for (const damage of this.game.showDamageNumbers) {
            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = `rgba(255, 50, 50, ${damage.life})`;
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(Math.floor(damage.value), damage.x, damage.y);
            this.ctx.shadowBlur = 0;
        }
    }
}