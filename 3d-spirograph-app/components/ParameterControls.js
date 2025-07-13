export class ParameterControls {
  constructor(onParameterChange, onExport, generator, scene3D) {
    this.onParameterChange = onParameterChange;
    this.onExport = onExport;
    this.generator = generator;
    this.scene3D = scene3D;
    this.params = { ...generator.getDefaultParams() };
    this.printerBounds = { x: 150, y: 150, z: 150 };
    this.container = document.getElementById("controls-container");

    this.createUI();
  }

  createUI() {
    // Clear container
    this.container.innerHTML = "";

    // Add title
    const title = document.createElement("div");
    title.className = "app-title";
    title.textContent = "3D Spirograph";
    this.container.appendChild(title);

    // Add description
    const description = document.createElement("div");
    description.style.cssText = `
      margin-bottom: 20px;
      font-size: 12px;
      color: #ccc;
      text-align: center;
    `;
    description.textContent = this.generator.description;
    this.container.appendChild(description);

    // Create parameter controls
    const paramDefs = this.generator.getParameterDefinitions();
    Object.entries(paramDefs).forEach(([key, def]) => {
      this.createSlider(key, def);
    });

    // Add printer bounds section
    this.createPrinterBoundsSection();

    // Add export button
    this.createExportButton();

    // Add instructions
    this.createInstructions();
  }

  createSlider(key, definition) {
    const container = document.createElement("div");
    container.className = "control-group";

    const label = document.createElement("label");
    label.textContent = definition.label;
    label.setAttribute("for", `slider-${key}`);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `slider-${key}`;
    slider.min = definition.min;
    slider.max = definition.max;
    slider.step = definition.step;
    slider.value = this.params[key];

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "value-display";
    valueDisplay.textContent = `Value: ${this.params[key]}`;

    // Add description if available
    if (definition.description) {
      const desc = document.createElement("div");
      desc.style.cssText = `
        font-size: 11px;
        color: #999;
        margin-top: 4px;
        line-height: 1.3;
      `;
      desc.textContent = definition.description;
      container.appendChild(desc);
    }

    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      this.params[key] = value;
      valueDisplay.textContent = `Value: ${value}`;

      // Debounce the parameter change for performance
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.onParameterChange(this.params);
        this.checkPatternBounds(); // Check bounds when parameters change
      }, 100);
    });

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    this.container.appendChild(container);
  }

  createPrinterBoundsSection() {
    // Add section divider
    const divider = document.createElement("div");
    divider.style.cssText = `
      border-top: 1px solid #444;
      margin: 25px 0 20px 0;
      padding-top: 20px;
    `;

    const sectionTitle = document.createElement("div");
    sectionTitle.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #ff6600;
      text-align: center;
    `;
    sectionTitle.textContent = "Printer Bounds";
    divider.appendChild(sectionTitle);

    this.container.appendChild(divider);

    // Create sliders for each dimension
    this.createBoundsSlider("x", "Bed Width (X)", 50, 500, 150);
    this.createBoundsSlider("y", "Bed Depth (Y)", 50, 500, 150);
    this.createBoundsSlider("z", "Bed Height (Z)", 50, 500, 150);

    // Add bounds info display
    this.createBoundsInfo();
  }

  createBoundsSlider(axis, label, min, max, defaultValue) {
    const container = document.createElement("div");
    container.className = "control-group";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.setAttribute("for", `bounds-slider-${axis}`);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `bounds-slider-${axis}`;
    slider.min = min;
    slider.max = max;
    slider.step = 5;
    slider.value = defaultValue;

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "value-display";
    valueDisplay.textContent = `Value: ${defaultValue}mm`;

    slider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      this.printerBounds[axis] = value;
      valueDisplay.textContent = `Value: ${value}mm`;

      // Update the 3D scene
      this.scene3D.updatePrinterBounds(this.printerBounds);

      // Update bounds info
      this.updateBoundsInfo();

      // Check if current pattern fits within bounds
      this.checkPatternBounds();
    });

    container.appendChild(labelEl);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    this.container.appendChild(container);
  }

  createBoundsInfo() {
    this.boundsInfo = document.createElement("div");
    this.boundsInfo.style.cssText = `
      margin: 15px 0;
      padding: 10px;
      background: rgba(255, 102, 0, 0.1);
      border-radius: 4px;
      font-size: 11px;
      color: #ff6600;
    `;
    this.updateBoundsInfo();
    this.container.appendChild(this.boundsInfo);
  }

  updateBoundsInfo() {
    if (this.boundsInfo) {
      const volume =
        (this.printerBounds.x * this.printerBounds.y * this.printerBounds.z) /
        1000000;
      this.boundsInfo.innerHTML = `
        <strong>Print Volume:</strong><br>
        ${this.printerBounds.x} × ${this.printerBounds.y} × ${
        this.printerBounds.z
      } mm<br>
        <strong>Total Volume:</strong> ${volume.toFixed(1)} liters
      `;
    }
  }

  checkPatternBounds() {
    // Check if the current pattern fits within the printer bounds
    const maxPatternSize = Math.max(
      this.params.R + this.params.r + this.params.d,
      this.params.numLayers * this.params.layerHeight
    );

    const fitsX =
      (this.params.R + this.params.r + this.params.d) * 2 <=
      this.printerBounds.x;
    const fitsY =
      (this.params.R + this.params.r + this.params.d) * 2 <=
      this.printerBounds.y;
    const fitsZ =
      this.params.numLayers * this.params.layerHeight <= this.printerBounds.z;

    if (!fitsX || !fitsY || !fitsZ) {
      console.warn("Pattern may exceed printer bounds!");
      // Could add visual warning here
    }
  }

  createExportButton() {
    const button = document.createElement("button");
    button.className = "export-button";
    button.textContent = "Export G-Code";
    button.onclick = () => this.onExport();
    this.container.appendChild(button);
  }

  createInstructions() {
    const instructions = document.createElement("div");
    instructions.style.cssText = `
      margin-top: 30px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 11px;
      line-height: 1.4;
      color: #ccc;
    `;

    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      • Left click + drag: Rotate view<br>
      • Right click + drag: Pan<br>
      • Scroll: Zoom in/out<br><br>
      
      <strong>Tips:</strong><br>
      • Smaller rolling radius creates more intricate patterns<br>
      • Higher pen distance creates larger loops<br>
      • Orange box shows your printer's build volume<br>
      • More layers = taller print
    `;

    this.container.appendChild(instructions);
  }

  updateParameters(newParams) {
    this.params = { ...this.params, ...newParams };

    // Update UI sliders to reflect new values
    Object.entries(newParams).forEach(([key, value]) => {
      const slider = document.getElementById(`slider-${key}`);
      if (slider) {
        slider.value = value;
        const valueDisplay =
          slider.parentElement.querySelector(".value-display");
        if (valueDisplay) {
          valueDisplay.textContent = `Value: ${value}`;
        }
      }
    });
  }
}
