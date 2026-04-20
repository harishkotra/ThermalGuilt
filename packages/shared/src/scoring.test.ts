import assert from "node:assert/strict";
import test from "node:test";
import { classifyGhost, computeZScore, isShameRed, scoreToTokenReward } from "./scoring.js";

test("computeZScore handles stdDev=0", () => {
  assert.equal(computeZScore(10, 10, 0), 0);
});

test("classifyGhost boundaries", () => {
  assert.equal(classifyGhost(96), "Ice Queen");
  assert.equal(classifyGhost(80), "Cool Cat");
  assert.equal(classifyGhost(65), "Warm Hug");
  assert.equal(classifyGhost(30), "Thermal Vampire");
  assert.equal(classifyGhost(10), "Inferno");
});

test("reward tiers", () => {
  assert.equal(scoreToTokenReward(100), 100);
  assert.equal(scoreToTokenReward(90), 50);
  assert.equal(scoreToTokenReward(75), 20);
  assert.equal(scoreToTokenReward(55), 5);
  assert.equal(scoreToTokenReward(20), 0);
});

test("shame red threshold", () => {
  assert.equal(isShameRed(15, 10, 2), true);
  assert.equal(isShameRed(13, 10, 2), false);
});
