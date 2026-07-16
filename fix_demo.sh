#!/bin/bash
sed -i '/const \[demoMode, setDemoMode\] = useState/,+4d' src/App.tsx
sed -i 's/ && !demoMode//g' src/App.tsx
sed -i 's/, demoMode//g' src/App.tsx
sed -i '/if (demoMode) {/,/return;/d' src/App.tsx
sed -i '/demoMode={demoMode}/d' src/App.tsx
