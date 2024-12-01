import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Black background for space effect
renderer.outputEncoding = THREE.sRGBEncoding; // Correct color rendering
document.getElementById("container").appendChild(renderer.domElement);

// Orbit Controls for Interactive View
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds smooth interactions
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// GLB Model Loader
let mainModel, backgroundModel; // Define variables for global access
const loader = new GLTFLoader();

// Particle System Variables
const particleCount = 1000;
const particleSpeed = new Float32Array(particleCount * 3);
const particleAcceleration = new Float32Array(particleCount * 3); // For more dynamic movement

// Create a Particle System
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 500; // X position
  positions[i * 3 + 1] = (Math.random() - 0.5) * 500; // Y position
  positions[i * 3 + 2] = (Math.random() - 0.5) * 500; // Z position
  particleSpeed[i * 3] = (Math.random() - 0.5) * 0.1; // X velocity
  particleSpeed[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Y velocity
  particleSpeed[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // Z velocity
  particleAcceleration[i * 3] = (Math.random() - 0.5) * 0.01; // X acceleration
  particleAcceleration[i * 3 + 1] = (Math.random() - 0.5) * 0.01; // Y acceleration
  particleAcceleration[i * 3 + 2] = (Math.random() - 0.5) * 0.01; // Z acceleration
}
particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// Update particle material for glowing effect
const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff, // White particles
  size: 0.5, // Decrease particle size for shine effect
  sizeAttenuation: true,
  emissive: new THREE.Color(0xffffff), // Make particles glow
  emissiveIntensity: 0.5, // Intensity of the glow
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Load Main GLB Model
let movingForward = true;
loader.load(
  "/interstellar__endurance_high_fidelity.glb", // Path relative to the public folder
  (gltf) => {
    mainModel = gltf.scene;
    scene.add(mainModel);

    // Adjust Main Model Size and Position
    mainModel.position.set(0, 0, 0); // Center the main model
    mainModel.scale.set(0.1, 0.1, 0.1); // Scale down by 10%

    console.log("Main model loaded successfully!");
  },
  (xhr) => {
    console.log(`Main model ${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error("An error occurred while loading the main model:", error);
  }
);

// Load Background GLB Model
loader.load(
  "/blackhole.glb", // Replace with the actual background model path
  (gltf) => {
    backgroundModel = gltf.scene;
    scene.add(backgroundModel);

    // Find the blackhole rim (assuming it's a separate object inside the black hole model)
    const blackholeRim = backgroundModel.getObjectByName("Rim"); // Replace "Rim" with the actual name of the rim if necessary
    if (blackholeRim) {
      // Animate the Rim's movement and rotation
      blackholeRim.rotation.z = Math.PI / 2;
      backgroundModel.rim = blackholeRim;
    }

    // Adjust Background Model Size and Position
    backgroundModel.position.set(0, 0, -100); // Move it farther back
    backgroundModel.scale.set(50, 50, 50); // Make it larger

    console.log("Background model loaded successfully!");
  },
  (xhr) => {
    console.log(`Background model ${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error("An error occurred while loading the background model:", error);
  }
);

// Camera Position
camera.position.set(0, 5, 20); // Farther back for better visibility

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the Main Model
  if (mainModel) {
    mainModel.rotation.y += 0.01; // Horizontal rotation
    mainModel.rotation.x += 0.005; // Vertical rotation

    // Move Main Model towards and away from the Background
    if (movingForward) {
      mainModel.position.z -= 0.1; // Move towards the background
      if (mainModel.position.z <= backgroundModel.position.z + 10) {
        movingForward = false; // Switch direction when "touching" background
      }
    } else {
      mainModel.position.z += 0.1; // Move back
      if (mainModel.position.z >= 0) {
        movingForward = true; // Switch direction again
      }
    }
  }

  // Rotate and Move the Black Hole Rim
  if (backgroundModel) {
    backgroundModel.rotation.y += 0.095; // Slow rotation
    backgroundModel.position.x = Math.sin(Date.now() * 0.001) * 2; // Horizontal movement
    backgroundModel.position.y = Math.cos(Date.now() * 0.001) * 2; // Vertical movement

    // Self-rotating movement along the x-axis
    backgroundModel.rotation.x += 0.001; // Rotate around the x-axis
  }

  // Update Particle Positions with Dynamic Movement
  const particlePositions = particlesGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    // Apply acceleration to particles
    particleSpeed[i * 3] += particleAcceleration[i * 3];
    particleSpeed[i * 3 + 1] += particleAcceleration[i * 3 + 1];
    particleSpeed[i * 3 + 2] += particleAcceleration[i * 3 + 2];

    // Update particle positions
    particlePositions[i * 3] += particleSpeed[i * 3]; // X movement
    particlePositions[i * 3 + 1] += particleSpeed[i * 3 + 1]; // Y movement
    particlePositions[i * 3 + 2] += particleSpeed[i * 3 + 2]; // Z movement

    // Reset particles if they move too far
    if (particlePositions[i * 3] > 250 || particlePositions[i * 3] < -250) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 500;
      particleSpeed[i * 3] = (Math.random() - 0.5) * 0.1;
    }
    if (particlePositions[i * 3 + 1] > 250 || particlePositions[i * 3 + 1] < -250) {
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      particleSpeed[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    }
    if (particlePositions[i * 3 + 2] > 250 || particlePositions[i * 3 + 2] < -250) {
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
      particleSpeed[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }
  particlesGeometry.attributes.position.needsUpdate = true; // Notify Three.js of updates

  // Update particle material for glowing effect
const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff, // White particles
  size: 0.5, // Decrease particle size for shine effect
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

  controls.update(); // Update controls
  renderer.render(scene, camera);
}
animate();

// Add background music
const music = new Audio('/interstellar.mp3'); // Provide the path to your audio file
let isPlaying = false;

// Music control button
const musicControlButton = document.getElementById("music-control");
musicControlButton.addEventListener("click", () => {
  if (isPlaying) {
    music.pause();
    musicControlButton.textContent = "Play Music";
  } else {
    music.play();
    musicControlButton.textContent = "Pause Music";
  }
  isPlaying = !isPlaying;
});

// Ensure music stops when the window is closed or reloaded
window.addEventListener("beforeunload", () => {
  music.pause();
});

const githubButton = document.getElementById("github-link");
githubButton.addEventListener("click", () => {
  window.open("https://github.com/BarathKumarpm/Interstellar_Docking_Threejs", "_blank"); // Replace with your GitHub URL
});

// Handle Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
