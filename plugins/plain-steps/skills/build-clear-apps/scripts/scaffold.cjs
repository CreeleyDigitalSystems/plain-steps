#!/usr/bin/env node
"use strict";
// Deterministic code generation from an explicit data contract, not natural-language interpretation.
const fs = require("node:fs");
const path = require("node:path");
const { validateContract } = require("../assets/flow-kit.js");

function scaffold(contract, destination) {
  const problems = validateContract(contract);
  if (problems.length) throw new Error(problems.join("\n"));
  const target = path.resolve(destination);
  if (fs.existsSync(target)) throw new Error("Destination already exists. Choose a new directory; no files were replaced.");
  const parent = path.dirname(target);
  fs.mkdirSync(parent, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(parent, ".plain-steps-build-"));
  try {
    const assets = path.resolve(__dirname, "../assets");
    for (const name of ["index.html", "app.js"]) fs.copyFileSync(path.join(assets, "calculation-flow", name), path.join(temporary, name));
    for (const name of ["flow-kit.js", "flow.css"]) fs.copyFileSync(path.join(assets, name), path.join(temporary, name));
    const serialized = JSON.stringify(contract, null, 2);
    const safeScript = serialized.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    fs.writeFileSync(path.join(temporary, "contract.js"), `"use strict";\nwindow.PlainStepsContract = ${safeScript};\n`);
    fs.writeFileSync(path.join(temporary, "calculation-contract.json"), serialized + "\n");
    fs.writeFileSync(path.join(temporary, "README.md"), "# Generated local calculation flow\n\nOpen index.html in an allowed browser. The app calculates from the explicit calculation-contract.json definition using local files. No network, account or dependency download is required by the generated app.\n\nIt has draft preservation, labelled validation, result inputs, calculation undo, local resumption and display settings. Browser storage is unencrypted, device/origin-bound, may fail or be removed, and is not a backup. Use non-sensitive values.\n\nGeneration does not verify the domain formula or browser behaviour. Check the formula against the actual request and an independently known answer, then complete the keyboard/error/back/undo/reopen journey in a permitted browser. Respect any browser policy refusal; no server/protocol workaround is implied.\n");
    // Atomic reservation refuses even a destination that appears during generation.
    fs.mkdirSync(target);
    for (const name of fs.readdirSync(temporary)) fs.copyFileSync(path.join(temporary, name), path.join(target, name), fs.constants.COPYFILE_EXCL);
    fs.rmSync(temporary, { recursive: true, force: true });
    return target;
  } catch (error) {
    // Only this invocation's newly created staging directory is removed.
    fs.rmSync(temporary, { recursive: true, force: true });
    throw new Error(`${error.message} Any newly generated destination files were retained for inspection.`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2) { process.stderr.write("Usage: node scaffold.cjs <contract.json> <new-output-directory>\n"); process.exitCode = 2; }
  else {
    try {
      const source = path.resolve(args[0]);
      if (fs.statSync(source).size > 65536) throw new Error("Contract exceeds the 64 KiB limit.");
      const contract = JSON.parse(fs.readFileSync(source, "utf8"));
      process.stdout.write(`Created local calculation files in ${scaffold(contract, args[1])}\nBrowser behaviour is not verified by generation.\n`);
    } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
  }
}
module.exports = { scaffold };
