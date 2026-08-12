// We import the global Level for now, but will eventually refactor it
export class WorldManager {
    constructor(engine) {
        this.engine = engine;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6e8294); // Atmospheric pre-dawn Himalayan sky
        this.scene.fog = new THREE.FogExp2(0x768798, 0.0018);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2500);
        this.camera.position.set(0, 15.8, 80);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        
        const container = document.getElementById('game-container');
        if (container) {
            // Prepend the canvas so it sits behind the UI overlays
            container.insertBefore(this.renderer.domElement, container.firstChild);
        }
        
        // Setup AAA Postprocessing Pipeline
        this.composer = new THREE.EffectComposer(this.renderer);
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Cinematic Restrained Bloom (Minimal bloom, clean contrast)
        this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.82; 
        this.bloomPass.strength = 0.42; 
        this.bloomPass.radius = 0.45;
        this.composer.addPass(this.bloomPass);
        
        // Subtle Film Grain for Cinematic Look
        this.filmPass = new THREE.FilmPass(0.18, 0.015, 648, false);
        this.composer.addPass(this.filmPass);

        // Hooks for resizing
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Level (Temporary integration of existing global class)
        this.level = new window.Level(this.scene);
        
        // Kill-Cam Grading Listeners
        window.addEventListener('bulletCamStart', () => this.enableKillCamGrading());
        window.addEventListener('bulletCamEnd', () => this.disableKillCamGrading());
    }

    enableKillCamGrading() {
        if (this.bloomPass) {
            this.bloomPass.strength = 1.2;
            this.bloomPass.threshold = 0.4;
            this.bloomPass.radius = 1.0;
        }
        if (this.filmPass) {
            this.filmPass.uniforms.grayscale.value = 1; // Enable grayscale for cinematic feel
            this.filmPass.uniforms.nIntensity.value = 0.8; // Increase noise
        }
    }

    disableKillCamGrading() {
        if (this.bloomPass) {
            this.bloomPass.strength = 0.6;
            this.bloomPass.threshold = 0.8;
            this.bloomPass.radius = 0.5;
        }
        if (this.filmPass) {
            this.filmPass.uniforms.grayscale.value = 0; // Disable grayscale
            this.filmPass.uniforms.nIntensity.value = 0.35; // Restore noise
        }
    }


    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
