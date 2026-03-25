import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot } from "../util/path"

const HomepageTags: QuartzComponent = ({ allFiles, fileData, cfg }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return <></>

  const urlPath = cfg.baseUrl?.includes("/")
    ? "/" + cfg.baseUrl.split("/").slice(1).join("/")
    : pathToRoot(fileData.slug!)
  const base = urlPath.endsWith("/") ? urlPath : urlPath + "/"

  // Count tag frequency
  const tagCounts = new Map<string, number>()
  for (const file of allFiles) {
    for (const tag of file.frontmatter?.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  // Sort by frequency, take top 20
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return (
    <div class="homepage-tags">
      <h3>Popular Tags</h3>
      <div class="tag-cloud">
        {topTags.map(([tag, count]) => (
          <a href={`${base}tags/${tag}`} class="tag-pill">
            #{tag}
            <span class="tag-count">{count}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

HomepageTags.css = `
.homepage-tags {
  margin: 2rem 0;
}

.homepage-tags h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--darkgray);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--lightgray);
  color: var(--darkgray) !important;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.tag-pill:hover {
  background: var(--secondary);
  color: var(--light) !important;
}

.tag-count {
  font-size: 0.7rem;
  opacity: 0.6;
}
`

export default (() => HomepageTags) satisfies QuartzComponentConstructor
