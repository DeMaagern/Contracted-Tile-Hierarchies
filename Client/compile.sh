#!/bin/bash
npm run build
browserify script/script-es5.js -o script/bundle.js
