#!/bin/bash

mkdir -p build

basketOfDeployables=(\
    "app.js"\
    "graph-layout.js"\
    "index.html"\
    "pattern-qr.patt"\
    "skills-data.json"\
    "style.css")

for deployable in ${basketOfDeployables[@]}
do
  cp $deployable build
done