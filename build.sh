#!/bin/bash

function abort() {
  echo "Error: $1" >/dev/stderr
  exit 1
}

POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
  -w | --watch)
    WATCH=1
    shift # past argument
    ;;
  -h | --help)
    HELP=1
    shift # past argument
    ;;
  -* | --*)
    abort "Unknown option $1"
    ;;
  *)
    POSITIONAL_ARGS+=("$1") # save positional arg
    shift                   # past argument
    ;;
  esac
done
function buildFile() {
  entrypoint="${1}"
  distfile="${2}"
  
  path=$(mktemp -d)
  ncc build -q -t -o "${path}" -e typescript -e zod "${entrypoint}"
  mv "${path}/index.js" "${distfile}"
  rmdir "${path}"
}

function buildSchema() {
  ts-node > ./dist/pp-finder.schema.json <<'EOF'
import { zodToJsonSchema } from "zod-to-json-schema";
import {ppFinderConfig} from "./src/types";

const schema = zodToJsonSchema(ppFinderConfig, "PPFinder");
console.log(JSON.stringify(schema, null, 2));
EOF
}

function buildAll() {

  echo -n "Building"
  (buildFile "src/index.ts" "./dist/index.cjs" && echo -n .) &
  (buildFile "src/compiler.ts" "./dist/compiler.js" && echo -n .) &
  (buildSchema && echo -n .) &
  wait
  echo " Done!"
}

if [ ! -z "${HELP}" ]; then
  echo "Usage: $0 [-w|--watch] [-h|--help]"
  echo "Builds pp-finder"
  echo
  echo "  -w, --watch   Watch for changes"
  echo "  -h, --help    Show this help message"
  exit 0
fi

cd "$(dirname "$(readlink -f -- "$0")")"
mkdir -p ./dist

if [ ! -z "${WATCH}" ]; then
  buildAll
  echo "Waiting for changes in ./src"
  while inotifywait -qq -e close_write -r ./src; do
    buildAll
    echo "Waiting for changes in ./src"
  done
else
  buildAll
fi
