#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const apiDocsDir = path.join(__dirname, '..', 'docs', 'api');

fs.rmSync(apiDocsDir, { recursive: true, force: true });
