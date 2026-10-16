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
const deckActions = document.querySelector(".deck-actions");
const studyControlIds = [
    "card-search",
    "shuffle-button",
    "new-card-button",
    "previous-button",
    "flip-button",
    "next-button",
];

let activeDeckId = decks[0].id;
let modalOpener = null;

function renderDecks() {
    if (decks.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No decks yet";
        deckList.replaceChildren(emptyMessage);
        return;
    }

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

function renderActiveDeckActions() {
    const existingActions = deckActions.querySelectorAll(
        "[data-deck-action]",
    );
    existingActions.forEach((action) => action.remove());

    if (decks.length === 0) {
        return;
    }

    const editButton = createDeckActionButton("edit", "Edit");
    const deleteButton = createDeckActionButton("delete", "Delete");

    deckActions.append(editButton, deleteButton);
}

function createDeckActionButton(action, label) {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.deckAction = action;
    button.textContent = label;
    return button;
}

function updateStudyControls() {
    const hasDecks = decks.length > 0;

    studyControlIds.forEach((controlId) => {
        const control = document.querySelector(`#${controlId}`);

        if (control) {
            control.disabled = !hasDecks;
        }
    });
}

function renderDeckState() {
    renderDecks();
    renderActiveDeckActions();
    updateStudyControls();
}

function selectDeck(deckId) {
    const selectedDeck = decks.find((deck) => deck.id === deckId);
    document.querySelector("#flashcard").hidden = false;

    if (!selectedDeck) {
        return;
    }

    activeDeckId = selectedDeck.id;
    deckTitle.textContent = selectedDeck.name;
    renderDeckState();
}

function showEmptyDeckState() {
    activeDeckId = null;
    deckTitle.textContent = "No decks yet";
    document.querySelector("#flashcard").hidden = true;
    document.querySelector("#card-count").textContent = "0 cards";
    renderDeckState();
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

function renameDeck(deckId, name) {
    const deck = decks.find((candidate) => candidate.id === deckId);

    if (!deck) {
        return;
    }

    deck.name = name;
    selectDeck(deck.id);
}

function deleteActiveDeck() {
    const deckIndex = decks.findIndex((deck) => deck.id === activeDeckId);

    if (deckIndex === -1 || !window.confirm("Delete this deck?")) {
        return;
    }

    decks.splice(deckIndex, 1);

    if (decks.length === 0) {
        showEmptyDeckState();
        return;
    }

    selectDeck(decks[0].id);
}

function closeDeckModal(dialog) {
    dialog.close();
    dialog.remove();
    modalOpener?.focus();
    modalOpener = null;
}

function showDeckModal(deckToRename = null) {
    modalOpener = document.activeElement;
    const isRename = deckToRename !== null;

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
    heading.textContent = isRename ? "Rename deck" : "Create a new deck";
    label.htmlFor = "deck-name";
    label.textContent = "Deck name";
    input.id = "deck-name";
    input.name = "deck-name";
    input.type = "text";
    input.required = true;
    input.autocomplete = "off";
    input.value = deckToRename?.name ?? "";
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

        if (isRename) {
            renameDeck(deckToRename.id, name);
        } else {
            createDeck(name);
        }

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

function handleDeckAction(action) {
    const activeDeck = decks.find((deck) => deck.id === activeDeckId);

    if (!activeDeck) {
        return;
    }

    if (action === "edit") {
        showDeckModal(activeDeck);
    }

    if (action === "delete") {
        deleteActiveDeck();
    }
}

deckList.addEventListener("click", (event) => {
    const deckLink = event.target.closest("a[data-deck-id]");

    if (!deckLink || !deckList.contains(deckLink)) {
        return;
    }

    event.preventDefault();
    selectDeck(deckLink.dataset.deckId);
});

deckActions.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-deck-action]");

    if (!actionButton || !deckActions.contains(actionButton)) {
        return;
    }

    handleDeckAction(actionButton.dataset.deckAction);
});

newDeckButton.addEventListener("click", () => showDeckModal());

if (activeDeckId) {
    selectDeck(activeDeckId);
} else {
    showEmptyDeckState();
}