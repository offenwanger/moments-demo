export function LabeledImage(container) {
    let mGroup = document.createElement('div')
    mGroup.style["background"] = "#d6d6d6";
    mGroup.style["padding"] = ".5em .75em";
    mGroup.style["margin"] = "5px";
    mGroup.style["display"] = "flex";
    mGroup.addEventListener('pointerup', () => { mGroup.style["background"] = "#d6d6d6" })
    mGroup.addEventListener('pointerdown', () => { mGroup.style["background"] = "#c6c6c6" })
    mGroup.addEventListener('pointerenter', () => { mGroup.style["background"] = "#e6e6e6" })
    mGroup.addEventListener('pointerout', () => { mGroup.style["background"] = "#d6d6d6" })
    container.appendChild(mGroup)

    let mImage = document.createElement('img')
    mImage.style["height"] = "64px";
    mImage.style["width"] = "64px";
    mGroup.appendChild(mImage)

    let mText = document.createElement('div')
    mGroup.appendChild(mText)


    this.show = () => mGroup.style['display'] = '';
    this.hide = () => mGroup.style['display'] = 'none';
    this.remove = () => { container.removeChild(mGroup) }
    this.setId = (id) => { mGroup.setAttribute('id', id); return this; }
    this.setLabel = (label) => { mText.textContent = label; return this; }
    this.setImage = (src) => { if (src) mImage.src = src; return this; }
}