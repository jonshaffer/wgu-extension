# Changelog

## [1.0.0](https://github.com/jonshaffer/wgu-extension/compare/functions-v0.1.0...functions-v1.0.0) (2026-01-09)


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
* Firebase deployment with Workload Identity Federation ([d0c55f2](https://github.com/jonshaffer/wgu-extension/commit/d0c55f28d0e84f94fc26c6f339c317a7dba003c7))
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

* address PR review comments for type safety and CI reliability ([a2e1c2d](https://github.com/jonshaffer/wgu-extension/commit/a2e1c2da5f24f0a7e27bb4929a683e80e79b1f00))
* **build:** resolve GraphQL export issues and add placeholder extractors ([66bdcf8](https://github.com/jonshaffer/wgu-extension/commit/66bdcf8a0ad7b6ff1ab76ebba9f23edad7faf812))
* **ci:** correct pnpm filter syntax and add missing test dependency ([97dec11](https://github.com/jonshaffer/wgu-extension/commit/97dec11403870ca8a104d6732887f1945bc0b14d))
* **ci:** resolve critical integration test failures and rate limiting ([975fb22](https://github.com/jonshaffer/wgu-extension/commit/975fb223cb48ef93a16597c8fe8ae6cb1d4beee0))
* **ci:** resolve integration test data structure conflicts ([4a038c0](https://github.com/jonshaffer/wgu-extension/commit/4a038c05929b61d9262e3c591fdff9c1650ff07b))
* **data:** update remaining references from extension/data to data/ ([183e63d](https://github.com/jonshaffer/wgu-extension/commit/183e63d1ef754577cca940c85b3bd1150af01478))
* **functions:** correct emulator host detection for integration tests ([f330167](https://github.com/jonshaffer/wgu-extension/commit/f330167b381d15811adae2943a72af559a36b760))
* **functions:** enhance test environment setup and CI reliability ([63242f8](https://github.com/jonshaffer/wgu-extension/commit/63242f831914bd527a218b89376f45b8ba8f2a85))
* **functions:** improve integration test environment detection ([4a3b0e7](https://github.com/jonshaffer/wgu-extension/commit/4a3b0e71d738291c941ef4864ebc8a3a95210711))
* **functions:** improve test environment detection for CI compatibility ([391be18](https://github.com/jonshaffer/wgu-extension/commit/391be18126cf07f3b6af7f187e2c16313c266942))
* **functions:** improve TypeScript type safety in GraphQL resolvers ([055a840](https://github.com/jonshaffer/wgu-extension/commit/055a8402e4ca24b468a3731ddaa0c13a22e8ac67))
* **functions:** resolve integration test failures to make CI pass ([803d99a](https://github.com/jonshaffer/wgu-extension/commit/803d99a19753cbda0fb01c11460a9f8d80ad5aee))
* **functions:** update GraphQL tests to use root path and add debugging ([f50f34c](https://github.com/jonshaffer/wgu-extension/commit/f50f34cb1e076a8ea4f247537c87d53a1328ef9b))
* **functions:** use makeExecutableSchema for GraphQL tests with resolvers ([1ec36d8](https://github.com/jonshaffer/wgu-extension/commit/1ec36d824ca4db142c94cb2653891ffa09bb32f4))
* improve CI reliability for integration tests ([203af6d](https://github.com/jonshaffer/wgu-extension/commit/203af6d34663c49188d4333b916a3fba1fb98b03))
* make service account key optional for CI integration tests ([b3a3f03](https://github.com/jonshaffer/wgu-extension/commit/b3a3f03f3bb7cfce9e05327b574a42bbc5357390))
* resolve all CI errors for deployment preparation ([5ce7c23](https://github.com/jonshaffer/wgu-extension/commit/5ce7c231a06634c8beeabbf837b0a149d1d5c9d8))
* resolve CI test failures with import paths and emulator configuration ([7b4f582](https://github.com/jonshaffer/wgu-extension/commit/7b4f5826b864261336933922040d8f37d29d8e33)), closes [#21](https://github.com/jonshaffer/wgu-extension/issues/21)
* resolve CI test failures with import paths and emulator configuration ([4294b37](https://github.com/jonshaffer/wgu-extension/commit/4294b37ee35151839c75445f5b62812da71148cd))
* resolve CI workflow issues across all workspaces ([ecadc95](https://github.com/jonshaffer/wgu-extension/commit/ecadc95c46e2fed2b90bd1d5cb12eb0d0922c1dc))
* resolve CI workflow issues across all workspaces ([68feaaa](https://github.com/jonshaffer/wgu-extension/commit/68feaaa99744cd18ce8ba11b98b7ac57a26ff4da))
* resolve critical ESLint errors blocking CI ([c3646f3](https://github.com/jonshaffer/wgu-extension/commit/c3646f3c73fc0ab14c5192de3b44bd97341f6f2a))
* resolve critical ESLint errors in functions workspace ([b853052](https://github.com/jonshaffer/wgu-extension/commit/b853052efa8c30dff6fb1594b2b44dcfb7807287))
* resolve DVC configuration issues and line length lint error ([e15670b](https://github.com/jonshaffer/wgu-extension/commit/e15670b8ca190f3b49b4ca31aff5504b5c13842b))
* resolve Firestore undefined values and DVC remote configuration issues ([6eba5b7](https://github.com/jonshaffer/wgu-extension/commit/6eba5b756e644b9ea12e24ce3da26760815f280e))
* resolve remaining 21 ESLint errors in suggestion-transformations.ts ([abd7e58](https://github.com/jonshaffer/wgu-extension/commit/abd7e58bcab4120dafbd91b6971176ec952baf27))
* resolve WXT duplicate imports and prepare for Firebase deployment ([1230e09](https://github.com/jonshaffer/wgu-extension/commit/1230e0959a5840cf06d1341147415c0d7acc9b82))
* resolve WXT duplicate imports and prepare for Firebase deployment ([8f04eca](https://github.com/jonshaffer/wgu-extension/commit/8f04ecae99da9e69e9def1757d3b7b0f51af4d38))
* simplify JSDoc syntax to resolve validation errors ([9e68ee6](https://github.com/jonshaffer/wgu-extension/commit/9e68ee6efe7283fc85826f6465200f4371d55d18))
* update workspace packages for pnpm compatibility ([ef83453](https://github.com/jonshaffer/wgu-extension/commit/ef834533c396f228fee97f98d493c8eb4c9db51e))


### Documentation

* **functions:** add comprehensive GraphQL architecture documentation ([54d5021](https://github.com/jonshaffer/wgu-extension/commit/54d50212bc569f71aa3101f37321f1022d8fa9c2))
* **functions:** add test debugging scripts and comprehensive testing guide ([c0cf394](https://github.com/jonshaffer/wgu-extension/commit/c0cf3943fdfbf0ef0c12d1ea7dee01e381d978bb))
* migrate all documentation from npm to pnpm ([0de88c8](https://github.com/jonshaffer/wgu-extension/commit/0de88c88c1d64db767d6cb31bcab9421324b9a1a))


### Styles

* **functions:** apply consistent code formatting ([d218ba9](https://github.com/jonshaffer/wgu-extension/commit/d218ba959c4b45d3efee47bbcf7168a7b7ec8b45))
* **functions:** apply ESLint auto-fixes ([04c6a23](https://github.com/jonshaffer/wgu-extension/commit/04c6a230f6e213998dfd63d42603376300e9876b))
* **functions:** fix ESLint formatting - trailing comma ([58caded](https://github.com/jonshaffer/wgu-extension/commit/58caded169d6b9391dceffd2e53a232972b2c2fd))


### Code Refactoring

* **functions:** migrate integration tests to use shared fixtures ([da6ae5d](https://github.com/jonshaffer/wgu-extension/commit/da6ae5db1c2f7db5e4e09fb454686f47b714ec1c))
* **functions:** rename searchFirestore to search ([bf8801c](https://github.com/jonshaffer/wgu-extension/commit/bf8801c2e820f3823829624482fe94ac8b8084eb))
* **functions:** restructure GraphQL architecture ([0d8a263](https://github.com/jonshaffer/wgu-extension/commit/0d8a26318ea9c632bcfa5a4d6d065c441b9da5a7))
* **functions:** rewrite seed-emulator for production backup/restore ([54a24e3](https://github.com/jonshaffer/wgu-extension/commit/54a24e3566613eadd915d2ef24004e8e6e777730))
* **functions:** split HTTP endpoints and update data layer ([e42885f](https://github.com/jonshaffer/wgu-extension/commit/e42885fd78b6d782166ec6506fe751b86ceb0d52))
* **functions:** update data models and transformations ([378b12d](https://github.com/jonshaffer/wgu-extension/commit/378b12db2ebfa1ebd4e87ea99d691969c5c283f6))
* **functions:** update exports and clean up unused files ([7567f34](https://github.com/jonshaffer/wgu-extension/commit/7567f34b295d337f8f7f746e3ea3fbe6d183dc69))
* **scripts:** clean up data pipeline and remove unused unified generation ([ddb1ba4](https://github.com/jonshaffer/wgu-extension/commit/ddb1ba42a6b6bd59c4b9e391ed1794d543f531e3))
* **types:** consolidate types package into data workspace ([fc0df0d](https://github.com/jonshaffer/wgu-extension/commit/fc0df0d4b9c8c4a1bc4692b461c813474f9ac2d6))


### Tests

* **functions:** add 'community' to expected search result types ([6ee94ee](https://github.com/jonshaffer/wgu-extension/commit/6ee94ee4bbad9839460d690934b6fa6788aec98e))
* **functions:** add comprehensive test fixtures infrastructure ([52f7c7f](https://github.com/jonshaffer/wgu-extension/commit/52f7c7fc6e7d54f9020a3007291d95736b06f3ca))
* **functions:** add comprehensive testing infrastructure ([cad305b](https://github.com/jonshaffer/wgu-extension/commit/cad305ba68d996980113849844aac0ea6888eb96))


### Continuous Integration

* migrate CI/CD workflows from npm to pnpm ([8999da2](https://github.com/jonshaffer/wgu-extension/commit/8999da25aefc6178d295a768c84a6a852d1ebbff))
