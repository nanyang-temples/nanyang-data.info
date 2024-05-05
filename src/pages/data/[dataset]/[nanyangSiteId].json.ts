import fs from "fs";
import path from "path";

import yaml from "js-yaml";

import type { APIRoute } from "astro";

import { datasets } from "@datasets";

export function getStaticPaths() {
  return Object.entries(datasets)
    .filter(([, dataset]) => dataset.hasExtendedMetadata)
    .reduce((result, [key, dataset]) => {
      dataset.records.forEach((record) => {
        result.push({
          params: { dataset: key, nanyangSiteId: record.nanyangSiteId },
        });
      });
      return result;
    }, []);
}

const getExtendedMetadata = (repositoryPath, datasetId) => {
  const yamlFileContents = fs.readFileSync(
    path.join(repositoryPath, `${datasetId}.yaml`),
    "utf8",
  );

  return yaml.load(yamlFileContents);
};

export const GET: APIRoute = ({ params, request }) => {
  const dataset = datasets[params.dataset];
  const data = getExtendedMetadata(dataset.repositoryPath, dataset.id);
  return new Response(
    JSON.stringify(
      data.find((record) => record.nanyangSiteId === params.nanyangSiteId),
    ),
  );
};
