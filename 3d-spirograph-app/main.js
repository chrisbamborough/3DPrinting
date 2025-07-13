import { Scene3D } from "./components/Scene3D.js";
import { ParameterControls } from "./components/ParameterControls.js";
import { GCodeExporter } from "./components/GCodeExporter.js";
import { SpirographGenerator } from "./generators/SpirographGenerator.js";

class SpirographApp {
  constructor() {
    this.scene3D = null;
    this.generator = null;
    this.controls = null;
    this.exporter = null;
    this.currentLine = null;

    this.init();
  }

  async init() {
    try {
      // Initialize components
      this.scene3D = new Scene3D(document.getElementById("canvas-container"));
      this.generator = new SpirographGenerator();
      this.exporter = new GCodeExporter();

      // Create parameter controls
      this.controls = new ParameterControls(
        (params) => this.updateGeometry(params),
        () => this.exportGCode(),
        this.generator,
        this.scene3D // Pass scene3D reference
      );

      // Generate initial geometry
      this.updateGeometry();

      console.log("3D Spirograph App initialized successfully");
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.showError(
        "Failed to initialize the application. Please refresh and try again."
      );
    }
  }

  updateGeometry(params = {}) {
    try {
      // Remove existing line
      if (this.currentLine) {
        this.scene3D.removeObject(this.currentLine);

        // Dispose of geometry and material to free memory
        this.currentLine.geometry.dispose();
        this.currentLine.material.dispose();
      }

      // Generate new line with current parameters
      this.currentLine = this.generator.generate(params);
      this.scene3D.addObject(this.currentLine);

      // Focus camera on the new object
      this.scene3D.focusOnObject(this.currentLine);

      console.log("Geometry updated with params:", params);
    } catch (error) {
      console.error("Failed to update geometry:", error);
      this.showError(
        "Failed to generate the pattern. Please check your parameters."
      );
    }
  }

  exportGCode() {
    try {
      if (!this.currentLine) {
        this.showError(
          "No pattern to export. Please generate a pattern first."
        );
        return;
      }

      console.log("Exporting G-Code...");

      const gcode = this.exporter.exportLine(this.currentLine);
      this.exporter.downloadGCode(gcode);

      // Calculate and log some statistics
      const positions = this.currentLine.geometry.attributes.position.array;
      const pointCount = positions.length / 3;

      console.log(`G-Code exported successfully:`);
      console.log(`- Points: ${pointCount}`);
      console.log(
        `- Estimated print time: ${this.exporter.estimatePrintTime(
          this.getPoints()
        )} minutes`
      );

      this.showSuccess("G-Code exported successfully!");
    } catch (error) {
      console.error("Failed to export G-Code:", error);
      this.showError("Failed to export G-Code. Please try again.");
    }
  }

  getPoints() {
    if (!this.currentLine) return [];

    const positions = this.currentLine.geometry.attributes.position.array;
    const points = [];

    for (let i = 0; i < positions.length; i += 3) {
      points.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2],
      });
    }

    return points;
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      transition: opacity 0.3s;
      ${type === "error" ? "background: #ff4444;" : ""}
      ${type === "success" ? "background: #00ff88; color: black;" : ""}
      ${type === "info" ? "background: #333;" : ""}
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Handle window resize
  handleResize() {
    if (this.scene3D) {
      this.scene3D.handleResize();
    }
  }

  // Clean up resources
  destroy() {
    if (this.currentLine) {
      this.currentLine.geometry.dispose();
      this.currentLine.material.dispose();
    }
    if (this.scene3D && this.scene3D.renderer) {
      this.scene3D.renderer.dispose();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.spirographApp = new SpirographApp();
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (window.spirographApp) {
    window.spirographApp.destroy();
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  if (window.spirographApp) {
    window.spirographApp.handleResize();
  }
});
