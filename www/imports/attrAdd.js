
// addAttr.js
// This allows the user to add new dynamic attributes to the current map.

import React, { Component } from 'react';
import { render } from 'react-dom';
import ReadFile from './ReadFile.jsx'

var dialogHex,
    readFile;

function destroy() {

    dialogHex.hide();
    dialogHex = undefined;
    readFile = undefined;
}

addAsLayers = function (data) {
    
    // Load the data into the shortlist.

    // Find unique names for the attributes.
    var attrNames = _.map(data[0].slice(1), function (origName) {
            return Layer.make_unique_layer_name(origName);
        }),
        dynLayers = {};
    
    // Create the basic layer entry.
    _.each(attrNames, function (name) {
        dynLayers[name] = { data: {}, dynamic: true };
    });
    
    // Load the values in each row.
    _.each(data.slice(1), function (row) {
        var nodeId = row[0];
        _.each(row.slice(1), function (val, i) {
            dynLayers[attrNames[i]].data[nodeId] = val;
        });
    });
    
    // All the layers to our layers global and the shortlist.
    Layer.with_layers(attrNames, function() {}, dynLayers);

    // Remove the busy snake.
    Session.set('mapSnake', false);

    // Destroy this dialogHex.
    destroy();
};

function handleReadStart() {
    Session.set('mapSnake', true);
}

function handleReadError(msg) {
    Session.set('mapSnake', false);
    Util.banner('error', msg);
}

function createWindow() {

    // Create the dialog.

    // Retrieve the html template.
    import '/imports/html/attrAdd.html';
    Blaze.render(Template.attrAddTemplate, $('.content')[0]);
    
    // Attach the html to the page content.
    let $dialog = $('#attrAddDialog');
    $('.content').append($dialog);
    
    // Attach the file reader
    readFile = render(
        <ReadFile
            parseTsv = {true}
            onSuccess = {addAsLayers}
            onStart = {handleReadStart}
            onError = {handleReadError}
        />, $dialog.find('.fileAnchor')[0]);

    // Create a dialog and show it.
    dialogHex = createDialogHex({
        $el: $dialog,
        opts: { title: 'Add Color Attributes' },
        helpAnchor: '/help/addAttr.html',
    });
    dialogHex.show();
     
    // Attach event listeners.
    $dialog.find('.file').change(ReadFile.read);
}

exports.init = function () {
    createWindow();
}
