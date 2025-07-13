import { PatternBase } from "./PatternBase.js";
import * as THREE from "three";

export class SpirographGenerator extends PatternBase {
  constructor() {
    super();
    this.name = "Spirograph";
    this.description = "Classic spirograph pattern with 3D extension";

    this.defaultParams = {
      R: 30, // Fixed circle radius
      r: 10, // Rolling circle radius
      d: 15, // Distance from center of rolling circle
      layerHeight: 0.2, // Height of each layer (mm)
      numLayers: 10, // Number of layers to print
      rotations: 5, // Number of complete rotations
      resolution: 1000, // Points per rotation
    };

    // Define parameter UI metadata
    this.parameterDefinitions = {
      R: {
        label: "Fixed Ring Radius",
        min: 10,
        max: 50,
        step: 1,
        description: "Radius of the fixed outer circle",
      },
      r: {
        label: "Rolling Ring Radius",
        min: 5,
        max: 25,
        step: 1,
        description: "Radius of the rolling inner circle",
      },
      d: {
        label: "Pen Distance",
        min: 5,
        max: 30,
        step: 1,
        description: "Distance from center of rolling circle to pen",
      },
      layerHeight: {
        label: "Layer Height",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        description: "Height of each printed layer in mm",
      },
      numLayers: {
        label: "Number of Layers",
        min: 1,
        max: 50,
        step: 1,
        description: "Total number of layers to print vertically",
      },
      rotations: {
        label: "Rotations",
        min: 1,
        max: 10,
        step: 1,
        description: "Number of complete pattern rotations",
      },
    };
  }

  generate(params = {}) {
    const p = { ...this.defaultParams, ...params };
    const points = [];

    // Calculate total steps for all layers
    const stepsPerRotation = p.resolution;
    const totalSteps = p.rotations * stepsPerRotation;
    const stepSize = (2 * Math.PI * p.rotations) / totalSteps;

    // Generate points for each layer
    for (let layer = 0; layer < p.numLayers; layer++) {
      const currentZ = layer * p.layerHeight;

      // For layers after the first, we need to connect from the previous layer
      if (layer > 0) {
        // Get the last point from the previous layer
        const lastPoint = points[points.length - 1];

        // Calculate the first point of this layer
        const t = 0;
        const firstX =
          (p.R + p.r) * Math.cos(t) - p.d * Math.cos(((p.R + p.r) / p.r) * t);
        const firstY =
          (p.R + p.r) * Math.sin(t) - p.d * Math.sin(((p.R + p.r) / p.r) * t);

        // Add a vertical transition from last point to first point of new layer
        points.push(new THREE.Vector3(firstX, firstY, currentZ));
      }

      // Generate the spirograph pattern for this layer
      for (let i = 0; i <= totalSteps; i++) {
        const t = i * stepSize;

        // Classic spirograph equations - these create the X-Y pattern
        const x =
          (p.R + p.r) * Math.cos(t) - p.d * Math.cos(((p.R + p.r) / p.r) * t);
        const y =
          (p.R + p.r) * Math.sin(t) - p.d * Math.sin(((p.R + p.r) / p.r) * t);
        const z = currentZ; // Z increases with each layer

        // In Three.js: X=left/right, Y=up/down, Z=forward/back
        // In 3D printing: X=left/right, Y=forward/back, Z=up/down
        // So we need to map: spirograph_x -> X, spirograph_y -> Z, layer_height -> Y
        points.push(new THREE.Vector3(x, currentZ, y));
      }
    }

    return this.createLineGeometry(points);
  }

  validateParameters(params) {
    // Ensure we don't have mathematical issues
    if (params.r && params.R && params.r >= params.R) {
      console.warn(
        "Rolling radius should be smaller than fixed radius for best results"
      );
    }
    return true;
  }
}
