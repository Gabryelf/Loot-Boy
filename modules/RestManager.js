// ============ МОДУЛЬ ОТДЫХА ============

class RestManager {
    constructor(game, player, ui, events) {
        this.game = game;
        this.player = player;
        this.ui = ui;
        this.events = events;
        this.isResting = false;
        this.restTimer = null;
        this.restEventTimer = null;
        this.originalBackgroundSpeed = CONFIG.GAME.BACKGROUND_SPEED;
    }
    
    startRest() {
        console.log('RestManager.startRest() called');
        console.log('isResting:', this.isResting);
        console.log('inCombat:', this.game.combat.inCombat);
        console.log('food:', this.player.food, 'water:', this.player.water);
        
        if (this.isResting) {
            this.ui.addLog('Вы уже отдыхаете...', 'system');
            return;
        }
        
        if (this.game.combat.inCombat) {
            this.ui.addLog('❌ Нельзя отдыхать во время боя!', 'system');
            return;
        }
        
        if (this.player.food <= 8 || this.player.water <= 8) {
            this.ui.addLog(`❌ Недостаточно ресурсов для отдыха! Еда: ${Math.floor(this.player.food)}, Вода: ${Math.floor(this.player.water)} (нужно минимум 9)`, 'system');
            return;
        }
        
        this.isResting = true;
        this.game.isResting = true;
        
        // Останавливаем фон
        CONFIG.GAME.BACKGROUND_SPEED = 0;
        
        // Затемняем канвас
        this.game.canvas.style.filter = 'brightness(0.4) sepia(0.2)';
        this.game.canvas.style.transition = 'filter 1s';
        
        // Показываем костер
        this.game.showCampfire = true;
        
        this.ui.addLog('🔥 Вы развели костер и присели отдохнуть...', 'system');
        this.ui.addLog('⏳ Отдых будет длиться 5 секунд', 'system');
        
        // Запускаем таймер отдыха
        this.restTimer = setTimeout(() => {
            this.finishRest();
        }, 5000);
        
        // Шанс на событие во время отдыха
        this.restEventTimer = setTimeout(() => {
            if (this.isResting && Math.random() < 0.3) {
                this.interruptRestWithEvent();
            }
        }, 2000);
    }
    
    finishRest() {
        console.log('RestManager.finishRest() called');
        
        if (!this.isResting) return;
        
        if (this.restEventTimer) {
            clearTimeout(this.restEventTimer);
            this.restEventTimer = null;
        }
        
        const heal = Math.floor(Math.random() * 30) + 20;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.player.food -= 8;
        this.player.water -= 8;
        
        // Восстанавливаем фон
        CONFIG.GAME.BACKGROUND_SPEED = this.originalBackgroundSpeed;
        this.game.canvas.style.filter = '';
        this.game.canvas.style.transition = '';
        this.game.showCampfire = false;
        this.game.isResting = false;
        
        this.ui.addLog(`🔥 Отдых завершен! Восстановлено ${heal} HP`, 'system');
        this.ui.updateUI();
        this.game.saveGame();
        
        this.isResting = false;
        this.restTimer = null;
    }
    
    interruptRestWithEvent() {
        console.log('RestManager.interruptRestWithEvent() called');
        
        if (!this.isResting) return;
        
        if (this.restTimer) {
            clearTimeout(this.restTimer);
            this.restTimer = null;
        }
        if (this.restEventTimer) {
            clearTimeout(this.restEventTimer);
            this.restEventTimer = null;
        }
        
        CONFIG.GAME.BACKGROUND_SPEED = this.originalBackgroundSpeed;
        this.game.canvas.style.filter = '';
        this.game.canvas.style.transition = '';
        this.game.showCampfire = false;
        this.game.isResting = false;
        
        this.ui.addLog('⚠️ Ваш отдых прерван неожиданным событием!', 'system');
        this.isResting = false;
        
        setTimeout(() => {
            if (this.events && this.events.triggerRandomEvent) {
                this.events.triggerRandomEvent();
            }
        }, 500);
    }
    
    cancelRest() {
        if (!this.isResting) return;
        
        if (this.restTimer) clearTimeout(this.restTimer);
        if (this.restEventTimer) clearTimeout(this.restEventTimer);
        
        CONFIG.GAME.BACKGROUND_SPEED = this.originalBackgroundSpeed;
        this.game.canvas.style.filter = '';
        this.game.canvas.style.transition = '';
        this.game.showCampfire = false;
        this.game.isResting = false;
        
        this.ui.addLog('Отдых прерван.', 'system');
        this.isResting = false;
    }
    
    isRestingActive() {
        return this.isResting;
    }
}