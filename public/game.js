// Game State
let gameState = {
    resources: 0,
    probes: 1,
    replicationCost: 100,
    miningRate: 1,
    currentLocation: 'earth',
    unlockedLocations: ['earth'],
    upgrades: {},
    totalMined: 0
};

// Location data
const locations = {
    earth: {
        name: 'Earth',
        description: 'Home base. The journey begins here.',
        miningMultiplier: 1,
        unlockCost: 0,
        connections: ['asteroid-belt', 'mars']
    },
    'asteroid-belt': {
        name: 'Asteroid Belt',
        description: 'Rich in raw materials. Mining efficiency +50%.',
        miningMultiplier: 1.5,
        unlockCost: 500,
        connections: ['earth', 'mars', 'jupiter']
    },
    mars: {
        name: 'Mars',
        description: 'The Red Planet. Mining efficiency +25%.',
        miningMultiplier: 1.25,
        unlockCost: 300,
        connections: ['earth', 'asteroid-belt']
    },
    jupiter: {
        name: 'Jupiter',
        description: 'Gas giant with resource-rich moons. Mining efficiency +100%.',
        miningMultiplier: 2,
        unlockCost: 2000,
        connections: ['asteroid-belt', 'saturn']
    },
    saturn: {
        name: 'Saturn',
        description: 'Ringed beauty with abundant resources. Mining efficiency +150%.',
        miningMultiplier: 2.5,
        unlockCost: 5000,
        connections: ['jupiter', 'sun']
    },
    sun: {
        name: 'Sol',
        description: 'The ultimate power source. Mining efficiency +300%.',
        miningMultiplier: 4,
        unlockCost: 20000,
        connections: ['saturn']
    },
    mercury: {
        name: 'Mercury',
        description: 'Dense with metals. Mining efficiency +75%.',
        miningMultiplier: 1.75,
        unlockCost: 1000,
        connections: ['venus', 'sun']
    },
    venus: {
        name: 'Venus',
        description: 'Harsh environment, rich rewards. Mining efficiency +60%.',
        miningMultiplier: 1.6,
        unlockCost: 800,
        connections: ['earth', 'mercury']
    }
};

// Upgrade definitions
const upgrades = {
    mining1: { cost: 500, name: 'Enhanced Mining', effect: () => gameState.miningRate += 1 },
    efficiency1: { cost: 1000, name: 'Efficient Replication', effect: () => gameState.replicationCost *= 0.9 },
    mining2: { cost: 2500, name: 'Advanced Mining', effect: () => gameState.miningRate += 2, requires: 'mining1' },
    automation1: { cost: 5000, name: 'Basic Automation', effect: () => {} } // Passive effect handled in mining calculation
};

// Game loop
let lastUpdate = Date.now();
let autoSaveInterval;

function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastUpdate) / 1000; // seconds
    lastUpdate = now;

    // Idle resource generation
    const currentMultiplier = locations[gameState.currentLocation].miningMultiplier;
    const automationBonus = gameState.upgrades.automation1 ? 2 : 1;
    const idleGain = gameState.miningRate * gameState.probes * currentMultiplier * automationBonus * deltaTime;
    
    gameState.resources += idleGain;
    gameState.totalMined += idleGain;

    updateUI();
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('resources').textContent = Math.floor(gameState.resources).toLocaleString();
    document.getElementById('probes').textContent = gameState.probes.toLocaleString();
    document.getElementById('mining-rate').textContent = (gameState.miningRate * locations[gameState.currentLocation].miningMultiplier * (gameState.upgrades.automation1 ? 2 : 1)).toFixed(1);
    document.getElementById('total-mined').textContent = Math.floor(gameState.totalMined).toLocaleString();
    document.getElementById('replicate-cost').textContent = `(Cost: ${Math.floor(gameState.replicationCost).toLocaleString()})`;
    document.getElementById('current-location').textContent = locations[gameState.currentLocation].name;
    document.getElementById('location-description').textContent = locations[gameState.currentLocation].description;

    // Update replicate button
    const replicateBtn = document.getElementById('replicate-btn');
    replicateBtn.disabled = gameState.resources < gameState.replicationCost;

    // Update upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upgradeId = btn.dataset.upgrade;
        const upgrade = upgrades[upgradeId];
        
        if (gameState.upgrades[upgradeId]) {
            btn.classList.add('purchased');
            btn.disabled = true;
        } else {
            const canAfford = gameState.resources >= upgrade.cost;
            const meetsRequirements = !upgrade.requires || gameState.upgrades[upgrade.requires];
            btn.disabled = !canAfford || !meetsRequirements;
        }
    });

    // Update travel buttons
    updateTravelButtons();
}

function updateTravelButtons() {
    const travelContainer = document.getElementById('travel-buttons');
    travelContainer.innerHTML = '';

    const currentConnections = locations[gameState.currentLocation].connections;

    currentConnections.forEach(locationId => {
        const location = locations[locationId];
        const isUnlocked = gameState.unlockedLocations.includes(locationId);
        
        const btn = document.createElement('button');
        btn.className = 'travel-btn';
        btn.textContent = `${location.name}${!isUnlocked ? ` (Unlock: ${location.unlockCost})` : ''}`;
        btn.disabled = !isUnlocked && gameState.resources < location.unlockCost;
        
        btn.onclick = () => travelTo(locationId);
        travelContainer.appendChild(btn);
    });
}

