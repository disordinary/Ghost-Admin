// openMobileMenu="openMobileMenu"
// value=model.titleScratch
// tabindex="1" 
// shouldFocus=shouldFocusTitle 
// focus-out="updateTitle" 
// update=(action (perform updateTitle)) 
// keyDown=(action "titleKeyDown")

import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'h2',
    classNames: ['gh-title'],
    didRender() {
        if(this._rendered) {
            return;
        }

        let $this = this.$('div');
        $this[0].onkeyup = event => {
            if($this[0].textContent != '') {
                $this.removeClass('no-content');
            } else {
                $this.addClass('no-content');
            }

            // sanity check
            // if($this[0].innerHTML !== $this[0].textContent) {
            //     console.log('Title content does not match!');
            //     console.log($this[0].innerHTML, $this[0].textContent)
            //     $this[0].innerHTML = $this[0].textContent;
            //
            //     // todo: retain the range position.
            // }
        };

        $this[0].onkeydown = event => {
            // block the browser format keys.
            if(event.ctrlKey || event.metaKey){
                switch(event.keyCode) {
                    case 66: // B
                    case 98: // b
                    case 73: // I
                    case 105: // i
                    case 85: // U
                    case 117: // u
                        return false;
                }
            }
            if(event.keyCode === 13) {
                //enter
                return false;
            }

            // down key
            // if we're within ten pixels of the bottom of this element then we try and figure out where to position
            // the cursor in the editor.
            if(event.keyCode === 40) {
                let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.
                let cursorPositionOnScreen =  range.getBoundingClientRect();
                let offset = $this.offset();
                let bottomOfHeading =  offset.top + $this.height();
                if(cursorPositionOnScreen.bottom > bottomOfHeading - 33) {
                    let editor = window.editor; // hmmm, this is nasty!
                                                // We need to pass the editor instance so that we can `this.get('editor');`
                                                // but the editor instance is within the component and not exposed.
                                                // there's also a dependency that the editor will have with the title and the title will have with the editor
                                                // so that the cursor can move both ways (up and down) between them.
                                                // see `lib/gh-koenig/addon/gh-koenig.js` and the function `findCursorPositionFromPixel` which should actually be
                                                // encompassed here.
                    let loc = editor.element.getBoundingClientRect();

                    let cursorPositionInEditor = editor.positionAtPoint(cursorPositionOnScreen.left, loc.top);

                    if(cursorPositionInEditor.isBlank) {
                        editor.element.focus();
                    } else {
                        editor.selectRange(cursorPositionInEditor.toRange());
                    }
                    return false;
                }
            }
            $this.removeClass('no-content');
        };
        this._rendered = true;
    }
});
function resetRange(newRange) {
    
}