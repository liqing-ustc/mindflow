# GitHub Pages Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a Quartz v4 static site to GitHub Pages so all MindFlow notes are browsable at `https://liqing-ustc.github.io/MindFlow`.

**Architecture:** Quartz v4 lives in `website/` subdirectory; the vault root serves as content via `--directory ../`. GitHub Actions builds on every push to `main` and deploys to `gh-pages` branch. Giscus provides comments via GitHub Discussions.

**Tech Stack:** Quartz v4 (pinned tag), Node.js 22, TypeScript/TSX, GitHub Actions, Giscus

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `.gitignore` | Modify | Exclude node_modules and dist before any npm install |
| `website/` | Create (clone) | Entire Quartz v4 framework |
| `website/quartz.config.ts` | Modify | Site info, ignorePatterns, plugin config |
| `website/quartz/components/Comments.tsx` | Create | Giscus embed component |
| `website/quartz/components/index.ts` | Modify | Export Comments component |
| `website/quartz.layout.ts` | Modify | Add TOC to left sidebar, Giscus to afterBody |
| `.github/workflows/deploy.yml` | Create | CI/CD: build + deploy to gh-pages |
| `index.md` | Create | Website homepage |

---

## Task 1: Update `.gitignore` First

**Files:** Modify `.gitignore`

This must be done before `npm install` to prevent accidentally staging `node_modules`.

- [ ] **Step 1: Add entries to `.gitignore`**

  Open `.gitignore` and append:
  ```
  # Quartz build output
  website/node_modules/
  dist/
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add .gitignore
  git commit -m "chore: ignore website/node_modules and dist"
  ```

---

## Task 2: Enable GitHub Discussions and Get Giscus IDs (Manual)

These browser steps must be done before Task 5 (Giscus component) so you have the required IDs.

- [ ] **Step 1: Enable GitHub Discussions**

  Go to: `https://github.com/liqing-ustc/MindFlow/settings`
  → Features section → check **Discussions** → Save

- [ ] **Step 2: Create "Comments" discussion category**

  Go to: `https://github.com/liqing-ustc/MindFlow/discussions`
  → Manage categories → New category
  - Name: `Comments`
  - Type: `Announcement` (only maintainers can create threads — readers still reply)

- [ ] **Step 3: Get Giscus repo-id and category-id**

  Visit https://giscus.app and fill in:
  - Repository: `liqing-ustc/MindFlow`
  - Page ↔ Discussion mapping: `pathname`
  - Discussion category: `Comments`

  Copy the two values from the generated script tag:
  - `data-repo-id="..."` → save this
  - `data-category-id="..."` → save this

  You will use these in Task 5.

---

## Task 3: Clone Quartz into `website/`

**Files:** `website/` (new directory)

- [ ] **Step 1: Find the latest stable Quartz v4 release tag**

  ```bash
  git ls-remote --tags https://github.com/jackyzha0/quartz.git | grep -E 'v4\.[0-9]+' | tail -5
  ```
  Note the latest `v4.x.x` tag (e.g., `v4.4.0`). Use it in the next step.

- [ ] **Step 2: Clone Quartz at that tag**

  Replace `v4.4.0` with the latest tag found above:
  ```bash
  git clone --branch v4.4.0 --depth 1 https://github.com/jackyzha0/quartz.git website
  ```

- [ ] **Step 3: Remove nested `.git` directory**

  Without this, git treats `website/` as a nested repo and won't track its files.
  ```bash
  rm -rf website/.git
  ```

- [ ] **Step 4: Install dependencies**

  ```bash
  cd website && npm install
  ```

  This generates `website/package-lock.json` — it must be committed.

- [ ] **Step 5: Verify the build works with default config**

  ```bash
  npx quartz build --directory ../ --output ../dist
  ```
  Expected: build completes, `dist/` created at repo root with HTML files. Unresolved wikilink warnings are normal at this stage.

- [ ] **Step 6: Commit Quartz including `package-lock.json`**

  ```bash
  cd ..
  git add website/
  git status  # Confirm website/node_modules is NOT listed (gitignore should suppress it)
  git commit -m "feat: scaffold Quartz v4 into website/"
  ```

  > If `website/node_modules/` appears in `git status`, stop — Task 1 was not done correctly. Do not commit node_modules.

---

## Task 4: Configure `quartz.config.ts`

**Files:** Modify `website/quartz.config.ts`

- [ ] **Step 1: Open `website/quartz.config.ts` and locate the `configuration` block**

  Find the section starting with:
  ```ts
  const config: QuartzConfig = {
    configuration: {
      pageTitle: "🪴 Quartz 4",
  ```

