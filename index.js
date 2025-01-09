import * as THREE from "./node_modules/three/src/Three.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from '/node_modules/three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './node_modules/three/examples/jsm/geometries/TextGeometry.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.boss = null;
        this.gates = [];
        this.points = 0;
        this.level = 1; // Player starts at level 1
        this.pointsToNextLevel = 1; // Points required for the next level
        this.mouseX = 0;
        this.levelLength = -30; // How much gates spawn
        this.bossPosZ;
        this.gateValue;
        this.winThreshold = 5;
        this.minPoints = 1;
        this.maxPoints = 5;
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

        this.bossPosZ = -50;

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

    updatePlayerLevel() {
        if (this.points >= this.pointsToNextLevel) {
            this.level++;
            this.pointsToNextLevel += this.level; // Increment required points (e.g., 1, 2, 3, ...)
            this.updatePlayerModel(); // Change player model for new level
            console.log(`Level Up! New Level: ${this.level}`);
        }
    }

    updatePlayerModel() {
        const loader = new GLTFLoader();
        loader.load(`./media/models/tank_level${this.level}.glb`, (gltf) => {
            this.scene.remove(this.player); // Remove the old model
            this.player = gltf.scene;
            this.player.scale.set(0.5, 0.5, 0.5);
            this.player.position.set(0, 0.3, 0); // Maintain position
            this.scene.add(this.player);
        });
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
            this.boss.position.set(0, 0.3, this.bossPosZ);
            this.boss.rotation.y = Math.PI; // Rotate 180 degrees to face backward
            this.scene.add(this.boss);
        });
    }

    createRoad() {
        const roadGeometry = new THREE.PlaneGeometry(10, -this.levelLength + 90);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x98FB98 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -50;
        this.scene.add(road);
    }

    createGates() {
        const spacing = 10;
        for (let z = -10; z > this.levelLength; z -= spacing) {
            const greenGateX = THREE.MathUtils.randFloat(-4, 4);
            const redGateX = THREE.MathUtils.randFloat(-4, 4);
    
            // Use Gate class for green and red gates
            const greenGate = this.createGate(greenGateX, z, 0x00ff00);
            const redGate = this.createGate(redGateX, z, 0xff0000);
    
            this.gates.push(greenGate, redGate);
        }
    }

    // Create an individual gate with a random value
    createGate(x, z, color, minPoints, maxPoints) {
        const isPositive = color === 0x00ff00;
        const gate = new Gate(x, z, isPositive, undefined, this.minPoints, this.maxPoints); // Use Gate class
        this.addGateText(gate);

        this.scene.add(gate.mesh);
        console.log('Creating gate with:', { minPoints, maxPoints, value: this.value });
        return gate;
    }

    // Add a text label to a gate showing its value
    addGateText(gate) {
        const loader = new FontLoader();
        loader.load('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            console.log(gate.value)
            const textGeometry = new TextGeometry(`${gate.value}`, {
                font: font,
                size: 0.3,
                height: 0.1,
            });
            const textMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 1 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    
            // Adjust text position above gate for better visibility
            textMesh.position.set(gate.mesh.position.x - 0.5, gate.mesh.position.y + 2.5, gate.mesh.position.z); 
            this.scene.add(textMesh);
        }, undefined, (error) => {
            console.error('An error occurred while loading the font:', error);
        });
    }

    // Check collisions with gates
    checkGateCollisions() {
        this.gates = this.gates.filter((gate) => {
            if (gate.checkCollision(this.player)) {
                this.scene.remove(gate.mesh); // Remove gate from the scene
                gate.pointsCalc(this, gate); // Update points in Game class
                this.updatePlayerLevel(); // Check for level up
                console.log(`Points: ${this.points}`);
                return false; // Remove gate from array
            }
            return true; // Keep gate
        });
    }

    resetGame(lost) {
        this.points = 0;
        if (lost == false) {
        this.bossDifficulty++;
        this.winThreshold += 5;
        this.levelLength -= 10;
        this.minPoints += 2;
        this.maxPoints += 3;
        console.log("Boss strength is now " + this.winThreshold);
        } else {
            console.log("Try again commander!")
        }
        

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
                    gate.pointsCalc(this, gate); // Update points in Game class
                    console.log("Points are now " + this.points)
                    return false;
                }
                return true;
            });

            // Check if player reaches the boss
            if (this.player.position.z <= this.boss.position.z) {
                if (this.points >= this.winThreshold) {
                    console.log(`You win! Points: ${this.points}`);
                    this.resetGame(false);
                } else {
                    console.log(`You lose! Your points: ${this.points}. The bos strength: ${this.winThreshold}`);
                    this.resetGame(true);
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
    constructor( x, z, isPositive, value, minPoints, maxPoints ) {
        this.isPositive = isPositive;
        this.value = value || THREE.MathUtils.randInt(minPoints, maxPoints); // Random value between minimum points and maximum points
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4.5, 0.1),
            new THREE.MeshStandardMaterial({ color: this.isPositive ? 0x00ff00 : 0xff0000, opacity: 0.6, transparent: true })
        );
        this.mesh.position.set(x, 0.5, z);
    }

    checkCollision(player) {
        const playerBox = new THREE.Box3().setFromObject(player);
        const gateBox = new THREE.Box3().setFromObject(this.mesh);
        return playerBox.intersectsBox(gateBox); // Check if bounding boxes overlap
    }

    pointsCalc(game, gate) {
        game.points += gate.isPositive ? gate.value : -gate.value; // Adjust points in Game class
    }
}

const game = new Game();
game.init();
