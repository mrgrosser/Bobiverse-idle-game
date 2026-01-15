const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Location data (matching frontend)
const locations = {
    earth: { miningMultiplier: 1 },
    mars: { miningMultiplier: 1.25 },
    venus: { miningMultiplier: 1.6 },
    'asteroid-belt': { miningMultiplier: 1.5 },
    mercury: { miningMultiplier: 1.75 },
    jupiter: { miningMultiplier: 2 },
    saturn: { miningMultiplier: 2.5 },
    sun: { miningMultiplier: 4 }
};

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// Database setup
const dbPath = path.join(dataDir, 'game.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY,
      resources REAL DEFAULT 0,
      probes INTEGER DEFAULT 1,
      replication_cost REAL DEFAULT 100,
      mining_rate REAL DEFAULT 1,
      current_location TEXT DEFAULT 'earth',
      unlocked_locations TEXT DEFAULT '["earth"]',
      upgrades TEXT DEFAULT '{}',
      last_update INTEGER DEFAULT 0,
      total_mined REAL DEFAULT 0
    )
  `);

  // Create default game state if it doesn't exist
  db.get('SELECT * FROM game_state WHERE id = 1', (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO game_state (id, last_update)
        VALUES (1, ?)
      `, [Date.now()]);
    }
  });
}

// Input validation
function validateGameState(data) {
  const errors = [];

  if (typeof data.resources !== 'number' || data.resources < 0) {
    errors.push('Invalid resources value');
  }
  if (typeof data.probes !== 'number' || data.probes < 1 || !Number.isInteger(data.probes)) {
    errors.push('Invalid probes value');
  }
  if (typeof data.replicationCost !== 'number' || data.replicationCost < 0) {
    errors.push('Invalid replicationCost value');
  }
  if (typeof data.miningRate !== 'number' || data.miningRate < 0) {
    errors.push('Invalid miningRate value');
  }
  if (typeof data.currentLocation !== 'string' || !locations[data.currentLocation]) {
    errors.push('Invalid currentLocation');
  }
  if (!Array.isArray(data.unlockedLocations) || data.unlockedLocations.length === 0) {
    errors.push('Invalid unlockedLocations');
  }
  if (typeof data.upgrades !== 'object' || data.upgrades === null || Array.isArray(data.upgrades)) {
    errors.push('Invalid upgrades');
  }
  if (typeof data.totalMined !== 'number' || data.totalMined < 0) {
    errors.push('Invalid totalMined value');
  }

  return errors;
}

// Get game state
app.get('/api/game', (req, res) => {
  db.get('SELECT * FROM game_state WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Calculate idle earnings (matching frontend calculation)
    const now = Date.now();
    const timeDiff = (now - row.last_update) / 1000; // seconds
    const upgrades = JSON.parse(row.upgrades);
    const locationMultiplier = locations[row.current_location]?.miningMultiplier || 1;
    const automationBonus = upgrades.automation1 ? 2 : 1;
    const idleEarnings = row.mining_rate * row.probes * locationMultiplier * automationBonus * timeDiff;

    const gameState = {
      resources: row.resources + idleEarnings,
      probes: row.probes,
      replicationCost: row.replication_cost,
      miningRate: row.mining_rate,
      currentLocation: row.current_location,
      unlockedLocations: JSON.parse(row.unlocked_locations),
      upgrades: upgrades,
      totalMined: row.total_mined + idleEarnings,
      idleEarnings: idleEarnings
    };

    res.json(gameState);
  });
});

// Update game state
app.post('/api/game', (req, res) => {
  const {
    resources,
    probes,
    replicationCost,
    miningRate,
    currentLocation,
    unlockedLocations,
    upgrades,
    totalMined
  } = req.body;

  // Validate input
  const validationErrors = validateGameState(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  db.run(`
    UPDATE game_state
    SET resources = ?,
        probes = ?,
        replication_cost = ?,
        mining_rate = ?,
        current_location = ?,
        unlocked_locations = ?,
        upgrades = ?,
        last_update = ?,
        total_mined = ?
    WHERE id = 1
  `, [
    resources,
    probes,
    replicationCost,
    miningRate,
    currentLocation,
    JSON.stringify(unlockedLocations),
    JSON.stringify(upgrades),
    Date.now(),
    totalMined
  ], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Reset game
app.post('/api/reset', (req, res) => {
  db.run(`
    UPDATE game_state 
    SET resources = 0,
        probes = 1,
        replication_cost = 100,
        mining_rate = 1,
        current_location = 'earth',
        unlocked_locations = '["earth"]',
        upgrades = '{}',
        last_update = ?,
        total_mined = 0
    WHERE id = 1
  `, [Date.now()], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bobiverse Idle Game running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
