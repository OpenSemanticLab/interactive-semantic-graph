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
<script src="https://unpkg.com/@open-semantic-lab/interactive-semantic-graph@latest/dist/index.umd.js">// UMD bundle</script>
```


[license-url]: LICENSE
[license-img]: https://badgen.net/github/license/ahmadnassri/template-js-lib

[release-url]: https://github.com/ahmadnassri/template-js-lib/releases
[release-img]: https://badgen.net/github/release/ahmadnassri/template-js-lib

[semantic-url]: https://github.com/ahmadnassri/template-js-lib/actions?query=workflow%3Arelease
[semantic-img]: https://badgen.net/badge/📦/semantically%20released/blue

## Dev
```bash
npm i
npm run build
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
