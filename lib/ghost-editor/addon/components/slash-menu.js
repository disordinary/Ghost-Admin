import Ember from 'ember';
import Tools from '../options/default-tools';
import layout from '../templates/components/slash-menu';

export default Ember.Component.extend({
    layout,
    classNames: ['slash-menu'],
    range: null,
    menuSelectedItem: 0,
    toolsLength:0,
    selectedTool:null,
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
    didRender() {
        if(this._setup_plus) {
            return;
        }
        let $editor = Ember.$('.gh-editor-container');
        let editor = this.editor;
        editor.cursorDidChange(() => {

            if(!editor.range || !editor.range.head || !editor.range.head.section || !editor.range.head.section.renderNode) {
                return;
            }
            let $plus = Ember.$('#slash-menu-newline');
            if(!editor.range.head.section.isBlank) {
               $plus.fadeOut();
               return;
            }
            let element = editor.range.head.section.renderNode._element;

            if(this._element === element) {
                return;
            }

            let offset =  this.$(element).position();
            let edOffset = $editor.offset();

            $plus.css('top', offset.top + $editor.scrollTop() - edOffset.top - 5);

            if(element.tagName.toLowerCase()==='li') {
                $plus.css('left', this.$(element.parentNode).position().left + $editor.scrollLeft() - 90);
            } else {
                $plus.css('left', offset.left + $editor.scrollLeft() - 90);
            }

            $plus.fadeIn();

            this._element = element;
            this._setup_plus = true;

        });
    },
    willDestroy() {
        this.editor.destroy();
    },
    cursorChange() {
        if(this.isActive) {
            if(!this.editor.range.isCollapsed || this.editor.range.head.section !== this._node || this.editor.range.head.offset < 1 || !this.editor.range.head.section) {
               this.close();
            }

            this.query = this.editor.range.head.section.text.substring(this._offset, this.editor.range.head.offset);
            this.set('range', {
                section: this._node,
                startOffset: this._offset,
                endOffset: this.editor.range.head.offset
            });
            this.propertyDidChange('toolbar');
        } else if(this.editor.range.head.section) {
            this._node = this.editor.range.head.section;
            this._offset = this.editor.range.head.offset;
            this.set('range', {
                section: this._node,
                startOffset: this._offset,
                endOffset: this.editor.range.head.offset
            });
        }


    },
    open(editor) {
        let self = this;
        let $this = this.$('#slash-menu');
        let $editor = Ember.$('.gh-editor-container');

        this._node = editor.range.head.section;
        this._offset = editor.range.head.offset;
        this.isActive = true;
        this.cursorChange();
        let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.

        let position =  range.getBoundingClientRect();
        let edOffset = $editor.offset();

        $this.show();

        Ember.run.schedule('afterRender', this,
            () => {
                $this.css('top', position.top + $editor.scrollTop() - edOffset.top + 20); //- edOffset.top+10
                $this.css('left', position.left + (position.width / 2) + $editor.scrollLeft() - edOffset.left );
            }
        );

        this.query="";
        this.propertyDidChange('toolbar');


        const downKeyCommand = {
            str: 'DOWN',
            _ghostName: 'slashdown',
            run() {
                let item = self.get('menuSelectedItem');
                if(item < self.get('toolsLength')-1) {
                    self.set('menuSelectedItem', item + 1);
                    self.propertyDidChange('toolbar');
                }
            }
        };
        editor.registerKeyCommand(downKeyCommand);

        const upKeyCommand = {
            str: 'UP',
            _ghostName: 'slashup',
            run() {
                let item = self.get('menuSelectedItem');
                if(item > 0) {
                    self.set('menuSelectedItem', item - 1);
                    self.propertyDidChange('toolbar');
                }
            }
        };
        editor.registerKeyCommand(upKeyCommand);

        const enterKeyCommand = {
            str: 'ENTER',
            _ghostName: 'slashdown',
            run(postEditor) {

                let range = postEditor.range;

                range.head.offset = self._offset - 1;
                postEditor.deleteRange(range);
                self.get('selectedTool').onClick(self.get('editor'));
                self.close();
            }
        };
        editor.registerKeyCommand(enterKeyCommand);

        const escapeKeyCommand = {
            str: 'ESC',
            _ghostName: 'slashesc',
            run() {
               self.close();
            }
        };
        editor.registerKeyCommand(escapeKeyCommand);
    },
    openFromButton(editor) {
        let self = this;
        let $this = this.$('#slash-menu');
        let $editor = Ember.$('.gh-editor-container');
        let edOffset = $editor.offset();



        let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.

        console.log(this._node, this._offset, range, 'sdsd');//sdsd
        this.isActive = true;

        $this.show();
        let position = Ember.$('#slash-menu-newline').offset();

        Ember.run.schedule('afterRender', this,
            () => {
                $this.css('top', position.top + $editor.scrollTop() - edOffset.top + 50); //- edOffset.top+10
                $this.css('left', position.left + $editor.scrollLeft() - edOffset.left );
            }
        );

        this.query="";
        this.propertyDidChange('toolbar');


        const downKeyCommand = {
            str: 'DOWN',
            _ghostName: 'slashdown',
            run() {
                let item = self.get('menuSelectedItem');
                if(item < self.get('toolsLength')-1) {
                    self.set('menuSelectedItem', item + 1);
                    self.propertyDidChange('toolbar');
                }
            }
        };
        editor.registerKeyCommand(downKeyCommand);

        const upKeyCommand = {
            str: 'UP',
            _ghostName: 'slashup',
            run() {
                let item = self.get('menuSelectedItem');
                if(item > 0) {
                    self.set('menuSelectedItem', item - 1);
                    self.propertyDidChange('toolbar');
                }
            }
        };
        editor.registerKeyCommand(upKeyCommand);

        const enterKeyCommand = {
            str: 'ENTER',
            _ghostName: 'slashdown',
            run(postEditor) {

                let range = postEditor.range;

                range.head.offset = self._offset - 1;
                postEditor.deleteRange(range);
                self.get('selectedTool').onClick(self.get('editor'));
                self.close();
            }
        };
        editor.registerKeyCommand(enterKeyCommand);

        const escapeKeyCommand = {
            str: 'ESC',
            _ghostName: 'slashesc',
            run() {
                self.close();
            }
        };
        editor.registerKeyCommand(escapeKeyCommand);
    },
    actions: {
        newline: function () {
            this.openFromButton(this.editor);
        },
    },
    close() {
        this.isActive = false;

        this.$('#slash-menu').hide();
        // note: below is using a mobiledoc Private API.
        // there is no way to unregister a keycommand when it's registered so we have to remove it ourselves.
        for( let i = this.editor._keyCommands.length-1; i > -1; i--) {
            let keyCommand = this.editor._keyCommands[i];

            if(keyCommand._ghostName === 'slashdown' || keyCommand._ghostName === 'slashup' || keyCommand._ghostName === 'slashenter'|| keyCommand._ghostName === 'slashesc') {
                this.editor._keyCommands.splice(i,1);
            }
        }
    }
});
