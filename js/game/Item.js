var Item;
const DEFAULT_TOOL_DISTANCE = 2.5;
(function(){
    var imageHolder = document.getElementById( 'item-pic' );
    Item = function(name, type, images, onMouseDown, onMouseUp) {
        this.name = name;
        this.type = type;
        this.images = images;
        this.onMouseDown = (function(objectClicked){onMouseDown(objectClicked, imageHolder, images);});
        this.onMouseUp = (function(objectClicked){onMouseUp(objectClicked, imageHolder, images);});
        this.toolDistance = DEFAULT_TOOL_DISTANCE;
    }
})();
