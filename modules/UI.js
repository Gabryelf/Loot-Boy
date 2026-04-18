// ============ МОДУЛЬ UI/ИНТЕРФЕЙСА ============

class UIManager {
    constructor(game, player, combat) {
        this.game = game;
        this.player = player;
        this.combat = combat;
        this.chatMessages = document.getElementById('chatMessages');
    }
    
    updateUI() {
        document.getElementById('hpValue').textContent = Math.floor(this.player.hp);
        document.getElementById('foodValue').textContent = Math.floor(this.player.food);
        document.getElementById('waterValue').textContent = Math.floor(this.player.water);
        document.getElementById('levelValue').textContent = this.player.level;
        this.updateExpCircle();
    }
    
    updateExpCircle() {
        const expCircle = document.getElementById('expCircleProgress');
        if (!expCircle) return;
        
        const progress = this.player.getExpProgress();
        const circumference = 2 * Math.PI * 28;
        const offset = circumference * (1 - progress);
        
        expCircle.style.strokeDashoffset = offset;
        expCircle.style.stroke = '#ffd700';
        expCircle.style.filter = 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.5))';
        
        const expNeeded = this.player.getExpNeeded();
        const expContainer = document.querySelector('.exp-container');
        if (expContainer) {
            expContainer.title = `Опыт: ${expNeeded.current} / ${expNeeded.needed}`;
        }
    }
    
    addLog(message, type = 'event') {
        const logEntry = document.createElement('div');
        logEntry.className = `chat-message ${type}`;
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logEntry.textContent = `[${time}] ${message}`;
        this.chatMessages.appendChild(logEntry);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        while (this.chatMessages.children.length > 50) {
            this.chatMessages.removeChild(this.chatMessages.firstChild);
        }
    }
    
    showInventory() {
        if (this.game.inventory) {
            this.game.inventory.showInventory();
        }
    }
    
    showPerks() {
        let modal = document.getElementById('perksModal');
        if (!modal) {
            modal = this.createPerksModal();
        }
        
        this.updatePerksList(modal);
        modal.style.display = 'flex';
    }
    
    createPerksModal() {
        const modal = document.createElement('div');
        modal.id = 'perksModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content perks-modal-content">
                <h3>⭐ СИСТЕМА ПЕРКОВ</h3>
                <div class="perks-points-display">⭐ ОЧКИ ПЕРКОВ: ${this.player.perkPoints} ⭐</div>
                <div id="perksList" class="perks-grid"></div>
                <div style="padding: 15px 0 5px 0; border-top: 1px solid #d4a043; margin-top: 10px;">
                    <button id="closePerksModalBtn" class="perks-close-btn">Закрыть</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = document.getElementById('closePerksModalBtn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                const modalElem = document.getElementById('perksModal');
                if (modalElem) modalElem.style.display = 'none';
            };
        }
        return modal;
    }
    
    updatePerksList(modal) {
        const perksDiv = document.getElementById('perksList');
        if (!perksDiv) return;
        
        perksDiv.innerHTML = '';
        
        const pointsDisplay = modal.querySelector('.perks-points-display');
        if (pointsDisplay) {
            pointsDisplay.innerHTML = `⭐ ОЧКИ ПЕРКОВ: ${this.player.perkPoints} ⭐`;
        }
        
        for (const [id, perk] of Object.entries(PERKS.available)) {
            const isUnlocked = this.player.level >= perk.requiredLevel;
            const isOwned = PERKS.active.includes(id);
            
            const perkCard = document.createElement('div');
            perkCard.className = `perk-card ${!isUnlocked || isOwned ? 'locked' : ''}`;
            perkCard.innerHTML = `
                <div class="perk-icon" style="color: ${perk.color}">${perk.icon}</div>
                <div class="perk-info">
                    <div class="perk-name" style="color: ${perk.color}">${perk.name}</div>
                    <div class="perk-description">${perk.description}</div>
                    <div class="perk-requirement">⭐ Требуется уровень ${perk.requiredLevel}</div>
                </div>
                <div class="perk-action">
                    ${this.getPerkActionHTML(id, isUnlocked, isOwned)}
                </div>
            `;
            
            if (isUnlocked && !isOwned && this.player.perkPoints > 0) {
                const learnBtn = perkCard.querySelector('.perk-learn-btn');
                if (learnBtn) {
                    learnBtn.onclick = () => this.game.unlockPerk(id);
                }
            }
            
            perksDiv.appendChild(perkCard);
        }
    }
    
    getPerkActionHTML(id, isUnlocked, isOwned) {
        if (isUnlocked && !isOwned && this.player.perkPoints > 0) {
            return '<button class="perk-learn-btn">Изучить</button>';
        } else if (isOwned) {
            return '<span class="perk-owned">✅ Изучен</span>';
        } else {
            return '<span class="perk-locked-text">🔒 Заблокирован</span>';
        }
    }
}