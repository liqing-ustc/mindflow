document.querySelectorAll<HTMLButtonElement>(".et-al-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true"
    const fullList = btn.nextElementSibling as HTMLElement
    if (expanded) {
      btn.setAttribute("aria-expanded", "false")
      btn.textContent = "et al."
      fullList.style.display = "none"
    } else {
      btn.setAttribute("aria-expanded", "true")
      btn.textContent = "▲"
      fullList.style.display = "inline"
    }
  })
})
