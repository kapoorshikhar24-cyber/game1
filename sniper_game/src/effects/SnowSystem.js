/**
 * SnowSystem — Three.js particle snow for the Himalayan atmosphere.
 * Uses a BufferGeometry Points cloud for efficiency.
 */
export class SnowSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.count = 1800;
        this.range = 160;   // XZ spread around player
        this.height = 80;   // Max height above player
        this.speed = 4.5;   // Fall speed (units/sec)
        this.drift = 1.2;   // Horizontal drift amplitude

        this._buildParticles();
    }

    _buildParticles() {
        const positions = new Float32Array(this.count * 3);
        const velocities = new Float32Array(this.count * 3); // x-drift, _, z-drift per particle

        for (let i = 0; i < this.count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * this.range;
            positions[i * 3 + 1] = Math.random() * this.height;
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.range;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * this.drift;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * this.drift * 0.5;
        }

        this.velocities = velocities;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xddeeff,
            size: 0.22,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);

        this.posAttr = geo.attributes.position;
    }

    update(dt) {
        if (!this.camera || !this.posAttr) return;

        const camX = this.camera.position.x;
        const camZ = this.camera.position.z;
        const camY = this.camera.position.y;
        const halfRange = this.range / 2;

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            // Fall downward
            this.posAttr.array[i3 + 1] -= this.speed * dt;
            // Drift
            this.posAttr.array[i3 + 0] += this.velocities[i3 + 0] * dt;
            this.posAttr.array[i3 + 2] += this.velocities[i3 + 2] * dt;

            // Wrap below ground → reset to top of column
            if (this.posAttr.array[i3 + 1] < camY - 2) {
                this.posAttr.array[i3 + 1] = camY + this.height * Math.random();
                this.posAttr.array[i3 + 0] = camX + (Math.random() - 0.5) * this.range;
                this.posAttr.array[i3 + 2] = camZ + (Math.random() - 0.5) * this.range;
            }

            // Clamp XZ to follow camera
            if (Math.abs(this.posAttr.array[i3 + 0] - camX) > halfRange) {
                this.posAttr.array[i3 + 0] = camX + (Math.random() - 0.5) * this.range;
            }
            if (Math.abs(this.posAttr.array[i3 + 2] - camZ) > halfRange) {
                this.posAttr.array[i3 + 2] = camZ + (Math.random() - 0.5) * this.range;
            }
        }

        this.posAttr.needsUpdate = true;
    }
}
