// Build-time settings the GitHub Pages workflow passes in (see vite.config.ts).
interface ImportMetaEnv {
  // The address the site is served from; overrides the one in lib/profile.ts.
  readonly VITE_SITE_URL?: string;
  // "1" when the site was built as plain files, with no server behind it.
  readonly VITE_STATIC_SITE?: string;
}
