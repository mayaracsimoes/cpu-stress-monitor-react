"use strict";
const require$$2 = require("worker_threads");
const crypto = require("crypto");
const iterations = 1e5;
const keylen = 64;
const digest = "sha512";
function stressLoop() {
  let isRunning = true;
  require$$2.parentPort.on("message", (message) => {
    if (message === "stop") {
      isRunning = false;
    }
  });
  while (isRunning) {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2Sync("password", salt, iterations, keylen, digest);
  }
}
stressLoop();
