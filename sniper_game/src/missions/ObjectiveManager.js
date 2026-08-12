export class ObjectiveManager {
    constructor(engine) {
        this.engine = engine;
        this.primaryObjectives = [];
        this.optionalObjectives = [];
        this.currentPrimaryIndex = 0;
    }

    // Accessor for TacticalTablet compatibility
    get objectives() {
        return {
            primary: this.primaryObjectives,
            optional: this.optionalObjectives,
        };
    }

    loadObjectives(primary, optional) {
        this.primaryObjectives = primary || [];
        this.optionalObjectives = optional || [];
        this.currentPrimaryIndex = 0;

        this.updateHUD();
    }

    getCurrentObjective() {
        if (this.currentPrimaryIndex < this.primaryObjectives.length) {
            return this.primaryObjectives[this.currentPrimaryIndex];
        }
        return null;
    }

    completeCurrentObjective() {
        let current = this.getCurrentObjective();
        if (current) {
            current.completed = true;
            this.engine.eventBus.emit('OBJECTIVE_COMPLETED', current);

            this.currentPrimaryIndex++;

            if (this.currentPrimaryIndex >= this.primaryObjectives.length) {
                this.engine.eventBus.emit('ALL_PRIMARY_OBJECTIVES_COMPLETE');
            }
        }
        this.updateHUD();
    }

    completeObjectiveById(id) {
        let current = this.getCurrentObjective();
        if (current && current.id === id) {
            this.completeCurrentObjective();
            return;
        }

        // Check optionals
        let opt = this.optionalObjectives.find(o => o.id === id);
        if (opt) {
            opt.completed = true;
            this.engine.eventBus.emit('OPTIONAL_OBJECTIVE_COMPLETED', opt);
            this.updateHUD();
        }
    }

    failOptionalObjective(id) {
        let opt = this.optionalObjectives.find(o => o.id === id);
        if (opt) {
            opt.completed = false;
            opt.failed = true;
            this.engine.eventBus.emit('OPTIONAL_OBJECTIVE_FAILED', opt);
            this.updateHUD();
        }
    }

    updateHUD() {
        let current = this.getCurrentObjective();

        let currentObjEl = document.getElementById('current-objective');
        if (currentObjEl) {
            currentObjEl.innerText = current ? current.title.toUpperCase() : "MISSION COMPLETE";
        }

        let descEl = document.querySelector('.hud-obj-desc');
        if (descEl) {
            descEl.innerText = current ? current.desc : "All mission objectives complete. Escape sector.";
        }

        let objListEl = document.getElementById('objective-list');
        if (objListEl) {
            let html = '<ul>';
            for (let i = 0; i < this.primaryObjectives.length; i++) {
                let obj = this.primaryObjectives[i];
                let statusClass = obj.completed ? 'completed' : (i === this.currentPrimaryIndex ? 'active' : 'pending');
                let icon = obj.completed ? '✓' : (i === this.currentPrimaryIndex ? '➢' : '○');
                html += `<li class="${statusClass}">${icon} ${obj.title}</li>`;
            }
            for (let opt of this.optionalObjectives) {
                let statusClass = opt.failed ? 'failed' : (opt.completed ? 'completed' : 'optional');
                let icon = opt.failed ? '✗' : (opt.completed ? '★' : '☆');
                html += `<li class="${statusClass}">${icon} [OPTIONAL] ${opt.title}</li>`;
            }
            html += '</ul>';
            objListEl.innerHTML = html;
        }
    }
}
