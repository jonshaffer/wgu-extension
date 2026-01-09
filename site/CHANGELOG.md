# Changelog

## [1.0.0](https://github.com/jonshaffer/wgu-extension/compare/unofficial-wgu-extension-site-v0.1.0...unofficial-wgu-extension-site-v1.0.0) (2026-01-09)


### ⚠ BREAKING CHANGES

* Major project restructuring into monorepo format

### feat\

* restructure project as monorepo with extension, functions, and site workspaces ([4ee432c](https://github.com/jonshaffer/wgu-extension/commit/4ee432cbdd283d0ad9501fc365b153e1f27a8481))


### Features

* **api:** add GraphQL API infrastructure ([21da86f](https://github.com/jonshaffer/wgu-extension/commit/21da86f1d83b5feea6f2a6e24e527272b73da973))
* **ci:** update workflow for WIF authentication and env examples ([3dfa380](https://github.com/jonshaffer/wgu-extension/commit/3dfa3803798b06ea841ffdf636e69d589a0aed7d))
* **config:** centralize configuration into shared modules ([0d14b2f](https://github.com/jonshaffer/wgu-extension/commit/0d14b2fdb4368bc168e1c6d341c954a8f479942d))
* Firebase deployment with Workload Identity Federation ([d0c55f2](https://github.com/jonshaffer/wgu-extension/commit/d0c55f28d0e84f94fc26c6f339c317a7dba003c7))
* implement universal AGENT.md system with comprehensive tool support ([9b9e0fd](https://github.com/jonshaffer/wgu-extension/commit/9b9e0fd8a5605977e6a7b73f99a97e5d10f91270))
* merge Spec Kit implementation and monorepo structure ([9c8616a](https://github.com/jonshaffer/wgu-extension/commit/9c8616a5e335f5edba408a33f93d663279513e4e))
* **site:** add complete browse interface with resource layouts ([6cd8c15](https://github.com/jonshaffer/wgu-extension/commit/6cd8c15eb4fb669bf13963b99c892b918afb867d))
* **site:** add GraphQL integration and Apollo Client setup ([0805367](https://github.com/jonshaffer/wgu-extension/commit/0805367c9798a811e106b1619fc7ed2d912ca0ad))
* **site:** enhance UI with new components and content system ([41d96e5](https://github.com/jonshaffer/wgu-extension/commit/41d96e55dcd54dc05cf7ff92754481f10f1bb41f))
* **site:** implement hero search with page transitions and animations ([984cbdd](https://github.com/jonshaffer/wgu-extension/commit/984cbdd9fa88716d7faa4bb40fc6f4ca77fbd710))


### Bug Fixes

* **ci:** configure npm for platform-specific dependencies in CI environments ([64db363](https://github.com/jonshaffer/wgu-extension/commit/64db363c7cc174ddd5bda535130e3388c686ea11))
* correct site module imports to use index files ([feac59f](https://github.com/jonshaffer/wgu-extension/commit/feac59f957a4b31fab7f69813431047f69b69a01))
* resolve all CI errors for deployment preparation ([5ce7c23](https://github.com/jonshaffer/wgu-extension/commit/5ce7c231a06634c8beeabbf837b0a149d1d5c9d8))
* resolve CI workflow issues across all workspaces ([ecadc95](https://github.com/jonshaffer/wgu-extension/commit/ecadc95c46e2fed2b90bd1d5cb12eb0d0922c1dc))
* resolve WXT duplicate imports and prepare for Firebase deployment ([1230e09](https://github.com/jonshaffer/wgu-extension/commit/1230e0959a5840cf06d1341147415c0d7acc9b82))
* resolve WXT duplicate imports and prepare for Firebase deployment ([8f04eca](https://github.com/jonshaffer/wgu-extension/commit/8f04ecae99da9e69e9def1757d3b7b0f51af4d38))
* **site:** configure React Router v7 for SPA mode ([3d9041a](https://github.com/jonshaffer/wgu-extension/commit/3d9041a75abcc8117a80b5760a12ca7b31e3eac0))
* **site:** improve search results header stability ([a4fbc75](https://github.com/jonshaffer/wgu-extension/commit/a4fbc75da80118a665e5ca6080f3415c27498243))
* **site:** remove unused ts-expect-error directive ([b876578](https://github.com/jonshaffer/wgu-extension/commit/b8765780ef77a3d8a691370630793ec97f9ca0e7))
* **site:** resolve ESLint errors blocking deployment ([7226fbb](https://github.com/jonshaffer/wgu-extension/commit/7226fbb5a5144df4236ef538547f6c0a3704fca8))
* **site:** resolve TypeScript errors in Spotlight and API Explorer ([7bb0531](https://github.com/jonshaffer/wgu-extension/commit/7bb05316f8de58d3206971e1108f8a7618336b81))
* **site:** simplify page transitions to prevent blank page issue ([3f0a104](https://github.com/jonshaffer/wgu-extension/commit/3f0a104b0a323b9158df7d321c2d4b6babcae905))
* **site:** upgrade to Zod v4.0.x for @hookform/resolvers compatibility ([09878cb](https://github.com/jonshaffer/wgu-extension/commit/09878cbf7196fd46b0ce402de4dd87c52757fa4c))
* update workspace packages for pnpm compatibility ([ef83453](https://github.com/jonshaffer/wgu-extension/commit/ef834533c396f228fee97f98d493c8eb4c9db51e))


### Documentation

* migrate all documentation from npm to pnpm ([0de88c8](https://github.com/jonshaffer/wgu-extension/commit/0de88c88c1d64db767d6cb31bcab9421324b9a1a))


### Code Refactoring

* address PR [#42](https://github.com/jonshaffer/wgu-extension/issues/42) review feedback ([a2923ca](https://github.com/jonshaffer/wgu-extension/commit/a2923ca0dd08a0df09761b7d3faf83f000869948))
* **app:** move components to app directory and update imports ([ce366f3](https://github.com/jonshaffer/wgu-extension/commit/ce366f32256efd206cb45737b346db3c10929d5a))
* **assets:** centralize icons and logos with symlinks ([2d949a7](https://github.com/jonshaffer/wgu-extension/commit/2d949a70fef16fa6a17aae3683db45cc0310c500))
* **site:** simplify GraphQL queries ([3edc462](https://github.com/jonshaffer/wgu-extension/commit/3edc462e45233192c45e7f17845b6ae8729171e7))
* **site:** update configuration and dependencies ([eba697a](https://github.com/jonshaffer/wgu-extension/commit/eba697ab344587e487f733efaf771ae7f813efe6))


### Continuous Integration

* **pages:** publish from pages-data/ to keep GH Pages separate from React app; update local builder accordingly ([87bfb8b](https://github.com/jonshaffer/wgu-extension/commit/87bfb8b28f837d95f125ebf14b692c2d8a838e7f))
