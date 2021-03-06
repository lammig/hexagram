// dialogHex.js
// Our wrapper around jquery-ui's dialog.
// A jquery element is passed in which is used as the trigger to open the
// dialog. Jquery-UI dialog options passed in are applied after our default
// dialog options. A help icon is provided in the header.

var app = app || {}; // jshint ignore:line

(function (hex) {

    DialogHex = function ($el, opts, showFx, hideFx, helpAnchor) {

        this.$el = $el;
        this.opts = opts;
        this.showFx = showFx;
        this.hideFx = hideFx;
        this.$help = $('.help-button');
        this.helpAnchor = helpAnchor;

        DialogHex.prototype.showHelp = function () {

            // TODO This should bring up the help doc in another window
            // scrolled to the specific anchor.
            alert('Sorry, no help here yet for "' + opts.title + '"');
        }

        DialogHex.prototype.initHelp = function () {
 
            var self = this;
 
            this.$help.detach()
                .css('display', 'inline');
            $('.ui-dialog-titlebar-close').before(self.$help);

            // Event handlers
            // Remove any old help handlers from other dialogs using it
            this.$help.off('click')
                .on('click', self.showHelp);
        }

        DialogHex.prototype.hide = function () {

            this.$el.dialog('destroy');
        }

        DialogHex.prototype.init = function () {

            var self = this,
                closeSvg = 'close.svg';

            // Replace jqueryUI's sad close icon
            $('.ui-dialog-titlebar-close').css({
                'background-color': 'inherit',
                'background-image': 'url(' + closeSvg + ')',
                'border-size': '0',
                'width': '14',
                'height': '14',
            })
            .find('span').hide();

            if (this.helpAnchor) {
                //this.initHelp(); // TODO turn this on when we have help
            }
 
            if (this.showFx) {
                this.showFx(); // Call the instance init function
            }
        }

        DialogHex.prototype.show = function () {

            // Initialize the dialog options to our favorite defaults
            var self = this,
                opts = {
                    dialogClass: 'dialog',
                    minHeight: '10em',
                    width: 'resolve',
                    close: self.hideFx,
            };

            // Override the defaults or add options from the caller
            for (var key in this.opts) {
                if (this.opts.hasOwnProperty(key)) {
                    opts[key] = this.opts[key];
                }
            };
            this.$el.dialog(opts);

            // Give the DOM a chance to load so we can find the elements in init
            setTimeout(function () {
                self.init();
            }, 0);
        }

        DialogHex.prototype.initButton = function ($button) {

            // Give the button jquery-ui style and create a click handler for it
            var self = this;
            $button
                .prop('title', this.opts.title)
                .button()
                .click(function() {
                
                    // Recreate the dialog if the button is pressed while
                    // a dialog instance is defined.
                    if (self.$el.dialog('instance')) {
                        self.hideFx();
                    }
                    self.show();
                });
        }
    }

    createDialogHex = function ($button, $el, opts, showFx, hideFx,
        buttonInitialized, helpAnchor) {

        /* Creates an instance of our dialog, which contains a button to open
         * the dialog in addition to a dialog
         *
         * @param $button: jquery DOM element of the dialog activator
         *          where null indicates the button is already initialized
         * @param $el: jquery DOM element of the dialog anchor
         * @param opts: overrides of this class' jquery-ui dialog options
         * @param showFx: called after the show function of this class
         * @param hideFx: called to destroy the jqueryui dialog
         * @param helpAnchor: the html anchor in the user help doc
         */
        var instance = new DialogHex($el, opts, showFx, hideFx, helpAnchor);
        if (!buttonInitialized) {
            instance.initButton($button);
        }
        return instance;
    }
})(app);

