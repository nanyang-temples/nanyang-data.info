import "leaflet";
import "leaflet.markercluster";

// Hack to expose global L from esm import
const L = window["L"];

const datasetURLs = [
  "../data/01-buddhist_temples_taiwan/by-latlong.json",
  "../data/01-temples_in_bangkok_mb/by-latlong.json",
];

const getDataset = async (url) => {
  const response = await fetch(url);
  const dataset = (await response.json()).dataset;
  return dataset;
};

const datasets = await Promise.all(
  datasetURLs.map(async (url) => await getDataset(url)),
);

export const icon = L.divIcon({
  className: "marker",
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q.825 0 1.413-.588T14 10q0-.825-.588-1.413T12 8q-.825 0-1.413.588T10 10q0 .825.588 1.413T12 12Zm0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2q3.175 0 5.588 2.225T20 10.2q0 2.5-1.988 5.438T12 22Z"/></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -45],
});

const streetLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
  },
);

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
);

const map = L.map("map", { minZoom: 4, maxZoom: 18 });
streetLayer.addTo(map);

// set view to show the relevant (?) part of Southeast Asia
map.setView([13, 110], 5);

const buildPopUp = (locations, projectName) =>
  locations
    .map(
      (site) =>
        `<section>${[
          site.nanyangSiteId,
          site["siteNameZh"] || null,
          site["siteNameEn"] || null,
          site["siteNameAlt1"] || null,

          `<button
              data-site-id="${site.nanyangSiteId}"
              data-dataset-name="${projectName}"
              ${site.siteNameZh && `data-site-name-zh="${site.siteNameZh}"`}
              ${site.siteNameEn && `data-site-name-en="${site.siteNameEn}"`}
              ${
                site.siteNameAlt1 &&
                `data-site-name-alt1="${site.siteNameAlt1}"`
              }
          >
            details
          </button>`,
        ]
          .filter(Boolean)
          .join("<br>")}</section>`,
    )
    .join("");

const isValidHttpUrl = (string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

const showFullDetailsSidebar = (siteData, additionalMetadata, datasetId) => {
  const processValue = (value) => {
    if (isValidHttpUrl(value))
      return `<a href="${value}" target="_blank">${value}</a>`;
    return value;
  };

  const div = fullDetails.querySelector("div");

  div.innerHTML = "";

  if (siteData.siteNameZh) div.innerHTML += `<h3>${siteData.siteNameZh}</h3>`;
  if (siteData.siteNameEn) div.innerHTML += `<h3>${siteData.siteNameEn}</h3>`;
  if (siteData.siteNameAlt1)
    div.innerHTML += `<h3>${siteData.siteNameAlt1}</h3>`;

  div.innerHTML += `<a href="/datasets/${datasetId}">${siteData.datasetName}</a>`;
  div.innerHTML += `<p>${siteData.siteId}</p>`;

  div.innerHTML +=
    "<dl>" +
    Object.entries(additionalMetadata)
      .filter(([key, value]) => key !== "nanyangSiteId")
      .map(([key, value]) => {
        return `<dt>${key}</dt><dd>${processValue(value)}</dd>`;
      })
      .join("") +
    "</dl>";
  fullDetails.scrollTop = 0;
  fullDetails.classList.add("show");
};

const buildFullDetailsEl = () => {
  const fullDetails = document.createElement("div");

  fullDetails.classList.add("full-details");

  fullDetails.innerHTML = `
  <a class="leaflet-popup-close-button" role="button" aria-label="Close popup" href="#close"><span aria-hidden="true">×</span></a>
  <div></div>
  `;

  fullDetails
    .querySelector("a[href='#close']")
    .addEventListener("click", () => fullDetails.classList.remove("show"));

  fullDetails.addEventListener("wheel", (event) => event.stopPropagation());

  return fullDetails;
};

const popupClick = (marker, locations, datasetId, projectName) => {
  marker.getPopup().setContent(buildPopUp(locations, projectName));
  const popupEl = marker.getPopup().getElement();
  popupEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.siteId;
      fetch(`/data/${datasetId}/${id}.json`)
        .then((res) => res.json())
        .then((additionalMetadata) =>
          showFullDetailsSidebar(button.dataset, additionalMetadata, datasetId),
        );
    });
  });
};

const fullDetails = buildFullDetailsEl();
document.getElementById("map").appendChild(fullDetails);

const overlayLayers = {};

datasets.forEach((dataset, i) => {
  const markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    disableClusteringAtZoom: 12,
    spiderfyOnMaxZoom: false,
  });

  Object.entries(dataset.records).forEach(([latLong, locations]) => {
    const marker = L.marker(latLong.split(","), { icon: icon });
    marker
      .bindPopup()
      .on("click", () =>
        popupClick(marker, locations, dataset.id, dataset.projectName),
      );
    marker.getPopup().on("remove", () => fullDetails.classList.remove("show"));
    markers.addLayer(marker);
    map.addLayer(markers);
    overlayLayers[dataset.projectName] = markers;
  });
});

const layerControl = L.control
  .layers(
    { "Street Map": streetLayer, Satellite: satelliteLayer },
    overlayLayers /*, { collapsed: false } */,
  )
  .addTo(map);

const mapEl = document.getElementById("map");
mapEl.style.setProperty(
  "--attribution-height",
  mapEl.querySelector(".leaflet-control-attribution").offsetHeight + "px",
);
