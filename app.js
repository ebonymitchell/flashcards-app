const decks = [
    {
        id: "deck-javascript-basics",
        name: "JavaScript Basics",
        createdAt: new Date().toISOString(),
        cards: [],
    },
    {
        id: "deck-world-geography",
        name: "World Geography",
        createdAt: new Date().toISOString(),
        cards: [],
    },
    {
        id: "deck-spanish-vocabulary",
        name: "Spanish Vocabulary",
        createdAt: new Date().toISOString(),
        cards: [],
    },
];

const deckList = document.querySelector("#deck-list");
const deckTitle = document.querySelector("#deck-title");
const cardCount = document.querySelector("#card-count");
const cardPosition = document.querySelector("#card-position");
const newDeckButton = document.querySelector("#new-deck-button");
const deckActions = document.querySelector(".deck-actions");
const flashcard = document.querySelector("#flashcard");
const cardEmptyState = document.querySelector("#card-empty-state");
const cardFront = document.querySelector("#card-front");
const cardBack = document.querySelector("#card-back");
const cardActions = document.querySelector("#card-actions");
const newCardButton = document.querySelector("#new-card-button");
const editCardButton = document.querySelector("#edit-card-button");
const deleteCardButton = document.querySelector("#delete-card-button");
const previousButton = document.querySelector("#previous-button");
const flipButton = document.querySelector("#flip-button");
const nextButton = document.querySelector("#next-button");
const studyControlIds = [
    "card-search",
    "shuffle-button",
    "new-card-button",
    "previous-button",
    "flip-button",
    "next-button",
];

let activeDeckId = decks[0]?.id ?? null;
let activeCardId = null;
let studyOrder = [];
let isCardFlipped = false;
let modalOpener = null;

function getActiveDeck() {
    return decks.find((deck) => deck.id === activeDeckId) ?? null;
}

function getActiveCard() {
    const activeDeck = getActiveDeck();
    return activeDeck?.cards.find((card) => card.id === activeCardId) ?? null;
}

function getStudyCards() {
    const activeDeck = getActiveDeck();

    if (!activeDeck) {
        return [];
    }

    return studyOrder
        .map((cardId) => activeDeck.cards.find((card) => card.id === cardId))
        .filter(Boolean);
}

function resetStudyOrder() {
    const activeDeck = getActiveDeck();
    studyOrder = activeDeck?.cards.map((card) => card.id) ?? [];
}

function shuffleStudyOrder() {
    for (let index = studyOrder.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [studyOrder[index], studyOrder[randomIndex]] = [
            studyOrder[randomIndex],
            studyOrder[index],
        ];
    }

    activeCardId = studyOrder[0] ?? null;
    isCardFlipped = false;
    renderDeckState();
}

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

function createDeckActionButton(action, label) {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.deckAction = action;
    button.textContent = label;
    return button;
}

function renderActiveDeckActions() {
    deckActions
        .querySelectorAll("[data-deck-action]")
        .forEach((action) => action.remove());

    if (!getActiveDeck()) {
        return;
    }

    deckActions.append(
        createDeckActionButton("edit", "Edit"),
        createDeckActionButton("delete", "Delete"),
    );
}

function updateStudyControls() {
    const hasDeck = getActiveDeck() !== null;
    const hasCard = getActiveCard() !== null;

    studyControlIds.forEach((controlId) => {
        const control = document.querySelector(`#${controlId}`);

        if (control) {
            if (controlId === "new-card-button") {
                control.disabled = !hasDeck;
            } else {
                control.disabled = !hasCard;
            }
        }
    });

    editCardButton.disabled = !hasCard;
    deleteCardButton.disabled = !hasCard;
    cardActions.hidden = !hasCard;
}

