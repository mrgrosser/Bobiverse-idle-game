# 🛸 Bobiverse: Von Neumann Probe Idle Game

A web-based idle/incremental game inspired by Dennis E. Taylor's Bobiverse series. Build, replicate, and expand your probe fleet across the solar system!

## 🎮 Game Features

- **Animated Solar System Map**: Watch your probes travel between celestial bodies
- **Resource Management**: Mine raw materials from asteroids, moons, planets, and even the Sun
- **Exponential Growth**: Replicate your probes to increase mining efficiency
- **Location-Based Bonuses**: Each location provides different mining multipliers
- **Upgrade System**: Enhance your mining rate, replication efficiency, and automation
- **Idle Mechanics**: Earn resources even when you're away
- **Persistent Saves**: SQLite database stores your progress
- **Beautiful Space Theme**: Dark mode UI with animated starfield

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bobiverse-idle-game.git
cd bobiverse-idle-game
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. Access the game at `http://localhost:3000`

That's it! Your game is now running in a container.

## 🏗️ Manual Installation (Without Docker)

If you prefer to run it without Docker:

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

Access the game at `http://localhost:3000`

## 🎯 How to Play

1. **Start Mining**: Click "Mine Resources" or let your probes mine automatically
2. **Replicate Probes**: Spend resources to create more probes (exponential cost increase)
3. **Unlock Locations**: Travel to new celestial bodies to unlock better mining rates
4. **Purchase Upgrades**: Enhance your mining efficiency and reduce replication costs
5. **Expand Your Empire**: Work your way from Earth to the Sun!

### Location Progression
- 🌍 **Earth** (1x) - Starting location
- ♂ **Mars** (1.25x) - Unlock cost: 300
- 🪨 **Asteroid Belt** (1.5x) - Unlock cost: 500
- ♀ **Venus** (1.6x) - Unlock cost: 800
- ☿ **Mercury** (1.75x) - Unlock cost: 1,000
- ♃ **Jupiter** (2x) - Unlock cost: 2,000
- ♄ **Saturn** (2.5x) - Unlock cost: 5,000
- ☀️ **Sol** (4x) - Unlock cost: 20,000

## 🐳 Docker Deployment Details

### Building the Image
```bash
docker build -t bobiverse-idle-game .
```

### Running with Custom Port
```bash
docker run -d \
  -p 8080:3000 \
  -v game-data:/app/data \
  --name bobiverse-game \
  bobiverse-idle-game
```

### Behind a Reverse Proxy

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name game.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Example Traefik labels in docker-compose.yml:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.bobiverse.rule=Host(`game.yourdomain.com`)"
  - "traefik.http.services.bobiverse.loadbalancer.server.port=3000"
```

## 💾 Data Persistence

Game saves are stored in a SQLite database in the `data/` directory. When using Docker, this is mounted as a volume to persist across container restarts.

### Backup Your Save
```bash
# Copy the database from the container
docker cp bobiverse-idle-game:/app/data/game.db ./backup-game.db

# Or if using docker-compose with volumes
docker run --rm -v bobiverse-idle-game_game-data:/data -v $(pwd):/backup alpine tar czf /backup/game-backup.tar.gz -C /data .
```

### Restore a Save
```bash
docker cp ./backup-game.db bobiverse-idle-game:/app/data/game.db
```

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (production/development)

### Modifying Game Balance
Edit the following in `public/game.js`:
- `replicationCost` - Initial probe replication cost
- `miningRate` - Base mining rate
- Location `miningMultiplier` values
- Upgrade costs and effects

## 📊 API Endpoints

- `GET /api/game` - Retrieve current game state
- `POST /api/game` - Save game state
- `POST /api/reset` - Reset game to initial state

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Container**: Docker with Alpine Linux base

## 🎨 Customization Ideas

- Add more celestial bodies (Neptune, Uranus, Pluto, Kuiper Belt)
- Implement prestige/reset mechanics for long-term progression
- Add achievements system
- Include resource types (metals, gases, exotic matter)
- Create random events (asteroid encounters, solar flares)
- Add multiplayer leaderboards

## 📝 License

MIT License - Feel free to modify and use for your own homelab!

## 🤝 Contributing

This is a personal project, but feel free to fork and create your own version!

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs bobiverse-idle-game

# Rebuild without cache
docker-compose build --no-cache
```

### Database issues
```bash
# Remove the volume and restart
docker-compose down -v
docker-compose up -d
```

### Port already in use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

## 🎭 Credits

Inspired by the Bobiverse book series by Dennis E. Taylor. If you enjoy this game, definitely check out the books!

---

*"We are Bob. Resistance is futile."* - Bob (probably)
