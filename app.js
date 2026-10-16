const sampleDecks = [
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

let decks = sampleDecks;

const storageKey = "flashcards-study-app";

const deckList = document.querySelector("#deck-list");
const deckTitle = document.querySelector("#deck-title");
const cardCount = document.querySelector("#card-count");
const cardPosition = document.querySelector("#card-position");
const cardSearch = document.querySelector("#card-search");
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
let searchQuery = "";

function isValidCard(card) {
    return (
        card &&
        typeof card.id === "string" &&
        typeof card.front === "string" &&
        typeof card.back === "string"
    );
}

function isValidDeck(deck) {
    return (
        deck &&
        typeof deck.id === "string" &&
        typeof deck.name === "string" &&
        typeof deck.createdAt === "string" &&
        Array.isArray(deck.cards) &&
        deck.cards.every(isValidCard) &&
        new Set(deck.cards.map((card) => card.id)).size === deck.cards.length
    );
}

function loadData() {
    try {
        const savedData = window.localStorage.getItem(storageKey);

        if (!savedData) {
            return null;
        }

        const parsedData = JSON.parse(savedData);

        if (
            !parsedData ||
            !Array.isArray(parsedData.decks) ||
            !parsedData.decks.every(isValidDeck) ||
            new Set(parsedData.decks.map((deck) => deck.id)).size !==
                parsedData.decks.length ||
            (parsedData.activeDeckId !== null &&
                typeof parsedData.activeDeckId !== "string")
        ) {
            console.warn("Saved flashcard data is invalid; using sample decks.");
            return null;
        }

        return parsedData;
    } catch {
        console.warn("Saved flashcard data could not be loaded.");
        return null;
    }
}

function saveData() {
    try {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify({ decks, activeDeckId }),
        );
    } catch {
        console.warn("Flashcard data could not be saved.");
    }
}

function initializeData() {
    const savedData = loadData();

    if (!savedData) {
        return;
    }

    decks = savedData.decks;
    activeDeckId = decks.some((deck) => deck.id === savedData.activeDeckId)
        ? savedData.activeDeckId
        : decks[0]?.id ?? null;
}

function getActiveDeck() {
    return decks.find((deck) => deck.id === activeDeckId) ?? null;
}

function getActiveCard() {
    const activeDeck = getActiveDeck();
    return (
        activeDeck?.cards.find(
            (card) =>
                card.id === activeCardId &&
                filterCards().some((filteredCard) => filteredCard.id === card.id),
        ) ?? null
    );
}

function filterCards() {
    const activeDeck = getActiveDeck();

    if (!activeDeck) {
        return [];
    }

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
        return [...activeDeck.cards];
    }

    return activeDeck.cards.filter(
        (card) =>
            card.front.toLowerCase().includes(query) ||
            card.back.toLowerCase().includes(query),
    );
}

function getStudyCards() {
    const filteredCards = filterCards();

    return studyOrder
        .map((cardId) => filteredCards.find((card) => card.id === cardId))
        .filter(Boolean);
}

function resetStudyOrder() {
    studyOrder = filterCards().map((card) => card.id);
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

function updateCardEmptyState(activeDeck, hasCard) {
    if (!activeDeck) {
        cardEmptyState.hidden = true;
        return;
    }

    cardEmptyState.hidden = hasCard;
    cardEmptyState.textContent =
        activeDeck.cards.length === 0
            ? "This deck has no cards yet. Select New Card to add one."
            : "No matching cards.";
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
            } else if (controlId === "card-search") {
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
    updateCardEmptyState(activeDeck, activeCard !== null);
    cardFront.hidden = !activeCard || isCardFlipped;
    cardBack.hidden = !activeCard || !isCardFlipped;

    if (activeCard) {
        cardFront.querySelector("p").textContent = activeCard.front;
        cardBack.querySelector("p").textContent = activeCard.back;
    }

    const totalCardCount = activeDeck?.cards.length ?? 0;
    cardCount.textContent =
        searchQuery && hasDeck
            ? `${getStudyCards().length} of ${totalCardCount} cards`
            : `${totalCardCount} cards`;
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
    saveData();
    renderDeckState();
}

function showEmptyDeckState() {
    activeDeckId = null;
    activeCardId = null;
    studyOrder = [];
    deckTitle.textContent = "No decks yet";
    saveData();
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
    activeCardId = getStudyCards().some((candidate) => candidate.id === card.id)
        ? card.id
        : getStudyCards()[0]?.id ?? null;
    isCardFlipped = false;
    saveData();
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
    activeCardId = getStudyCards().some((card) => card.id === activeCard.id)
        ? activeCard.id
        : getStudyCards()[0]?.id ?? null;
    isCardFlipped = false;
    saveData();
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
    activeCardId = getStudyCards()[0]?.id ?? null;
    isCardFlipped = false;
    saveData();
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
cardSearch.addEventListener("input", () => {
    searchQuery = cardSearch.value;
    resetStudyOrder();
    activeCardId = getStudyCards()[0]?.id ?? null;
    isCardFlipped = false;
    renderDeckState();
});
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

initializeData();

if (activeDeckId) {
    selectDeck(activeDeckId);
} else {
    showEmptyDeckState();
}
