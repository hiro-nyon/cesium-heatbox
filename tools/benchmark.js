#!/usr/bin/env node
// Minimal benchmark stub so CI can run without Cesium environment
/* eslint-disable no-console */

function main() {
  const start = Date.now();
  // Simulate light work
  let acc = 0;
  for (let i = 0; i < 1e6; i++) acc += i;
  const ms = Date.now() - start;
  console.log(`Benchmark stub completed in ${ms} ms (acc=${acc}).`);
}

main();

