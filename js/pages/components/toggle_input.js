export function ToggleInput(container) {
    let mChangeCallback = (bool) => { };

    let mInputContainer = document.createElement('div');
    container.appendChild(mInputContainer);

    let mInputLabel = document.createElement('span');
    mInputContainer.appendChild(mInputLabel);

    let mInputBox = document.createElement('input');
    mInputBox.setAttribute('type', 'checkbox')
    mInputBox.addEventListener('change', () => {
        let val = mInputBox.checked;
        mChangeCallback(val);
    });
    mInputContainer.appendChild(mInputBox)

    this.show = () => mInputContainer.style['display'] = '';
    this.hide = () => mInputContainer.style['display'] = 'none';
    this.remove = () => { container.removeChild(mInputContainer); }
    this.setId = (id) => { mInputContainer.setAttribute('id', id); return this; };
    this.setLabel = (text) => { mInputLabel.textContent = text; return this; };
    this.setVal = (bool) => { mInputBox.checked = bool; return this; }
    this.getVal = () => { return mInputBox.checked; }
    this.onChange = (func) => { mChangeCallback = func; return this; };
}