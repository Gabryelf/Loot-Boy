// ============ ОСНОВНОЙ КЛАСС ИГРЫ ============

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.sprites = {};
        this.crosshair = null;
        this.showDamageNumbers = [];
        this.projectiles = [];
        
        this.gameLoop = null;
        this.eventTimer = null;
        this.distanceReportTimer = null;
        this.isChatCollapsed = false;
        this.shootAnimation = false;
        this.meleeAnimation = false;
        this.showCampfire = false;
        this.isResting = false;
        
        this.loadGame();
        
        // Инициализация модулей
        this.player = new Player();
        this.ui = new UIManager(this, this.player, null);
        this.combat = new CombatSystem(this, this.player, this.ui);
        this.events = new EventManager(this, this.player, this.combat, this.ui);
        this.inventory = new InventoryManager(this, this.player, this.ui);
        this.restManager = new RestManager(this, this.player, this.ui, this.events);  // Переименовано!
        this.renderer = new Renderer(this, this.ctx, this.player, this.combat);
        
        // Обновляем ссылки
        this.ui.combat = this.combat;
        this.ui.inventory = this.inventory;
        
        this.weaponList = Object.keys(this.player.weapons);
        this.armorList = Object.keys(this.player.armorItems);
        this.player.weaponIndex = this.weaponList.indexOf(this.player.currentWeapon);
        this.player.armorIndex = this.armorList.indexOf(this.player.currentArmor);
        
        this.init();
    }
    
    async init() {
        await this.loadAllSprites();
        this.ui.updateUI();
        this.startGameLoop();
        this.startEventTimer();
        this.startDistanceReporter();
        this.addEventListeners();
        this.setupIcons();
        this.setupCrosshair();
        this.ui.addLog(TEXTS.CHAT.WELCOME, 'system');
        this.ui.addLog(TEXTS.CHAT.WELCOME_DESC, 'system');
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
        
        // По умолчанию прицел скрыт
        this.crosshair.style.display = 'none';
        
        // Устанавливаем начальную позицию прицела в центр
        this.crosshair.style.left = '300px';
        this.crosshair.style.top = '200px';
        
        // Обновляем позицию прицела при движении мыши
        document.addEventListener('mousemove', (e) => {
            if (this.crosshair) {
                const rect = this.canvas.getBoundingClientRect();
                // Ограничиваем движение прицела границами канваса
                let x = e.clientX;
                let y = e.clientY;
                
                // Ограничиваем по X
                if (x < rect.left) x = rect.left;
                if (x > rect.right) x = rect.right;
                // Ограничиваем по Y
                if (y < rect.top) y = rect.top;
                if (y > rect.bottom) y = rect.bottom;
                
                this.crosshair.style.left = x + 'px';
                this.crosshair.style.top = y + 'px';
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.combat.inCombat && this.combat.currentEnemy && this.combat.attackCooldown <= 0) {
                const rect = this.canvas.getBoundingClientRect();
                const canvasMouseX = e.clientX - rect.left;
                const canvasMouseY = e.clientY - rect.top;
                
                this.combat.playerAttack(canvasMouseX, canvasMouseY);
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
                }
            }
        });
    }
    
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            if (!this.restManager.isRestingActive()) {
                const died = this.player.updateResources(this.player.resourceDrainBonus);
                
                if (this.combat.inCombat && this.combat.currentEnemy) {
                    this.combat.update();
                }
                
                if (died || this.player.hp <= 0) {
                    this.gameOver();
                }
            }
            
            this.updateProjectiles();
            this.updateDamageNumbers();
            this.ui.updateUI();
            this.renderer.updateBackground();
            this.renderer.draw();
        }, CONFIG.GAME.TICK_INTERVAL);
    }
    
    startEventTimer() {
        this.eventTimer = setInterval(() => {
            if (!this.combat.inCombat && !this.restManager.isRestingActive()) {
                this.events.triggerRandomEvent();
            }
        }, CONFIG.GAME.EVENT_INTERVAL);
    }
    
    startDistanceReporter() {
        this.distanceReportTimer = setInterval(() => {
            if (!this.combat.inCombat && !this.restManager.isRestingActive()) {
                this.reportDistance();
            }
        }, CONFIG.GAME.DISTANCE_REPORT_INTERVAL);
    }
    
    reportDistance() {
        const distanceMeters = Math.floor(this.player.distance);
        this.ui.addLog(`${TEXTS.CHAT.TIME_PREFIX} ${distanceMeters} ${TEXTS.CHAT.DISTANCE_REPORT}`, 'time');
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
    
    addHitIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'hit-indicator';
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 300);
    }
    
    addMissIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'miss-indicator';
        indicator.textContent = 'MISS!';
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 500);
    }
    
    addMeleeSwipe(x, y) {
        const swipe = document.createElement('div');
        swipe.className = 'melee-swipe';
        swipe.style.left = x + 'px';
        swipe.style.top = y + 'px';
        document.body.appendChild(swipe);
        setTimeout(() => swipe.remove(), 200);
    }
    
    getWeaponSpriteKey(weaponName) {
        const mapping = {
            'Ржавый нож': 'KNIFE',
            'Пистолет': 'PISTOL',
            'Винтовка': 'RIFLE',
            'Дробовик': 'SHOTGUN'
        };
        
        if (mapping[weaponName]) {
            return mapping[weaponName];
        }
        
        return weaponName.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '');
    }
    
    unlockPerk(perkId) {
        if (this.player.perkPoints <= 0) {
            this.ui.addLog('Нет очков перков!', 'system');
            return;
        }
        
        const perk = PERKS.available[perkId];
        if (!perk || this.player.level < perk.requiredLevel) {
            this.ui.addLog('Недостаточный уровень!', 'system');
            return;
        }
        
        if (PERKS.active.includes(perkId)) {
            this.ui.addLog('Перк уже изучен!', 'system');
            return;
        }
        
        PERKS.active.push(perkId);
        this.player.perkPoints--;
        PERKS.applyPerkEffects(this.player, perkId);
        
        this.ui.addLog(`✨ Изучен перк: ${perk.name}!`, 'level');
        this.ui.updateUI();
        
        const modal = document.getElementById('perksModal');
        if (modal) modal.style.display = 'none';
        setTimeout(() => this.ui.showPerks(), 100);
        this.saveGame();
    }
    
    updateUI() {
        this.ui.updateUI();
    }
    
    prevWeapon() {
        this.player.switchWeapon(-1, this.weaponList, (weaponName) => {
            this.ui.addLog(`Экипировано: ${weaponName}`, 'system');
        });
        this.inventory.updateInventoryUI();
        this.saveGame();
    }
    
    nextWeapon() {
        this.player.switchWeapon(1, this.weaponList, (weaponName) => {
            this.ui.addLog(`Экипировано: ${weaponName}`, 'system');
        });
        this.inventory.updateInventoryUI();
        this.saveGame();
    }
    
    prevArmor() {
        this.player.switchArmor(-1, this.armorList, (armorName) => {
            this.ui.addLog(`Экипировано: ${armorName}`, 'system');
        });
        this.inventory.updateInventoryUI();
        this.saveGame();
    }
    
    nextArmor() {
        this.player.switchArmor(1, this.armorList, (armorName) => {
            this.ui.addLog(`Экипировано: ${armorName}`, 'system');
        });
        this.inventory.updateInventoryUI();
        this.saveGame();
    }
    
    craft() {
        if (this.player.craftKnifeUpgrade()) {
            this.ui.addLog(`🔧 Улучшили нож! Урон +5`, 'system');
            this.ui.updateUI();
            this.saveGame();
        } else {
            const metalCount = this.player.inventory.filter(i => i.name === 'Металлолом').reduce((sum, i) => sum + i.value, 0);
            this.ui.addLog(`❌ Нужно 30 металлолома для улучшения ножа! (есть ${metalCount})`, 'system');
        }
    }
    
    doRest() {  // Переименовано с rest на doRest
        console.log('doRest called - starting rest');
        if (this.restManager) {
            this.restManager.startRest();
        } else {
            console.error('RestManager not initialized');
            this.ui.addLog('Система отдыха не инициализирована!', 'system');
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
            timestamp: Date.now()
        };
        chrome.storage.local.set({ gameSave: saveData });
    }
    
    loadGame() {
        chrome.storage.local.get(['gameSave'], (result) => {
            if (result.gameSave && result.gameSave.player) {
                Object.assign(this.player, result.gameSave.player);
                PERKS.active = result.gameSave.activePerks || [];
                this.weaponList = Object.keys(this.player.weapons);
                this.armorList = Object.keys(this.player.armorItems);
                
                PERKS.clearPerkEffects(this.player);
                for (const perkId of PERKS.active) {
                    PERKS.applyPerkEffects(this.player, perkId);
                }
                
                this.ui.updateUI();
                this.ui.addLog('Игра загружена!', 'system');
            }
        });
    }
    
    gameOver() {
        clearInterval(this.gameLoop);
        clearInterval(this.eventTimer);
        clearInterval(this.distanceReportTimer);
        
        this.ui.addLog(TEXTS.CHAT.GAME_OVER, 'system');
        this.ui.addLog(`🏆 Пройдено: ${Math.floor(this.player.distance)} метров, Уровень: ${this.player.level}`, 'system');
        
        setTimeout(() => {
            if (confirm('Игра окончена! Начать заново?')) {
                chrome.storage.local.remove('gameSave');
                location.reload();
            }
        }, 100);
    }
    
    addEventListeners() {
        const inventoryBtn = document.getElementById('inventoryBtn');
        const craftBtn = document.getElementById('craftBtn');
        const restBtn = document.getElementById('restBtn');
        const perksBtn = document.getElementById('perksBtn');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        const closeInventoryBtn = document.getElementById('closeInventoryBtn');
        const prevWeaponBtn = document.getElementById('prevWeaponBtn');
        const nextWeaponBtn = document.getElementById('nextWeaponBtn');
        const prevArmorBtn = document.getElementById('prevArmorBtn');
        const nextArmorBtn = document.getElementById('nextArmorBtn');
        
        if (inventoryBtn) inventoryBtn.onclick = () => this.inventory.showInventory();
        if (craftBtn) craftBtn.onclick = () => this.craft();
        if (restBtn) {
            restBtn.onclick = () => {
                console.log('Rest button clicked from DOM');
                this.doRest();  // Вызываем переименованный метод
            };
        }
        if (perksBtn) perksBtn.onclick = () => this.ui.showPerks();
        if (chatToggleBtn) chatToggleBtn.onclick = () => this.toggleChat();
        if (closeInventoryBtn) closeInventoryBtn.onclick = () => {
            document.getElementById('inventoryModal').style.display = 'none';
        };
        if (prevWeaponBtn) prevWeaponBtn.onclick = () => this.prevWeapon();
        if (nextWeaponBtn) nextWeaponBtn.onclick = () => this.nextWeapon();
        if (prevArmorBtn) prevArmorBtn.onclick = () => this.prevArmor();
        if (nextArmorBtn) nextArmorBtn.onclick = () => this.nextArmor();
    }
}

// Создаем экземпляр игры после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});