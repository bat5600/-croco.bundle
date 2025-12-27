import { execSync } from "node:child_process";

execSync(
  "npx tailwindcss -c articles/tailwind.config.js -i articles/input.css -o articles/croco-article.css --minify",
  { stdio: "inherit" }
);
