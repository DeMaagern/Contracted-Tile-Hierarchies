#!/bin/bash
sudo npm install
sudo npm run build
sudo browserify script/script-es5.js -o script/bundle.js
