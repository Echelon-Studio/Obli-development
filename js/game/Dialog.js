var Dialog;

(function(){
    var dialogMain = document.getElementById('dialogue');
    var dialogName = document.getElementById('name');
    var dialogPortrait = document.getElementById('portrait');
    var dialogText = document.getElementById('dialogue-box-text');

    Dialog = function(characterName, portrait, characterText){
        this.characterName = characterName;
        this.portrait = portrait;
        this.characterText = characterText;
        this.show = function(){
            dialogName.innerHTML = characterName;
            dialogPortrait.src = portrait;
            dialogText.innerHTML = characterText;
            dialogMain.style.display = '';
        };
        this.hide = function(){
            dialogMain.style.display = 'none';
        }
    };
    dialogMain.style.display = 'none';
})();