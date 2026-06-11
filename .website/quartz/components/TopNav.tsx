import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const TopNav: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  // Build absolute base path from baseUrl (e.g. "liqing-ustc.github.io/MindFlow" → "/MindFlow")
  // Falls back to pathToRoot for local dev where baseUrl has no path segment
  const urlPath = cfg.baseUrl?.includes("/")
    ? "/" + cfg.baseUrl.split("/").slice(1).join("/")
    : pathToRoot(fileData.slug!)
  const base = urlPath.endsWith("/") ? urlPath : urlPath + "/"
  const sections = [
    { label: "Papers", path: "Papers/" },
    { label: "Ideas", path: "Ideas/" },
    { label: "Topics", path: "Topics/" },
    { label: "Projects", path: "Projects/" },
    { label: "Meetings", path: "Meetings/" },
  ]
  return (
    <nav class="top-nav">
      {sections.map(({ label, path }) => (
        <a href={`${base}${path}`}>{label}</a>
      ))}
    </nav>
  )
}

TopNav.css = `
/* Header bar layout: PageTitle | TopNav (flex:1) | Search | Darkmode */
.page-header > header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--lightgray);
}

.page-header > header .page-title {
  flex-shrink: 0;
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.top-nav {
  display: flex;
  gap: 1.25rem;
  flex: 1;
}

.top-nav a {
  color: var(--darkgray);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.75;
  transition: color 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}

.top-nav a:hover {
  color: var(--secondary);
  opacity: 1;
}

`

export default (() => TopNav) satisfies QuartzComponentConstructor
