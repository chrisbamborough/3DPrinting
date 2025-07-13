import * as THREE from "three";

export class PatternBase {
  constructor() {
    this.name = "";
    this.description = "";
    this.defaultParams = {};
    this.parameterDefinitions = {};
  }

  generate(params = {}) {
    throw new Error(
      `Generate method must be implemented by ${this.constructor.name}`
    );
  }

  getParameterDefinitions() {
    return this.parameterDefinitions;
  }

  getDefaultParams() {
    return { ...this.defaultParams };
  }

  validateParameters(params) {
    // Basic validation - can be overridden
    return true;
  }

  createLineGeometry(points) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      linewidth: 2,
    });
    return new THREE.Line(geometry, material);
  }
}
