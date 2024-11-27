import * as THREE from "./node_modules/three/src/Three.js"

// Create Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a simple light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// Create a plane for the road
const roadGeometry = new THREE.PlaneGeometry(20, 100);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Set camera position
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);
