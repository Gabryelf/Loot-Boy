// ============ МОДУЛЬ ИНВЕНТАРЯ ============

class InventoryManager {
    constructor(game, player, ui) {
        this.game = game;
        this.player = player;
        this.ui = ui;
    }
    
    showInventory() {
        const modal = document.getElementById('inventoryModal');
        this.updateInventoryUI();
        modal.style.display = 'flex';
    }
    
    updateInventoryUI() {
        this.updateWeaponSlot();
        this.updateArmorSlot();
        this.updateInventoryList();
    }
    
    updateWeaponSlot() {
        const weaponSlot = document.getElementById('currentWeaponSlot');
        const currentWeapon = this.player.weapons[this.player.currentWeapon];
        
        weaponSlot.innerHTML = `
            <div class="equipment-icon">
                <canvas class="weapon-icon-canvas" width="40" height="40"></canvas>
            </div>
            <div class="equipment-info">
                <div class="equipment-name">${currentWeapon.name}</div>
                <div class="equipment-stats">⚔️ Урон: ${currentWeapon.damage}</div>
                ${currentWeapon.ammo !== null ? `<div class="equipment-stats">🔫 Патроны: ${currentWeapon.ammo}/${currentWeapon.maxAmmo}</div>` : ''}
            </div>
        `;
        
        const weaponCanvas = weaponSlot.querySelector('.weapon-icon-canvas');
        const weaponSpriteKey = this.game.getWeaponSpriteKey(currentWeapon.name);
        if (this.game.sprites[weaponSpriteKey]) {
            const ctx = weaponCanvas.getContext('2d');
            ctx.drawImage(this.game.sprites[weaponSpriteKey], 0, 0, 40, 40);
        }
    }
    
    updateArmorSlot() {
        const armorSlot = document.getElementById('currentArmorSlot');
        const currentArmor = this.player.armorItems[this.player.currentArmor];
        
        armorSlot.innerHTML = `
            <div class="equipment-icon">
                <canvas class="armor-icon-canvas" width="40" height="40"></canvas>
            </div>
            <div class="equipment-info">
                <div class="equipment-name">${currentArmor.name}</div>
                <div class="equipment-stats">🛡️ Защита: ${currentArmor.defense}</div>
            </div>
        `;
        
        const armorCanvas = armorSlot.querySelector('.armor-icon-canvas');
        const armorSpriteKey = currentArmor.name.toUpperCase().replace(/ /g, '_');
        if (this.game.sprites[armorSpriteKey]) {
            const ctx = armorCanvas.getContext('2d');
            ctx.drawImage(this.game.sprites[armorSpriteKey], 0, 0, 40, 40);
        }
    }
    
    updateInventoryList() {
        const inventoryDiv = document.getElementById('inventoryList');
        inventoryDiv.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            inventoryDiv.innerHTML = `<div class="empty-inventory">📦 Пусто...</div>`;
            return;
        }
        
        this.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-actions">
                    <button class="item-action-btn use-btn" data-index="${index}">Использовать</button>
                    <button class="item-action-btn scrap-btn" data-index="${index}">Разобрать</button>
                    <button class="item-action-btn drop-btn" data-index="${index}">Выбросить</button>
                </div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
        
        this.attachInventoryEvents();
    }
    
    attachInventoryEvents() {
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
    
    useItem(index) {
        const item = this.player.inventory[index];
        
        if (item.name === 'Аптечка') {
            const healAmount = Math.floor(25 * this.player.healBonus);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            this.ui.addLog(`💊 Использовали аптечку +${healAmount} HP`, 'system');
            this.player.inventory.splice(index, 1);
        } else if (item.name.includes('Патроны')) {
            const weapon = this.player.weapons[this.player.currentWeapon];
            if (weapon && weapon.ammo !== null) {
                const amount = item.value || 10;
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
                this.ui.addLog(`🔫 Добавлено ${amount} патронов`, 'system');
                this.player.inventory.splice(index, 1);
            }
        }
        
        this.game.updateUI();
        this.updateInventoryUI();
        this.game.saveGame();
    }
    
    scrapItem(index) {
        const item = this.player.inventory[index];
        const scrapValue = Math.floor(item.value / 2) || 5;
        this.player.inventory.push({ name: 'Металлолом', type: 'craft', value: scrapValue });
        this.player.inventory.splice(index, 1);
        this.ui.addLog(`🔧 Разобрали ${item.name} на металлолом`, 'system');
        this.updateInventoryUI();
        this.game.saveGame();
    }
    
    dropItem(index) {
        this.player.inventory.splice(index, 1);
        this.ui.addLog(`🗑️ Предмет выброшен`, 'system');
        this.updateInventoryUI();
        this.game.saveGame();
    }
}