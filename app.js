const decks = [
  {
    id: "deck-javascript-basics",
    name: "JavaScript Basics",
    createdAt: new Date().toISOString(),
  },
  {
    id: "deck-world-geography",
    name: "World Geography",
    createdAt: new Date().toISOString(),
  },
  {
    id: "deck-spanish-vocabulary",
    name: "Spanish Vocabulary",
    createdAt: new Date().toISOString(),
  },
];

const deckList = document.querySelector("#deck-list");
const deckTitle = document.querySelector("#deck-title");
const newDeckButton = document.querySelector("#new-deck-button");

let activeDeckId = decks[0].id;
let modalOpener = null;

function renderDecks() {
  deckList.replaceChildren(
    ...decks.map((deck) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");

      link.href = "#deck-content";
      link.dataset.deckId = deck.id;
      link.textContent = deck.name;

      if (deck.id === activeDeckId) {
        link.setAttribute("aria-current", "page");
      }

      listItem.append(link);
      return listItem;
    }),
  );
}

function selectDeck(deckId) {
  const selectedDeck = decks.find((deck) => deck.id === deckId);

  if (!selectedDeck) {
    return;
  }

  activeDeckId = selectedDeck.id;
  deckTitle.textContent = selectedDeck.name;
  renderDecks();
}

function createDeckId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `deck-${window.crypto.randomUUID()}`;
  }

  return `deck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDeck(name) {
  const deck = {
    id: createDeckId(),
    name,
    createdAt: new Date().toISOString(),
  };

  decks.push(deck);
  selectDeck(deck.id);
}

function closeDeckModal(dialog) {
  dialog.close();
  dialog.remove();
  modalOpener?.focus();
  modalOpener = null;
}

function showDeckModal() {
  modalOpener = document.activeElement;

  const dialog = document.createElement("dialog");
  const form = document.createElement("form");
  const heading = document.createElement("h2");
  const label = document.createElement("label");
  const input = document.createElement("input");
  const errorMessage = document.createElement("p");
  const buttonGroup = document.createElement("div");
  const saveButton = document.createElement("button");
  const cancelButton = document.createElement("button");

  dialog.id = "new-deck-modal";
  dialog.setAttribute("aria-labelledby", "new-deck-modal-title");
  form.method = "dialog";
  heading.id = "new-deck-modal-title";
  heading.textContent = "Create a new deck";
  label.htmlFor = "deck-name";
  label.textContent = "Deck name";
  input.id = "deck-name";
  input.name = "deck-name";
  input.type = "text";
  input.required = true;
  input.autocomplete = "off";
  errorMessage.id = "deck-name-error";
  errorMessage.setAttribute("role", "alert");
  errorMessage.hidden = true;
  saveButton.type = "submit";
  saveButton.textContent = "Save";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";

  form.append(heading, label, input, errorMessage, buttonGroup);
  buttonGroup.append(saveButton, cancelButton);
  dialog.append(form);
  document.body.append(dialog);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();

    if (!name) {
      errorMessage.textContent = "Enter a name for the deck.";
      errorMessage.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }

    createDeck(name);
    closeDeckModal(dialog);
  });

  cancelButton.addEventListener("click", () => closeDeckModal(dialog));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeckModal(dialog);
  });

  dialog.showModal();
  input.focus();
}

deckList.addEventListener("click", (event) => {
  const deckLink = event.target.closest("a[data-deck-id]");

  if (!deckLink || !deckList.contains(deckLink)) {
    return;
  }

  event.preventDefault();
  selectDeck(deckLink.dataset.deckId);
});

newDeckButton.addEventListener("click", showDeckModal);

selectDeck(activeDeckId);