- [ ] **Step 2: Update site metadata fields**

  Change these specific values (leave everything else as-is):
  ```ts
  pageTitle: "MindFlow",
  baseUrl: "liqing-ustc.github.io/MindFlow",
  locale: "en-US",
  ignorePatterns: ["Templates/**", ".obsidian/**", "docs/**", "private", "*.canvas"],
  ```

  - `Templates/**` — template files have no reading value
  - `.obsidian/**` — Obsidian config JSON files, not markdown, produces broken pages
  - `docs/**` — internal spec/plan documents, not for public
  - `private` — future-proofing for any `private/` folder
  - `*.canvas` — Obsidian canvas files (not markdown)

- [ ] **Step 3: Verify `ObsidianFlavoredMarkdown` and `ContentIndex` plugins are present**

  In `plugins.transformers`, confirm `Plugin.ObsidianFlavoredMarkdown(...)` exists.
  In `plugins.emitters`, confirm `Plugin.ContentIndex(...)` exists.
  Both are enabled by default in Quartz v4 — just verify, no changes needed.

- [ ] **Step 4: Build to verify config is valid**

  ```bash
  cd website && npx quartz build --directory ../ --output ../dist
  ```
  Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

  ```bash
  cd ..
  git add website/quartz.config.ts
  git commit -m "feat: configure Quartz site metadata and ignorePatterns"
  ```

---

## Task 5: Create Giscus Comments Component

**Files:** Create `website/quartz/components/Comments.tsx`, modify `website/quartz/components/index.ts`

> Requires `data-repo-id` and `data-category-id` from Task 2 Step 3.

- [ ] **Step 1: Create `website/quartz/components/Comments.tsx`**

  ```tsx
  import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

  const Comments: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={`comments ${displayClass ?? ""}`}>
        <script
          src="https://giscus.app/client.js"
          data-repo="liqing-ustc/MindFlow"
          data-repo-id="REPLACE_WITH_REPO_ID"
          data-category="Comments"
          data-category-id="REPLACE_WITH_CATEGORY_ID"
          data-mapping="pathname"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="preferred_color_scheme"
          data-lang="en"
          crossOrigin="anonymous"
          async={true}
        ></script>
      </div>
    )
  }

  Comments.displayName = "Comments"
  export default (() => Comments) satisfies QuartzComponentConstructor
  ```

  Replace `REPLACE_WITH_REPO_ID` and `REPLACE_WITH_CATEGORY_ID` with the actual values from Task 2 Step 3.

- [ ] **Step 2: Export Comments from `website/quartz/components/index.ts`**

  Open `website/quartz/components/index.ts` and add at the end:
  ```ts
  export { default as Comments } from "./Comments"
  ```

  Check how other components are exported (e.g., `export { default as Graph } from "./Graph"`) and follow the same pattern.

- [ ] **Step 3: Build to verify the component compiles**

  ```bash
  cd website && npx quartz build --directory ../ --output ../dist
  ```
  Expected: build succeeds, no TypeScript errors about Comments.

- [ ] **Step 4: Commit**

  ```bash
  cd ..
  git add website/quartz/components/Comments.tsx website/quartz/components/index.ts
  git commit -m "feat: add Giscus comments component"
  ```

---

## Task 6: Configure Layout — Add TOC and Comments

**Files:** Modify `website/quartz.layout.ts`

- [ ] **Step 1: Open `website/quartz.layout.ts` and read its current structure**

  The file exports `sharedPageComponents`, `defaultContentPageLayout`, and `defaultListPageLayout`. Identify where the `left`, `right`, `beforeBody`, and `afterBody` arrays are defined in `defaultContentPageLayout`.

- [ ] **Step 2: Add Comments import at the top of the file**

  After the existing `import * as Component from "./quartz/components"` line, add:
  ```ts
  import Comments from "./quartz/components/Comments"
  ```

- [ ] **Step 3: Add `TableOfContents` to the left sidebar**

  In `defaultContentPageLayout.left`, add `Component.DesktopOnly(Component.TableOfContents())` after `Component.DesktopOnly(Component.Explorer())`:
  ```ts
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
    Component.DesktopOnly(Component.TableOfContents()),  // ← add this line
  ],
  ```

- [ ] **Step 4: Add Comments to `afterBody`**

  In `defaultContentPageLayout`, add or update `afterBody`:
  ```ts
  afterBody: [
    Comments(),
  ],
  ```

