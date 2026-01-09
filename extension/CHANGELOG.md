# Changelog

## [1.0.0](https://github.com/jonshaffer/wgu-extension/compare/unofficial-wgu-extension-v0.1.0...unofficial-wgu-extension-v1.0.0) (2026-01-09)


### ⚠ BREAKING CHANGES

* **types:** @wgu-extension/types package has been consolidated into @wgu-extension/data. Consumers should update their imports from '@wgu-extension/types' to '@wgu-extension/data'.
* **data:** Data directory moved from extension/data to root data/. All data scripts now run from data workspace using npm --workspace=data.
* Major project restructuring into monorepo format

### feat\

* restructure project as monorepo with extension, functions, and site workspaces ([4ee432c](https://github.com/jonshaffer/wgu-extension/commit/4ee432cbdd283d0ad9501fc365b153e1f27a8481))


### Features

* **api:** add GraphQL API infrastructure ([21da86f](https://github.com/jonshaffer/wgu-extension/commit/21da86f1d83b5feea6f2a6e24e527272b73da973))
* **ci:** update workflow for WIF authentication and env examples ([3dfa380](https://github.com/jonshaffer/wgu-extension/commit/3dfa3803798b06ea841ffdf636e69d589a0aed7d))
* **config:** centralize configuration into shared modules ([0d14b2f](https://github.com/jonshaffer/wgu-extension/commit/0d14b2fdb4368bc168e1c6d341c954a8f479942d))
* **connect:** accept free-form resource.type and unify ingest endpoint ([cf68e8e](https://github.com/jonshaffer/wgu-extension/commit/cf68e8e1b9f764a37faf3197511e429136ec99ca))
* **discord:** generate processed communities aggregate and schema; publish via Pages and add local Pages builder/serve scripts ([87ae6f3](https://github.com/jonshaffer/wgu-extension/commit/87ae6f3ae6d750d2ed2be6862c104c54ad6fc8ed))
* **dvc:** integrate DVC pull into build and CI/CD workflows ([a996e84](https://github.com/jonshaffer/wgu-extension/commit/a996e84aeab54a70cab20103971a9521f9887347))
* **extension:** add task description print styles ([1a1aec7](https://github.com/jonshaffer/wgu-extension/commit/1a1aec74f79053d74238812faaa588247bb0a7d4)), closes [#16](https://github.com/jonshaffer/wgu-extension/issues/16)
* **extension:** update community data integration for GraphQL ([d16169f](https://github.com/jonshaffer/wgu-extension/commit/d16169fead6c04a5ba2ef511ae1fec55919a0e3e))
* **extension:** use remote unified community data across content scripts and panels\n\n- Replace bundled asset loads with remote loader + TTL cache\n- Update Reddit, Discord, WGU Connect content scripts to use unified data\n- Switch Communities/Search panels and utilities to unified courseMappings\n- Fix minor issues (Discord whitelist, icon path) ([138739f](https://github.com/jonshaffer/wgu-extension/commit/138739f59518f7487dc145a4011aad557ed6ad13))
* Firebase deployment with Workload Identity Federation ([d0c55f2](https://github.com/jonshaffer/wgu-extension/commit/d0c55f28d0e84f94fc26c6f339c317a7dba003c7))
* generating an aggregate file of the catalog data ([7c46fce](https://github.com/jonshaffer/wgu-extension/commit/7c46fce03333ac58f972e7899221b016914524e2))
* implement universal AGENT.md system with comprehensive tool support ([9b9e0fd](https://github.com/jonshaffer/wgu-extension/commit/9b9e0fd8a5605977e6a7b73f99a97e5d10f91270))
* merge Spec Kit implementation and monorepo structure ([9c8616a](https://github.com/jonshaffer/wgu-extension/commit/9c8616a5e335f5edba408a33f93d663279513e4e))
* **site:** add complete browse interface with resource layouts ([6cd8c15](https://github.com/jonshaffer/wgu-extension/commit/6cd8c15eb4fb669bf13963b99c892b918afb867d))
* **types:** add raw types and JSON Schemas for WGU Connect and WGU Student Groups; export Zod types in @wgu-extension/types; include schemas in Pages ([3d09cbc](https://github.com/jonshaffer/wgu-extension/commit/3d09cbc267ba53c33fa2a0d25abc67071a6bb064))


### Bug Fixes

* address PR review comments for type safety and CI reliability ([a2e1c2d](https://github.com/jonshaffer/wgu-extension/commit/a2e1c2da5f24f0a7e27bb4929a683e80e79b1f00))
* **build:** resolve GraphQL export issues and add placeholder extractors ([66bdcf8](https://github.com/jonshaffer/wgu-extension/commit/66bdcf8a0ad7b6ff1ab76ebba9f23edad7faf812))
* **ci:** configure npm for platform-specific dependencies in CI environments ([64db363](https://github.com/jonshaffer/wgu-extension/commit/64db363c7cc174ddd5bda535130e3388c686ea11))
* **extension:** add missing npm scripts for CI preview builds ([6224b9f](https://github.com/jonshaffer/wgu-extension/commit/6224b9f5a6a6742ba73b09e32e89061c22f878ac))
* **extension:** correct GraphQL client function parameter order ([9ee4d01](https://github.com/jonshaffer/wgu-extension/commit/9ee4d01950ea009f5a8c7c14f9a69f9ed9b72978))
* **extension:** resolve React import errors and component type issues ([82ac1ce](https://github.com/jonshaffer/wgu-extension/commit/82ac1cec314ecd9262ee13c90b9e844eb11d7895))
* **extension:** resolve TypeScript type errors in content scripts and components ([c904aed](https://github.com/jonshaffer/wgu-extension/commit/c904aeddf50bee86c62e28ea48648c71e5469fcd))
* resolve CI workflow issues across all workspaces ([ecadc95](https://github.com/jonshaffer/wgu-extension/commit/ecadc95c46e2fed2b90bd1d5cb12eb0d0922c1dc))
* resolve CI workflow issues across all workspaces ([68feaaa](https://github.com/jonshaffer/wgu-extension/commit/68feaaa99744cd18ce8ba11b98b7ac57a26ff4da))
* resolve WXT duplicate imports and prepare for Firebase deployment ([1230e09](https://github.com/jonshaffer/wgu-extension/commit/1230e0959a5840cf06d1341147415c0d7acc9b82))
* resolve WXT duplicate imports and prepare for Firebase deployment ([8f04eca](https://github.com/jonshaffer/wgu-extension/commit/8f04ecae99da9e69e9def1757d3b7b0f51af4d38))
* skip WXT postinstall in CI environments ([7a4152e](https://github.com/jonshaffer/wgu-extension/commit/7a4152e6cbcc842d121a9e841838dfa28b4c4ef9))
* **types:** add missing type declarations and Chrome API types ([0db161c](https://github.com/jonshaffer/wgu-extension/commit/0db161c5e229cb7e9166ddca22da2a245cc490ab))
* update workspace packages for pnpm compatibility ([ef83453](https://github.com/jonshaffer/wgu-extension/commit/ef834533c396f228fee97f98d493c8eb4c9db51e))
* use npx for wxt postinstall to resolve CI binary path issue ([fa889d2](https://github.com/jonshaffer/wgu-extension/commit/fa889d2faa4e3ffb559687d5e4d0099fd56410b8))


### Documentation

* migrate all documentation from npm to pnpm ([0de88c8](https://github.com/jonshaffer/wgu-extension/commit/0de88c88c1d64db767d6cb31bcab9421324b9a1a))


### Styles

* **lint:** resolve ESLint errors across all workspaces ([9421008](https://github.com/jonshaffer/wgu-extension/commit/94210082dfe5ca65dffd3d7a184b92461033e86f))


### Code Refactoring

* address PR [#42](https://github.com/jonshaffer/wgu-extension/issues/42) review feedback ([a2923ca](https://github.com/jonshaffer/wgu-extension/commit/a2923ca0dd08a0df09761b7d3faf83f000869948))
* **assets:** centralize icons and logos with symlinks ([2d949a7](https://github.com/jonshaffer/wgu-extension/commit/2d949a70fef16fa6a17aae3683db45cc0310c500))
* **data:** move data management from extension/data to root data workspace ([bd7d40c](https://github.com/jonshaffer/wgu-extension/commit/bd7d40cfaa069a70708e966236d7c03aad19f0b7))
* **data:** remove legacy data collection infrastructure ([1bc84f5](https://github.com/jonshaffer/wgu-extension/commit/1bc84f5cda7b0a855cbcf9a7f5c0db9016c8bb78))
* **scripts:** clean up data pipeline and remove unused unified generation ([ddb1ba4](https://github.com/jonshaffer/wgu-extension/commit/ddb1ba42a6b6bd59c4b9e391ed1794d543f531e3))
* **types:** consolidate types package into data workspace ([fc0df0d](https://github.com/jonshaffer/wgu-extension/commit/fc0df0d4b9c8c4a1bc4692b461c813474f9ac2d6))
