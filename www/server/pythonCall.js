
// pythonCall.js
// Call python utilities from nodejs.

var Future = Npm.require('fibers/future');
var spawn = Npm.require('child_process').spawn;

function make_parm_file (opts, in_json) {

    // Save parameters to a file in json and return the file name as json that
    // looks like this: {"parm_filename": "<filename>"}
    // in_json of true indicates the options are already in json format
    var json_opts = in_json ? opts : JSON.stringify(opts);
    
    return JSON.stringify({
        parm_filename: writeToTempFile(json_opts)
    });
}

report_local_result = function (result, context) {

    // Report an error or successful result to http or the client.
    if (context.http_response) {
    
        // This is from an http request so respond to that
        respondToHttp (result.code, context.http_response, result.data);
    } else if (context.future) {
    
        // This has a future, so return the result via the future
        if (result.code === 200) {
        
            // Success with a results filename,
            // so convert the contents of this file from json to javascript.
            result.data = readFromJsonFileSync(result.data);
            context.future.return(result);
            
        } else {
        
            // An error as a string.
            context.future.throw(result);
        }
        
    } else {

        console.log('Error: report_local_result() received a context without a',
            'future or http_response\ncontext:', context);
        console.trace();
    }
};

function local_error (error, pythonCallName, context) {

    var result = { code: 500, data: error.toString() };
    console.log('Error: pythonCall(' + pythonCallName + ')', result.data);
    report_local_result(result, context);
}

function local_success (result_filename, pythonCallName, context) {

    // Remove any trailing new line char
    var filename = result_filename,
        index = result_filename.indexOf('\n');
    if (index > -1) {
        filename = result_filename.slice(0, index);
    }
    var result = { code: 200, data: filename };
    console.log('Info: pythonCall(' + pythonCallName + ')',
            'Results file:', result.data);
    report_local_result(result, context);
}

function call_python_local (pythonCallName, json, context) {

    // Generic asynchronous caller from server to python code.
    // Put the parameters in a file as json, then call the python routine. The
    // python routine returns either an error string or a filename containing
    // the results as json. The results are returned to the caller via the
    // supplied callback as a javascript object on success, or a string on
    // error.
    
    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_local(' + pythonCallName + ')');
    
    // Parms to pass to python
    var spawn_parms = [
            SERVER_DIR + 'pythonCall.py',
            pythonCallName,
            json,
            TEMP_DIR,
        ];
    
    // Make the python call using a spawned process.
    var call = spawn('python', spawn_parms);

    call.on('error', function (error) {
        local_error(error, pythonCallName, context);
    });

    call.stderr.on('data', function (data) {
        local_error(data, pythonCallName, context);
    });

    call.stdout.on('data', function (stdout_in) {
        var stdout = stdout_in.toString();
        if (stdout.slice(0,5).toLowerCase() === 'error' ||
            stdout.slice(0,7).toLowerCase() === 'warning') {
    
            // Return any errors/warnings printed by the python script
            local_error(stdout, pythonCallName, context);
        } else {
            local_success(stdout, pythonCallName, context);
        }
    });
    
    call.on('close', function (code) {
        if (code === 0) {
            console.log('Info: success with call_python_local(' +
                pythonCallName + ')', 'Exited with:', code);
        } else {
            console.log('Error with call_python_local(' + pythonCallName + ')',
                'Exited with:', code);
        }
    });
    
    call.stdin.end();
}

function report_remote_result (result, context) {

    if (context.http_response) {
    
        // Send the results back to the local server
        respondToHttp(
            result.statusCode,
            context.http_response,
            result.content,
            true);
        
    } else if (context.future) {
        if (result.statusCode === 200) {
        
            // Success so return the data as a javascript object
            var filename = JSON.parse(result.content);
            context.future.return({
                code: result.statusCode,
                data: readFromJsonFileSync(filename)
            });
        } else {
        
            // Error so throw the error as javascript
            context.future.throw({
                code: result.statusCode,
                data: JSON.parse(result.content)
            });
        }
    }
}

function call_python_remote (pythonCallName, json, context) {

    // Log every call to python in case we have errors, there will be
    // some sort of bread crumbs to follow.
    console.log('Info: call_python_remote calling:',
        CALC_URL + '/' + pythonCallName);
    
    // Define HTTP request options
    var options = {
        headers: {
            'content-type': 'application/json',
        },
        content: json,
    };
    
    var Fiber = Npm.require('fibers');
    var id = 1;
    var f = new Fiber(function(id) { // jshint ignore: line
        context.in_json = true;
        HTTP.post(CALC_URL + '/' + pythonCallName, options,
                function (error, result) {
            
            if (error) {
                console.log('Error: call_python_remote(' + pythonCallName +
                    '):', result.statusCode, result.content);
            } else {
                console.log('Info: call_python_remote(' + pythonCallName + ')',
                    'Code, Results file:', result.statusCode, result.content);
            }
            report_remote_result(result, context);
        });
    }).run(id);
}

