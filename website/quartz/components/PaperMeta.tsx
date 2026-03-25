// @ts-ignore
import script from "./scripts/papermeta.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PaperMeta: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (!fileData.slug?.startsWith("Papers/")) return <></>

  const fm = fileData.frontmatter as Record<string, any>
  const authors: string[] = fm?.authors ?? []
  const institute: string[] = fm?.institute ?? []
  const venue: string = fm?.venue ?? ""

  if (authors.length === 0 && institute.length === 0 && !venue) return <></>

  const firstAuthor = authors[0] ?? ""
  const hasMore = authors.length > 1

  return (
    <div class="paper-meta">
      {venue && (
        <span class="paper-venue">
          {venue}
        </span>
      )}
      {institute.length > 0 && (
        <span class="paper-institute">
          {venue && <span class="meta-sep">·</span>}
          {institute.join(", ")}
        </span>
      )}
      <span class="paper-authors">
        {(venue || institute.length > 0) && <span class="meta-sep">·</span>}
        {firstAuthor}
        {hasMore && (
          <>
            {" "}
            <button class="et-al-btn" aria-expanded="false">
              et al.
            </button>
            <span class="authors-full" style="display:none">
              {authors.slice(1).map((a) => (
                <span>, {a}</span>
              ))}
            </span>
          </>
        )}
      </span>
    </div>
  )
}

PaperMeta.afterDOMLoaded = script

PaperMeta.css = `
.paper-meta {
  display: inline;
  font-size: 0.9rem;
  color: var(--darkgray);
  margin: 0.3rem 0 0.6rem 0;
  opacity: 0.8;
  line-height: 1.6;
}

.paper-authors,
.paper-institute,
.paper-venue {
  display: inline;
}

.paper-authors {
  display: inline;
}

.et-al-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--secondary);
  font-size: 0.9rem;
  cursor: pointer;
  font-style: italic;
  text-decoration: underline dotted;
}

.et-al-btn:hover {
  color: var(--tertiary);
}

.authors-full {
  display: inline;
}

.meta-sep {
  margin: 0 0.3rem;
  opacity: 0.4;
}

.paper-venue {
  font-style: italic;
}
`

export default (() => PaperMeta) satisfies QuartzComponentConstructor
