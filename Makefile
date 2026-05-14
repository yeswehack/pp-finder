SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -ec

.PHONY: all clean watch test cli loader compiler schema

DIST_DIR := dist
SRC_DIR := src
SOURCES := $(shell find $(SRC_DIR) -name '*.ts')
AGENTS := $(shell find $(SRC_DIR)/agents -name '*.ts')
TESTS := $(shell find ./test -type f)

all: cli loader compiler schema register

clean:
	@echo "Cleaning up"
	@rm -rf $(DIST_DIR)

watch:
	@while inotifywait -qre close_write $(SRC_DIR) $(TEST_DIR); do \
		$(MAKE) all; \
	done

test: loader compiler register $(SOURCES) $(TESTS)
	@echo "Starting tests"
	@yarn run ts-node ./test/main.ts

define build_rule
	@echo "Building $(1)"
	@mkdir -p $(DIST_DIR)
	@TMP_DIR=$$(mktemp -d) && \
	yarn run ncc build -q -t -o "$$TMP_DIR" "./$(SRC_DIR)/$(1).ts" && \
	mv "$$TMP_DIR/index.js" "$(DIST_DIR)/$(1).$(2)" && \
	rmdir "$$TMP_DIR"
endef

$(DIST_DIR)/%.cjs: $(SRC_DIR)/%.ts $(AGENTS)
	$(call build_rule,$*,"cjs")

$(DIST_DIR)/compiler.js: $(SRC_DIR)/compiler.ts
	$(call build_rule,compiler,"js")

$(DIST_DIR)/pp-finder.schema.json: $(SRC_DIR)/config.ts
	@echo "Generating JSON schema"
	@mkdir -p $(DIST_DIR)
	@TMP_DIR=$$(mktemp -d) && \
	yarn run ts-node > "$$TMP_DIR/schema.json" <<< "import { z } from 'zod'; \
	import {jsonParser} from './$(SRC_DIR)/config'; \
	const schema = z.toJSONSchema(jsonParser); \
	console.log(JSON.stringify(schema, null, 2));" && \
	mv "$$TMP_DIR/schema.json" "$(DIST_DIR)/pp-finder.schema.json" && \
	rmdir "$$TMP_DIR"

cli: $(DIST_DIR)/cli.cjs
loader: $(DIST_DIR)/loader.cjs
compiler: $(DIST_DIR)/compiler.js
schema: $(DIST_DIR)/pp-finder.schema.json
register: $(DIST_DIR)/register.cjs

.NOTPARALLEL: clean
