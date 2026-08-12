export class AssetManager {
    constructor(engine) {
        this.engine = engine;
        this.models = {};
        this.textures = {};
        this.sounds = {};
        this.materials = {};

        // Initialize Three.js Loaders
        this.textureLoader = new THREE.TextureLoader();
        
        if (typeof THREE.GLTFLoader !== 'undefined') {
            this.gltfLoader = new THREE.GLTFLoader();
            if (typeof THREE.DRACOLoader !== 'undefined') {
                const dracoLoader = new THREE.DRACOLoader();
                dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
                this.gltfLoader.setDRACOLoader(dracoLoader);
            }
        }

        if (typeof THREE.RGBELoader !== 'undefined') {
            this.rgbeLoader = new THREE.RGBELoader();
        }

        // Pre-generate high quality procedural fallback PBR textures
        this.initProceduralFallbacks();

        // Preload external GLTF/GLB environment assets
        this.preloadEnvironmentAssets();
    }

    /**
     * Preloads core 3D GLTF models like rocks and cliffs.
     */
    async preloadEnvironmentAssets() {
        await this.loadModel(
            'namaqualand_cliff_01',
            '/assets/environment/rocks/namaqualand_cliff_01_1k.gltf/namaqualand_cliff_01_1k.gltf'
        );
    }

    /**
     * Loads a GLTF / GLB 3D model into cache.
     * @param {string} name - Asset key identifier
     * @param {string} path - File path relative to project root
     */
    async loadModel(name, path) {
        if (!this.gltfLoader) {
            console.warn(`GLTFLoader unavailable. Model '${name}' cannot be loaded.`);
            return null;
        }

        return new Promise((resolve) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    this.models[name] = gltf.scene;
                    console.log(`[AssetManager] Successfully loaded 3D model: ${name}`);
                    resolve(gltf.scene);
                },
                undefined,
                (err) => {
                    console.warn(`[AssetManager] Model load failed (${path}). Using fallback proxy geometry.`, err);
                    resolve(null);
                }
            );
        });
    }

    /**
     * Loads a texture file into cache.
     * @param {string} name 
     * @param {string} path 
     */
    async loadTexture(name, path) {
        return new Promise((resolve) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    this.textures[name] = texture;
                    console.log(`[AssetManager] Loaded texture: ${name}`);
                    resolve(texture);
                },
                undefined,
                (err) => {
                    console.warn(`[AssetManager] Texture load failed (${path}). Using procedural fallback texture.`);
                    resolve(this.textures[`procedural_${name}`] || this.textures['fallback_noise']);
                }
            );
        });
    }

    /**
     * Pre-generates realistic procedural canvas textures to ensure PBR materials look stunning even before external assets are loaded.
     */
    initProceduralFallbacks() {
        this.textures['fallback_noise'] = this.createNoiseTexture('#6e7a75', '#3f4b45');
        this.textures['procedural_snow_diffuse'] = this.createNoiseTexture('#eef3f7', '#d9e2ec');
        this.textures['procedural_dirt_diffuse'] = this.createNoiseTexture('#4a3b32', '#2c221c');
        this.textures['procedural_concrete_diffuse'] = this.createNoiseTexture('#5a605c', '#3c413e');
        this.textures['procedural_rock_diffuse'] = this.createNoiseTexture('#58626b', '#3b4349');
    }

    /**
     * Helper: Generates tileable canvas noise texture for PBR fallbacks.
     */
    createNoiseTexture(colorA, colorB, size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = colorA;
        ctx.fillRect(0, 0, size, size);

        // Add multi-pass perlin-style procedural grain
        ctx.fillStyle = colorB;
        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 2.5 + 0.5;
            ctx.globalAlpha = Math.random() * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
}
