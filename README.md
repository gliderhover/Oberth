# Oberth Compute

Website for Oberth Compute: reserved NVIDIA H100, H200, B200 and B300 capacity in the US, on terms from one month to five years.

Static site served with GitHub Pages from `main` at oberth.org. Four pages share one header (mega-menu) and footer:

- `/` Company: overview, operators, what we do, why a broker, FAQ, contact
- `/capacity/` MW Capacity: GPU lineup, capacity matcher, process
- `/thermal/` Thermal Infra: TONFY cooling portfolio with the 3D explorer
- `/marketplace/` Marketplace: for AI teams, for capacity owners, example request

Links between pages are root-absolute (`/capacity/#matcher`), so the site must be served from the domain root.

## Thermal page

`thermal/` is the TONFY thermal portfolio with an interactive 3D explorer (Three.js, orthographic axonometric view).
`thermal/app.js` is a bundle of `thermal/src/*.js` built with esbuild:

    npm i three@0.187.0 esbuild
    npx esbuild thermal/src/main.js --bundle --format=esm --minify --outfile=thermal/app.js

Product data lives in `thermal/src/data.js`; procedural 3D models and exploded-part offsets in `thermal/src/scene.js`.

## Marketplace
`/marketplace/` lists CS Storage hardware (24 listings) with filters, search and sort; each listing has its own page at `/marketplace/listing/<slug>/`. All listing data lives in `market.py` in the build workspace, which writes the grid, the detail pages and `marketplace/listings.js`. Photos in `marketplace/img/` are cropped from the CS Storage product manual, one per listed product.
