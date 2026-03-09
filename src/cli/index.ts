#!/usr/bin/env node
import { main } from "./api";

main().catch((error) => {
  console.error(`frosting: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
