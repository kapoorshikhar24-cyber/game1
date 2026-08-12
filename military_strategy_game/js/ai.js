class AI {
    static THREAT_SCORES = {
        'Tank': 100,
        'Artillery': 90,
        'Infantry': 50,
        'Recon': 30
    };

    static async takeTurn(gameManager) {
        let enemyUnits = gameManager.units.filter(u => u.team === CONFIG.TEAMS.ENEMY);
        
        for (let unit of enemyUnits) {
            // Check if unit was destroyed during another unit's attack (e.g. counter-attack logic if implemented later)
            if (!gameManager.units.includes(unit)) continue;
            
            // Artificial delay for visual tracking
            await new Promise(r => setTimeout(r, 600));
            
            gameManager.selectedUnit = unit;
            gameManager.calculateValidActions();
            gameManager.updateUI();

            this.processUnit(unit, gameManager);
            
            // Re-render to show movement/attack
            gameManager.draw();
            
            await new Promise(r => setTimeout(r, 400));
        }

        gameManager.clearSelection();
        gameManager.endTurn();
    }

    static processUnit(unit, gameManager) {
        let playerUnits = gameManager.units.filter(u => u.team === CONFIG.TEAMS.PLAYER);
        if (playerUnits.length === 0) return;

        // 1. Retreat Check
        if (unit.hp < (unit.maxHp * 0.25)) {
            this.executeRetreat(unit, playerUnits, gameManager);
            return;
        }

        // 2. Evaluate Threat & Select Target
        let target = this.selectBestTarget(unit, playerUnits, gameManager);
        if (!target) return;

        // 3. Attack or Advance
        let dist = this.getDistance(unit.x, unit.y, target.x, target.y);
        
        if (dist <= unit.range) {
            // Attack
            Combat.executeAttack(gameManager, unit, target);
        } else {
            // Advance
            this.executeAdvance(unit, target, gameManager);
            
            // Try to attack after moving
            gameManager.calculateValidActions();
            if (this.getDistance(unit.x, unit.y, target.x, target.y) <= unit.range && !unit.hasAttacked) {
                Combat.executeAttack(gameManager, unit, target);
            }
        }
    }

    static selectBestTarget(unit, playerUnits, gameManager) {
        let bestTarget = null;
        let highestScore = -9999;

        for (let pUnit of playerUnits) {
            let dist = this.getDistance(unit.x, unit.y, pUnit.x, pUnit.y);
            let baseThreat = this.THREAT_SCORES[pUnit.name] || 10;
            
            // Prefer targets that are closer (reduce threat score by distance penalty)
            let score = baseThreat - (dist * 2);
            
            // Bonus if we can attack it right now
            if (dist <= unit.range) {
                score += 50;
            }

            if (score > highestScore) {
                highestScore = score;
                bestTarget = pUnit;
            }
        }
        return bestTarget;
    }

    static executeAdvance(unit, target, gameManager) {
        if (gameManager.validMoves.length === 0) return;

        // Find the valid move tile that gets us closest to the target
        let bestMove = null;
        let minDistance = 9999;

        for (let move of gameManager.validMoves) {
            let dist = this.getDistance(move.x, move.y, target.x, target.y);
            if (dist < minDistance) {
                minDistance = dist;
                bestMove = move;
            }
        }

        if (bestMove) {
            let terrain = gameManager.map.getTile(bestMove.x, bestMove.y);
            unit.mp -= terrain.moveCost;
            unit.x = bestMove.x;
            unit.y = bestMove.y;
        }
    }

    static executeRetreat(unit, playerUnits, gameManager) {
        if (gameManager.validMoves.length === 0) return;

        // Find the most dangerous nearby player
        let closestPlayer = playerUnits.reduce((closest, curr) => {
            let d1 = this.getDistance(unit.x, unit.y, closest.x, closest.y);
            let d2 = this.getDistance(unit.x, unit.y, curr.x, curr.y);
            return d2 < d1 ? curr : closest;
        }, playerUnits[0]);

        // Find the valid move tile that gets us furthest away from them
        let bestMove = null;
        let maxDistance = -1;

        for (let move of gameManager.validMoves) {
            let dist = this.getDistance(move.x, move.y, closestPlayer.x, closestPlayer.y);
            if (dist > maxDistance) {
                maxDistance = dist;
                bestMove = move;
            }
        }

        if (bestMove) {
            let terrain = gameManager.map.getTile(bestMove.x, bestMove.y);
            unit.mp -= terrain.moveCost;
            unit.x = bestMove.x;
            unit.y = bestMove.y;
        }
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
}
