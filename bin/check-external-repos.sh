#!/usr/bin/env bash

set -euo pipefail;

function log() {
  [ ! -t 1 ] && printf "\n%s\n" "$1" && return;
  COLOR='\e[;93m'; # light yellow (93)
  RESET='\e[0m';
  DATE=$(date +%H:%M:%S);
  printf "%b[%s]: %s%b\n" "${COLOR}" "${DATE}" "$1" "${RESET}";
}

repositories=$(node_modules/js-yaml/bin/js-yaml.js config.yaml | jq -r .datasets[])


for repository in $repositories; do
  repo_name="${repository##*/}";
  repo_revision=$(git ls-remote $repository HEAD | cut -f1)
  log "$repo_name: $repo_revision"
  
done

