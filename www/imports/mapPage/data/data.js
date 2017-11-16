/**
 * Retrieve data.
 */

import Ajax from '/imports/mapPage/data/ajax.js';
import Perform from '/imports/common/perform.js';
import rx from '/imports/common/rx.js';
import Util from '/imports/common/util.js';

function request (id, opts) {

    // Retrieve a data file via ajax.
    // @param id: the identifier for this data (file)
    // @param successFx: function to call on success
    // @param rxAction; optional state action to take on success
    // @param stateVar; optional state variable to set to true on success
    Perform.log(id + '.tab_requested');
    if (_.isUndefined(opts)) {
        opts = {};
    }
    var aOpts = {
        id: id,
        success: function (results) {
            Perform.log(id + '.tab_got');
            if (opts.successFx) {
                opts.successFx(results, id);
            }
            if (opts.rxAction) {
                rx.set(opts.rxAction);
            } else if (opts.stateVar) {
                Session.set(opts.stateVar, true);
            }
        },
        error: function (error) {
            if (opts.errorFx) {
                opts.errorFx(error);
            } else {
                Util.projectNotFound(id);
            }
        },
    };
    if (opts.ok404) {
        aOpts.ok404 = true;
    }
    Ajax.get(aOpts);
}

exports.requestStats = function (id, opts) {
    opts.ok404 = true;
    request(id, opts);
};

exports.requestMapMeta = function (opts) {

    // Request the metadata within the map minor data.
    import Tool from '/imports/mapPage/head/tool.js';
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || Tool.receiveMapMetadata;
    opts.errorFx = opts.errorFx || Tool.requestMapMetadataError;
    request('mapMeta', opts);
};

exports.requestAttributeTags = function (opts) {
    import Filter from '/imports/mapPage/longlist/filter.js';
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || Filter.receiveLayerTags;
    opts.errorFx = opts.errorFx || Filter.requestLayerTagsError;
    request('attribute_tags', opts);
};

exports.requestLayoutNames = function (opts) {
    import Layout from '/imports/mapPage/head/layout.js';

    // This may have been requested already if a layout name was supplied,
    // but no layout index.
    if (rx.get(rx.INIT_APP_LAYOUT_NAMES_REQUESTED)) {
        return;
    }
    rx.set(rx.act.INIT_APP_LAYOUT_NAMES_REQUESTED);
    opts.successFx = opts.successFx || Layout.layoutNamesReceived;
    opts.ok404 = true;
    request('layouts', opts);
};

exports.requestColormaps = function (opts) {
    import Hexagram from '/imports/mapPage/viewport/hexagram.js';
    opts.successFx = opts.successFx || Hexagram.colormapsReceived;
    request('colormaps', opts);
};

exports.requestLayer = function (id, opts) {
    request(id, opts);
};

exports.requestDataTypes = function (opts) {
    import Longlist from '/imports/mapPage/longlist/longlist.js';
    opts.successFx = opts.successFx || Longlist.layerTypesReceived;
    request('Layer_Data_Types', opts);
};

exports.requestLayerSummary = function (opts) {
    import Longlist from '/imports/mapPage/longlist/longlist.js';
    opts.successFx = opts.successFx || Longlist.layerSummaryLoaded;
    request('layers', opts);
};

exports.requestLayoutAssignments = function (opts) {
    import Hexagons from '/imports/mapPage/viewport/hexagons.js';
    var index = Session.get('layoutIndex');
    
    // If no layout index was supplied ...
    if (_.isUndefined(index)) {
    
        // If a layout name was supplied (in the url) ...
        if (Session.get('layoutName')) {
        
            // A layout name was supplied, so we need to get the layout list
            // before we know the layout index to download layout node placement
            exports.requestLayoutNames(
                { rxAction: rx.act.INIT_APP_LAYOUT_NAMES_RECEIVED });
            return;
        } else {
            // Default to the first layout.
            index = 0;
            Session.set('layoutIndex', 0);
        }
    }
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.successFx = opts.successFx || Hexagons.layoutAssignmentsReceived;
    request((Session.get('mapView') === 'honeycomb' ? 'assignments' :
        'xyPreSquiggle_') + index, opts);
};
