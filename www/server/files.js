// files.js

// Contains the Meteor methods for accessing flat files on the server.

var Future = Npm.require('fibers/future');
var fs = Npm.require('fs');
var os = Npm.require('os');
var crypto = Npm.require('crypto');
var Path = Npm.require('path');

writeToTempFile = function (data, fileExtension) {

    // Write arbitrary data to a file, blocking until the write is complete
    var filename = TEMP_DIR + '/' + crypto.randomBytes(4).readUInt32LE(0);
    if (!_.isUndefined(fileExtension)) {
        filename += fileExtension;
    }
    fs.writeFileSync(filename, data);
    return filename;
};

clean_file_name = function (dirty) {
    
    // Make a directory or file name out of some string.
    // Valid characters:
    //     a-z, A-Z, 0-9, dash (-), dot (.), underscore (_)
    // The tough characters are replaced with underscores.
    
    if (!dirty) {return undefined;}
    return dirty.replace(/[^A-Za-z0-9_\-\.]/g, "_");
};

function parseTsv (data) {

    // separate the data in to an array of rows
    var data1 = data.split('\n'),

    // Separate each row into an array of values
    parsed = _.map(data1, function(row) {
        return row.split('\t');
    });
    
    // Remove any empty row left from the new-line split
    if (parsed[parsed.length-1].length === 1 &&
            parsed[parsed.length-1][0] === '') {
        parsed.pop();
    }
    return parsed;
}

readFromTsvFileSync = function (filename) {

    // Parse the data after reading the file
    return parseTsv(fs.readFileSync(filename, 'utf8'));
};

readFromJsonFileSync = function (filename) {
    
    // Parse the data after reading the file
    if (!filename) {
        console.log('Error: no filename passed to readFromJsonFileSync()');
        return false;
    }
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
};

readFromJsonBaseFile = function (filePath) {

    return readFromJsonFileSync(VIEW_DIR + filePath);
};

Meteor.methods({

    upload_feature_space_file: function (
            dir, sub_dir, file_name, data, start) {

        // Upload a tsv file to the server in chunks and synchronously
        var buf = new Buffer(data);
        var mode = (start === 0) ? 'w' : 'a';
        var fd;

        // If this is the first chunk,
        // create the directory and meta.json if need be.
        if (mode === 'w') {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            var path = Path.join(dir, sub_dir)
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
        }

        // Write the chunck
        fd = fs.openSync(Path.join(dir, sub_dir, file_name), mode);
        fs.writeSync(fd, buf, 0, buf.length, start);
        fs.closeSync(fd);
    },
});
