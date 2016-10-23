
// createMap.js
// Call the python layout code.

var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');

var PythonCall = require('./pythonCall');
var CreateMap = require('./createMap');

exports.post_calc = function (result, context) {
    
    // Process the results of the create map request where:
    // result: { code: <http-code>, data: <result-data> }
    
    if (result.code !== 200) {
        PythonCall.report_local_result (result, context);
        return;
    }
    
    // Check the python layout log for success
    var log = fs.readFileSync(context.js_result, 'utf8');
    var log_array = log.split('\n');
    var success_msg = 'Visualization generation complete!';
    var success = _.find(log_array, function(line) {
        return line.indexOf(success_msg) > -1;
    });
    if (success) {

        // Return the layout log file name
        PythonCall.report_local_result(result, context);
    } else {
       
        // Send the log to the admin & throw an error.
        var subject = 'Error when creating a map';
        var msg = 'log file: ' + result.data;
        sendMail(ADMIN_EMAIL, subject, msg);
        
        PythonCall.report_local_result ({
            code: 400,
            data: 'Calc script had an unknown error',
            }, context);
    }
};

Meteor.methods({

    create_map: function (opts) {

        // Process a create map request from the client.
        this.unblock();
        var future = new Future();
        callPython('layout', opts, { future: future, callback: create_map });
        return future.wait();
    },
});