// sort.js
// This contains the logic for retrieving the layout-aware and layout-ignore
// sort attribute stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    var computingText = 'Computing statistics now...';

    function finalCompare(a, b) {

        // After the other compares, do these last compares for all sorts.
        // Compare clumpiness,
        // then alphabetically by name if all else fails.

        // By clumpiness
        if(layers[a].clumpiness > layers[b].clumpiness) {
            // a has a higher clumpiness score, so put it first.
            return -1;
        } else if(layers[b].clumpiness > layers[a].clumpiness) {
            // b has a higher clumpiness score. Put it first instead.
            return 1;
        } else if(isNaN(layers[b].clumpiness) && !isNaN(layers[a].clumpiness)) {
            // a has a clumpiness score and b doesn't, so put a first
            return -1;
        } else if(!isNaN(layers[b].clumpiness) && isNaN(layers[a].clumpiness)) {
            // b has a clumpiness score and a doesn't, so put b first.
            return 1;
        }			

        // Use lexicographic ordering on the name
        return a.localeCompare(b);
    }

    function variableCompare(a, b, v) {

        // Compare the variable: 'v'

        if(layers[a][v] < layers[b][v]) {
            // a has a lower value, so put it first.
            return -1;
        } else if(layers[b][v] < layers[a][v]) {
            // b has a lower value. Put it first instead.
            return 1;
        } else if(isNaN(layers[b][v]) && !isNaN(layers[a][v])) {
            // a has a value and b doesn't, so put a first
            return -1;
        } else if(!isNaN(layers[b][v]) && isNaN(layers[a][v])) {
            // b has a value and a doesn't, so put b first.
            return 1;
        }
        return 0
    }

    function pValueCompare(a, b) {

        // Compare p_values, then do the final compare
        
        var result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function differentialCompare(a, b) {

        // Compare  differential values, then do the final compare
        
        var result = variableCompare(a, b, 'Differential');
        if (result !== 0) return result;

        return finalCompare(a, b);
    }

    function correlationCompare(a, b, pos) {

        // Compare correlation sign, then p-value, then do the final compare

        // Compare correlation signs with positives first or negatives first,
        // depending on pos, where true indicates positive, false negative
        var aSign = layers[a].correlation < 0 ? -1 : 1,
            bSign = layers[b].correlation < 0 ? -1 : 1;

        if (aSign < bSign && pos) {
            return 1;
        } else if (bSign < aSign && pos) {
            return -1
        } else if (aSign < bSign && !pos) {
            return -1;
        } else if (bSign < aSign && !pos) {
            return 1
        }

        // Compare p_values
        result = variableCompare(a, b, 'p_value');
        if (result !== 0) return result;

        // The final compare
        return finalCompare(a, b);
    }

    function positiveCorrelationCompare(a, b) {

        return correlationCompare(a, b, true);
    }

    function negativeCorrelationCompare(a, b) {

        return correlationCompare(a, b, false);
    }

    sort_layers = function  (layer_array) {

        // Given an array of layer names, sort the array in place as we want
        // layers to appear to the user.

        /*
        The compare order of sorts:
        - sort options are optional and one of:
            - ignore layout: by p-value in ascending order
            - layout-aware positive: by positive correlation sign first, then p-value
            - layout-aware negative: by negative correlation sign first, then p-value
        - by clumpiness/density
        - alphabetically

        The compare functions return the usual values:
            <0 if A belongs before B
            >0 if A belongs after B
            0 if equal or their order doesn't matter
        */

        var type_value = Session.get('sort').type;

        if (layer_array.length === 0) return;

        if (type_value == "layout-aware-positive") {
            layer_array.sort(positiveCorrelationCompare);

        } else if (type_value == "layout-aware-negative") {
            layer_array.sort(negativeCorrelationCompare);

        } else if (type_value == "p_value") {
            layer_array.sort(pValueCompare);

        } else if (type_value == "Differential") {
            layer_array.sort(differentialCompare);

        } else {
            // The default sort, by density/clumpiness
            layer_array.sort(finalCompare);
            
            if (!_.isUndefined(ctx.first_layer)) {

                // move the 'First' attribute to the top
                layer_array.splice(layer_array.indexOf(ctx.first_layer), 1);
                layer_array.unshift(ctx.first_layer);
            }
        }
    }

    clearStats = function () {

        // Clear stats for each layer before updating with the new stats
        for (var layer_name in layers) {
            delete layers[layer_name].clumpiness;
            delete layers[layer_name].p_value;
            delete layers[layer_name].correlation;
         }
    }

    updateUi = function (type, text, focus_attr, opts) {

        // If we were computing dynamic stats,
        // include the elapsed time in the banner
        var elapsed = '';
        if (opts && opts.hasOwnProperty('startDate')
            && $("#banner").text() === computingText) {
            var endDate = new Date;
            elapsed = ' ('
                + Math.ceil((endDate.getTime() - opts.startDate.getTime()) / 1000)
                + ' secs)';
        }

        // Set the sort properties and update the UI to sort them
        if (type === 'default') {
            Session.set('sort', ctx.defaultSort());
            text = Session.get('sort').text;

        } else if (type === 'noStats') {
            text = 'None, due to no statistical results';
            Session.set('sort', {text: text, type: 'noStats',
                focus_attr: focus_attr});
        } else {

            Session.set('sort', {text: text, type: type,
                focus_attr: focus_attr});
        }
        update_browse_ui();
        update_shortlist_ui();
        banner('info', 'Now sorted by ' + text + elapsed);
    }

    function updateLayerStat (focus_attr, layer, value, statType) {

        // We don't want to load the value if it is the focus layer.
        // This will keep the focus attribute out of the sort.
        if (layer !== focus_attr && !isNaN(value)) {
            layers[layer][statType] = parseFloat(value);
            return 1; // To increment the count
        }
        return 0; // Don't increment the count
    }

    function receive_ignore_layout_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for ignore-layout sort statistics
        var count = 0,
            type = (opts.hasOwnProperty('isDiffStats')) ? 'Differential' : 'p_value' ;
        if (parsed.length === 2 && parsed[0].length > 3) {

            // This is from a pre-computed file, so it is of the form:
            // [
            //      [layerName1, layerName2, ...],
            //      [value1, value2, ...]
            // ]
            for (var i = 0; i < parsed[0].length; i++) {
                count += updateLayerStat(focus_attr, parsed[0][i], parsed[1][i],
                    type);
            }
        } else {

            // These stats were not pre-computed, so it is of the form:
            // [
            //      [layerName1, layerName2, value2],
            //      [layerName1, layerName3, value3],
            //      ...
            // ]
            // The first element of each row is the focus layer name
            // which we already know, so ignore it.
            for (var i = 0; i < parsed.length; i++) {

                // Extract the layer name
                // to which the selected layer is being compared against.
                var compare_layer_name = parsed[i][1];

                // Extract the value
                count += updateLayerStat(focus_attr, compare_layer_name,
                    parsed[i][2], type);
            }

        }
        // Now we're done loading the stats, update the sort properties
        if (count < 1) {
            updateUi('noStats');
        } else {
            var text = (type === 'p_value')
                ? 'P-value by: ' + focus_attr + ' (ignoring layout)'
                : 'Differential by: ' + focus_attr;
            updateUi(type, text, focus_attr, opts);
        }
    }

    function receive_layout_aware_stats (parsed, focus_attr, opts) {

        // Handle the response from the server for layout-aware sort statistics

        // We have layout-aware stats parsed in the form:
        // [
        //      [layerName1, r-value1, p-value1],
        //      [layerName2, r-value2, p-value2],
        //      ...
        // ]
        var count = 0;
        for (var i = 0; i < parsed.length; i++) {

            // First element of each row is the layer name
            // to which the selected layer is being compared against.
            var compare_layer_name = parsed[i][0],
                r_value = parseFloat(parsed[i][1]),
                p_value = parseFloat(parsed[i][2]);

            // Save the stats for this layer against the focus layer.
            if (!isNaN(r_value) && !isNaN(p_value)) {
                layers[compare_layer_name].correlation = r_value;
                layers[compare_layer_name].p_value = p_value;
                count += 1;
            }
        }

        if (count > 0) {
            // Now we're done loading the stats, update the sort properties
            var corr = 'correlation',
                type = 'layout-aware-positive';
            if (opts.anticorrelated) {
                corr = 'anticorrelation';
                type = 'layout-aware-negative';
            }
            var text = 'Layout-aware ' + corr + ' with: ' + focus_attr;

            updateUi(type, text, focus_attr, opts);
        } else {
            updateUi('noStats');
        }
    }

    function receive_data (parsed, focus_attr, opts) {

        // Handle the response from the server for sort statistics

        // Clear the stats in the layers before loading new ones
        clearStats();

        if (opts.hasOwnProperty('layout')) {

            // Layout-aware stats
            receive_layout_aware_stats (parsed, focus_attr, opts)

        } else {

            // Layout-ignore stats or diff stats
            receive_ignore_layout_stats (parsed, focus_attr, opts)
        }
    }

    find_clumpiness_stats = function (layout) {

        // Reset the sort to the default of density
        clearStats();

        // Set the clumpiness scores for all layers to the appropriate values for
        // the given layout index. Just pulls from each layer's clumpiness_array
        // field.
        var layer;
        var count = 0;
        for (var i = 0; i < ctx.layer_names_sorted.length; i++) {
            // For each layer
            
            // Get the layer object
            layer = layers[ctx.layer_names_sorted[i]];

            if (!_.isUndefined(layer.clumpiness_array)) {

                // We have a set of clumpiness scores for this layer.
                // Switch the layer to the appropriate clumpiness score.
                if (!_.isNaN(layer.clumpiness_array[layout])) {
                    layer.clumpiness = layer.clumpiness_array[layout];
                    count += 1;
                }
            }
        }

        if (count > 0) {
            updateUi('default');
        } else {
            updateUi('none', 'None, due to no density stats', 'none');
        }
    }

    getDynamicStats = function (focus_attr, opts) {

        // This is a dynamically-generated attribute or a request because
        // the stats were not precomputed

        // Set up common parameters between layout-aware and -ignore
        opts.layerA = focus_attr;
        opts.layerIndex = ctx.layer_names_by_index.indexOf(focus_attr);
        opts.directory = ctx.project;
        opts.proxPre = Session.get('proxPre');

        // Gather the data for user-selection attributes
        if (!opts.hasOwnProperty('dynamicData')) opts.dynamicData = {};
        var layer;
        for (var i = 0; i < ctx.bin_layers.length; i++) {
            layer = ctx.bin_layers[i];
            if (layers[layer].hasOwnProperty('selection')) {
                opts.dynamicData[layer] = layers[layer].data;
            }
        }

        opts.startDate = new Date();
        Meteor.call('pythonCall', 'statsSortLayer', opts,
            function (error, result) {
                if (error) {
                    banner('error', error);
                } else if (result.slice(0,5) === 'Error') {
                    banner('error', result);
                } else if (result.slice(0,4) === 'Info') {
                    banner('info', result);
                } else {
                    receive_data(JSON.parse(result), focus_attr, opts);
                }
            }
        );
    }

    getPreComputedStats = function (filename, focus_attr, opts) {

        // Retrieve the precomputed stats file from the server
        print("Fetching " + filename);

        $.get(filename, function(tsv_data) {

            var parsed = tsvParseRows(tsv_data);

            if (fileNotFound(parsed[0][0])) {
                banner('stay', computingText);
                getDynamicStats(focus_attr, opts);
                return;
            }
            receive_data(parsed, focus_attr, opts);
        }, "text");
    }

    get_layout_ignore_stats = function (focus_attr) {

        // Retrieve the layer's layout-ignore values

        // Save the data types lists to the options
        opts = {
            statsLayers: ctx.bin_layers.concat(ctx.cat_layers.concat(ctx.cont_layers)),
            binLayers: ctx.bin_layers,
            catLayers: ctx.cat_layers,
            contLayers: ctx.cont_layers,
        }

        if (layers[focus_attr].hasOwnProperty('selection')) {

            // This is a user-selection attribute
            banner('stay', computingText);
            getDynamicStats(focus_attr, opts);

        } else {
            // This is a primary attribute, so check for pre-computed stats
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "stats_" + layer_index + ".tab";

            getPreComputedStats(filename, focus_attr, opts);
        }
    }

    get_diff_stats = function (focus_attr, focus_attr2) {

        // Calc the differential stats on the server
        var first = true,
            hexnames1,
            hexnames2,
            vals,
            fill,
            obj = {}
            diffData = {};

        // Create a new selection attribute from the one values of each layer
        _.each([focus_attr, focus_attr2], function (attr) {

            // Create an array which contains hexagon names where the value is
            //      one, and zero where the value is zero
            hexnames2 = _.map(layers[attr].data, function(val, name) {
                return (val > 0) ? name : 0;
            });

            // Filter out the zeros from the array to get an array of
            // hexagon names
            hexnames2 = _.filter(hexnames2, function (name) {
                return name !== 0;
            });

            // Create a zero- or one-filled array.
            if (first) {
                hexnames1 = [].concat(hexnames2); // a copy
                fill = 0;
                first = false;
            } else {
                fill = 1;
            }
            vals = Array.apply(null,
                Array(hexnames2.length)).map(Number.prototype.valueOf, fill);

            // Create an object of hexagon names as properties with the value
            // representing this user selection
            obj = _.object(hexnames2, vals);

            // Add these hexagons names and their values to a new object
            for (var name in obj) { diffData[name] = obj[name]; }
        });

        // If there are any overlapping hexagons between the two layers
        // we can't do this stat
        if (_.intersection(hexnames1, hexnames2).length > 0) {
            return 'Stats cannot be computed due to overlap of '
                + 'hexagons between the two attributes';
        }

        // Treat this as a selection layer and run the stats
        banner('stay', computingText);
        var diffLayer = focus_attr + ' & ' + focus_attr2;
        opts = {
            isDiffStats: 'yes',
            statsLayers: ctx.bin_layers.concat(ctx.cat_layers.concat(ctx.cont_layers.concat(diffLayer))),
            binLayers: ctx.bin_layers.concat(diffLayer),
            catLayers: ctx.cat_layers,
            contLayers: ctx.cont_layers,
            dynamicData: {},
        }
        opts.dynamicData[diffLayer] = diffData;
        getDynamicStats(diffLayer, opts);

        return undefined;
    }

    get_layout_aware_stats = function (layout_index, focus_attr, anticorrelated) {

        // Retrieve the layer's layout-aware values

        // Save the layout index and anticorrelated flag to the options
        var opts = {
            statsLayers: ctx.bin_layers,
            layout: layout_index,
            anticorrelated: anticorrelated,
        };

        if (layers[focus_attr].hasOwnProperty('selection')) {

            // This is a user-selection attribute
            banner('stay', computingText);
            getDynamicStats(focus_attr, opts);

        } else {
            // This is a primary attribute, so check for pre-computed stats
            var layer_index = ctx.layer_names_by_index.indexOf(focus_attr),
                filename = ctx.project + "statsL_"+ layer_index + "_" +
                    layout_index + ".tab";

            getPreComputedStats(filename, focus_attr, opts);
        }
    }
})(app);

