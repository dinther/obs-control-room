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


class PopupMenu extends Popup{  //handles single level menu popup
    constructor(popupData){
        super();
        this.popupData = Object.assign({
            showIcons: true,  //override, shows menu item icons if defined
            showHotkeys: true, //Shows hotkeys in menu
            cycleItems: true, //jumps to top when reaches end with arrow key or other way
            itemOptions: { //default menuitem values. Overridden in actual menudata
                showHotkey: true,
                enabled: true,
                visible: true
            },
            menuItems: [
                {
                    id: 'item1',
                    type: 'item',
                    index: 0,
                    enabled: true,
                    visible: true,
                    icon: './icons/item1.svg',
                    caption: 'Menu item 1',
                    hotkey: 'ALT s',
                    showHotkey: true,
                    action: function(){
                        //do something
                    }
                },
                {
                    id: 'item2',
                    type: 'separator',
                    index: 1,
                    enabled: true,
                    visible: true,
                    icon: './icons/item2.svg',
                    caption: 'Menu item 2',
                    hotkey: 'ALT r',
                    showHotkey: true,
                    action: function(){
                        //do something else 
                    }
                },
                {
                    id: 'item3',
                    type: 'menu',
                    index: 2,
                    enabled: true,
                    visible: true,
                    icon: './icons/item3.svg',
                    caption: 'Menu item 3',
                    hotkey: 'ALT r',
                    showHotkey: true,
                    action: function(){
                        //do something else 
                    }
                }                         
            ]
        }, this.popupData);
    }
}