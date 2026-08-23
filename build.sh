#!/bin/bash

cd ./back
npm install
npm run build
cd ../front
npm install
npx vite build