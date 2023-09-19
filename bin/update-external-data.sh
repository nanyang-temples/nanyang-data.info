#!/usr/bin/env bash

set -euo pipefail;

function log() {
  [ ! -t 1 ] && printf "\n%s\n" "$1" && return;
  COLOR='\e[;93m'; # light yellow (93)
  RESET='\e[0m';
  DATE=$(date +%H:%M:%S);
  printf "%b[%s]: %s%b\n" "${COLOR}" "${DATE}" "$1" "${RESET}";
}

repositories_path=$(node_modules/js-yaml/bin/js-yaml.js config.yaml | jq -r .paths.repositories)
repositories=$(node_modules/js-yaml/bin/js-yaml.js config.yaml | jq -r .datasets[])


cd "$repositories_path";

for repository in $repositories; do
  repo_name="${repository##*/}";
  if [[ -d "$repo_name" ]]; then
    log "Updating $repo_name...";
    cd "$repo_name";
    git pull;
  else
    log "Cloning $repository...";
    git clone $repository;
  fi
done

