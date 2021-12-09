/*
Popup and Popup Menu can be used for
    ToolTips
    Dropdown Combo list
    SlideIn Menu
    DropDown Menu (Multiple levels)
    Popup menu
    Anything that needs a popup container

    Popup can be modal or non modal and can be set to attempt to avoid the boundaries of it's operational area.
    Popup handles window resize and scroll correctly.
    Popup menus are fully supported by the keyboard.
*/

class Popup{
    constructor(popupData){
        if (popupData === undefined){
            popupData = {};
        }
        this.popupData = this.mergeObject({
            name: 'OBS Menu',
            id: 'obsmenu',
            parent: 'body',  //The popup menu will be shown inside these boundaries.
          //owner: '.axes div:nth-child(6)',  //owner defines where the popup will appear          
            rect: null, //DOMRect location rectangle. Relative to owner if not null otherwise absolute
            scrollWithPage: true, //Popup will scroll along with the owner
            AnywhereToClose: true, //Any click anywhere closes the popup. othewise close() must be called explicitly
            modal: false, //Popup must close before further interaction with the page is possible.
            styleNames:{  //stylenames used for menu. Easy re-map to match your style sheets and naming convention
                container: 'pop_container',
                hidden: 'pop_hidden',
                modal: 'pop_modal',
                nonModal: 'pop_nonmodal'
            }
        }, popupData);
        this.parentElement = this.getElement(this.popupData.parent);
        this.modalElement = document.createElement('div');
        this.modalElement.classList.add( (this.popupData.modal)? this.popupData.styleNames.modal : this.popupData.styleNames.nonModal);
        this.modalElement.classList.add(this.popupData.styleNames.hidden);
        this.containerElement = document.createElement('div');
        this.containerElement.classList.add(this.popupData.styleNames.container);
        this.containerElement.id = '';
        this.modalElement.appendChild(this.containerElement);
        this.parentElement.appendChild(this.modalElement);
        if (this.popupData.AnywhereToClose){
            document.addEventListener('click', event=>{
                if (this.visible){
                    this.close();
                }
            });
        };
        this.onCalcLocation = null; //  Callback when location is calculated User can override here     
    }

    mergeObject(target, source){
        //we kow the structure and levels so keep it simple
        let styleNames = source.styleNames;
        delete source.styleNames;
        Object.assign(target, source);
        if (styleNames != undefined){
            if (target.styleNames === undefined){
                target.styleNames = {};
            }
            Object.assign(target.styleNames, styleNames);
        }
        return target;
    }

    getElement(element, parent=null){
        if (typeof element === 'string'){
            if (parent instanceof Element){
                return parent.querySelector(element);
            }
            return document.querySelector(element);
        }
        if (element instanceof Element){
            return element;
        }
        return null;
    }

    open(popupData, owner=null){
        this.close();
        if (typeof popupData === 'object'){
            this.mergeObject(this.popupData, popupData);
        }
        this.populatePopup();
        this.modalElement.classList.remove(this.popupData.styleNames.hidden);
    }

    close(){
        this.modalElement.classList.add(this.popupData.styleNames.hidden);
    }

    remove(){
        if (this.modalElement !== undefined){
            this.modalElement.remove();
            this.modalElement = null;
            this.containerElement = null;
        }
        this.popupData = null;
    }

    populatePopup(){
        this.modalElement.classList.add(this.popupData.styleNames.hidden);
        this.containerElement.innerHTML = '';
        this.containerElement.id = this.popupData.id;   
    }

    isNum(value){
        return typeof value === 'number';
    }

    calcLocation(){
        let rect = {left: 0, top: 0};
        if (typeof this.onCalcLocation === 'function'){
            rect = this.onCalcLocation(rect);
        }
        return rect;
    }

