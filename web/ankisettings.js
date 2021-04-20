const deckSelector = document.getElementById('deck_selector');
const cardModelSelector = document.getElementById('card_model_selector');

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

async function getFieldNamesForModel(modelName) {
    return await eel.invoke_anki('modelFieldNames', {modelName: modelName})()
}

function updateFieldValuesTable(fieldValues) {
    if (fieldValues) {
        const fieldValuesTable = document.getElementById('field_values_table');
        const fieldValuesTableBody = fieldValuesTable.getElementsByTagName('tbody')[0];
        const tupleTemplate = document.getElementById('field_values_tuple_template');
        fieldValuesTableBody.innerHTML = '';
        fieldValuesTableBody.append(tupleTemplate); // keeping the clone
        fieldValues.forEach(fieldValue=>{
            const tupleClone = tupleTemplate.cloneNode(true);
            tupleClone.id = 'field_tuple' + fieldValue.replace(' ', '_');
            const tupleLabel = tupleClone.getElementsByClassName('tuple_label')[0];
            tupleLabel.innerHTML = fieldValue;
            const fieldValueSelect = tupleClone.getElementsByClassName('field_value_select')[0];
            fieldValueSelect.innerHTML = `<option></option>
            <option>Selected Text</option>
            <option>Sentence</option>
            <option>Screenshot</option>
            <option>Audio</option>`;
            tupleClone.hidden = false;
            fieldValuesTableBody.append(tupleClone);
        })
        fieldValuesTable.hidden = false;
    }
}
function applyFieldAndValuesToTable(fieldValueMap) {
    if(fieldValueMap) {
        const fieldValuesTable = document.getElementById('field_values_table');
        const fieldValuesTableBody = fieldValuesTable.getElementsByTagName('tbody')[0];
        const tupleTemplate = document.getElementById('field_values_tuple_template');
        fieldValuesTableBody.innerHTML = '';
        fieldValuesTableBody.append(tupleTemplate); // keeping the clone
        for (const field in fieldValueMap) {
            const tupleClone = tupleTemplate.cloneNode(true);
            tupleClone.id = 'field_tuple' + field.replace(' ', '_');
            const tupleLabel = tupleClone.getElementsByClassName('tuple_label')[0];
            tupleLabel.innerHTML = field;
            const fieldValueSelect = tupleClone.getElementsByClassName('field_value_select')[0];
            fieldValueSelect.innerHTML = `<option></option>
            <option>Selected Text</option>
            <option>Sentence</option>
            <option>Screenshot</option>
            <option>Audio</option>`;
            fieldValueSelect.value = fieldValueMap[field];
            tupleClone.hidden = false;
            fieldValuesTableBody.append(tupleClone);
        }
        fieldValuesTable.hidden = false;
    }
}