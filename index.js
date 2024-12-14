import * as THREE from "./node_modules/three/src/Three.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, player, boss, gates = [];
let points = 0; // Track player's points
let winThreshold = 10; // Points required to win
let bossDifficulty = 0; // Increases with each replay

// Track mouse position
let mouseX = 0;

// Initialize the scene
function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Load 3D models
    const loader = new GLTFLoader();
    loader.load('./media/models/FT.glb', (gltf) => {
        player = gltf.scene;
        player.scale.set(0.5, 0.5, 0.5);
        player.position.set(0, 0.3, 0); // Raised slightly above the road
        scene.add(player);
    });

    loader.load('./media/models/pak75.glb', (gltf) => {
        boss = gltf.scene;
        boss.scale.set(1, 1, 1);
        boss.position.set(0, 0.3, -50); // Raised slightly above the road
        scene.add(boss);
    });

    // Create the road
    const roadGeometry = new THREE.PlaneGeometry(10, 100);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x98FB98 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -50;
    scene.add(road);

    // Create initial gates
    createGates();

    animate();
}

// Create gates at intervals along the road
function createGates() {
    const spacing = 10; // Distance between each pair of gates
    for (let z = -10; z > -50; z -= spacing) {
        const positions = [-2.5, 2.5]; // Left and right positions on the road
        positions.forEach((x, index) => {
            const gateGeometry = new THREE.BoxGeometry(4.5, 5, 0.2);
            const gateMaterial = new THREE.MeshStandardMaterial({
                color: index === 0 ? 0x00ff00 : 0xff0000 // Positive and negative gates
            });
            const gate = new THREE.Mesh(gateGeometry, gateMaterial);
            gate.position.set(x, 1, z);
            scene.add(gate);
            gates.push(gate);
        });
    }
}

// Reset game for replayability
function resetGame() {
    points = 0;
    bossDifficulty++;
    winThreshold += 5; // Increase required points to win
    boss.position.set(0, 0.3, -50); // Reset boss position
    player.position.set(0, 0.3, 0); // Reset player position
    camera.position.z = 5; // Reset camera position

    // Remove old gates and recreate them
    gates.forEach(gate => scene.remove(gate));
    gates = [];
    createGates();
}

// Update player movement based on mouse
function updatePlayerMovement() {
    if (player) {
        const targetX = (mouseX / window.innerWidth) * 10 - 5; // Map mouse position to road width
        player.position.x += (targetX - player.position.x) * 0.1; // Smooth movement
        player.rotation.y = Math.atan2(targetX - player.position.x, 1); // Face the mouse direction
    }
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);

    // Move player forward
    if (player) {
        player.position.z -= 0.01;
        camera.position.z -= 0.01;

        // Update player movement based on mouse
        updatePlayerMovement();

        // Check for collisions with gates
        gates = gates.filter((gate) => {
            if (
                Math.abs(player.position.z - gate.position.z) < 1 &&
                Math.abs(player.position.x - gate.position.x) < 1
            ) {
                scene.remove(gate);
                points += gate.material.color.getHex() === 0x00ff00 ? 1 : -1; // Add or subtract points
                return false;
            }
            return true;
        });

        // Check if player reaches boss
        if (player.position.z <= boss.position.z) {
            if (points >= winThreshold) {
                console.log(`You win! Points: ${points}`);
                resetGame();
            } else {
                console.log(`You lose! Points: ${points}`);
                resetGame();
            }
        }
    }

    renderer.render(scene, camera);
}

// Listen for mouse movement
window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX; // Track horizontal mouse position
});

// Resize the canvas on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the game
init();
