// ============ МОДУЛЬ СОБЫТИЙ ============

class EventManager {
    constructor(game, player, combat, ui) {
        this.game = game;
        this.player = player;
        this.combat = combat;
        this.ui = ui;
    }
    
    triggerRandomEvent() {
        const eventData = TEXTS.EVENTS[Math.floor(Math.random() * TEXTS.EVENTS.length)];
        this.showEventModal(eventData);
    }
    
    showEventModal(eventData) {
        clearInterval(this.game.gameLoop);
        clearInterval(this.game.eventTimer);
        
        const modal = document.getElementById('choiceModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Устанавливаем фон события
        if (eventData.backgroundImage) {
            modalContent.style.backgroundImage = `url(${eventData.backgroundImage})`;
            modalContent.style.backgroundSize = 'cover';
            modalContent.style.backgroundPosition = 'center';
        } else {
            modalContent.style.backgroundImage = 'linear-gradient(135deg, #1a0f05 0%, #0f0a03 100%)';
        }
        
        document.getElementById('modalText').innerHTML = `
            <div class="event-title">${eventData.title}</div>
            <div class="event-description">${eventData.description}</div>
        `;
        
        const optionsDiv = document.getElementById('modalOptions');
        optionsDiv.innerHTML = '';
        
        eventData.options.forEach((option) => {
            const btn = document.createElement('button');
            btn.textContent = option.text;
            btn.className = 'event-option-btn';
            btn.onclick = () => {
                this.applyEventEffects(option.effects);
                modal.style.display = 'none';
                modalContent.style.backgroundImage = '';
                this.game.startGameLoop();
                this.game.startEventTimer();
                this.game.updateUI();
                this.game.saveGame();
            };
            optionsDiv.appendChild(btn);
        });
        
        modal.style.display = 'flex';
    }
    
    applyEventEffects(effects) {
        for (const effectId of effects) {
            const effect = TEXTS.EFFECTS[effectId];
            if (!effect) continue;
            
            this.ui.addLog(effect.log, 'event');
            
            if (effect.hp) this.player.hp = Math.min(this.player.maxHp, Math.max(0, this.player.hp + effect.hp));
            if (effect.food) this.player.food = Math.min(100, Math.max(0, this.player.food + effect.food));
            if (effect.water) this.player.water = Math.min(100, Math.max(0, this.player.water + effect.water));
            if (effect.exp) {
                this.player.addExp(effect.exp, (level) => {
                    this.ui.addLog(TEXTS.CHAT.LEVEL_UP, 'level');
                    this.ui.addLog(`Достигнут ${level} уровень! +20 HP`, 'level');
                });
            }
            if (effect.item) {
                for (let i = 0; i < (effect.value || 1); i++) {
                    this.player.inventory.push({ name: effect.item, type: 'consumable', value: 25 });
                }
            }
            if (effect.combat) {
                const enemies = TEXTS.ENEMIES.filter(e => e.level === (effect.combat === 'easy' ? 1 : effect.combat === 'hard' ? 2 : 1));
                const enemy = enemies[Math.floor(Math.random() * enemies.length)];
                this.combat.startBattle(enemy);
            }
        }
    }
}