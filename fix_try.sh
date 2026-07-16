#!/bin/bash
sed -i '/try {/,/const list/ { /}/d }' src/App.tsx
