import Ember from 'ember';
import layout from '../templates/components/ghost-newline';


export default Ember.Component.extend({
    layout,
    classNames: ['toolbar-newline'],
    init() {
        this._super(...arguments);
        let editor = this.editor = this.get('editor');
    },
    click() {
        alert('click');
    },
    didRender() {
        let $this = this.$();
        let editor = this.editor;
        let $editor = Ember.$('.gh-editor-container'); // TODO this is part of Ghost-Admin

        editor.cursorDidChange(() => {

            // if there is no cursor:
            if(!editor.range || !editor.range.head.section) {
                $this.fadeOut();
                return;
            }

            let element = editor.range.head.section.renderNode._element;

            if(this._element === element) {
                return;
            }

            // if the section is a blank section then we can change it to a card, otherwise we can't.
            if(!editor.range.head.section.isBlank) {
                return;
            }


            let offset =  this.$(element).position();
            let edOffset = $editor.offset();

            $this.css('top', offset.top + $editor.scrollTop() - edOffset.top - 5);
            if(element.tagName.toLowerCase()==='li') {
                $this.css('left', this.$(element.parentNode).position().left + $editor.scrollLeft() - 90);
            } else {
                $this.css('left', offset.left + $editor.scrollLeft() - 90);
            }

            $this.fadeIn();

            this._element = element;

        });
    },
    willDestroy() {
        this.editor.destroy();
    }
});
