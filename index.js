import * as THREE from "./node_modules/three/src/Three.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.boss = null;
        this.gates = [];
        this.points = 0;
        this.winThreshold = 10;
        this.bossDifficulty = 0;
        this.mouseX = 0; // Track mouse position
    }


    init() {
        // Initialize scene, camera, and renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.addLights();
        this.loadModels();
        this.createRoad();
        this.createGates();

        this.addEventListeners();
        this.animate();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    loadModels() {
        const loader = new GLTFLoader();
    
        // Load Player Tank
        loader.load('./media/models/FT.glb', (gltf) => {
            this.player = gltf.scene;
            this.player.scale.set(0.5, 0.5, 0.5);
            this.player.position.set(0, 0.3, 0);
            this.player.rotation.y = -Math.PI / 2; // Rotate 90 degrees counterclockwise
            this.scene.add(this.player);
        });
    
        // Load Boss Gun
        loader.load('./media/models/pak75.glb', (gltf) => {
            this.boss = gltf.scene;
            this.boss.scale.set(1, 1, 1);
            this.boss.position.set(0, 0.3, -50);
            this.boss.rotation.y = Math.PI; // Rotate 180 degrees to face backward
            this.scene.add(this.boss);
        });
    }
    
    

    createRoad() {
        const roadGeometry = new THREE.PlaneGeometry(10, 100);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x98FB98 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -50;
        this.scene.add(road);
    }

    createGates() {
        const spacing = 10; // Distance between each pair of gates
        for (let z = -10; z > -50; z -= spacing) {
            const positions = [-2.5, 2.5]; // Left and right positions on the road
            positions.forEach((x, index) => {
                const gate = new Gate(x, z, index === 0);
                this.scene.add(gate.mesh);
                this.gates.push(gate);
            });
        }
    }

    resetGame() {
        this.points = 0;
        this.bossDifficulty++;
        this.winThreshold += 5;

        this.boss.position.set(0, 0.3, -50);
        this.player.position.set(0, 0.3, 0);
        this.camera.position.z = 5;

        this.gates.forEach(gate => this.scene.remove(gate.mesh));
        this.gates = [];
        this.createGates();
    }

    updatePlayerMovement() {
        if (this.player) {
            const targetX = (this.mouseX / window.innerWidth) * 10 - 5;
            this.player.position.x += (targetX - this.player.position.x) * 0.1;
    
            // Reverse the angle calculation to make the tank face the mouse
            const angle = Math.atan2(this.player.position.x - targetX, 1);
            this.player.rotation.y = -Math.PI / 2 + angle; // Offset by 90 degrees to align properly
        }
    }
    
    
    

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.player) {
            this.player.position.z -= 0.01;
            this.camera.position.z -= 0.01;

            this.updatePlayerMovement();

            // Check for collisions with gates
            this.gates = this.gates.filter(gate => {
                if (gate.checkCollision(this.player)) {
                    this.scene.remove(gate.mesh);
                    this.points += gate.isPositive ? 1 : -1;
                    return false;
                }
                return true;
            });

            // Check if player reaches the boss
            if (this.player.position.z <= this.boss.position.z) {
                if (this.points >= this.winThreshold) {
                    console.log(`You win! Points: ${this.points}`);
                    this.resetGame();
                } else {
                    console.log(`You lose! Points: ${this.points}`);
                    this.resetGame();
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    addEventListeners() {
        window.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX;
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

class Gate {
    constructor(x, z, isPositive) {
        this.isPositive = isPositive;

        const gateGeometry = new THREE.BoxGeometry(4.5, 5, 0.2);
        const gateMaterial = new THREE.MeshStandardMaterial({
            color: this.isPositive ? 0x00ff00 : 0xff0000
        });
        this.mesh = new THREE.Mesh(gateGeometry, gateMaterial);
        this.mesh.position.set(x, 1, z);
    }

    checkCollision(player) {
        return (
            Math.abs(player.position.z - this.mesh.position.z) < 1 &&
            Math.abs(player.position.x - this.mesh.position.x) < 1
        );
    }
}

// Initialize the game
const game = new Game();
game.init();
