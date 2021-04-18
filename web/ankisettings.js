const deckSelector = document.getElementById('deck_selector');
const deckSelectContainer = document.getElementById('deck_select_container');
const cardModelSelect = document.getElementById('card_model_select');
const cardModelSelector = document.getElementById('card_model_selector');
const cardModelSelectContainer = document.getElementById('card_model_select_container');
const loadingSpinner = document.getElementById("loading-spinner")

async function initDecks() {
    const deckNames = await eel.invoke_anki('deckNames')();
    deckNames.forEach(deckName => {
        const deckOption = document.createElement("li");
        deckOption.classList.add("mdl-menu__item")
        deckOption.data_val = deckName.replace(' ', '_');
        deckOption.innerHTML = deckName;
        deckSelector.append(deckOption);
    });
    getmdlSelect.init('#deck_select_container');
    return deckNames;
}

async function initCardModels() {
    const cardModelNames = await eel.invoke_anki('modelNames')();
    cardModelNames.forEach(cardModelName => {
        const cardModelOption = document.createElement("li");
        cardModelOption.classList.add("mdl-menu__item")
        cardModelOption.data_val = cardModelName.replace(' ', '_');
        cardModelOption.innerHTML = cardModelName;
        cardModelSelector.append(cardModelOption);
    });  
    getmdlSelect.init('#card_model_select_container');
    return cardModelNames;
}
(async() => {
    await Promise.all([initDecks(), initCardModels()]);
    loadingSpinner.hidden = true;
    deckSelectContainer.hidden = false;
    cardModelSelectContainer.hidden = false;
})();

function changeDeck() {

}

async function changeCardModel() {
    const modelName = cardModelSelect.value;
    const fieldNames =  await eel.invoke_anki('modelFieldNames', {modelName: modelName})();
    console.log('field names', fieldNames)
    // updateFieldValuesTable(fieldNames);
}

function updateFieldValuesTable(fieldValues) {
    const fieldValuesTable = document.getElementById('field_values_table');
    const fieldValuesTableBody = fieldValuesTable.getElementsByTagName('tbody')[0];
    const tupleTemplate = document.getElementById('field_values_tuple_template');
    fieldValuesTableBody.innerHTML = '';
    fieldValuesTableBody.append(tupleTemplate);
    fieldValues.forEach(fieldValue=>{
        const tupleClone = tupleTemplate.cloneNode(true);
        tupleClone.id = fieldValue.replace(' ', '_');
        const tupleLabel = tupleClone.getElementsByClassName('tuple_label')[0];
        tupleLabel.innerHTML = fieldValue;
        const fieldValueSelector = tupleClone.getElementsByClassName('field_value_selector')[0];
        fieldValueSelector.id = `field_value_selector_${fieldValue.replace(' ', '_')}`;
        const fieldValueSelect = tupleClone.getElementsByClassName('field_value_select')[0];
        fieldValueSelect.id = `field_value_select_${fieldValue.replace(' ', '_')}`;
        console.log(fieldValueSelect.id)
        tupleClone.hidden = false;
        fieldValuesTableBody.append(tupleClone);
    })
}

updateFieldValuesTable(["Word", "Kana", "Picture", "Sentence", "Meaning", "Audio", "Pitch"])
updateFieldValuesTable(["Front", "Back"])