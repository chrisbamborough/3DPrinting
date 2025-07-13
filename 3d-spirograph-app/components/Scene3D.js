import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class Scene3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.boundingBox = null;
    this.printerBounds = { x: 150, y: 150, z: 150 };

    this.setupScene();
    this.setupLighting();
    this.setupGrid();
    this.setupBoundingBox();
    this.setupControls();
    this.setupResize();
    this.animate();
  }

  setupScene() {
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x1a1a1a);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(50, 50, 50);
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    // Add a subtle point light
    const pointLight = new THREE.PointLight(0x00ff88, 0.3, 100);
    pointLight.position.set(0, 0, 20);
    this.scene.add(pointLight);
  }

  setupGrid() {
    // Ground grid based on printer bounds
    const gridSize = Math.max(this.printerBounds.x, this.printerBounds.y);
    const gridHelper = new THREE.GridHelper(gridSize, 50, 0x444444, 0x222222);
    gridHelper.name = "gridHelper";
    this.scene.add(gridHelper);

    // Add coordinate axes
    const axesHelper = new THREE.AxesHelper(25);
    axesHelper.name = "axesHelper";
    this.scene.add(axesHelper);
  }

  setupBoundingBox() {
    this.createBoundingBox();
  }

  createBoundingBox() {
    // Remove existing bounding box if it exists
    if (this.boundingBox) {
      this.scene.remove(this.boundingBox);
      this.boundingBox.geometry.dispose();
      this.boundingBox.material.dispose();
    }

    // Create wireframe box geometry
    // Three.js coordinates: X=width, Y=height, Z=depth
    // 3D Printing coordinates: X=width, Y=depth, Z=height
    // So we map: printerBounds.x -> X, printerBounds.y -> Z, printerBounds.z -> Y
    const geometry = new THREE.BoxGeometry(
      this.printerBounds.x, // X = width (correct)
      this.printerBounds.z, // Y = height (was printerBounds.z)
      this.printerBounds.y // Z = depth (was printerBounds.y)
    );

    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0xff6600,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });

    this.boundingBox = new THREE.LineSegments(edges, material);
    this.boundingBox.name = "printerBounds";

    // Position the box so it sits on the ground plane
    // Y is up in Three.js, so position at half height
    this.boundingBox.position.set(0, this.printerBounds.z / 2, 0);

    this.scene.add(this.boundingBox);

    // Update grid to match printer bounds
    this.updateGrid();
  }

  updateGrid() {
    // Remove existing grid
    const existingGrid = this.scene.getObjectByName("gridHelper");
    if (existingGrid) {
      this.scene.remove(existingGrid);
    }

    // Create new grid based on printer bounds
    const gridSize = Math.max(this.printerBounds.x, this.printerBounds.y);
    const divisions = Math.min(50, gridSize / 5); // Adjust divisions based on size
    const gridHelper = new THREE.GridHelper(
      gridSize,
      divisions,
      0x444444,
      0x222222
    );
    gridHelper.name = "gridHelper";
    this.scene.add(gridHelper);
  }

  updatePrinterBounds(bounds) {
    this.printerBounds = { ...this.printerBounds, ...bounds };
    this.createBoundingBox();
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.autoRotate = false;
  }

  setupResize() {
    window.addEventListener("resize", () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  addObject(object) {
    this.scene.add(object);
  }

  removeObject(object) {
    this.scene.remove(object);
  }

  focusOnObject(object) {
    if (object && object.geometry) {
      object.geometry.computeBoundingBox();
      const box = object.geometry.boundingBox;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Move camera to view the object nicely
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;

      this.camera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
      );

      this.controls.target.copy(center);
      this.controls.update();
    }
  }
}
