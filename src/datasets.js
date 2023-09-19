import fs from "fs";
import path from "path";
import { execSync } from "node:child_process";

import neatCsv from "neat-csv";
import yaml from "js-yaml";

import config from "@config";
const repositories = config.datasets;
const repositoriesPath = config.paths.repositories;

export const datasets = {};

for (let repositoryUrl of repositories) {
  const repositoryName = repositoryUrl.split("/").pop();
  const repositoryPath = path.join(repositoriesPath, repositoryName);
  if (!fs.lstatSync(repositoryPath).isDirectory()) continue;

  const repositoryRev = execSync("git rev-parse --short HEAD", {
    cwd: repositoryPath,
  })
    .toString()
    .trim();

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
      path.join(repositoryPath, `${id}_meta.yaml`),
      "utf8",
    );

    const records = await neatCsv(csvFileContents, "utf-8");
    const metadata = yaml.load(yamlFileContents);

    datasets[id] = {
      id,
      records,
      repositoryPath,
      repositoryUrl,
      repositoryName,
      repositoryRev,
      ...metadata,
    };
  }
}
