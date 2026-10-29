import { existsSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve(process.cwd(), "dist/__manus__");

if (existsSync(target)) {
  console.error(`Build rejected: ${target} must not exist.`);
  process.exit(1);
}
