.PHONY: all slides present
all: slides docs

docs: index.js transducers-explained-*.js | node_modules
	`npm bin`/docco *.js

slides: build/slides.html

present: slides
	python -m webbrowser -t "localhost:8000/build/slides.html"

serve: slides
	python -m SimpleHTTPServer

build/slides.html: slides.md | node_modules build
	`npm bin`/biggie $< > $@

node_modules:
	npm install

build:
	mkdir -p build
