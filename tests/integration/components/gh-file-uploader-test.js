/* jshint expr:true */
import { expect } from 'chai';
import {
    describeComponent,
    it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
import {createFile, fileUpload} from '../../helpers/file-upload';

const {run} = Ember;

const stubSuccessfulUpload = function (server, delay = 0) {
    server.post('/ghost/api/v0.1/uploads/', function () {
        return [200, {'Content-Type': 'application/json'}, '"/content/images/test.png"'];
    }, delay);
};

const stubFailedUpload = function (server, code, error, delay = 0) {
    server.post('/ghost/api/v0.1/uploads/', function () {
        return [code, {'Content-Type': 'application/json'}, JSON.stringify({
            errors: [{
                errorType: error,
                message: `Error: ${error}`
            }]
        })];
    }, delay);
};

describeComponent(
    'gh-file-uploader',
    'Integration: Component: gh-file-uploader',
    {
        integration: true
    },
    function() {
        let server;

        beforeEach(function () {
            server = new Pretender();
            this.set('uploadUrl', '/ghost/api/v0.1/uploads/');
        });

        afterEach(function () {
            server.shutdown();
        });

        it('renders', function() {
            this.render(hbs`{{gh-file-uploader}}`);

            expect(this.$('label').text().trim(), 'default label')
                .to.equal('Select or drag-and-drop a file');
        });

        it('renders form with supplied label text', function () {
            this.set('labelText', 'My label');
            this.render(hbs`{{gh-file-uploader labelText=labelText}}`);

            expect(this.$('label').text().trim(), 'label')
                .to.equal('My label');
        });

        it('generates request to supplied endpoint', function (done) {
            stubSuccessfulUpload(server);

            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(server.handledRequests.length).to.equal(1);
                expect(server.handledRequests[0].url).to.equal('/ghost/api/v0.1/uploads/');
                done();
            });
        });

        it('fires uploadSuccess action on successful upload', function (done) {
            let uploadSuccess = sinon.spy();
            this.set('uploadSuccess', uploadSuccess);

            stubSuccessfulUpload(server);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadSuccess=(action uploadSuccess)}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(uploadSuccess.calledOnce).to.be.true;
                expect(uploadSuccess.firstCall.args[0]).to.equal('/content/images/test.png');
                done();
            });
        });

        it('doesn\'t fire uploadSuccess action on failed upload', function (done) {
            let uploadSuccess = sinon.spy();
            this.set('uploadSuccess', uploadSuccess);

            stubFailedUpload(server, 500);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadSuccess=(action uploadSuccess)}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(uploadSuccess.calledOnce).to.be.false;
                done();
            });
        });

        it('fires uploadStarted action on upload start', function (done) {
            let uploadStarted = sinon.spy();
            this.set('uploadStarted', uploadStarted);

            stubSuccessfulUpload(server);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadStarted=(action uploadStarted)}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(uploadStarted.calledOnce).to.be.true;
                done();
            });
        });

        it('fires uploadFinished action on successful upload', function (done) {
            let uploadFinished = sinon.spy();
            this.set('uploadFinished', uploadFinished);

            stubSuccessfulUpload(server);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadFinished=(action uploadFinished)}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(uploadFinished.calledOnce).to.be.true;
                done();
            });
        });

        it('fires uploadFinished action on failed upload', function (done) {
            let uploadFinished = sinon.spy();
            this.set('uploadFinished', uploadFinished);

            stubFailedUpload(server);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadFinished=(action uploadFinished)}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(uploadFinished.calledOnce).to.be.true;
                done();
            });
        });

        it('displays invalid file type error', function (done) {
            stubFailedUpload(server, 415, 'UnsupportedMediaTypeError');
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(this.$('.failed').length, 'error message is displayed').to.equal(1);
                expect(this.$('.failed').text()).to.match(/The file type you uploaded is not supported/);
                expect(this.$('.btn-green').length, 'reset button is displayed').to.equal(1);
                expect(this.$('.btn-green').text()).to.equal('Try Again');
                done();
            });
        });

        it('displays file too large for server error', function (done) {
            stubFailedUpload(server, 413, 'RequestEntityTooLargeError');
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(this.$('.failed').length, 'error message is displayed').to.equal(1);
                expect(this.$('.failed').text()).to.match(/The file you uploaded was larger/);
                done();
            });
        });

        it('handles file too large error directly from the web server', function (done) {
            server.post('/ghost/api/v0.1/uploads/', function () {
                return [413, {}, ''];
            });
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(this.$('.failed').length, 'error message is displayed').to.equal(1);
                expect(this.$('.failed').text()).to.match(/The file you uploaded was larger/);
                done();
            });
        });

        it('displays other server-side error with message', function (done) {
            stubFailedUpload(server, 400, 'UnknownError');
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(this.$('.failed').length, 'error message is displayed').to.equal(1);
                expect(this.$('.failed').text()).to.match(/Error: UnknownError/);
                done();
            });
        });

        it('handles unknown failure', function (done) {
            server.post('/ghost/api/v0.1/uploads/', function () {
                return [500, {'Content-Type': 'application/json'}, ''];
            });
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                expect(this.$('.failed').length, 'error message is displayed').to.equal(1);
                expect(this.$('.failed').text()).to.match(/Something went wrong/);
                done();
            });
        });

        it('can be reset after a failed upload', function (done) {
            stubFailedUpload(server, 400, 'UnknownError');
            this.render(hbs`{{gh-file-uploader url=uploadUrl}}`);
            fileUpload(this.$('input[type="file"]'));

            wait().then(() => {
                run(() => {
                    this.$('.btn-green').click();
                });
            });

            wait().then(() => {
                expect(this.$('input[type="file"]').length).to.equal(1);
                done();
            });
        });

        it('displays upload progress', function (done) {
            this.set('done', done);

            // pretender fires a progress event every 50ms
            stubSuccessfulUpload(server, 150);

            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadFinished=(action done)}}`);
            fileUpload(this.$('input[type="file"]'));

            // after 75ms we should have had one progress event
            run.later(this, function () {
                expect(this.$('.progress .bar').length).to.equal(1);
                let [_, percentageWidth] = this.$('.progress .bar').attr('style').match(/width: (\d+)%?/);
                expect(percentageWidth).to.be.above(0);
                expect(percentageWidth).to.be.below(100);
            }, 75);
        });

        it('handles drag over/leave', function () {
            this.render(hbs`{{gh-file-uploader}}`);

            run(() => {
                let dragover = Ember.$.Event('dragover', {
                    dataTransfer: {
                        files: []
                    }
                });
                this.$('.gh-image-uploader').trigger(dragover);
            });

            expect(this.$('.gh-image-uploader').hasClass('--drag-over'), 'has drag-over class').to.be.true;

            run(() => {
                this.$('.gh-image-uploader').trigger('dragleave');
            });

            expect(this.$('.gh-image-uploader').hasClass('--drag-over'), 'has drag-over class').to.be.false;
        });

        it('triggers file upload on file drop', function (done) {
            let uploadSuccess = sinon.spy();
            let drop = Ember.$.Event('drop', {
                dataTransfer: {
                    files: [createFile()]
                }
            });

            this.set('uploadSuccess', uploadSuccess);

            stubSuccessfulUpload(server);
            this.render(hbs`{{gh-file-uploader url=uploadUrl uploadSuccess=(action uploadSuccess)}}`);

            run(() => {
                this.$('.gh-image-uploader').trigger(drop);
            });

            wait().then(() => {
                expect(uploadSuccess.calledOnce).to.be.true;
                expect(uploadSuccess.firstCall.args[0]).to.equal('/content/images/test.png');
                done();
            });
        });
    }
);
