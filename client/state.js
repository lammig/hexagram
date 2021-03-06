// state.js
// An object to write and load state

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    // Global across this app
    DISABLED_COLOR = '#aaaaaa';

    var DEFAULT_PAGE = 'homePage',
        DEFAULT_PROJECT = 'Gliomas/',
        DEFAULT_SORT = {
            text: 'Density of attributes',
            type: 'default',
            focus_attr: null,
            color: 'inherit',
            background: 'inherit',
        };
 
    function getUrlParms() {
        var parms = location.search.substr(1);
        var result = {};
        var found = false;
        parms.split("&").forEach(function(part) {
            if (part !== "") {
                var item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
                found = true;
            }
        });
        if (found) {
            return result;
        } else {
            return null;
        }
    }

    State = function() {

        // The state stores the values used across modules for different
        // purposes. These may belong to this object or to the reactive meteor
        // Session. Eventually maybe all of this object's vars will be migrated
        // to meteor Session vars.
        //
        //      - localStorage: persist for the duration of the browser tab
        //          session, that is, they remain as long as the browser tab
        //          is used and not closed. These are written to the browser's
        //          localStorage
        //
        //          - project localStorage: a subset that are cleared when the
        //              project changes because they may not apply to the new
        //              project
        //
        //      - other: persist for this page load only, and are not saved to
        //          localStorage. Some of these belong to this object and some to
        //          the reactive meteor Session. Not all of these vars are
        //          initialized here, but in their respective file
        //          initialization functions

        var s = this;

        s.defaultProject = DEFAULT_PROJECT;

        // Keep localStore of different servers separate
        s.storeName = location.host + '-hexMapState';
 
        // Pull out any parameters in the URL
        s.uParm = getUrlParms();

        s.localStorage = {
            // Contains all of the non-project state we want to save
            all: [
                'page',
                'project',
                'viewEdges',
                'viewWindows',
            ],

            // Contains all of the project state we want to save
            project: [
                'background',
                'center',
                'first_layer',
                'gridCenter',
                'gridZoom',
                'layoutIndex',
                'overlayNodes',
                //'layouts', // We use this for a project, but don't save it
                'shortlist',
                'zoom',
            ],
        }
        s.localStorage.known = s.localStorage.all.concat(s.localStorage.project);
        s.alreadySaved = false;

        // Non-project variables maintained in the meteor session
        Session.setDefault('page', DEFAULT_PAGE);
        Session.setDefault('sort', DEFAULT_SORT); // Default sort message & type
        Session.setDefault('viewEdges', false); // Display of directed graph or not
        Session.setDefault('viewWindows', false); // Display of stats windows or not
        Session.set('firstSort', true);

        // Variables maintained in this state object, with defaults.
        s.project = DEFAULT_PROJECT;  // The project data to load
    }

    State.prototype.defaultProject = function () {
        return s.defaultProject;
    };

    State.prototype.defaultSort = function () {
        return DEFAULT_SORT
    };

    State.prototype.setProjectDefaults = function () {
        var s = this;

        // Project variables maintaineds in this state object, with defaults.
        Session.setDefault('background', 'black');  // Visualization background color
        s.center = null; // google map center
        Session.set('first_layer', undefined); // first to be displayed in shortlist
        s.gridCenter = null; // grid map center
        s.gridZoom = 2;  // Zoom level of the grid
        Session.set('layouts', []);  // Map layouts maintained in order of entry
        Session.set('layoutIndex', null);
        //Session.set('overlayNodes', undefined);  // overlay nodes to include
        Session.set('shortlist', []); // Array of layer names in the shortlist
        s.zoom = 2;  // Map zoom level where 2 means zoomed in by 2 levels
    }

    State.prototype.save = function (newProject) {
 
        // Save state by writing it to local browser store.
        // newProject is optional.
        var s = this,
            store = {},
            index,
            isNewProject = !_.isUndefined(newProject);

        if (s.alreadySaved) {
            return;
        }
        s.alreadySaved = true;

        // If we have a new project, clear any state related to the old project
        if (isNewProject) {
            Session.set('page', 'mapPage');
            s.project = newProject;
            s.setProjectDefaults();
        }

        // Find all of the vars to be saved by walking though our localStorage list
        _.each(s.localStorage.known, function (key) {

            // If this is a Session var we want to store it there
            if (!Session.equals(key, undefined)) {
                store[key] = Session.get(key);

            // If this var belongs to this ctx object we want to store it here
            } else if (!_.isUndefined(s[key]) && !_.isNull(s[key])) {
                if (key === 'center') {
                    s.center = centerToArray(s.center);
                } else if (key === 'gridCenter') {
                    s.gridCenter = centerToArray(s.gridCenter);
                }
                store[key] = s[key];
            // This var has no value to store
            } else {
                return;
            }
        });

        // Overwrite the previous state in localStorage
        window['localStorage'].removeItem(s.storeName);
        window['localStorage'].setItem(s.storeName, JSON.stringify(store));
 
        //console.log('save store:', store);
    };
 
    State.prototype.load = function (store) {
 
        //console.log('load store:', store);

        // Walk through the saved state loading anything we recognize
        var s = this;
        _.each(store, function (val, key) {

            // Skip those we don't know
            if (s.localStorage.known.indexOf(key) < 0) {
                return;
            }
            
            // Load this object's vars into this state if maintained in this
            // state rather than in a Session var
            if (!_.isUndefined(s[key])) {
                s[key] = val;

            // Otherwise assume this is a Session var and load it into there
            } else {
                Session.set(key, val);
            }
        });
    };
 
    State.prototype.loadFromBookmark = function (bookmark) {
 
        // Load state from the given bookmark
        var s = this;

        Meteor.call('findBookmark', bookmark,
            function (error, result) {
                if (error) {
                    banner('error', error);
                    return;
                }
                
                var store = result.jsonState;
                if (store === null) {
                    console.log("No saved state found, so using defaults.");
                } else {
                    s.load(store);
                }
                s.projectNotFoundNotified = false;
            }
        );
    };
 
    State.prototype.loadFromLocalStore = function () {

        // Load state from local store
        var s = this,
            store = JSON.parse(window['localStorage'].getItem(s.storeName));
        if (store === null) {
            console.log("No saved state found, so using defaults.");

        } else {
            s.load(store);
        }
        
        // TODO a hack until bookmarks are going
        Session.set('overlayNodes', undefined);  // overlay nodes to include
    };

    State.prototype.fixUpOldUrls = function (project) {
 
        var xlate = {
            'evanPaull/pCHIPS/': 'pCHIPS/',
            'ynewton/gliomas-paper/': 'Gliomas/',
        }
 
        // Fix up some project names that we've aleady given out to people
        // before reorganizing projects and implementing logins
        if (xlate[project]) {
            project = xlate[project]
        }
        return project;
    };
 
    State.prototype.loadFromUrl = function () {
 
        // Load state from parameters in the url
        var s = this;
        var state = {};
 
        // Find the project if one was included in the URL,
        // replacing every '.' with '/'
        if (s.uParm.p) {
            state.project
                = s.uParm.p.replace(/\./g, '/')
                + '/';
 
            // A project in a url means someone wants to see a particular map
            state.page = 'mapPage';
 
            // Find any overlay node in the URL
            if (s.uParm.x && s.uParm.y) {
                if (!s.uParm.node) {
                    s.uParm.node = 'x';
                }
                state.overlayNodes = {}
                state.overlayNodes[s.uParm.node] = {x: s.uParm.x, y: s.uParm.y};
     
            // TODO a special hack until we get bookmarks going: load
            // the hard-coded overlay node data specific to this project
            } else if (state.project.slice(0,13) === 'CKCC/v1-') {
      
                var node = state.project.slice(13,-1);
                if (OVERLAY_NODES[node]) {
                    state.overlayNodes = {};
                    state.overlayNodes[node] = OVERLAY_NODES[node];
                }
            } else {
 
                // Fix up any old URLs we gave out
                state.project = s.fixUpOldUrls(state.project);
            }
 
            s.load(state);
        }
    };

    function checkLocalStore () {

        // Check to see if browser supports HTML5 Store
        // Any modern browser should pass.
        // TODO if a browser does not support this, there is no way for a user
        // to change projects. Project could be passed in the URL
        try {
            "localStorage" in window && window["localStorage"] !== null;
        } catch (e) {
            banner('warn', "Browser does not support local storage.");
            return false;
        }
        return true;
    }

    function initDocs () {
 
        // Show query API doc menu option if user is in dev or CKCC role.
        Meteor.call('isUserInRole', ['dev', 'queryAPI'], function (error, results) {
            if (!error && results) {
                $('.queryDocs').show();
           } else {
                $('.queryDocs').hide();
            }
        });
 
        // Show createMap doc menu option if user is in createMap or dev role.
        Meteor.call('isUserInRole', ['dev', 'createMap'], function (error, results) {
            if (!error && results) {
                $('.createMapDocs').show();
           } else {
                $('.createMapDocs').hide();
            }
        });
 
        // Show dev doc menu option if user is in dev and is a dev server
        Meteor.call('isUserInRole', 'dev', function (error, results) {
            if (!error && results && DEV) {
                $('.devDocs').show();
           } else {
                $('.devDocs').hide();
            }
        });
    }

    centerToLatLng = function (centerIn) {
 
        // If needed, create the center or translate from an array to latLng.
        var center = centerIn;
        if (_.isNull(center)) {
            center = [0, 0];
        }
        if (Array.isArray(center)) {
 
            // This is stored this as an array of two numbers rather
            // than as latLng since when we retrieve it, we won't know
            // about google maps yet so won't understand LatLng.
            center = new google.maps.LatLng(center[0], center[1]);
        }
        return center;
    }
 
    centerToArray = function (centerIn) {
 
        // If needed, translate the latLng center to an array for store.
        var center = centerIn;
        if (!Array.isArray(center)) {

            // This is stored this as an array of two numbers rather
            // than as latLng since when we retrieve it, we won't know
            // about google maps yet so won't understand LatLng.
            center = [center.lat(), center.lng()];
        }
        return center
    }
 
    initState = function () { // jshint ignore:line
        var storageSupported = checkLocalStore();
        var s = new State();
        s.setProjectDefaults();

        // Initialize some flags
        s.alreadySaved = false;
        s.projectNotFoundNotified = false;

        // Load state
        if (s.uParm !== null) {
            if (s.uParm.b) {
 
                // Load from the bookmark ID in the URL
                s.loadFromBookmark(s.uParm.b);
            } else {
 
                // Load from the parms in the URL
                s.loadFromUrl();
            }
        } else if (storageSupported) {
 
            // Load from the local store if there is anything in there
            s.loadFromLocalStore();
        }
        if (storageSupported) {
        
            // Create a listener to know when to save state
            window.onbeforeunload = function() {
                s.save();
            }
        }
 
        // Set help menu options when the username changes, including log out
        Meteor.autorun(function () {
            var x = Meteor.user();
            initDocs();
        });

        return s;
    };
})(app);

