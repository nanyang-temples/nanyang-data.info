import fs from "fs";
import path from "path";

import neatCsv from "neat-csv";
import yaml from "js-yaml";

import config from "@config";
const repositoriesPath = config.paths.repositories;

export const datasets = {};

for (let dir of fs.readdirSync(repositoriesPath)) {
  const repositoryPath = path.join(repositoriesPath, dir);
  console.log(dir, "|", repositoryPath);
  if (!fs.lstatSync(repositoryPath).isDirectory()) continue;
  const datasetCsvs = fs
    .readdirSync(repositoryPath)
    .filter((f) => f.endsWith(".csv"));

  for (const datasetCsvPath of datasetCsvs) {
    const id = path.parse(datasetCsvPath).name;

    const csvFileContents = fs.readFileSync(
      path.join(repositoryPath, datasetCsvPath),
      "utf-8",
    );

    const yamlFileContents = fs.readFileSync(
      path.join(repositoryPath, `${id}.yaml`),
      "utf8",
    );

    const records = await neatCsv(csvFileContents, "utf-8");
    const metadata = yaml.load(yamlFileContents);

    datasets[id] = { id, records, ...metadata };
  }
}
