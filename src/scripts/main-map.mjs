import "leaflet";
import "leaflet.markercluster";
import Autocomplete from "@vendor/autocomplete.esm.js";

// Hack to expose global L from esm import
const L = window["L"];

const datasetURLs = [
  "../data/01-buddhist_temples_taiwan/by-latlong.json",
  "../data/02-religious_sites_jinshan_shimen/by-latlong.json",
  "../data/01-temples_in_bangkok_mb/by-latlong.json",
  "../data/01-SGPchineseAssociations/by-latlong.json",
  "../data/02-SGPtemples/by-latlong.json",
  "../data/01-temples_in_bintan_mb/by-latlong.json",
  "../data/02-franke_indonesia/by-latlong.json",
];

const getDataset = async (url) => {
  const response = await fetch(url);
  const dataset = (await response.json()).dataset;
  return dataset;
};

export const getIcon = (fill) =>
  L.divIcon({
    className: "marker",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="${fill}" d="M12 12q.825 0 1.413-.588T14 10q0-.825-.588-1.413T12 8q-.825 0-1.413.588T10 10q0 .825.588 1.413T12 12Zm0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2q3.175 0 5.588 2.225T20 10.2q0 2.5-1.988 5.438T12 22Z"/></svg>`,
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

const colors = [
  "cadetblue",
  "chocolate",
  "rebeccapurple",
  "green",
  "crimson",
  "darkgoldenrod",
  "hotpink",
];

const style = document.createElement("style");
colors.forEach(
  (color, i) =>
    (style.textContent += `.leaflet-control-layers-overlays label:nth-of-type(${
      i + 1
    }) {accent-color: ${color};}\n.pill-${i} {background-color: ${color};}\n`),
);
document.body.appendChild(style);

const map = L.map("map", { minZoom: 4, maxZoom: 18 });
streetLayer.addTo(map);

// set view to show the relevant (?) part of Southeast Asia
// TODO: go back to setting this automatically?
map.setView([8, 110], 5);

const buildPopUp = (marker, locations) =>
  locations
    .map(
      (site) =>
        `<section>${[
          `<span class="pill pill-${site.datasetIdx}">${marker.datasetName}</span>`,
          site["siteNameZh"] || null,
          site["siteNameEn"] || null,
          site["siteNameAlt1"] || null,
          site.hasExtendedMetadata
            ? `<button data-site-id="${site.nanyangSiteId}">show details</button>`
            : null,
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

const showFullDetailsSidebar = (siteData, additionalMetadata) => {
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

  div.innerHTML += `<a href="/datasets/${siteData.datasetId}">${siteData.datasetName}</a>`;
  div.innerHTML += `<p>${siteData.nanyangSiteId}</p>`;

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
  L.DomEvent.disableClickPropagation(fullDetails);

  return fullDetails;
};

const popupClick = (marker, locations) => {
  marker.getPopup().setContent(buildPopUp(marker, locations));
  const popupEl = marker.getPopup().getElement();
  popupEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const siteData = sites[button.dataset.siteId];
      fetch(`/data/${siteData.datasetId}/${button.dataset.siteId}.json`)
        .then((res) => res.json())
        .then((additionalMetadata) =>
          showFullDetailsSidebar(siteData, additionalMetadata),
        );
    });
  });
};

const fullDetails = buildFullDetailsEl();
document.getElementById("map").appendChild(fullDetails);

const layers = {};
let sites = {};

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
      "opacity 2s ease";
    document.querySelector("#map .loading").style.opacity = 0;
    window.requestAnimationFrame(() =>
      setTimeout(() => {
        document.querySelector("#map .loading").remove();
      }, 2000),
    );
  }, 1000),
);

document.querySelector(".auto-search-wrapper").style.display = "block";

/* Create layer groups and plot markers */
datasets.forEach((dataset, i) => {
  const markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    disableClusteringAtZoom: 12,
    spiderfyOnMaxZoom: false,
  });

  Object.entries(dataset.records).forEach(([latLong, locations]) => {
    const marker = L.marker(latLong.split(","), { icon: getIcon(colors[i]) });
    marker.datasetName = dataset.projectName;
    marker.bindPopup().on("click", () =>
      popupClick(
        marker,
        locations.map((location) => ({
          ...location,
          ...{
            hasExtendedMetadata: dataset.hasExtendedMetadata,
            datasetIdx: i,
          },
        })),
      ),
    );
    marker.getPopup().on("remove", () => fullDetails.classList.remove("show"));
    markers.addLayer(marker);
    locations.forEach((location) => {
      sites[location.nanyangSiteId] = {
        ...location,
        ...{
          datasetId: dataset.id,
          datasetIdx: i,
          datasetName: dataset.projectName,
          hasExtendedMetadata: dataset.hasExtendedMetadata,
          marker,
        },
      };
    });
  });
  map.addLayer(markers);
  layers[dataset.projectName] = markers;
});

const layerControl = L.control
  .layers({ "Street Map": streetLayer, Satellite: satelliteLayer }, layers, {
    collapsed: false,
  })
  .addTo(map);

const mapEl = document.getElementById("map");
mapEl.style.setProperty(
  "--attribution-height",
  mapEl.querySelector(".leaflet-control-attribution").offsetHeight + "px",
);

const markupSearchResult = (siteName, query) => {
  return siteName
    ? siteName.replace(new RegExp(query, "i"), (str) => `<mark>${str}</mark>`)
    : null;
};

const formatSearchResult = (site, query) => {
  return `<li>${[
    `<span class="pill pill-${site.datasetIdx}">${site.datasetName}</span>`,
    markupSearchResult(site.siteNameZh, query),
    markupSearchResult(site.siteNameEn, query),
    markupSearchResult(site.siteNameAlt1, query),
  ]
    .filter(Boolean)
    .join("<br>")}</li>`;
};

const searchInput = new Autocomplete("search", {
  cache: false,
  selectFirst: true,

  onSearch: ({ currentValue }) => {
    return Object.values(sites).filter(
      (site) =>
        site.siteNameEn?.match(new RegExp(currentValue, "i")) ||
        site.siteNameZh?.match(new RegExp(currentValue, "i")) ||
        site.siteNameAlt1?.match(new RegExp(currentValue, "i")),
    );
  },

  onResults: ({ currentValue, matches, template }) => {
    return matches === 0
      ? template
      : matches.map((site) => formatSearchResult(site, currentValue)).join("");
  },

  onSubmit: ({ element, object }) => {
    searchInput.destroy();
    element.blur();
    map.once("zoomend", () =>
      setTimeout(() => {
        object.marker.openPopup();
        popupClick(object.marker, [object]);
      }, 1),
    );
    map.flyTo(Object.values(object.marker._latlng), 12);
  },

  onOpened: ({ results }) => {
    document.querySelector(".auto-search-wrapper").style.zIndex = "1003";
    const resultsTop = results.parentElement.getBoundingClientRect().top;
    const footerHeight = document.body.querySelector("footer").offsetHeight;
    results.parentElement.style.maxHeight = `calc(100dvh - ${resultsTop}px - ${footerHeight}px - 10px)`;
  },

  onClose: () => {
    document.querySelector(".auto-search-wrapper").style.zIndex = "999";
  },

  noResults: ({ currentValue, template }) =>
    template(`<li>No results found: “${currentValue}”</li>`),
});
