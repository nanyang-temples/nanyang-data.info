import "leaflet";
import "leaflet.markercluster";
// Hack to expose global L from esm import
const L = window["L"];

export const getDataset = async (url) => {
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

export const streetLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
  },
);

export const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
);

export const buildPopUp = (marker, locations) =>
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

export const isValidHttpUrl = (string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

export const showFullDetailsSidebar = (siteData, additionalMetadata) => {
  const processValue = (value) => {
    if (isValidHttpUrl(value))
      return `<a href="${value}" target="_blank">${value}</a>`;
    return value;
  };

  const fullDetailsEl = document.querySelector(".full-details");
  const div = fullDetailsEl.querySelector("div");

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
  fullDetailsEl.scrollTop = 0;
  fullDetailsEl.classList.add("show");
};

export const buildFullDetailsEl = () => {
  const fullDetailsEl = document.createElement("div");

  fullDetailsEl.classList.add("full-details");

  fullDetailsEl.innerHTML = `
  <a class="leaflet-popup-close-button" role="button" aria-label="Close popup" href="#close"><span aria-hidden="true">×</span></a>
  <div></div>
  `;

  fullDetailsEl
    .querySelector("a[href='#close']")
    .addEventListener("click", () => fullDetailsEl.classList.remove("show"));

  fullDetailsEl.addEventListener("wheel", (event) => event.stopPropagation());
  L.DomEvent.disableClickPropagation(fullDetailsEl);

  return fullDetailsEl;
};

export const popupClick = (marker, locations) => {
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

export const processDataset = (dataset, i, iconColor) => {
  const sites = {};
  const markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    disableClusteringAtZoom: 12,
    spiderfyOnMaxZoom: false,
  });

  Object.entries(dataset.records).forEach(([latLong, locations]) => {
    const marker = L.marker(latLong.split(","), { icon: getIcon(iconColor) });
    marker.datasetName = dataset.projectName;
    marker.bindPopup().on("click", () =>
      popupClick(
        marker,
        locations.map((location) => ({
          ...location,
          ...{
            datasetIdx: i,
            hasExtendedMetadata: dataset.hasExtendedMetadata,
          },
        })),
      ),
    );
    marker
      .getPopup()
      .on("remove", () =>
        document.querySelector(".full-details").classList.remove("show"),
      );
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
  return [sites, markers];
};
