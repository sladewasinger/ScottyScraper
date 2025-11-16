# ScottyScraper

Static Vue app that fetches an HTML page, parses a liquor table client-side, and shows a friendly searchable UI. Designed to be built and deployed to GitHub Pages.

How it works
- The app fetches the target URL from the browser using `fetch`. If CORS blocks it, enable the "Use CORS proxy" option which queries `https://api.allorigins.win/raw?url=` as a fallback. You can replace the proxy URL in `src/App.vue` if you prefer a different proxy.

Local dev

PowerShell:
```powershell
cd c:\Repos\ScottyScraper\client
npm install
npm run dev
```

Build for production

```powershell
npm run build
```

Build output for GitHub Pages

- This project is configured to emit the production build into a repository-level `docs/` folder (`client` -> `docs/`). The `index.html` file will be at the root of `docs/`, which makes it easy to publish the `docs/` folder via GitHub Pages (Project Pages). If you prefer a different deployment strategy, update `client/vite.config.js`.

Deploy to GitHub Pages

- Commit the generated `docs/` folder to your repository and enable Pages to serve from the `docs/` folder in the repository settings, or use a CI workflow to push the build output.

Notes
- Client-side scraping may fail if the target site forbids cross-origin requests or blocks public CORS proxies. For reliable scraping you can add a small server-side proxy (not included) or self-host a proxy.
