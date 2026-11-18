# Oberth Compute

Website for Oberth Compute: reserved NVIDIA H100, H200, B200 and B300 capacity in the US, on terms from one month to five years.

Static site, no build step. `index.html` plus `assets/`. Served with GitHub Pages from `main`.

## Thermal page

`thermal/` is the TONFY thermal portfolio with an interactive 3D explorer (Three.js, orthographic axonometric view).
`thermal/app.js` is a bundle of `thermal/src/*.js` built with esbuild:

    npm i three@0.187.0 esbuild
    npx esbuild thermal/src/main.js --bundle --format=esm --minify --outfile=thermal/app.js

Product data lives in `thermal/src/data.js`; procedural 3D models and exploded-part offsets in `thermal/src/scene.js`.
