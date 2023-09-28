# Interactive Semantic Graph

Interactive semantic graph tool based on vis.js

[![license][license-img]][license-url]
[![release][release-img]][release-url]
[![semantic][semantic-img]][semantic-url]

## Features



## Install

``` bash
npm install interactive-semantic-graph
```


### Browser

``` html
<script src="https://unpkg.com/@open-semantic-lab/interactive-semantic-graph@latest/dist/isg.umd.js">// UMD bundle</script>
```


[license-url]: LICENSE
[license-img]: https://badgen.net/github/license/OpenSemanticLab/interactive-semantic-graph

[release-url]: https://github.com/OpenSemanticLab/interactive-semantic-graph/releases
[release-img]: https://badgen.net/github/release/OpenSemanticLab/interactive-semantic-graph

[semantic-url]: https://github.com/OpenSemanticLab/interactive-semantic-graph/actions?query=workflow%3Arelease
[semantic-img]: https://badgen.net/badge/📦/semantically%20released/blue

## Dev

### Requirements
nodejs, e. g. from https://github.com/crazy-max/nodejs-portable

### Clone & Install
```bash
git clone https://github.com/OpenSemanticLab/interactive-semantic-graph
cd interactive-semantic-graph
npm i
```

### Build
```bash
npm run build
```
or
```bash
npx webpack
```

### Build
```bash
npm run test
```

### ESLint
```bash
npx eslint file.js

#or 

npx eslint folder
```

## Local Automation

use [Docker Compose][] to run tasks locally:

-   `docker-compose run readme` to regenerate `README.md`
-   `docker-compose run test` to run tests across all LTS versions of Node.js
-   `docker-compose run lint` to execute [super-linter][] locally

> **Note:**  
> Your main `README.md` file is in `docs/README.md`, the file at root is generated using [pandoc][] using the provided [template][].
>
> You should run `docker-compose run readme` after any change to `docs/README.md` and before commit / push
