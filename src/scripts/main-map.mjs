import * as L from "leaflet/dist/leaflet-src.esm.js";

const response = await fetch("../data/01-temples_in_bangkok_mb.json");
const sites = (await response.json()).dataset;

export const icon = L.divIcon({
  className: "marker",
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q.825 0 1.413-.588T14 10q0-.825-.588-1.413T12 8q-.825 0-1.413.588T10 10q0 .825.588 1.413T12 12Zm0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2q3.175 0 5.588 2.225T20 10.2q0 2.5-1.988 5.438T12 22Z"/></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -45],
});

const tileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    maxZoom: 16,
  },
);

const map = L.map("map", { minZoom: 4, maxZoom: 12 });
tileLayer.addTo(map);

// set view to show the relevant (?) part of Southeast Asia
map.setView([13, 110], 5);

// create an object where keys are lat,long pairs and values are arrays of locations
const locationsByLatLong = sites.reduce(
  (result, site) => ({
    ...result,
    [`${site.latitude},${site.longitude}`]: [
      ...(result[`${site.latitude},${site.longitude}`] || []),
      site,
    ],
  }),
  {},
);

map.invalidateSize();
map.fitBounds(
  Object.keys(locationsByLatLong)
    .filter((latLong) => latLong != ",")
    .map((latLong) => latLong.split(",")),
);

Object.entries(locationsByLatLong).forEach(([latLong, locations]) => {
  L.marker(latLong.split(","), { icon: icon })
    .addTo(map)
    .bindPopup(
      locations
        .map(
          (site) =>
            `<p>${[
              site.nanyangSiteID,
              site["SiteName-zh"],
              site["siteName-en"],
              site["siteName-alt1"],
            ].join("<br>")}</p>`,
        )
        .join(""),
    );
});
