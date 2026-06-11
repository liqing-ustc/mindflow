import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot } from "../util/path"

const HomepageStats: QuartzComponent = ({ allFiles, fileData, cfg }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return <></>

  const urlPath = cfg.baseUrl?.includes("/")
    ? "/" + cfg.baseUrl.split("/").slice(1).join("/")
    : pathToRoot(fileData.slug!)
  const base = urlPath.endsWith("/") ? urlPath : urlPath + "/"

  const sections = [
    { label: "Papers",     folder: "Papers",     color: "#3B82F6" },
    { label: "Ideas",      folder: "Ideas",      color: "#10B981" },
    { label: "Topics",     folder: "Topics",     color: "#8B5CF6" },
    { label: "Domain Maps", folder: "DomainMaps", color: "#F59E0B" },
    { label: "Projects",   folder: "Projects",   color: "#EF4444" },
  ]
  const counts = sections.map(({ label, folder, color }) => ({
    label,
    folder,
    color,
    count: allFiles.filter(
      (f) => f.slug?.startsWith(`${folder}/`) && !f.slug?.endsWith("/index"),
    ).length,
  }))

  return (
    <div class="homepage-stats">
      {counts.map(({ label, folder, count, color }) => (
        <a href={`${base}${folder}/`} class="stat-item" style={`--stat-color: ${color}`}>
          <span class="stat-count">{count}</span>
          <span class="stat-label">{label}</span>
        </a>
      ))}
    </div>
  )
}

HomepageStats.css = `
.homepage-stats {
  display: flex;
  gap: 1.5rem;
  margin: 1.5rem 0 2rem 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: color-mix(in srgb, var(--stat-color) 12%, var(--light));
  border-radius: 8px;
  min-width: 80px;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;
  border: 1px solid color-mix(in srgb, var(--stat-color) 25%, transparent);
}

.stat-item:hover {
  background: var(--stat-color);
  transform: translateY(-2px);
}

.stat-item:hover .stat-count,
.stat-item:hover .stat-label {
  color: white;
  opacity: 1;
}

.stat-count {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--stat-color);
  line-height: 1;
}

.stat-label {
  font-size: 1rem;
  color: var(--stat-color);
  margin-top: 0.3rem;
  opacity: 0.8;
}
`

export default (() => HomepageStats) satisfies QuartzComponentConstructor
