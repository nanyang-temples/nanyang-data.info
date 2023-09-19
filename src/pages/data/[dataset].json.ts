import type { APIRoute } from "astro";

import { datasets } from "@datasets";

export function getStaticPaths() {
  return Object.entries(datasets).map(([key, dataset]) => ({
    params: { dataset: key },
  }));
}

export const GET: APIRoute = ({ params, request }) => {
  const dataset = params.dataset;
  return new Response(
    JSON.stringify({
      dataset: datasets[dataset],
    }),
  );
};
