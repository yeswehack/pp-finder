all: cli loader compiler schema
schema: dist/pp-finder.schema.json
cli: dist/cli.cjs
loader: dist/loader.cjs
compiler: dist/compiler.js

clean:
	@echo "Cleaning up"
	@rm -rf ./dist



SOURCES := $(shell find ./src -name '*.ts')
TESTS := $(shell find ./test -type f)

watch:
	@while true; do \
		$(MAKE) all; \
		inotifywait -qre close_write .; \
	done

test: loader compiler .WAIT ${SOURCES} ${TESTS}
	@echo "Starting tests"
	@ts-node ./test/main.ts

dist/loader.cjs: ${SOURCES}
	@echo "Building loader"
	@mkdir -p dist
	@TMP_DIR="$$(mktemp -d)" && \
	ncc build -q -t -o "$${TMP_DIR}" "./src/loader.ts" && \
	mv "$${TMP_DIR}/index.js" "./dist/loader.cjs" && \
	rmdir "$${TMP_DIR}"

dist/cli.cjs:  ${SOURCES}
	@echo "Building CLI"
	@mkdir -p dist
	@TMP_DIR="$$(mktemp -d)" && \
	ncc build -q -t -o "$${TMP_DIR}" "./src/cli.ts" && \
	mv "$${TMP_DIR}/index.js" "./dist/cli.cjs" && \
	rmdir "$${TMP_DIR}"

dist/compiler.js:  ${SOURCES}
	@echo "Building compiler"
	@mkdir -p dist
	@TMP_DIR="$$(mktemp -d)" && \
	ncc build -q -t -o "$${TMP_DIR}" "./src/compiler.ts" && \
	mv "$${TMP_DIR}/index.js" "./dist/compiler.js" && \
	rmdir "$${TMP_DIR}"

dist/pp-finder.schema.json: ./src/config.ts
	@echo "Generating JSON schema"
	@mkdir -p dist
	@ts-node > dist/pp-finder.schema.json <<< "import { zodToJsonSchema } from 'zod-to-json-schema';\
	import {jsonParser} from './src/config';\
	const schema = zodToJsonSchema(jsonParser, 'PPFinder');\
	console.log(JSON.stringify(schema, null, 2));"

