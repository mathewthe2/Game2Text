// const deckSelector = document.getElementById('deck_selector');
const deckSelector = document.getElementById('decks');
// const cardModelSelector = document.getElementById('card_model_selector');
const cardModelSelector = document.getElementById('card_models');

async function initDecks() {
    const deckNames = await eel.invoke_anki('deckNames')();
    if (typeof deckNames === 'string') { 
        // Failed to connect to Anki
        return []
    }
    if (deckNames.length > 0) {
        deckNames.forEach(deckName => {
            const deckOption = document.createElement("option");
            deckOption.value = deckName;
            deckSelector.append(deckOption);
        });
    }
    return deckNames;
}

async function initCardModels() {
    const cardModelNames = await eel.invoke_anki('modelNames')();
    if (typeof cardModelNames === 'string') {
        // Failed to connect to Anki
        return []
    }
    if (cardModelNames.length > 0) {
        cardModelNames.forEach(cardModelName => {
            const cardModelOption = document.createElement("option");
            cardModelOption.value = cardModelName;
            cardModelSelector.append(cardModelOption);
        });  
    }
    return cardModelNames;
}

async function getFieldNamesForModel(modelName) {
    return await eel.invoke_anki('modelFieldNames', {modelName: modelName})()
}

function updateFieldValuesTable(fieldValues) {
    const fieldValuesTable = document.getElementById('field_values_table');
    if (Object.keys(fieldValues).length) {
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
            <option>Reading</option>
            <option>Glossary</option>
            <option>Sentence</option>
            <option>Screenshot</option>
            <option>Audio</option>
            <option>Word Audio</option>`;
            tupleClone.hidden = false;
            fieldValuesTableBody.append(tupleClone);
        })
        fieldValuesTable.hidden = false;
    } else {
        fieldValuesTable.hidden = true;
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
            <option>Reading</option>
            <option>Glossary</option>
            <option>Sentence</option>
            <option>Screenshot</option>
            <option>Audio</option>
            <option>Word Audio</option>`;
            fieldValueSelect.value = fieldValueMap[field];
            tupleClone.hidden = false;
            fieldValuesTableBody.append(tupleClone);
        }
        fieldValuesTable.hidden = false;
    }
}