export function TextInput(container, type = 'text') {
    let mChangeCallback = (newText) => { };

    let mInputContainer = document.createElement('div');
    container.appendChild(mInputContainer);

    let mInputLabel = document.createElement('span');
    mInputContainer.appendChild(mInputLabel);

    let mInputBox = document.createElement('input');
    mInputBox.setAttribute('type', type)
    mInputBox.addEventListener('blur', () => {
        let val = mInputBox.value;
        if (type == 'number') val = parseFloat(val);
        mChangeCallback(val);
    });
    mInputContainer.appendChild(mInputBox)

    this.show = () => mInputContainer.style['display'] = '';
    this.hide = () => mInputContainer.style['display'] = 'none';
    this.remove = () => { container.removeChild(mInputContainer); }
    this.setId = (id) => { mInputContainer.setAttribute('id', id); return this; };
    this.setLabel = (text) => { mInputLabel.textContent = text; return this; };
    this.setText = (text) => { mInputBox.value = text; return this; }
    this.getText = () => { return mInputBox.value; }
    this.setOnChange = (func) => { mChangeCallback = func; return this; };
}