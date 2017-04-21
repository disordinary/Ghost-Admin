/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import {editorRendered, waitForRender, inputText, timeoutPromise} from '../../helpers/editor-helpers';
import $ from 'jquery';

describe('Integration: Component: gh-koenig-plusmenu', function () {
    setupComponentTest('gh-koenig', {
        integration: true
    });
    beforeEach(function () {
        this.set('value', {
            version: '0.3.1',
            atoms: [],
            markups: [],
            cards: [],
            sections: []});
    });

    it('the slash menu appears on user input', function (done) {
        this.render(hbs`{{gh-koenig
                            apiRoot='/todo'
                            assetPath='/assets'
                            containerSelector='.editor-holder'
                            value=value
                        }}`);

        editorRendered()
            .then(() => {
                let {editor} = window;
                editor.element.focus();
                inputText(editor, '/');
                return waitForRender('.gh-cardmenu');
            })
            .then(() => {
                let cardMenu = $('.gh-cardmenu');
                expect(cardMenu.children().length).to.equal(7);
                done();
            });
    });

    it('the plus menu appears on click', function (done) {
        this.render(hbs`{{gh-koenig
                            apiRoot='/todo'
                            assetPath='/assets'
                            containerSelector='.editor-holder'
                            value=value
                        }}`);

        editorRendered()
            .then(() => {
                let {editor} = window;
                editor.element.focus();

                return waitForRender('.gh-cardmenu-button');
            }).then(() => {
                done();
            });

    });
});
