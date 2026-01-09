# Changelog

## [1.0.0](https://github.com/jonshaffer/wgu-extension/compare/data-v0.1.0...data-v1.0.0) (2026-01-09)


### ⚠ BREAKING CHANGES

* **dvc:** Git LFS has been completely removed in favor of DVC
* **types:** @wgu-extension/types package has been consolidated into @wgu-extension/data. Consumers should update their imports from '@wgu-extension/types' to '@wgu-extension/data'.
* **data:** Data directory moved from extension/data to root data/. All data scripts now run from data workspace using npm --workspace=data.
* Major project restructuring into monorepo format
* **reddit:** File naming convention changed to lowercase

### feat\

* restructure project as monorepo with extension, functions, and site workspaces ([4ee432c](https://github.com/jonshaffer/wgu-extension/commit/4ee432cbdd283d0ad9501fc365b153e1f27a8481))


### Features

* add Discord community data files ([dbde37d](https://github.com/jonshaffer/wgu-extension/commit/dbde37d790b0b2fa387f32d0ae58d23ec87d65a7))
* **catalog:** add simplified catalog processing system ([2ab7440](https://github.com/jonshaffer/wgu-extension/commit/2ab7440f99676d121c322261d92acfea0e858c07))
* **catalogs:** unify ingest to data/catalogs/scripts, fix path config to use relative repo paths; write parsed outputs to data/catalogs/parsed\n\n- normalize config paths at runtime; persist relative paths in JSON\n- update analyzer/fetch scripts to use configured parsedDirectory\n- fix relative input resolution in unified parser\n- regenerate parsing report and parsed outputs ([c0d11f2](https://github.com/jonshaffer/wgu-extension/commit/c0d11f2ffff09aabaf155b9f648e7a1107e593cd))
* **data:** add catalog ingestion scripts and type definitions ([2d69e49](https://github.com/jonshaffer/wgu-extension/commit/2d69e49a0e557972bcbe0b65225bfeb9ef841dc1))
* **data:** add Firestore upload scripts and catalog processing ([c2a39e0](https://github.com/jonshaffer/wgu-extension/commit/c2a39e03d4d1117edef65f19598977e21abd3146))
* **data:** add new data processing infrastructure ([688cc7e](https://github.com/jonshaffer/wgu-extension/commit/688cc7e539cefb02a8364adb2fa107974ebdd801))
* **data:** add raw catalog files with Git LFS support ([960ffdd](https://github.com/jonshaffer/wgu-extension/commit/960ffdd089af1424d0acda0b8aaea6d4a04bd136))
* **data:** add Reddit communities and WGU Student Groups data ([a7b4347](https://github.com/jonshaffer/wgu-extension/commit/a7b43470154179aaae8ed8b68486825d13d4c0cf))
* **data:** create unified directory and relocate type definitions ([9249b57](https://github.com/jonshaffer/wgu-extension/commit/9249b574e1316770f2109e7e92f0bfe08be59c11))
* **data:** enhance WGU Connect resource extraction with privacy focus ([c7284b3](https://github.com/jonshaffer/wgu-extension/commit/c7284b3d78078ea2888b8f8d9fdc1d26f9c787e3))
* **data:** migrate catalog files to DVC for efficient large file handling ([5643566](https://github.com/jonshaffer/wgu-extension/commit/5643566fed82043cc2375306802a049bdb51b430))
* **discord:** add live data collection system for Discord servers ([f57a775](https://github.com/jonshaffer/wgu-extension/commit/f57a77541aebc94023f43571fd7882886c05b166))
* **discord:** add raw types + JSON schema, unified validator with invite checks; add WGU Unofficial server\n\n- types: data/discord/types/raw-discord.ts + type guard + barrel\n- schema: data/discord/types/discord-community.schema.json (AJV)\n- validator: data/discord/scripts/validate-raw.ts with --check-invites\n- invites lib: data/discord/scripts/lib/invites.ts (shared)\n- ingest script now uses types/guard\n- CI: add validate-discord-data workflow; standardize dashed script names\n- data: fix WGU CS invite; add 600152872767979523 (WGU Unofficial)\n\nAlso: migrate Reddit validator to dashed filename and update scripts/workflow. ([bbdaf41](https://github.com/jonshaffer/wgu-extension/commit/bbdaf41dddf180204e1c75abce7bcbd9eb8a9619))
* **dvc:** extend DVC to manage all raw community data files ([d390342](https://github.com/jonshaffer/wgu-extension/commit/d390342059a939d10c78ca2dabbae1b7c82a6397))
* **dvc:** integrate DVC pull into build and CI/CD workflows ([a996e84](https://github.com/jonshaffer/wgu-extension/commit/a996e84aeab54a70cab20103971a9521f9887347))
* **dvc:** migrate from Git LFS to DVC for all large files ([bedbce5](https://github.com/jonshaffer/wgu-extension/commit/bedbce5454ddadb5a4215f7f4601b720f5e9d334))
* Firebase deployment with Workload Identity Federation ([d0c55f2](https://github.com/jonshaffer/wgu-extension/commit/d0c55f28d0e84f94fc26c6f339c317a7dba003c7))
* **firestore:** implement Mathematical Transfer pattern for efficient data sync ([df7f54a](https://github.com/jonshaffer/wgu-extension/commit/df7f54a7e0eb2e5253cfdd7c46386eba5a7a5781))
* implement production-ready catalog automation system ([cd6b40c](https://github.com/jonshaffer/wgu-extension/commit/cd6b40c2d2068290be6af1849a3ee39c24c2d0cc))
* **ingest:** enhance Reddit data processing pipeline ([5ada7c8](https://github.com/jonshaffer/wgu-extension/commit/5ada7c8ad8f39a5e2496bb8e21f35a586c27b567))
* merge Spec Kit implementation and monorepo structure ([9c8616a](https://github.com/jonshaffer/wgu-extension/commit/9c8616a5e335f5edba408a33f93d663279513e4e))
* **processed:** add consolidated Reddit communities output ([e7559c3](https://github.com/jonshaffer/wgu-extension/commit/e7559c37bad3a18ebfd6e1d4dcae1cb4fb90a5e7))
* restructure WGU Connect data to individual files ([ce5f5e6](https://github.com/jonshaffer/wgu-extension/commit/ce5f5e6b73dce0c9864274dd130a312af81743c9))
* **scripts:** add WGU Student Groups data ingestion script ([723d6be](https://github.com/jonshaffer/wgu-extension/commit/723d6be54d55ae0958ac83fe6eb2894c0d30494d))
* **site:** add complete browse interface with resource layouts ([6cd8c15](https://github.com/jonshaffer/wgu-extension/commit/6cd8c15eb4fb669bf13963b99c892b918afb867d))
* **types:** add Reddit community type definitions ([a549a3f](https://github.com/jonshaffer/wgu-extension/commit/a549a3fea69d472c6d843ef064a37b03e7d7e3dd))
* **validation:** add Reddit raw data validation script ([82db4d0](https://github.com/jonshaffer/wgu-extension/commit/82db4d0708df9cf7ee5ae4e4e9b7ba671f0db763))
* **wgu-student-groups:** add Group Hubs extractor, JSDOM test harness, and content-script integration; add npm script to run tests ([a756947](https://github.com/jonshaffer/wgu-extension/commit/a75694718cd3611cf431620be8f0d87749d7c839))


### Bug Fixes

* correct WGU college name from 'healthcare' to 'health' ([250217e](https://github.com/jonshaffer/wgu-extension/commit/250217edd7bca5bf780d8dca700834ae06664f21))
* **data:** add explicit .js extensions for ESM compatibility ([0aaa3df](https://github.com/jonshaffer/wgu-extension/commit/0aaa3df62f34c957594000aa69aa563b7d5407f5))
* **data:** resolve TypeScript configuration and module resolution errors ([80070ee](https://github.com/jonshaffer/wgu-extension/commit/80070ee4934af2ebebdca35e84188501b481abc6))
* resolve CI workflow issues across all workspaces ([ecadc95](https://github.com/jonshaffer/wgu-extension/commit/ecadc95c46e2fed2b90bd1d5cb12eb0d0922c1dc))
* update data workspace npm scripts to resolve CI failures ([c98f3e4](https://github.com/jonshaffer/wgu-extension/commit/c98f3e41eb7d5d6338641b385739bbdba5bbb94f))
* update workspace packages for pnpm compatibility ([ef83453](https://github.com/jonshaffer/wgu-extension/commit/ef834533c396f228fee97f98d493c8eb4c9db51e))


### Documentation

* migrate all documentation from npm to pnpm ([0de88c8](https://github.com/jonshaffer/wgu-extension/commit/0de88c88c1d64db767d6cb31bcab9421324b9a1a))
* update documentation for new architecture ([557562b](https://github.com/jonshaffer/wgu-extension/commit/557562bd47cf72eea1e5767fe23ff5684b549ea7))


### Styles

* **lint:** resolve ESLint errors across all workspaces ([9421008](https://github.com/jonshaffer/wgu-extension/commit/94210082dfe5ca65dffd3d7a184b92461033e86f))


### Code Refactoring

* **catalogs:** move historical/parsed -&gt; parsed and historical/pdfs -&gt; pdfs; update scripts, docs, workflow, and LFS attrs ([7efbb55](https://github.com/jonshaffer/wgu-extension/commit/7efbb5584ffe8c839c22af3774a2c11ac57b6a57))
* **catalogs:** remove data/catalogs/raw in favor of data/catalogs/pdfs; migrate existing files and update LFS config ([49c3f18](https://github.com/jonshaffer/wgu-extension/commit/49c3f18d150cec607cafe45c39933c62550fd167))
* clean up data structure with individual community files ([3f318b6](https://github.com/jonshaffer/wgu-extension/commit/3f318b6fe6d616c46b2c4cc2720e6559672f77b1))
* **data:** consolidate raw catalog files into catalogs directory ([9c6f41e](https://github.com/jonshaffer/wgu-extension/commit/9c6f41e046d2b44b7bc53ff8176b7424d2eddb55))
* **data:** migrate DVC from individual files to collection-based tracking ([50c3cc2](https://github.com/jonshaffer/wgu-extension/commit/50c3cc22a0d4857552dffd2a67fd4e6be19e7cfd))
* **data:** move data management from extension/data to root data workspace ([bd7d40c](https://github.com/jonshaffer/wgu-extension/commit/bd7d40cfaa069a70708e966236d7c03aad19f0b7))
* **data:** move pipeline orchestrator to data/ root level ([e4c4e22](https://github.com/jonshaffer/wgu-extension/commit/e4c4e228dd207a7ad0b12c96bfec1cb7f28075ab))
* **data:** organize course files into public/data/courses/ directory ([d5e9342](https://github.com/jonshaffer/wgu-extension/commit/d5e934200564d785939ec31d566e65e09871a5b7))
* **data:** remove legacy data collection infrastructure ([1bc84f5](https://github.com/jonshaffer/wgu-extension/commit/1bc84f5cda7b0a855cbcf9a7f5c0db9016c8bb78))
* **data:** reorganize community data into self-contained directories ([98d4db9](https://github.com/jonshaffer/wgu-extension/commit/98d4db9c3237610f5aa39a951964a22dbcd3939d))
* **data:** reorganize generated files to public/data/ directory ([3e0a440](https://github.com/jonshaffer/wgu-extension/commit/3e0a44048f81ce057a00d0948f59e04d66e1dc54))
* **reddit:** standardize raw data file naming to lowercase ([754058f](https://github.com/jonshaffer/wgu-extension/commit/754058fa8637896fb37c24c13254f296a721dcd6))
* remove unused catalog management scripts ([6dc8620](https://github.com/jonshaffer/wgu-extension/commit/6dc8620d8db723e9b4a9dc9548df5a3ab4c7eff6))
* **scripts:** clean up data pipeline and remove unused unified generation ([ddb1ba4](https://github.com/jonshaffer/wgu-extension/commit/ddb1ba42a6b6bd59c4b9e391ed1794d543f531e3))
* **types:** consolidate types package into data workspace ([fc0df0d](https://github.com/jonshaffer/wgu-extension/commit/fc0df0d4b9c8c4a1bc4692b461c813474f9ac2d6))


### Tests

* **data:** add placeholder test file for collection validation ([925edaf](https://github.com/jonshaffer/wgu-extension/commit/925edaf01a25f659f838650daf083e3d4986dcec))
