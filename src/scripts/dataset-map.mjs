import {
  buildFullDetailsEl,
  getDataset,
  popupClick,
  processDataset,
  satelliteLayer,
  streetLayer,
} from "./map-utils.mjs";
import { initSearch } from "./map-search.mjs";

const mapEl = document.getElementById("map");
const datasetId = mapEl.dataset.datasetId;
const datasetURLs = [`../data/${datasetId}/by-latlong.json`];

/* Create the map */
const map = L.map("map", {
  minZoom: 4,
  maxZoom: 18,
  zoomSnap: 0.25,
  zoomDelta: 1,
  wheelPxPerZoomLevel: 120,
});
streetLayer.addTo(map);

mapEl.style.setProperty(
  "--attribution-height",
  mapEl.querySelector(".leaflet-control-attribution").offsetHeight + "px",
);
mapEl.appendChild(buildFullDetailsEl());

/* Load the datasets */
const datasets = await Promise.all(
  datasetURLs.map(async (url) => await getDataset(url)),
);

/* Create layer groups and plot markers */
const layers = {};
window.sites = {};
datasets.forEach((dataset, i) => {
  const [_sites, _markerLayer] = processDataset(
    dataset,
    i,
    "var(--theme-primary)",
  );
  layers[dataset.projectName] = _markerLayer;
  map.addLayer(_markerLayer);
  Object.assign(window.sites, _sites);
  map.fitBounds(_markerLayer.getBounds().pad(0.05));
});

const layerControl = L.control
  .layers({ "Street Map": streetLayer, Satellite: satelliteLayer })
  .addTo(map);

/* Initialize search and show search UI */
initSearch(sites, map, popupClick);
