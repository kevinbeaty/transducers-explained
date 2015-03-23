.PHONY: all
all: visits.log

visits.log: access.log | node_modules
	cat $< | node pagevisits.js > $@

node_modules:
	npm install
