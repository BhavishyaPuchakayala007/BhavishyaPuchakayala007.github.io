# bhavishya: the anatomy of a curious mechie

Bhavishya Puchakayala's portfolio: a story told along a single hand-drawn thread.

It starts as a tangled scribble (the "free-body diagram" of her brain). As you scroll, the thread wanders through what she's breaking into (mechatronics, physical AI, product development), the three verbs she's obsessed with (sense, think, act), the months since JEE Advanced, and the loop she keeps repeating, then hands you over to the work and to her field notes, in her own words. "Go deeper" drops you through a black hole into the whole notebook: every build, field note and milestone. At the very end the thread ties onto a tendon-driven robot hand, a sketch of her HandSync project, and becomes its tendon.

- **Laptop:** the story scrolls sideways. The thread draws itself as you go, objects talk when you hover them, a little inspection bot follows your cursor along the thread, and the robot hand at the end closes when you grab it and pull.
- **Mobile:** the same story told vertically, with the thread weaving down the page, objects that talk when tapped, and a bot you can drag along the thread.

## Still to fill in

`EMAIL` in `src/lib/profile.ts` is empty, so LinkedIn is the main contact button. Fill it in and an email button appears, and LinkedIn moves beside it. The profile links (LinkedIn, Hugging Face, GitHub, X) live in the same file.

Projects and field notes can carry links too: `link` and `code` on each entry in `src/routes/index.tsx` and `src/routes/work.tsx`.

## Where things live

- `src/lib/profile.ts`: name, site address, email and profile links
- `src/routes/index.tsx`: the home page (story, work, ending)
- `src/routes/work.tsx`: the whole notebook, reached by falling through the black hole
- `src/components/tendon-hand.tsx`: the robot hand, its poses and how it moves
- `src/components/project-art.tsx`: the drawings that stand in for project screenshots
- `src/components/pipeline-art.tsx`: the sense and think drawings
- `src/components/space.tsx`: the clickable stars and the rocket that climbs as you scroll
- `src/components/rabbit-hole.tsx`: the fall and the way back out
- `src/lib/seo.ts`: titles, descriptions and structured data
- `src/styles.css`: theme tokens and animations
- `src/assets/`: the hand-drawn doodles, the photo and the pieces of the fall

## Run it locally

```sh
bun install   # or npm install
bun run dev   # or npm run dev
```

It needs Node 22 or newer.

## How it's deployed

Live at [bhavishyapuchakayala007.github.io/portfolio](https://bhavishyapuchakayala007.github.io/portfolio/). The site is built as plain files, and `.github/workflows/pages.yml` rebuilds and publishes it to GitHub Pages on every push to `main`. In the repository, Settings → Pages → Source must be set to "GitHub Actions".

If the site ever moves to a custom domain or a differently named repository, nothing needs editing: the workflow works out the address and writes it into the page tags, the sitemap, `robots.txt` and `llms.txt`.

## What it's built with

- [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router), TypeScript
- Vite, Tailwind CSS 4
- Animation is hand-written: SVG paths for the threads and the robot hand, `requestAnimationFrame` for the scroll story, CSS for reveals. No animation libraries.