function renderCard() {
    const activeDeck = getActiveDeck();
    const activeCard = getActiveCard();
    const studyCards = getStudyCards();
    const hasDeck = activeDeck !== null;
    const cardIndex = studyCards.findIndex((card) => card.id === activeCardId);

    flashcard.hidden = !hasDeck;
    cardEmptyState.hidden = !hasDeck || activeDeck.cards.length > 0;
    cardFront.hidden = !activeCard || isCardFlipped;
    cardBack.hidden = !activeCard || !isCardFlipped;

    if (activeCard) {
        cardFront.querySelector("p").textContent = activeCard.front;
        cardBack.querySelector("p").textContent = activeCard.back;
    }

    cardCount.textContent = `${activeDeck?.cards.length ?? 0} cards`;
    cardPosition.textContent = activeCard
        ? `Card ${cardIndex + 1} of ${studyCards.length}.`
        : "Card 0 of 0.";
    flashcard.setAttribute(
        "aria-label",
        activeCard
            ? `Flashcard ${cardIndex + 1} of ${studyCards.length}. Activate to flip.`
            : "Flashcard. No cards available.",
    );
    flashcard.setAttribute("aria-pressed", String(isCardFlipped));
}

function renderDeckState() {
    renderDecks();
    renderActiveDeckActions();
    renderCard();
    updateStudyControls();
}

function selectDeck(deckId) {
    const selectedDeck = decks.find((deck) => deck.id === deckId);

    if (!selectedDeck) {
        return;
    }

    activeDeckId = selectedDeck.id;
    resetStudyOrder();
    activeCardId = selectedDeck.cards[0]?.id ?? null;
    isCardFlipped = false;
    deckTitle.textContent = selectedDeck.name;
    renderDeckState();
}

function showEmptyDeckState() {
    activeDeckId = null;
    activeCardId = null;
    studyOrder = [];
    deckTitle.textContent = "No decks yet";
    renderDeckState();
}

function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDeck(name) {
    const deck = {
        id: createId("deck"),
        name,
        createdAt: new Date().toISOString(),
        cards: [],
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

function createCard(front, back) {
    const activeDeck = getActiveDeck();

    if (!activeDeck) {
        return;
    }

    const card = {
        id: createId("card"),
        front,
        back,
    };

    activeDeck.cards.push(card);
    resetStudyOrder();
    activeCardId = card.id;
    isCardFlipped = false;
    renderDeckState();
}

function updateCard(cardId, front, back) {
    const activeCard = getActiveDeck()?.cards.find(
        (card) => card.id === cardId,
    );

    if (!activeCard) {
        return;
    }

    activeCard.front = front;
    activeCard.back = back;
    resetStudyOrder();
    isCardFlipped = false;
    renderDeckState();
}

function deleteActiveCard() {
    const activeDeck = getActiveDeck();
    const cardIndex = activeDeck?.cards.findIndex(
        (card) => card.id === activeCardId,
    );

    if (
        !activeDeck ||
        cardIndex === undefined ||
        cardIndex < 0 ||
        !window.confirm("Delete this card?")
    ) {
        return;
    }

    activeDeck.cards.splice(cardIndex, 1);
    resetStudyOrder();
    activeCardId = activeDeck.cards[0]?.id ?? null;
    isCardFlipped = false;
    renderDeckState();
}

function closeModal(dialog) {
    dialog.close();
    dialog.remove();
    modalOpener?.focus();
    modalOpener = null;
}

function showDeckModal(deckToRename = null) {
    showFormModal({
        id: "new-deck-modal",
        title: deckToRename ? "Rename deck" : "Create a new deck",
        fields: [
            {
                id: "deck-name",
                label: "Deck name",
                value: deckToRename?.name ?? "",
            },
        ],
        onSubmit: ([name]) => {
            if (deckToRename) {
                renameDeck(deckToRename.id, name);
            } else {
                createDeck(name);
            }
        },
    });
}

function showCardModal(cardToEdit = null) {
    showFormModal({
        id: "card-modal",
        title: cardToEdit ? "Edit card" : "Create a new card",
        fields: [
            {
                id: "card-front-input",
                label: "Front text",
                value: cardToEdit?.front ?? "",
                multiline: true,
            },
            {
                id: "card-back-input",
                label: "Back text",
                value: cardToEdit?.back ?? "",
                multiline: true,
            },
        ],
        onSubmit: ([front, back]) => {
            if (cardToEdit) {
                updateCard(cardToEdit.id, front, back);
            } else {
                createCard(front, back);
            }
        },
    });
}

function createModalField(field) {
    const label = document.createElement("label");
    const input = field.multiline
        ? document.createElement("textarea")
        : document.createElement("input");

    label.htmlFor = field.id;
    label.textContent = field.label;
    input.id = field.id;
    input.name = field.id;
    input.required = true;
    input.value = field.value;
    input.rows = field.multiline ? 3 : undefined;
    return { label, input };
}

function showFormModal({ id, title, fields, onSubmit }) {
    modalOpener = document.activeElement;

    const dialog = document.createElement("dialog");
    const form = document.createElement("form");
    const heading = document.createElement("h2");
    const errorMessage = document.createElement("p");
    const buttonGroup = document.createElement("div");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");
    const inputs = fields.map(createModalField);

    dialog.id = id;
    dialog.setAttribute("aria-labelledby", `${id}-title`);
    form.method = "dialog";
    heading.id = `${id}-title`;
    heading.textContent = title;
    errorMessage.id = `${id}-error`;
    errorMessage.setAttribute("role", "alert");
    errorMessage.hidden = true;
    saveButton.type = "submit";
    saveButton.textContent = "Save";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    form.append(heading);
    inputs.forEach(({ label, input }) => form.append(label, input));
    form.append(errorMessage, buttonGroup);
    buttonGroup.append(saveButton, cancelButton);
    dialog.append(form);
    document.body.append(dialog);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = inputs.map(({ input }) => input.value.trim());

        if (values.some((value) => !value)) {
            errorMessage.textContent = "Complete all fields before saving.";
            errorMessage.hidden = false;
            inputs.forEach(({ input }, index) => {
                input.setAttribute("aria-invalid", String(!values[index]));
            });
            inputs.find(({ input }) => input.getAttribute("aria-invalid") === "true")
                ?.input.focus();
            return;
        }

        onSubmit(values);
        closeModal(dialog);
    });

    cancelButton.addEventListener("click", () => closeModal(dialog));
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeModal(dialog);
    });

    dialog.showModal();
    inputs[0].input.focus();
}

