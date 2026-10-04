// The handful of facts the whole site shares: who this is and where to find
// her. Change them here and the header, the ending, /work and the SEO tags all
// follow. Anything left as "" simply isn't shown.

export const NAME = "Bhavishya Puchakayala";
export const FIRST_NAME = "Bhavishya";

// The address the site is deployed at (no trailing slash). It's used for
// canonical links and share cards; public/sitemap.xml, robots.txt and llms.txt
// repeat it. If the site moves (a custom domain, say), the GitHub Pages
// workflow passes the new address in as VITE_SITE_URL and rewrites those
// three files to match, so nothing here needs editing.
export const SITE_URL: string = import.meta.env.VITE_SITE_URL || "https://bhavishyapuchakayala007.github.io";

// TODO: a public contact address. While it's empty, LinkedIn is the way in.
export const EMAIL = "";

export const LINKS = {
  linkedin: "https://in.linkedin.com/in/bhavishya-puchakayala",
  huggingface: "https://huggingface.co/peekaboo10",
  github: "https://github.com/BhavishyaPuchakayala007",
  x: "https://x.com/its_peekaboo",
};
