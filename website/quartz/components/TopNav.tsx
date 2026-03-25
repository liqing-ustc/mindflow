import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const TopNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
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
        <a href={`${root}${path}`}>{label}</a>
      ))}
    </nav>
  )
}

TopNav.css = `
.top-nav {
  display: flex;
  gap: 1.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--lightgray);
  margin-bottom: 0.5rem;
}

.top-nav a {
  color: var(--darkgray);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.8;
  transition: color 0.15s ease, opacity 0.15s ease;
}

.top-nav a:hover {
  color: var(--secondary);
  opacity: 1;
}
`

export default (() => TopNav) satisfies QuartzComponentConstructor
