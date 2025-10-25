# Changelog

## [1.0.0](https://github.com/jonshaffer/wgu-extension/compare/functions-v0.1.0...functions-v1.0.0) (2025-10-25)


### ⚠ BREAKING CHANGES

* **functions:** seed-emulator now requires gcloud CLI and uses different command syntax (backup/restore/import/list vs direct seeding)
* **firestore:** academic-registry collection replaced with individual courses and degree-plans collections
* **api:** GraphQL schema expanded with new types and resolvers
* **types:** @wgu-extension/types package has been consolidated into @wgu-extension/data. Consumers should update their imports from '@wgu-extension/types' to '@wgu-extension/data'.
* Major project restructuring into monorepo format

### feat\

* restructure project as monorepo with extension, functions, and site workspaces ([4ee432c](https://github.com/jonshaffer/wgu-extension/commit/4ee432cbdd283d0ad9501fc365b153e1f27a8481))


### Features

* **admin:** add secure admin functions with export capabilities ([cf3a140](https://github.com/jonshaffer/wgu-extension/commit/cf3a140d8c7329e3ff5b4379a16a24d5ca966568))
* **api:** add comprehensive GraphQL schema with search, auth, and data export ([8e9850c](https://github.com/jonshaffer/wgu-extension/commit/8e9850c5c3f09c328d5590156ce42a423f3e2b33))
* **api:** add GraphQL API infrastructure ([21da86f](https://github.com/jonshaffer/wgu-extension/commit/21da86f1d83b5feea6f2a6e24e527272b73da973))
* **connect:** accept free-form resource.type and unify ingest endpoint ([cf68e8e](https://github.com/jonshaffer/wgu-extension/commit/cf68e8e1b9f764a37faf3197511e429136ec99ca))
* **dvc:** add emulator data tracking with DVC ([8a2281b](https://github.com/jonshaffer/wgu-extension/commit/8a2281b7b6dc3d32f137c460d224ea698d2c9899))
* **dvc:** integrate DVC pull into build and CI/CD workflows ([a996e84](https://github.com/jonshaffer/wgu-extension/commit/a996e84aeab54a70cab20103971a9521f9887347))
* **firestore:** define pluralized collection structure and add pending-links moderation queue ([6446c90](https://github.com/jonshaffer/wgu-extension/commit/6446c9086950ad1585639b241cafa5941335f0a2))
* **firestore:** implement Mathematical Transfer pattern for efficient data sync ([df7f54a](https://github.com/jonshaffer/wgu-extension/commit/df7f54a7e0eb2e5253cfdd7c46386eba5a7a5781))
* **firestore:** migrate to collection-based data architecture ([8fa4804](https://github.com/jonshaffer/wgu-extension/commit/8fa480442ba11195c8ab28d7a587d78d69dc3af4))
* **functions:** add Apollo GraphQL HTTPS function (gen2) and scheduled Pages ingest to Firestore\n\n- GraphQL schema/resolvers for unifiedCommunityData served from Firestore\n- Express + Apollo Server v4 over onRequest with CORS\n- Scheduled function fetches unified JSON from GitHub Pages with ETag caching\n- Wire exports; install deps and types; ensure NodeNext path compatibility ([75b0b99](https://github.com/jonshaffer/wgu-extension/commit/75b0b992832146fe754e607a1ab511d604c6d450))
* **functions:** add comprehensive GraphQL resolvers and schemas ([2aa5529](https://github.com/jonshaffer/wgu-extension/commit/2aa55290762b0c99e61418d2abbb899184747408))
* **functions:** add comprehensive testing infrastructure ([748db2b](https://github.com/jonshaffer/wgu-extension/commit/748db2b1149fd0b1e4cc366db3e2cd142e4f3675))
* **functions:** add development and deployment scripts ([93d2015](https://github.com/jonshaffer/wgu-extension/commit/93d201554838eca4025059521c757b3ca899f641))
* **functions:** add Firestore emulator seeding script ([193d8c7](https://github.com/jonshaffer/wgu-extension/commit/193d8c78266f58ce820b46b3aa06243058c6826b))
* **functions:** add tar dependency for backup compression ([296325b](https://github.com/jonshaffer/wgu-extension/commit/296325b454e061660fbc334dd52efb07063aebcf))
* **functions:** implement comprehensive data architecture ([8490399](https://github.com/jonshaffer/wgu-extension/commit/849039959108fef47ee41146119f1858352532ea))
* **graphql:** add GraphQL API with comprehensive search ([53387e6](https://github.com/jonshaffer/wgu-extension/commit/53387e67940158ddee58198b87271340f118c692))
* implement universal AGENT.md system with comprehensive tool support ([9b9e0fd](https://github.com/jonshaffer/wgu-extension/commit/9b9e0fd8a5605977e6a7b73f99a97e5d10f91270))
* merge Spec Kit implementation and monorepo structure ([9c8616a](https://github.com/jonshaffer/wgu-extension/commit/9c8616a5e335f5edba408a33f93d663279513e4e))
* **sync:** implement Mathematical Transfer pattern with academic-registry chunking ([2b9134c](https://github.com/jonshaffer/wgu-extension/commit/2b9134c364c70f52018a54170ae0869691bc15b3))
* update emulator data with comprehensive production seed ([1c77756](https://github.com/jonshaffer/wgu-extension/commit/1c77756e7b4c3b666a634ad484c281c0a490afa8))


### Bug Fixes

* **data:** update remaining references from extension/data to data/ ([183e63d](https://github.com/jonshaffer/wgu-extension/commit/183e63d1ef754577cca940c85b3bd1150af01478))
* resolve all CI errors for deployment preparation ([5ce7c23](https://github.com/jonshaffer/wgu-extension/commit/5ce7c231a06634c8beeabbf837b0a149d1d5c9d8))
* resolve WXT duplicate imports and prepare for Firebase deployment ([1230e09](https://github.com/jonshaffer/wgu-extension/commit/1230e0959a5840cf06d1341147415c0d7acc9b82))
* resolve WXT duplicate imports and prepare for Firebase deployment ([8f04eca](https://github.com/jonshaffer/wgu-extension/commit/8f04ecae99da9e69e9def1757d3b7b0f51af4d38))


### Documentation

* **functions:** add comprehensive GraphQL architecture documentation ([54d5021](https://github.com/jonshaffer/wgu-extension/commit/54d50212bc569f71aa3101f37321f1022d8fa9c2))


### Styles

* **functions:** apply consistent code formatting ([d218ba9](https://github.com/jonshaffer/wgu-extension/commit/d218ba959c4b45d3efee47bbcf7168a7b7ec8b45))


### Code Refactoring

* **functions:** rename searchFirestore to search ([bf8801c](https://github.com/jonshaffer/wgu-extension/commit/bf8801c2e820f3823829624482fe94ac8b8084eb))
* **functions:** restructure GraphQL architecture ([0d8a263](https://github.com/jonshaffer/wgu-extension/commit/0d8a26318ea9c632bcfa5a4d6d065c441b9da5a7))
* **functions:** rewrite seed-emulator for production backup/restore ([54a24e3](https://github.com/jonshaffer/wgu-extension/commit/54a24e3566613eadd915d2ef24004e8e6e777730))
* **functions:** split HTTP endpoints and update data layer ([e42885f](https://github.com/jonshaffer/wgu-extension/commit/e42885fd78b6d782166ec6506fe751b86ceb0d52))
* **functions:** update data models and transformations ([378b12d](https://github.com/jonshaffer/wgu-extension/commit/378b12db2ebfa1ebd4e87ea99d691969c5c283f6))
* **functions:** update exports and clean up unused files ([7567f34](https://github.com/jonshaffer/wgu-extension/commit/7567f34b295d337f8f7f746e3ea3fbe6d183dc69))
* **scripts:** clean up data pipeline and remove unused unified generation ([ddb1ba4](https://github.com/jonshaffer/wgu-extension/commit/ddb1ba42a6b6bd59c4b9e391ed1794d543f531e3))
* **types:** consolidate types package into data workspace ([fc0df0d](https://github.com/jonshaffer/wgu-extension/commit/fc0df0d4b9c8c4a1bc4692b461c813474f9ac2d6))


### Tests

* **functions:** add comprehensive testing infrastructure ([cad305b](https://github.com/jonshaffer/wgu-extension/commit/cad305ba68d996980113849844aac0ea6888eb96))
