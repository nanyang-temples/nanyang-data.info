import {
  buildFullDetailsEl,
  getDataset,
  popupClick,
  processDataset,
  satelliteLayer,
  streetLayer,
} from "./map-utils.mjs";
import { initSearch } from "./map-search.mjs";

const datasetURLs = [
  "../data/01-buddhist_temples_taiwan/by-latlong.json",
  "../data/02-religious_sites_jinshan_shimen/by-latlong.json",
  "../data/01-temples_in_bangkok_mb/by-latlong.json",
  "../data/01-SGPchineseAssociations/by-latlong.json",
  "../data/02-SGPtemples/by-latlong.json",
  "../data/03-keramatShrines/by-latlong.json",
  "../data/01-temples_in_bintan_mb/by-latlong.json",
  "../data/02-franke_indonesia/by-latlong.json",
  "../data/01-temples_luangPrabang_ps/by-latlong.json",
  "../data/01-franke_malaysia/by-latlong.json",
];

/* Configure colors, write a stylesheet to apply them to the leaflet layer control
   and to create the pill- classes */
const colors = [
  "cadetblue",
  "chocolate",
  "rebeccapurple",
  "green",
  "crimson",
  "darkgoldenrod",
  "hotpink",
  "dodgerblue",
  "lightseagreen",
  "#bb85ab",
];

const style = document.createElement("style");
colors.forEach(
  (color, i) =>
    (style.textContent += `.leaflet-control-layers-overlays label:nth-of-type(${
      i + 1
    }) {accent-color: ${color};}\n.pill-${i} {background-color: ${color};}\n`),
);
document.body.appendChild(style);

/* Create the map */
const map = L.map("map", { minZoom: 4, maxZoom: 18 });
streetLayer.addTo(map);

// set view to show the relevant (?) part of Southeast Asia
map.setView([8, 120], 5);

const mapEl = document.getElementById("map");
mapEl.style.setProperty(
  "--attribution-height",
  mapEl.querySelector(".leaflet-control-attribution").offsetHeight + "px",
);
mapEl.appendChild(buildFullDetailsEl());

/* Load the datasets */
const datasets = await Promise.all(
  datasetURLs.map(async (url) => await getDataset(url)),
);

/* Dataset are loaded, hide loading indicator and show search UI */
const totalSitesCt = datasets.reduce(
  (total, dataset) => total + Object.keys(dataset.records).length,
  0,
);

document.querySelector(
  "#map .loading",
).innerHTML = `${totalSitesCt.toLocaleString()} sites loaded!<span>✅</span>`;

/* Fade-out and remove loading indicator */
window.requestAnimationFrame(() =>
  setTimeout(() => {
    document.querySelector("#map .loading").style.transition =
      "opacity 500ms ease";
    document.querySelector("#map .loading").style.opacity = 0;
    window.requestAnimationFrame(() =>
      setTimeout(() => {
        document.querySelector("#map .loading").remove();
      }, 500),
    );
  }, 500),
);

/* Create layer groups and plot markers */
const layers = {};
window.sites = {};
datasets.forEach((dataset, i) => {
  const [_sites, _markerLayer] = processDataset(dataset, i, colors[i]);
  layers[dataset.projectName] = _markerLayer;
  map.addLayer(_markerLayer);
  Object.assign(window.sites, _sites);
});

const layerControl = L.control
  .layers({ "Street Map": streetLayer, Satellite: satelliteLayer }, layers, {
    collapsed: false,
  })
  .addTo(map);

/* Initialize search and show search UI */
initSearch(sites, map, popupClick);
