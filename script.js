import * as THREE from 'three';

let scene, camera, renderer;
let particles;

function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50; // Adjust as needed

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create Particles
    createParticles();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation
    animate();
}

function createParticles() {
    const particleCount = 5000; // Number of particles
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3); // Each particle has x, y, z

    for (let i = 0; i < particleCount * 3; i++) {
        // Assign random positions (customize this for desired distribution)
        posArray[i] = (Math.random() - 0.5) * 100; // Example: spread out over a 100x100x100 cube
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material for the particles
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        color: 0xffffff, // White particles
        // map: new THREE.TextureLoader().load('path/to/your/particle_texture.png'), // Optional: for custom particle appearance
        // transparent: true, // Optional: if using texture with alpha
        // blending: THREE.AdditiveBlending, // Optional: for a glowing effect
        sizeAttenuation: true // Particles further away appear smaller
    });

    // The Points object
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
}

function animateParticles() {
    // Example animation: make particles move or rotate
    // This is a simple rotation example, you'll likely want more complex behavior
    if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;

        // You can also update individual particle positions here if needed
        // by accessing particles.geometry.attributes.position.array
        // and then setting particles.geometry.attributes.position.needsUpdate = true;
    }
}

function animate() {
    requestAnimationFrame(animate);
    animateParticles(); // Animate our particles
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the scene
init();