function travelTo(locationId) {
    const location = locations[locationId];
    
    // Check if location needs to be unlocked
    if (!gameState.unlockedLocations.includes(locationId)) {
        if (gameState.resources >= location.unlockCost) {
            gameState.resources -= location.unlockCost;
            gameState.unlockedLocations.push(locationId);
            
            // Mark location as unlocked on map
            const element = document.querySelector(`[data-location="${locationId}"]`);
            if (element) {
                element.classList.add('unlocked');
            }
        } else {
            return;
        }
    }

    // Animate probe travel
    animateProbeTravel(gameState.currentLocation, locationId);
    
    // Update current location
    gameState.currentLocation = locationId;
    
    // Update active state on map
    document.querySelectorAll('.celestial-body').forEach(el => el.classList.remove('active'));
    const newLocation = document.querySelector(`[data-location="${locationId}"]`);
    if (newLocation) {
        newLocation.classList.add('active');
    }

    updateUI();
}

function animateProbeTravel(fromId, toId) {
    const probe = document.getElementById('probe');
    const fromElement = document.querySelector(`[data-location="${fromId}"]`);
    const toElement = document.querySelector(`[data-location="${toId}"]`);

    if (!fromElement || !toElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const containerRect = document.getElementById('solar-system').getBoundingClientRect();

    const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
    const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
    const toX = toRect.left - containerRect.left + toRect.width / 2;
    const toY = toRect.top - containerRect.top + toRect.height / 2;

    probe.style.left = `${toX}px`;
    probe.style.top = `${toY}px`;
}

function initializeProbePosition() {
    const earthElement = document.querySelector('[data-location="earth"]');
    if (earthElement) {
        const rect = earthElement.getBoundingClientRect();
        const containerRect = document.getElementById('solar-system').getBoundingClientRect();
        const probe = document.getElementById('probe');
        
        probe.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        probe.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
    }
}

// Event Handlers
document.getElementById('mine-btn').addEventListener('click', () => {
    const mineAmount = gameState.miningRate * gameState.probes * locations[gameState.currentLocation].miningMultiplier;
    gameState.resources += mineAmount;
    gameState.totalMined += mineAmount;
    
    // Visual feedback
    const btn = document.getElementById('mine-btn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);
    
    updateUI();
});

document.getElementById('replicate-btn').addEventListener('click', () => {
    if (gameState.resources >= gameState.replicationCost) {
        gameState.resources -= gameState.replicationCost;
        gameState.probes += 1;
        gameState.replicationCost = Math.floor(gameState.replicationCost * 1.15);
        updateUI();
    }
});

document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const upgradeId = btn.dataset.upgrade;
        const upgrade = upgrades[upgradeId];
        
        if (!gameState.upgrades[upgradeId] && gameState.resources >= upgrade.cost) {
            gameState.resources -= upgrade.cost;
            gameState.upgrades[upgradeId] = true;
            upgrade.effect();
            updateUI();
        }
    });
});

document.getElementById('save-btn').addEventListener('click', saveGame);
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the game? All progress will be lost!')) {
        resetGame();
    }
});

// Save/Load System
async function saveGame() {
    try {
        const response = await fetch('/api/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
        });
        
        if (response.ok) {
            const btn = document.getElementById('save-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => btn.textContent = originalText, 2000);
        }
    } catch (error) {
        console.error('Save failed:', error);
    }
}

async function loadGame() {
    try {
        const response = await fetch('/api/game');
        const data = await response.json();
        
        if (data.idleEarnings > 0) {
            console.log(`Earned ${Math.floor(data.idleEarnings)} resources while away!`);
        }
        
        gameState = {
            resources: data.resources,
            probes: data.probes,
            replicationCost: data.replicationCost,
            miningRate: data.miningRate,
            currentLocation: data.currentLocation,
            unlockedLocations: data.unlockedLocations,
            upgrades: data.upgrades,
            totalMined: data.totalMined
        };
        
        // Update map to show unlocked locations
        gameState.unlockedLocations.forEach(locationId => {
            const element = document.querySelector(`[data-location="${locationId}"]`);
            if (element) {
                element.classList.add('unlocked');
            }
        });
        
        // Set active location
        document.querySelectorAll('.celestial-body').forEach(el => el.classList.remove('active'));
        const activeElement = document.querySelector(`[data-location="${gameState.currentLocation}"]`);
        if (activeElement) {
            activeElement.classList.add('active');
        }
        
        updateUI();
        initializeProbePosition();
        
        // Move probe to current location
        setTimeout(() => {
            animateProbeTravel('earth', gameState.currentLocation);
        }, 100);
        
    } catch (error) {
        console.error('Load failed:', error);
    }
}

async function resetGame() {
    try {
        await fetch('/api/reset', { method: 'POST' });
        location.reload();
    } catch (error) {
        console.error('Reset failed:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    gameLoop();
    
    // Auto-save every 30 seconds
    autoSaveInterval = setInterval(saveGame, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', saveGame);
});
