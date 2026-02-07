/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    layoutOverride?: string;
  }
}

interface ImportMetaEnv {
  readonly CONFIG_DIR: string;  // Bootstrap: path to config dir containing site.yaml
  readonly SITE_URL: string;
  readonly BASE_PATH: string;
  readonly ENABLE_SEARCH: string;
  readonly ENABLE_DARK_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
