/// <reference types="astro/client" />

/**
 * Environment variable type definitions
 */
interface ImportMetaEnv {
  // Documentation path
  readonly DOCS_PATH: string;

  // Site configuration
  readonly SITE_URL: string;
  readonly SITE_TITLE: string;
  readonly SITE_DESCRIPTION: string;
  readonly SITE_AUTHOR?: string;
  readonly SITE_ORG?: string;

  // Feature flags
  readonly ENABLE_SEARCH: string;
  readonly ENABLE_AI_ASSISTANT: string;
  readonly ENABLE_ANALYTICS: string;
  readonly ENABLE_DARK_MODE: string;
  readonly ENABLE_EDIT_LINKS: string;

  // External services
  readonly ANALYTICS_PROVIDER?: string;
  readonly ANALYTICS_ID?: string;
  readonly AI_PROVIDER?: string;
  readonly AI_API_KEY?: string;
  readonly GITHUB_REPO?: string;
  readonly GITHUB_BRANCH?: string;

  // Build configuration
  readonly BUILD_OUTPUT?: string;
  readonly BASE_PATH?: string;
  readonly TRAILING_SLASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
