/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly CONFIG_DIR: string;
  readonly DATA_DIR: string;
  readonly THEMES_DIR: string;
  readonly SITE_URL: string;
  readonly BASE_PATH: string;
  readonly ENABLE_SEARCH: string;
  readonly ENABLE_DARK_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