    setPopup(location){
        this.containerElement.style.left = (this.isNum(location.left))? location.left + 'px' : '';
        this.containerElement.style.right = (this.isNum(location.right))? location.right + 'px' : '';
        this.containerElement.style.top = (this.isNum(location.top))? location.top + 'px' : '';
        this.containerElement.style.bottom = (this.isNum(location.bottom))? location.bottom + 'px' : '';
        this.containerElement.style.width = (this.isNum(location.width))? location.width + 'px' : '';
        this.containerElement.style.height = (this.isNum(location.height))? location.height + 'px' : '';
    }

    get visible(){
        if (this.popupData !== undefined){
            return !this.modalElement.classList.contains(this.popupData.styleNames.hidden);
        } else {
            return false;
        }
    }
}

class PopupMenu extends Popup{  //handles single level menu popup
    constructor(popupData){
        super(popupData);
        this.popupData = this.mergeObject({
            showIcons: true,  //override, shows menu item icons if defined
            showHotkeys: true, //Shows hotkeys in menu
            sizeToOwner: false, //Sets popup to be the same width as the owner
            avoidBoundaries: true, //Tries not to get clipped by it's parent container
            cycleItems: true, //jumps to top when reaches end with arrow key or other way
            itemOptions: { //default menuitem values. Overridden in actual menudata
                type: 'item',
                showHotkey: true,
                enabled: true,
                visible: true
            },
            styleNames:{
                menu: 'pop_menu',
                menuItem: 'pop_menuitem',
                menuIcon: 'pop_menuicon',
                menuSeparator: 'pop_separator'
            },
            menuItems: []
        }, this.popupData);
        this.ownerElement = this.getElement(this.popupData.owner, this.parentElement);
        this.onGetIcon = this.popupData.onGetIcon;  //  callback to provide inline Icon data SVG or PNG. MenuItem object is passed in
        window.addEventListener('resize', event => {
            if (this.ownerElement == null){
                this.close();
            } else {
                this.setPopup(this.calcLocation());
            }
        });        
    }

    mergeObject(target, source){
        super.mergeObject(target, source);
        let itemOptions = source.itemOptions;
        delete(source.itemOptions);
        let menuItems = source.menuItems;
        delete(source.menuItems);
        if (itemOptions !== undefined){
            if (target.itemOptions === undefined){
                target.itemOptions = {};
            }
            Object.assign(target.itemOptions, itemOptions);
        }
        if (Array.isArray(menuItems)){
            if (target.menuItems === undefined){
                target.menuItems = [];
            }
            menuItems.forEach(menuItem=>{
                target.itemOptions
            });



            target.menuItems.concat(menuItems);
        }        
        return target;
    }

    getIcon(menuItem){
        if (typeof this.onGetIcon === 'function'){
            return this.onGetIcon(menuItem);
        } else {
            return '';
        }
    }

    open(popupData, owner=null){
        this.close();
        let newOwnerElement = null;
        if (popupData === undefined){
            this.modalElement.classList.remove(this.popupData.styleNames.hidden);
            return;
        } else if (typeof popupData === 'string'){
            newOwnerElement = this.getElement(popupData);
            this.popupData.ownerSelector = popupData;
        } else if (popupData instanceof Element){
            newOwnerElement = popupData;
        } else if (typeof popupData === 'object'){
            newOwnerElement = (owner instanceof Element)? owner : this.getElement(popupData.owner);
            this.mergeObject(this.popupData, popupData);
        }

        if (newOwnerElement !== null && newOwnerElement === this.ownerElement && this.popupData.id !== this.containerElement.id){
            this.modalElement.classList.remove(this.popupData.styleNames.hidden);
        } else {
            this.ownerElement = newOwnerElement

            let observer = new MutationObserver(mutations => {
               if (this.parentElement.contains(this.containerElement)) {
                    observer.disconnect();                   
                    this.setPopup(this.calcLocation());
                }
            });
            observer.observe(this.parentElement, {attributes: false, childList: true, characterData: false, subtree:true});
            this.populatePopup();
            this.modalElement.classList.remove(this.popupData.styleNames.hidden);
        }
    }

