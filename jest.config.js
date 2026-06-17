import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ts-jest)/)'
  ]
};