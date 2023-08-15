import fs from "fs";
import path from "path";

import neatCsv from "neat-csv";

import config from "@config";
const {
  paths: { data: dataPath },
} = config;

const datasetCsvs = fs.readdirSync(dataPath).filter((f) => f.endsWith(".csv"));

export const datasets = Object.fromEntries(
  await Promise.all(
    datasetCsvs.map(async (datasetCsvPath) => {
      const id = path.parse(datasetCsvPath).name;
      const csv = fs.readFileSync(path.join(dataPath, datasetCsvPath), "utf-8");
      return [id, await neatCsv(csv, "utf-8")];
    }),
  ),
);
