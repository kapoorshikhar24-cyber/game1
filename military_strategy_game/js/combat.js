class Combat {
    static calculateDamage(attacker, defender, terrain) {
        // Base formula: Damage = Attacker Attack - Defender Defense + Terrain Bonus + Random Modifier
        let defBonus = terrain ? terrain.defBonus : 0;
        let totalDefense = defender.defense + defBonus;
        
        let baseDamage = attacker.attackPower - totalDefense;
        if (baseDamage < 5) baseDamage = 5; // Minimum damage
        
        // Random modifier between -5 and +5
        let randomMod = Math.floor(Math.random() * 11) - 5;
        
        let finalDamage = baseDamage + randomMod;
        return Math.max(0, finalDamage);
    }

    static executeAttack(gameManager, attacker, defender) {
        let terrain = gameManager.map.getTile(defender.x, defender.y);
        let damage = this.calculateDamage(attacker, defender, terrain);
        
        defender.hp -= damage;
        attacker.hasAttacked = true;
        
        if (defender.hp <= 0) {
            defender.hp = 0;
            gameManager.destroyUnit(defender);
        }
    }
}
