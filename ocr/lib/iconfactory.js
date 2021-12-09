const IconFactory = (function(){
    let _icons = {};

    let _hasIcon = function(name){
        return (name !== undefined) && (_icons[name] !== undefined);
    }
    
    function hasIcon(name){
        return _hasIcon(name);
    }

    let _getIcon = function(name) { //optional arguments are title, with and height in any order but the first number is assumed to be width
        let iconObject = _icons[name];
        let iconSize = '';
        if (iconObject !== undefined){
            //first argument is the Icon name. Sort out the other arguments
            let title = '';
            let width = null;
            let height = null;
            if (arguments.length > 1){
                for (let i=1; i<arguments.length; i++){
                    let arg = arguments[i];
                    height = ((typeof arg === 'number') && (width !== null)) ? arg : null;
                    width = ((typeof arg === 'number') && (width === null)) ? arg : width;
                    title = ((typeof arg === 'string') && (title === '')) ? arg : title;
                } 
            };

            if (width !== null){
                iconSize = 'width=\"' + width + '\" ';
                if (height !== null){
                    iconSize += 'height=\"' + height + '\" '
                } else {
                    iconSize += 'height=\"' + width + '\" '
                }
            }
            if (iconObject.p !== undefined){
                let icon = '<svg xmlns=\"http://www.w3.org/2000/svg\" ' +
                iconSize + ((title !== '')? 'title=\"' + title + '\" ' : '') +
                'viewBox=\"' + iconObject.vb + '\"><path d=\"' + iconObject.p + '\" /></svg>';
                return icon;
            } else if (iconObject.b64 !== undefined){
                let icon = '<img ' + iconSize + ((title !== '')? 'alt=\"' + title + '\" ' : '') +
                'src=\"data:image/png;base64,' + iconObject.b64 + '\" />';
                return icon;
            }
        } else {
            return '';
        }
    }

    function getIcon(name){
        return _getIcon(name);
    }

    let _addSVGIcon = function(name, viewBox, path, title){
        let object = {vb: viewBox, p: path};
        if (typeof title === 'string'){
            object.t = title;
        }
        _icons[name] = object;
    }

    function addSVGIcon(name, viewBox, path, title){
        return _addSVGIcon(name, viewBox, path, title);
    }

    let _addPNGIcon = function(name, base64, alt){
        let object = {b64: base64};
        if (typeof alt === 'string'){
            object.a = alt;
        }
        _icons[name] = object;
    }

    function addPNGIcon(name, base64, alt){
        return _addPNGIcon(name, base64, alt);
    }

    _addIcons = function(icons){
        return Object.assign(_icons, icons);
    }

    function addIcons(icons){
        return _addIcons(icons);
    }

    let _asJSON = function(){
        return JSON.stringify(_icons);
    }

    function asJSON(){
        return _asJSON();
    }

    return {
        hasIcon,
        getIcon,
        addSVGIcon,
        addPNGIcon,
        addIcons,
        asJSON,
    }
}());