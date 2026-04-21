function fuzzyIncludes(label, query) {
  if (!query) {
    return true;
  }
  return label.includes(query);
}

export function createCommandPalette({
  openButton,
  dialog,
  closeButton,
  input,
  list,
  commands,
  onRun,
}) {
  let isOpen = false;

  function close() {
    isOpen = false;
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
  }

  function open() {
    isOpen = true;
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    render(input.value || "");
    input.focus();
  }

  function toggle() {
    if (isOpen) {
      close();
      return;
    }
    open();
  }

  function render(query) {
    const normalized = String(query || "")
      .toLowerCase()
      .trim();

    const filtered = commands.filter((command) => {
      const haystack = `${command.label} ${command.keywords.join(" ")}`.toLowerCase();
      return fuzzyIncludes(haystack, normalized);
    });

    list.innerHTML = "";

    for (const command of filtered.slice(0, 8)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-item";
      button.textContent = command.label;
      button.addEventListener("click", () => {
        onRun(command.id);
        close();
      });
      list.appendChild(button);
    }
  }

  input.addEventListener("input", () => render(input.value));

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = list.querySelector(".command-item");
      if (first) {
        first.click();
      }
    }

    if (event.key === "Escape") {
      close();
    }
  });

  openButton.addEventListener("click", () => toggle());
  closeButton.addEventListener("click", () => close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  window.addEventListener("keydown", (event) => {
    const isCommandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
    if (isCommandShortcut) {
      event.preventDefault();
      toggle();
      return;
    }

    if (event.key === "Escape" && isOpen) {
      close();
    }
  });

  return {
    open,
    close,
    toggle,
    isOpen: () => isOpen,
  };
}
