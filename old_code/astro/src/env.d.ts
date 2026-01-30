/// <reference types="astro/client" />

/**
 * Environment variable type definitions
 */
interface ImportMetaEnv {
  // ==================================
  // Directory Paths (Required)
  // ==================================
  /** Configuration directory path (YAML config files) */
  readonly CONFIG_DIR: string;
  /** Data directory path (user content: pages, docs, blog, assets) */
  readonly DATA_DIR: string;
  /** Styles directory path (theme selection and custom CSS) */
  readonly STYLES_DIR: string;

  // ==================================
  // Site Settings
  // ==================================
  /** Base URL for the site */
  readonly SITE_URL: string;
  /** Base path if deployed to subdirectory */
  readonly BASE_PATH?: string;

  // ==================================
  // Feature Flags
  // ==================================
  /** Enable full-text search functionality */
  readonly ENABLE_SEARCH: string;
  /** Enable dark mode toggle */
  readonly ENABLE_DARK_MODE: string;
  /** Enable edit on GitHub links */
  readonly ENABLE_EDIT_LINKS: string;
  /** Enable AI assistant integration */
  readonly ENABLE_AI_ASSISTANT: string;
  /** Enable analytics tracking */
  readonly ENABLE_ANALYTICS: string;

  // ==================================
  // External Services
  // ==================================
  /** GitHub repository (username/repo) */
  readonly GITHUB_REPO?: string;
  /** GitHub branch name */
  readonly GITHUB_BRANCH?: string;
  /** Analytics provider (google, plausible, umami) */
  readonly ANALYTICS_PROVIDER?: string;
  /** Analytics tracking ID */
  readonly ANALYTICS_ID?: string;
  /** AI provider name */
  readonly AI_PROVIDER?: string;
  /** AI API key */
  readonly AI_API_KEY?: string;

  // ==================================
  // Build Configuration
  // ==================================
  /** Output directory for build */
  readonly BUILD_OUTPUT?: string;
  /** Trailing slashes in URLs */
  readonly TRAILING_SLASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
