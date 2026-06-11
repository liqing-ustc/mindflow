import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot } from "../util/path"

const SidebarTags: QuartzComponent = ({ allFiles, fileData, cfg }: QuartzComponentProps) => {
  const urlPath = cfg.baseUrl?.includes("/")
    ? "/" + cfg.baseUrl.split("/").slice(1).join("/")
    : pathToRoot(fileData.slug!)
  const base = urlPath.endsWith("/") ? urlPath : urlPath + "/"

  const tagCounts = new Map<string, number>()
  for (const file of allFiles) {
    for (const tag of file.frontmatter?.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div class="sidebar-tags">
      <span class="sidebar-tags-title">Popular Tags</span>
      <div class="sidebar-tag-cloud">
        {topTags.map(([tag]) => (
          <a href={`${base}tags/${tag}`} class="sidebar-tag-pill">
            #{tag}
          </a>
        ))}
      </div>
    </div>
  )
}

SidebarTags.css = `
.sidebar-tags {
  margin-top: 1.5rem;
}

.sidebar-tags-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--darkgray);
  opacity: 0.5;
  margin-bottom: 0.6rem;
}

.sidebar-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.sidebar-tag-pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--lightgray);
  color: var(--darkgray) !important;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.sidebar-tag-pill:hover {
  background: var(--secondary);
  color: var(--light) !important;
}
`

export default (() => SidebarTags) satisfies QuartzComponentConstructor
