#!/usr/bin/env bash
set -euo pipefail

echo "=== Validating build.yml YAML syntax ==="
node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('.github/workflows/build.yml','utf8'));console.log('YAML valid')"

echo ""
echo "=== Running frontend build ==="
npm run build

echo ""
echo "=== All checks passed ==="
