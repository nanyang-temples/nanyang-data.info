import type { APIRoute } from "astro";

import { datasets } from "@datasets";

export function getStaticPaths() {
  return Object.entries(datasets).map(([key, dataset]) => ({
    params: { dataset: key },
  }));
}

const mapLocationsByLatLong = (d) =>
  // create an object where keys are lat,long pairs and values are arrays of locations
  d.records.reduce(
    (result, site) => ({
      ...result,
      [`${site.latitude},${site.longitude}`]: [
        ...(result[`${site.latitude},${site.longitude}`] || []),
        (() => {
          // iife to drop the latitude and longitude entries
          const { latitude, longitude, ...rest } = site;
          return rest;
        })(),
      ],
    }),
    {},
  );

export const GET: APIRoute = ({ params, request }) => {
  const dataset = params.dataset;
  return new Response(
    JSON.stringify({
      dataset: {
        ...datasets[dataset],
        records: mapLocationsByLatLong(datasets[dataset]),
      },
    }),
  );
};