- [ ] **Step 5: Verify `Graph`, `Backlinks`, `TagList` are present**

  Check that these components are already in `defaultContentPageLayout`. They are default in Quartz v4. If any are missing, add them:
  - `Graph()` → typically in `right`
  - `Backlinks()` → typically in `right`
  - `TagList()` → typically in `beforeBody`

- [ ] **Step 6: Build to verify layout compiles**

  ```bash
  cd website && npx quartz build --directory ../ --output ../dist
  ```
  Expected: build succeeds. Open `dist/index.html` in a browser (or `open ../dist/index.html`) to do a quick visual check that the layout looks reasonable.

- [ ] **Step 7: Commit**

  ```bash
  cd ..
  git add website/quartz.layout.ts
  git commit -m "feat: add TOC to left sidebar and Giscus comments to layout"
  ```

---

## Task 7: Create Homepage (`index.md`)

**Files:** Create `index.md` at repo root

- [ ] **Step 1: Create `index.md`**

  ```markdown
  ---
  title: MindFlow
  tags: []
  ---

  # MindFlow

  An AI research knowledge base — paper notes, research ideas, literature surveys, and project tracking.

  基于 Obsidian 的 AI 研究知识管理空间，记录论文笔记、研究 idea、文献综述和项目进展。

  ## Browse by Type

  - [[Papers/]] — 论文笔记
  - [[Ideas/]] — 研究灵感
  - [[Topics/]] — 主题综述
  - [[Projects/]] — 项目追踪
  - [[Meetings/]] — 会议记录

  ## Recent Papers

  - [[Papers/2504-Pi05|Pi0.5]] — Physical Intelligence
  - [[Papers/2603-MEM|MEM]] — Memory-Efficient Models
  - [[Papers/2603-RoboClaw|RoboClaw]]

  ## About

  Built with [Quartz v4](https://quartz.jzhao.xyz/) · Source on [GitHub](https://github.com/liqing-ustc/MindFlow)
  ```

- [ ] **Step 2: Build and verify homepage appears**

  ```bash
  cd website && npx quartz build --directory ../ --output ../dist
  ```
  Check that `../dist/index.html` exists and contains "MindFlow".

- [ ] **Step 3: Commit**

  ```bash
  cd ..
  git add index.md
  git commit -m "feat: add website homepage"
  ```

---

## Task 8: Create GitHub Actions Workflow

**Files:** Create `.github/workflows/deploy.yml`

- [ ] **Step 1: Ensure `.github/workflows/` directory exists**

  ```bash
  mkdir -p .github/workflows
  ```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

  ```yaml
  name: Deploy to GitHub Pages

  on:
    push:
      branches: [main]
    workflow_dispatch:

  permissions:
    contents: write

  jobs:
    build-and-deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0  # Required: Quartz uses git history for lastmod dates

        - uses: actions/setup-node@v4
          with:
            node-version: 22

        - name: Install dependencies
          working-directory: website
          run: npm ci

        - name: Build
          working-directory: website
          run: npx quartz build --directory ../ --output ../dist

        - name: Deploy to gh-pages
          uses: peaceiris/actions-gh-pages@v3
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./dist
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "feat: add GitHub Actions deploy workflow"
  ```

---

## Task 9: Deploy and Verify

- [ ] **Step 1: Enable Actions write permissions**

  Go to: `https://github.com/liqing-ustc/MindFlow/settings/actions`
  → Workflow permissions → select **"Read and write permissions"** → Save

  > This must be done before pushing, otherwise the deploy step will fail with 403.

- [ ] **Step 2: Push all commits to trigger the workflow**

  ```bash
  git push origin main
  ```

- [ ] **Step 3: Watch the workflow run**

  Go to: `https://github.com/liqing-ustc/MindFlow/actions`
  Expected: workflow completes with a green checkmark after ~3 minutes.
  If it fails, check the logs — most common issues: `npm ci` fails (missing `package-lock.json`) or deploy fails (missing write permissions).

- [ ] **Step 4: Set GitHub Pages source to `gh-pages` branch**

  The `gh-pages` branch now exists after the successful workflow run.
  Go to: `https://github.com/liqing-ustc/MindFlow/settings/pages`
  → Source → Branch: `gh-pages` / folder: `/ (root)` → Save

- [ ] **Step 5: Verify site is live**

  Visit `https://liqing-ustc.github.io/MindFlow` (allow 1-2 minutes for Pages to activate).
  Expected:
  - Homepage loads with "MindFlow" title
  - Left sidebar shows search, file tree, and TOC
  - Right sidebar shows graph and backlinks
  - Tags work (click any tag on a paper note)
  - Comments section appears at bottom of each note
