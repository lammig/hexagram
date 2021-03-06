// utils.js
// This contains the logic for retrieving the mutual information stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    round = function (x, n) {
        if (!n) {
            n = 0;
        }
        var m = Math.pow(10, n);
        return Math.round(x * m) / m;
    }

    getHumanProject = function (project) {
 
        // Transform a project from dir structure to display for humans
        return project.slice(0, -1);
	};

    projectNotFound = function (filename) {
        if (!ctx.projectNotFoundNotified) {

            // make the project name look it would in the URL & alert the user
            var proj = ctx.project.slice(5, -1).replace('/', '.');
            alert('"' + proj
                + '" does not seem to be a valid project.\nPlease select another.'
                + '\n(' + filename + ')');
            ctx.projectNotFoundNotified = true;
        }
    }

    banner = function (type, text) {
        // The type should be one of: info, error, warn, stay

        // Display a temporary message to the user on a banner.
        $("#banner")
            .removeClass('info warn error stay')
            .addClass(type)
            .text(text)
            .show();

        if (type === 'warn' || type === 'info') {
            $("#banner").delay(1250).fadeOut(1500);
        } else if (type === 'error') {
            $("#banner").delay(2500).fadeOut(1500);
        }

        // Also inform the browser console of this issue.
        console.log(type + ':', text);
    }

    tsvParseRows = function (tsv_data) {

        // Even though the retrieved file has no new line or carriage return,
        // the browser inserts '\n\r' at the end of the file. So, remove any
        // trailing new line and carriage return so that we don't end up with
        // an extra empty row.

        if (tsv_data.lastIndexOf('\n') === tsv_data.length - 1) {
            tsv_data = tsv_data.slice(0, -1);
        }

        // Remove any trailing microslop carriage return
        if (tsv_data.lastIndexOf('\r') === tsv_data.length - 1) {
            tsv_data = tsv_data.slice(0, -1);
        }
        return $.tsv.parseRows(tsv_data);
    }

    removeFromDataTypeList = function (layer_name) {

        // Remove this layer from the appropriate data type list
        var index = ctx.bin_layers.indexOf(layer_name);
        if (index > -1) {
            ctx.bin_layers.splice(index, 1);
        } else {
            index = ctx.cat_layers.indexOf(layer_name);
            if (index > -1) {
                ctx.cat_layers.splice(index, 1);
            } else {
                index = ctx.cont_layers.indexOf(layer_name);
                if (index > -1) {
                    ctx.cont_layers.splice(index, 1);
                }
            }
        }
    }

    addToDataTypeList = function (name, data) {
        //
        // @param name: the name of the layer
        // @param data: an array of values for the layer

        // Skip any layers with no values.
        if (data.length < 1) return;

        // Initialize our process-of-elimination vars
        var can_be_binary = true,
            can_be_categorical = true;

        // Loop through the data until we have determined the data type
        _.find(data, function (value) {
            if (value % 1 !== 0) {

                // It is continuous (fractional)
                can_be_binary = false;
                can_be_categorical = false;
                return true;

            } else if (value > 1 || value < 0) {

                // It's not binary, but it could still be either continuous
                // or categorical.
                can_be_binary = false;
                return true;
            } else {
                return false;
            }
        });
        
        if (can_be_binary) {

            // We're done, and nothing rules out it being binary
            // TODO this is capturing layers with NaN?
            ctx.bin_layers.push(name);

        } else if (can_be_categorical) {

            // It's not binary and we didn't hit a continuous float value
            // TODO we could have continous values which happen to be integers.
            // For now those types will be misplaced as categorical
            ctx.cat_layers.push(name);
        } else {
            // It is not binary or categorical, so it is continuous
            ctx.cont_layers.push(name);
        }
    }

    setHeightSelect2 = function ($el) {
 
        // Make the bottom of the list no longer than the main window
        $el.parent().on('select2-open', function () {
            var results = $('#select2-drop .select2-results');
            results.css('max-height', $(window).height() - results.offset().top - 15);
        });
    }

    createOurSelect2 = function ($el, optsIn, defaultSelection) {
 
        // Create a select2 drop-down.

        // Including our favorite options
        var opts = {
            dropdownAutoWidth: true,
            minimumResultsForSearch: -1,
        }

        // The caller's options override our favorite options
        for (var key in optsIn) {
            if (optsIn.hasOwnProperty(key)) {
                opts[key] = optsIn[key];
            }
        };

        // Createe the select2 object
        $el.select2(opts);

        // Set the default selection
        if (defaultSelection) {
            $el.select2('val', defaultSelection);
        }

        setHeightSelect2($el);
    }
})(app);