function moveToCard(direction) {
    const activeDeck = getActiveDeck();
    const studyCards = getStudyCards();

    if (!activeDeck || studyCards.length === 0) {
        return;
    }

    const currentIndex = studyCards.findIndex(
        (card) => card.id === activeCardId,
    );
    const nextIndex =
        (currentIndex + direction + studyCards.length) % studyCards.length;

    activeCardId = studyCards[nextIndex].id;
    isCardFlipped = false;
    renderDeckState();
}

function flipActiveCard() {
    if (!getActiveCard()) {
        return;
    }

    isCardFlipped = !isCardFlipped;
    renderCard();
}

function isTypingTarget(target) {
    return (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select, [contenteditable='true']") ||
            target.closest("dialog[open]"))
    );
}

function handleDeckAction(action) {
    const activeDeck = getActiveDeck();

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

    if (actionButton && deckActions.contains(actionButton)) {
        handleDeckAction(actionButton.dataset.deckAction);
    }
});

cardActions.addEventListener("click", (event) => {
    if (event.target === editCardButton) {
        showCardModal(getActiveCard());
    }

    if (event.target === deleteCardButton) {
        deleteActiveCard();
    }
});

newDeckButton.addEventListener("click", () => showDeckModal());
newCardButton.addEventListener("click", () => showCardModal());
previousButton.addEventListener("click", () => moveToCard(-1));
nextButton.addEventListener("click", () => moveToCard(1));
flipButton.addEventListener("click", flipActiveCard);
document.querySelector("#shuffle-button").addEventListener("click", shuffleStudyOrder);
flashcard.addEventListener("click", flipActiveCard);
flashcard.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        flipActiveCard();
    }
});
document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target)) {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveToCard(-1);
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        moveToCard(1);
    }

    if (event.key === " ") {
        event.preventDefault();
        flipActiveCard();
    }
});

if (activeDeckId) {
    selectDeck(activeDeckId);
} else {
    showEmptyDeckState();
}