    close(){
        super.close();
        if (this.ownerElement === null){
            delete this.popupData.rect;
        }
    }    

    populatePopup(){
        super.populatePopup();
        if (Array.isArray(this.popupData.menuItems)){
            this.containerElement.classList.add(this.popupData.styleNames.menu);
            this.popupData.menuItems.forEach(menuItem=>{
                let item = document.createElement('div');
                if (menuItem.caption == '_'){
                    item.classList.add(this.popupData.styleNames.menuSeparator);
                } else {
                    item.classList.add(this.popupData.styleNames.menuItem);
                    item.id = menuItem.id;
                    let iconDiv = document.createElement('div');
                    iconDiv.classList.add(this.popupData.styleNames.menuIcon)
                    iconDiv.innerHTML = this.getIcon(menuItem);
                    item.appendChild(iconDiv);
                    let caption = document.createElement('span');
                    caption.innerText = menuItem.caption;
                    item.appendChild(caption);
                }
                if (menuItem.visible == false){
                    item.classList.add(this.popupData.styleNames.hidden);
                }
                item.addEventListener('click', event=>{menuItem.action(event, menuItem)});
                this.containerElement.appendChild(item);
            })
        }
             
        //this.modalElement.classList.remove(this.popupData.styleNames.hidden);
    }

    calcLocation(){
        let rect = {};
        if (this.ownerElement){
            var ownerRect = this.ownerElement.getBoundingClientRect();
            rect.width = ownerRect.width;
        } else {
            var ownerRect = new DOMRect();
        }
        let pRect = this.parentElement.getBoundingClientRect();
        if (this.popupData.rect){   
            if (this.isNum(this.popupData.rect.left)){ rect.left = ownerRect.left + this.popupData.rect.left }
            else if (this.isNum(this.popupData.rect.right)){ rect.right = this.parentElement.offsetWidth - (ownerRect.right + this.popupData.rect.right) }
            else {rect.left = ownerRect.left}

            if (this.isNum(this.popupData.rect.top)){ rect.top = ownerRect.bottom + this.popupData.rect.top }
            else if (this.isNum(this.popupData.rect.bottom)){ rect.bottom = this.parentElement.offsetHeight - (ownerRect.top + this.popupData.rect.bottom) }
            else { rect.top = ownerRect.bottom}
        } else {
            rect.left = ownerRect.left;
            rect.top = ownerRect.bottom;
        }

        if (this.popupData.avoidBoundaries == true){
            //Adjust location if needed
            if (typeof rect.left=='number' && rect.left > this.parentElement.offsetWidth / 2 && rect.left + this.containerElement.offsetWidth > this.parentElement.offsetWidth){
                rect.right = pRect.width - rect.left;
                delete rect.left;    
            }
            if (typeof rect.right=='number' && rect.right > this.parentElement.offsetWidth / 2 && rect.right + this.containerElement.offsetWidth > this.parentElement.offsetWidth){
                rect.left = pRect.width - rect.right; 
                delete rect.right;    
            }
            if (typeof rect.top=='number' && rect.top > this.parentElement.offsetHeight / 2 && rect.top + this.containerElement.offsetHeight > this.parentElement.offsetHeight){
                rect.bottom = pRect.height - rect.top;
                delete rect.top;
            }
            if (typeof rect.bottom=='number' && rect.bottom > this.parentElement.offsetHeight / 2 && rect.bottom + this.containerElement.offsetHeight > this.parentElement.offsetHeight){
                rect.top = pRect.height - rect.bottom;
                delete rect.bottom;
            }
        }

        if (typeof this.onCalcLocation === 'function'){
            rect = this.onCalcLocation(rect, ownerRect, popupData.rect);
        }
        return rect;
    }

    setPopup(location){
        super.setPopup(location);
        if (this.popupData.sizeToOwner && location.width && location.width != 0){
            this.containerElement.style.width = location.width + 'px';
        } else {
            this.containerElement.style.width = '';
        }
    }    
}

  
