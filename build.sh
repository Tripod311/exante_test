#!/bin/bash

cd ./back
npm run build
cd ../front
npx vite build