callPython = function (pythonCallName, opts, context) {

    // Call a python function where the caller passes the
    // python call name, call options, and a context.
    // On success or error, the results are received as:
    //  {
    //      code: <http-status-code>, (whether it called locally or remotely)
    //      data: <data>,
    //  }

    var json;

    // Call either the local or remote python script.
    if (CALC_URL) {
    
        // Execute this remotely.
        if (opts.parm_filename) {
            
            // The opts is a parameter file name in json, so is fine as is
            // and looks like this: {"parm_filename": "<filename>"}
            json = opts;
        } else {
        
            // The opts are parameters in json, so save them to a file
            // and transform the filename to json.
            if (context.future) {
                json = make_parm_file(opts);
            } else {
                json = make_parm_file(opts, true);
            }
        }
        
        // Call the remote calc server
        call_python_remote(pythonCallName, json, context);

    } else {
        
        // Call the local python calc after converting the data to json,
        // storing in a file, then jsonizing that filename
        var parm_filename;
        if (opts.parm_filename) {
        
            // This is coming from http so parm_filename is already in json
            json = opts;
        } else {
        
            parm_filename = make_parm_file(opts);
        }
        
        call_python_local(pythonCallName, parm_filename, context);
    }
};

var valid_calls_from_client = [
    'diffAnalysis',
    'statsDynamic',
];

Meteor.methods({

    pythonCall: function (pythonCallName, opts) {

        // Asynchronously call a python function with this routine
        // handling the fiber/future.
        this.unblock();
        var future = new Future();
        
        if (valid_calls_from_client.indexOf(pythonCallName) > -1) {
            
            // This is a valid python call, so call it.
            callPython(pythonCallName, opts, undefined, future);
        } else {
        
            // This is not a valid python call, return an error.
            Meteor.setTimeout(function () {
                future.return('Error: ' + pythonCallName +
                    ' is not a python function');
            }, 0);
        }
        return future.wait();
    },

    /*
    pythonCall: function (pythonCallName, opts) {
    
        // TODO deprecated, move statsDynamic & diffAnalysis to use callPython
        // Asynchronously call a python function from the client.
        
        // If this is not a valid python call, return an error
        if (valid_calls_from_client.indexOf(pythonCallName) < 0) {
            return 'Error: ' + pythonCallName + ' is not a python function';
        }
        
        this.unblock();
        var future = new Future();

        // Create temp file if the client wants us to
        if (opts.hasOwnProperty('tempFile')) {
            opts.tempFile = writeToTempFile('junk');
        }

        // Make a project data directory string usable by the server code.
        opts.directory = VIEW_DIR + opts.directory;

        // Write the opts to a temporary file so we don't overflow the stdout
        // buffer.
        var pythonDir = SERVER_DIR,
            parmFile = writeToTempFile(JSON.stringify({parm: opts}));

        var command =
            'python ' +
            pythonDir +
            pythonCallName +
            ".py '" +
            parmFile +
            "'";

        exec(command, function (error, stdout) {
            if (error) {
                future.throw(error);
            } else {

                var data,
             
                    // remove last newline
                    result = stdout.toString().slice(0, -1);

                // Return any known errors/warnings to the client
                if (typeof result === 'string' &&
                    (result.slice(0,5).toLowerCase() === 'error' ||
                        result.slice(0,7).toLowerCase() === 'warning')) {
                    fs.unlinkSync(parmFile);
                    future.return(result);
                } else {
                    if (opts.tsv) {

                        // Read the tsv results file, creating an array of
                        // strings, one string per row. Return the array to the
                        // client where the row format is known, and parse them
                        // there.
                        // TODO This seems abusive of Meteor and should be
                        // change to what is best for meteor. This is reading
                        // the file on the server, then passing the long array
                        // to the client.
                        data = readFromTsvFileSync(result);
                    } else {
             
                        // Read and parse the json file

                        data = readFromJsonFileSync(result);
                        data.result = result;
                    }
                    //fs.unlinkSync(parmFile);
                    future.return(data);
                }
            }
        });
        return future.wait();
    },
    */
});
