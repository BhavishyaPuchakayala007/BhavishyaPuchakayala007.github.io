// Everything search engines and AI answer engines read about the site lives
// here: titles, descriptions, the share image, and the structured data that
// says who Bhavishya is. None of it changes what's on screen.

import { EMAIL, FIRST_NAME, LINKS, NAME, SITE_URL } from "./profile";

export { NAME, SITE_URL };
export const OG_IMAGE = `${SITE_URL}/og.png`;

export const ABOUT_SHORT =
  "Bhavishya Puchakayala is a mechanical engineering student at IIT Madras working on mechatronics and physical AI: a tendon-driven robotic hand teleoperated from a webcam, and speech recognition for dysarthric speech.";

// Only real profile pages count as "the same person elsewhere".
export const PROFILES = [LINKS.linkedin, LINKS.huggingface, LINKS.github, LINKS.x].filter((url) => url && !url.includes("/search/"));

export const person = {
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: NAME,
  alternateName: [FIRST_NAME],
  url: SITE_URL,
  image: OG_IMAGE,
  ...(EMAIL ? { email: `mailto:${EMAIL}` } : {}),
  jobTitle: "Mechanical Engineering student",
  description: ABOUT_SHORT,
  affiliation: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Madras" },
  alumniOf: { "@type": "EducationalOrganization", name: "New Vision Junior College" },
  address: { "@type": "PostalAddress", addressLocality: "Chennai", addressRegion: "Tamil Nadu", addressCountry: "IN" },
  knowsAbout: [
    "Mechanical engineering",
    "Mechatronics",
    "Physical AI",
    "Robotic hands",
    "Teleoperation",
    "Computer vision",
    "Hand tracking",
    "Vision-language-action models",
    "Automatic speech recognition",
    "Assistive technology",
    "Machine learning",
    "Python",
    "CAD",
  ],
  sameAs: PROFILES,
};

// Turn a JSON-LD object into a <script> entry for a route's head.
export const jsonLd = (data: Record<string, unknown>) => ({
  type: "application/ld+json",
  children: JSON.stringify({ "@context": "https://schema.org", ...data }),
});

// The standard set of tags for a page: title, description, canonical address
// and the share card.
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `the anatomy of a curious mechie, by ${NAME}` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
