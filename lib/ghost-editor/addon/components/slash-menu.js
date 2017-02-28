import Ember from 'ember';
import Tools from '../options/default-tools';
import layout from '../templates/components/slash-menu';

export default Ember.Component.extend({
    layout,
    classNames: ['slash-menu'],
    menuSelectedItem: 0,
    toolsLength:0,
    selectedTool:null,

    init() {
        this._super(...arguments);
        this.tools =new Tools(this.get('editor'), this);
        this.iconURL = this.get('assetPath') + '/tools/';
        this.editor.cursorDidChange(this.cursorChange.bind(this));

        let self = this;
        this.editor.onTextInput(
            {
                name: 'slash_menu',
                text: '/',
                run(editor) {
                    self.open(editor);
                }
            });
    },

    cursorChange() {
        this._node = this.editor.range.head.section;
        this._offset = this.editor.range.head.offset;
        if(this.isActive) {
            // update the toolbar based on the difference between the "/" and the current cursor position
            if(!this.editor.range.isCollapsed || this.editor.range.head.section !== this._node || this.editor.range.head.offset < 1 || !this.editor.range.head.section) {
                this.close();
            }
            this.query = this.editor.range.head.section.text.substring(this._offset, this.editor.range.head.offset);
            this.propertyDidChange('toolbar');
        }
    },
    open() {
        const $menu = Ember.$('#slash-menu');
        const $editor = Ember.$('.gh-editor-container');

        let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.

        let position =  range.getBoundingClientRect();
        let edOffset = $editor.offset();

        $menu.show();

        Ember.run.schedule('afterRender', this,
            () => {
                $menu.css('top', position.top + $editor.scrollTop() - edOffset.top + 20); //- edOffset.top+10
                $menu.css('left', position.left + (position.width / 2) + $editor.scrollLeft() - edOffset.left );
            }
        );

        this.query="";
        this.propertyDidChange('toolbar');
    },
    toolbar: Ember.computed(function () {
        let tools = [ ];
        let match = (this.query || "").trim().toLowerCase();
        let i = 0;
        // todo cache active tools so we don't need to loop through them on selection change.
        this.tools.forEach((tool) => {

            if ((tool.type === 'block' || tool.type === 'card') && (tool.label.toLowerCase().startsWith(match) || tool.name.toLowerCase().startsWith(match))) {

                let t = {
                    label : tool.label,
                    name: tool.name,
                    icon: tool.icon,
                    selected: i===this.menuSelectedItem,
                    onClick: tool.onClick
                };
                if(i === this.menuSelectedItem) {
                    this.set('selectedTool', t);
                }

                tools.push(t);
                i++;
            }
        });
        this.set('toolsLength', i);
        if(this.menuSelectedItem > this.toolsLength) {
            this.set('menuSelectedItem', this.toolsLength-1);
            // this.propertyDidChange('toolbar');
        }

        if(tools.length <  1) {
            this.isActive = false;
            this.$('#slash-menu').hide();
        }
        return tools;
    }),
    close() {
        this.isActive = false;

        this.$('#slash-menu').hide();
        // note: below is directly manipulating internal mobiledoc datastructures
        // a public api which does htis will be included in the next mobiledoc-kit release.
        for( let i = this.editor._keyCommands.length-1; i > -1; i--) {
            let keyCommand = this.editor._keyCommands[i];

            if(keyCommand._ghostName === 'slashdown' || keyCommand._ghostName === 'slashup' || keyCommand._ghostName === 'slashenter'|| keyCommand._ghostName === 'slashesc') {
                this.editor._keyCommands.splice(i,1);
            }
        }
    }
});
