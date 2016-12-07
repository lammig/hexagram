/**
 * Created by duncan on 10/6/16.
 */

var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');
var readline  = Npm.require('readline');

AttribDB = new Mongo.Collection('AttribDB');
AttrDataDB = new Mongo.Collection('AttrDataDB');
DensityDB = new Mongo.Collection('DensityDB');

function getLayoutsFromDensityDB(project){
    // this returns an array of all the layout names for a given project.
    // here we assume all attributes have the same number of layouts per project
    // which is true for now

    //grab a random attribute to find on
    var randAttr = DensityDB.findOne({project: project}).name;
    var layoutNames = [];
    //find one attributes worth of density documents and same the names in an
    // array
    DensityDB.find({project: project, name : randAttr}).forEach(
        function(doc){
            layoutNames.push(doc.layout_name);
        }
    );
    return layoutNames;
}

function fillEmptyDensityDBEntries(){
    //One day hopefully we won't need this function...
    //This function puts empty (Nan) density values in the density
    // DB for maps that share namespaces but didn't calculate the density of
    // other attributes.
    // In order to be able to do 'joins' of Density and Tags, used in the
    // longlist, there must be density values for all attributes we want to
    // appear... this was the only way to be able to keep the user from having
    // all the layer data on their machine

    console.log("started filling empty density entries");

    //grab all the namespaces we are using from the attribute database
    var namespaces = [];
    AttribDB.aggregate({$group :
            {_id : {namespace: "$namespace"}, //group by namespace
                 "count": {$sum : 1} }}).forEach(function(namedoc){
            namespaces.push(namedoc._id.namespace)
    });
    console.log("LoadDbs: the namespaces recognized were:",namespaces);

    //map each namespace to the projects sharing it.
    var projectsWithNamespace = {};
    //populate the above object
    namespaces.forEach(function(namespace){
        projectsWithNamespace[namespace] = [];
        DensityDB.aggregate({$match: {namespace: namespace}},{$group :
        {_id : {project: "$project"}, //group by project
            "count": {$sum : 1} }}).forEach(function(projectdoc){
            projectsWithNamespace[namespace].push(projectdoc._id.project)
        });
    });

    //now that we have our project mapper, for each project, we want all the attribute names that
    // have densities for other projects but not that particular project,
    // then we will check each one of those attributes, and make sure they are
    // present in the project, if they are not, then add them.
    namespaces.forEach(function(namespace){
        var projArr = projectsWithNamespace[namespace];
        console.log("projects sharing namespace:",namespace,"->projects:",projArr);

        projArr.forEach(function(project){
            console.log(projArr,project);
            var otherProjects = projArr.slice(); //this makes copy instead of just reference

            otherProjects.splice(projArr.indexOf(project),1);
            //console.log("project array and other projects arrray",projArr,otherProjects);
            //console.log("other projects with this namespace:", otherProjects);
            //before we can fill we need to which layout_name s the project has
            var layoutNames = getLayoutsFromDensityDB(project);
            //console.log("layoutnames for project:",project,"->layout_names:",layoutNames);
            //console.log("should be spitting out abunch of attribute names:::");

            DensityDB.aggregate({$match: {namespace: namespace, project : {$in : otherProjects}}},{$group :
            {_id : {attr_name: "$name"}, //get all the attribute names in other project
                "count": {$sum : 1} }}).forEach(function(attrdoc){
                //console.log(attrdoc._id.attr_name);
                //if its not there then loop through all the layoutNames that
                // should be there inserting each doc as we go
                if (!DensityDB.findOne({project:project, name: attrdoc._id.attr_name})){
                    layoutNames.forEach(function(layout_name){
                        DensityDB.insert({
                            namespace : namespace,
                            project : project,
                            name : attrdoc._id.attr_name,
                            tags : AttribDB.findOne({namespace: namespace,name: attrdoc._id.attr_name}).tags,
                            datatype : AttribDB.findOne({namespace: namespace,name: attrdoc._id.attr_name}).datatype,
                            layout_name : layout_name,
                            density : NaN

                        })
                    })
                }
            });
        })
    });
    console.log("ended filling empty density entries");
}

function initDensityDB(project,namespace){
    //goes through the clumpiness values for each layer in a project
    var future = new Future();
    var layerArray  = getTsvFile('layers.tab', project, false,'', future);

    layerArray.forEach(function(layer){
        var attribute_name = layer[0];      //name of the layer
        var clumpiArray = layer.splice(4); //holds density values
        //will hold all the density values for mapId-attribute_name pair
        var densityArr = [];

        //TODO: probably shouldn't use index for name
        var index = 0; // we are using the index for the name values

        //fill density array with all the clumpiness values,
        var dtype = AttribDB.findOne({namespace: namespace, name : attribute_name}).datatype;
        var tags = AttribDB.findOne({namespace: namespace, name : attribute_name}).tags;
        clumpiArray.forEach(function(strnum){
            DensityDB.insert(
                {
                    namespace:namespace,
                    project:project,
                    datatype : dtype,
                    tags : tags,
                    density:parseFloat(strnum),
                    name: attribute_name,
                    layout_name: String(index)
                }
            );
            index+=1;
        });
    });
}
function initAttrDB(project,namespace){
    //console.log("initiating attributes database");
    var future = new Future();
    var layerArray  = getTsvFile('layers.tab', project, false, '',future);

    //
    //loops over each attribute in the layers file and initializes a doc
    layerArray.forEach(function(entry){
        //console.log(entry)

        var attributeDoc     = {};
        attributeDoc.namespace        = namespace; //string, identifying overarching namespace
        attributeDoc.name   = entry[0];  //string, this and namesapce are the key to the attribute
        attributeDoc.url              = project + entry[1];  //where the data can be found, assumers tab delemited, 2 columns

        //attributeDoc.subspace         = undefined; // for later use, array of strings indentiying defined regions for which this attivute is in, i.e. pan12, BRCA, or something
        attributeDoc.tags             = undefined; //used for filtering
        //attributeDoc.node_ids         = undefined; //the string indetfyers that the attribute has data for
        //attributeDoc.values           = undefined; //the values of data, a paralelel array with node_ids
        attributeDoc.datatype         = undefined; //one of "Binary", "Continuous", "Categorical"
        attributeDoc.colormap         = undefined; //unparsed array of colormap file : categorical only
        attributeDoc.max              = undefined; //maximuim value of attribute continuous and categorical
        attributeDoc.min              = undefined; //minimum  value of attribute used for continuous

        attributeDoc.n   = Number(entry[2]);
        attributeDoc.positives =  ( entry[3] === '' ) ? NaN : Number(entry[3]); //binary only
        //attributeDoc.removeFx  = undefined; I don't think we'll need this till client side
        //attributeDoc.selection = false; I don't think we'll need this till client side
        //attributeDoc.clumpiness_array = entry.slice(4);

        /*
        count = 0;

        //clumpiness/density must be a separate database because a (namespace,attribute) pair
        // may have many density values across projects with multiple layouts.
        attributeDoc.clumpiness_array.forEach(function(value){
            DensityDB.insert({project:project,index:count,attribute_name:attributeDoc.attribute_name,density: value})
        });
        */

        //look at the data and see if we want to keep it, i.e. if theres
        // data for more entries in the new attribute

        //read the data first so we can see if we want to replace ol data
        var future2 = new Future();
        var data = getTsvFile(attributeDoc.url, '', false, '', future2);
        //get the data into arrays
        var values = [];
        var nodeIds = [];
        data.forEach(function (row) {
            nodeIds.push(row[0]);
            values.push(Number(row[1]));
        });

        //grab what ever values we already have stored for this namespace/attr
        var layerEntry = AttrDataDB.findOne(
            {
                namespace: namespace,
                name: attributeDoc.name
            }
        );

        var layerEntryValues = (!layerEntry) ? undefined : layerEntry.values;
        // if there is no layer entry, or there are no layer values,
        // or the new layer with the same namespace and attribute_name has
        // more values, then replace old document of layers object
        if(!layerEntry || !layerEntryValues
            || values.length > layerEntryValues.length ) {
            attributeDoc.max = Math.max.apply(null, values);
            attributeDoc.min = Math.min.apply(null, values);
            attributeDoc.magnitude  = Math.max(Math.abs(attributeDoc.max),Math.abs(attributeDoc.min));
            
            AttribDB.upsert({namespace: namespace, name : attributeDoc.name},
                attributeDoc);

            AttrDataDB.upsert({namespace: namespace, name : attributeDoc.name},
                {
                 namespace: namespace,
                 name : attributeDoc.name,
                 node_ids: nodeIds,
                 values : values
                });
        }
    });
}

function insertDataTypesToArrtibDB(project,namespace){
    //add the data types to mongo entries
    var future = new Future();
    var dataTypes  = getTsvFile("Layer_Data_Types.tab", project, false,'', future);
    //if no colormap then no categoricals for that project, then exit
    if (typeof(dataTypes) === 'string') {
        console.log("no datatypes for project:", project);
        return
    }

    //if there is already a defined datatype then this does nothing
    dataTypes.forEach(function(datatypes){
        var datatype = datatypes[0];

        //skip any row with this name, because it is not a datatype :)
        var rowIsType = datatype !== 'FirstAttribute';

        if (rowIsType) {
            datatypes.slice(1).forEach(function (attribute_name) {

                if (!AttribDB.findOne({
                        namespace: namespace,
                        name: attribute_name
                    })) {
                    console.log("loading datatypes AttribDB:", attribute_name,
                        "not found, there is a attribute present in datatypes file,",
                        project, "not present in layers.tab file")
                }
                else if (!AttribDB.findOne({
                        namespace: namespace,
                        name: attribute_name
                    }).datatype) {
                    //console.log('AttribDB: adding datatypes');
                    AttribDB.update({name: attribute_name}, {$set: {datatype: datatype}})
                }
            })
        }
    })
}
function insertColorMapsToArrtibDB(project,namespace){
    //console.log('AttribDB: adding colormaps');
    var future = new Future();
    var colormaps = getTsvFile('colormaps.tab', project, false,'', future);

    //if no colormap then no categoricals for that project, then exit
    if (typeof(colormaps) === 'string') {
        return
    }
    colormaps.forEach(function(colormap) {
        var attribute_name = colormap[0];
        //console.log(attribute_name);

        if(!AttribDB.findOne({namespace: namespace, name: attribute_name})){
            console.log("loading datatypes AttribDB:",attribute_name,
                "not found, this attribute is present in,",
                project,"colormaps.tab, but not present in the layers.tab")
        }
        else if(!AttribDB.findOne({namespace: namespace,name : attribute_name}).colormap) {
            AttribDB.update({namespace: namespace, name: attribute_name}, {$set: {colormap: colormap}})
        }
    });
    //
}

function insertTagsToArrtibDB(project,namespace){
    var future = new Future();
    var tags = getTsvFile('attribute_tags.tab', project, false,'', future);
    //if we didn't find the file then get out of there, no tags for project
    if (typeof(tags) === 'string') {
        return
    }
    //skipping first row because of header
    tags.slice(1).forEach(function(tag){
        var attribute_name = tag[0];
        var attrDoc = AttribDB.findOne({namespace: namespace,name: attribute_name})
        //if there is not a document for that attribute, that's weird,
        // chatter to server
        if(!attrDoc){
            console.log("loading datatypes AttribDB:",attribute_name,
                "not found, this attribute is present in,",
                project,"attribute_tags.tab, but not present in the layers.tab file");
        }
        //if there aren't already tags for the attribute then put them there
        else if(!attrDoc.tags) {
            //make tag entry -> tags : [ {name: tag1},{name: tag2},... ]
            // this structure is good for nested querying
            var tagArr = [];
            tag.slice(1).forEach(function(tag) {
                tagArr.push({"name" : tag})
            });
            AttribDB.update({namespace: namespace, name: attribute_name}, {$set: {tags: tagArr}})
        }
        //if tags array is present, add any tag that hasn't been seen yet
        else {
            tag.slice(1).forEach(function(tag) {
                //if we go through all tags in doc and this is still true
                // then we want to add the tag
                var addIt = true;
                attrDoc.tags.forEach(function(tagDoc){
                    if (tagDoc.name === tag) {
                        addIt = false;
                    }
                });
                if (addIt) {
                    var newTagDoc = {"name": tag};
                    AttribDB.update({namespace: namespace,name: attribute_name}, {$push: {tags: newTagDoc}})
                }
            });
        }
    });

}



function populate_attrib_database(projects){
    //function crawls over the view directory structure and loads all attributes
    // into the attrib_database
    // must clear dbs here because init functions are in a loop
    DensityDB.remove({});
    AttribDB.remove({});
    AttrDataDB.remove({});

    //Function to determine whether or not to scrape a project directory
    function wanted(project){
        return (projects.indexOf(project) > -1)
    }

    var dirStructure = getMajorMinor();

    _.each(dirStructure, function(minors,major){
        //console.log(major,minors)

        var minorCount = 0; //brute way of dealing with case where no minors exist
        _.each(minors,function(minor){

            minorCount+=1;
            var project = major+'/'+ minor +'/';

            //do nothing if the project isn't in the projects list from dbSettings
            if ( !(wanted(project)) ) { return }

            console.log('loading files for:',project);
            var namespace = getNameSpace(project);

            //grabs from layers.tab
            console.log("initing the attribute database for project", project);
            initAttrDB(project,namespace);

            //uses *data_type.tab file
            console.log("initing the data types for project", project);
            insertDataTypesToArrtibDB(project,namespace);

            //uses colormaps.tab
            console.log("initing the colormaps for project", project);
            insertColorMapsToArrtibDB(project,namespace);

            //uses attribute_tags.tab
            console.log("initing the tags for project", project);
            insertTagsToArrtibDB(project,namespace);
            //need to do this last because it depends on types and tags being there...
            console.log("initing the density database for project", project);
            initDensityDB(project,namespace);


        });
        if (minorCount === 0) { //takes care of case when there is only a major
            var project = major + '/';
            console.log('loading files for:',project);
            var namespace = getNameSpace(project);
            initAttrDB(project,namespace);
            insertDataTypesToArrtibDB(project,namespace);
            insertColorMapsToArrtibDB(project,namespace);
            insertTagsToArrtibDB(project,namespace);
            initDensityDB(project,namespace);


        }
    });
}

function read_nodenames(managers_doc,callback) {
    //function for reading the nodeIds (both feature and sample) from a
    // reflection datafile, needed for making the server aware of what nodes
    // are available for reflection
    //
    // input: a document from the managerFileCabinet array in
    // server/dbSettings.json
    // ouput: the node_ids from a reflection matrix
    var filename = FEATURE_SPACE_DIR +managers_doc.mapId.split(('/'))[0] + '/' + managers_doc.datapath;
    var node_names = [];
    var first = true;

    fs.stat(filename,function(err,stats) {
        if (err) {
            console.log(err);
            return ;
        }
        else if (stats.isFile() ){
            var featOrSamp = managers_doc.featOrSamp;

            var rl = readline.createInterface({
                input : fs.createReadStream(filename),
                terminal: false
            });

            //if we are dealing with sample nodes we only read the header,
            // if dealing with features need to grab first element after first line
            if(featOrSamp === 'feature') {
                rl.on('line', function (line) {
                    if(!first) {
                        //console.log(line.split('\t')[0])
                        node_names.push(line.split('\t')[0]);
                    } else {
                        first = false;
                    }
                });
            } else if (featOrSamp === 'sample') {
                rl.on('line', function (line) {
                    //console.log('typeOfline:',typeof(line));
                    node_names = line.split('\t').splice(1);
                    //console.log('node_names',node_names);
                    rl.close();
                });
            }
            //after we read stuff in we put it in the database (callback should do that)
            rl.on('close',function() {
                callback(managers_doc,node_names);
            });
        }
        else {
            callback(managers_doc,[])
        }
    });

}

function insertNodeNames(doc,node_names){
    //inserts a list of nodes into the proper FileCabinet entry
    new Fiber( function () {
        ManagerFileCabinet.update(doc, {
            $set: {
                available_nodes: node_names
            }
        });
    }).run();
}

function initManagerHelper(dbSettings) {
    //describe dbsettings//
    //This function initializes the databases needed for map attribute transfer.
    // Initialized by reading from Meteor's settings.json file
    // erases old db entries and starts fresh everytime the server is booted

    //remove old dbs
    Windows.remove({});
    ManagerAddressBook.remove({});
    ManagerFileCabinet.remove({});
    LayerPostOffice.remove({});

    //insert ManangerAddressBook entries
    var addyentries =
        dbSettings.ManagerAddressBook;

    _.each(addyentries,function(entry){
        ManagerAddressBook.insert(entry);
        //read_nodenames(entry,insertNodeNames);
    });

    //insert ManagerFileCabinet entries
    var cabinentEntries =
        dbSettings.ManagerFileCabinet;

    _.each(cabinentEntries,function(entry){
        ManagerFileCabinet.insert(entry);
        //console.log(entry.datapath);
        //console.log(FEATURE_SPACE_DIR)
        read_nodenames(entry,insertNodeNames);
    });
}


//populate the helper database from settings.json file
//initManagerHelper();
//populate_attrib_database();

Meteor.publish('basalAttrDB',function(namespace,project) {
    //publishes a subset of the fileCabinet, mainly so the client is aware of
    // nodes reflection is available to

    // if not logged in function won't do anything
    if(!this.userId) { return this.stop(); }

    return [AttribDB.find({namespace: namespace},
        {fields:
         {  name:1,
            url:1,
            datatype:1,
            magnitude:1,
            max:1, min:1, tags:1,
            colormap :1,
            positives: 1,
            n:1
         }
        }
    ),
        DensityDB.find({project: project})
    ];

});
Meteor.publish('dataAttrDBcall',function(namespace,attribute_name) {
    //publishes a subset of the fileCabinet, mainly so the client is aware of
    // nodes reflection is available to

    // if not logged in function won't do anything
    if(!this.userId) { return this.stop(); }

    return AttribDB.find({namespace: namespace,name: attribute_name},
        {fields:
         {  node_ids: 1,
            values: 1
         }
        }
    );


});
Meteor.publish('DensityDB',function(project,index) {
    //publishes a subset of the fileCabinet, mainly so the client is aware of
    // nodes reflection is available to

    // if not logged in function won't do anything
    //if(!this.userId) { return this.stop(); }
    console.log("we find a document?", !!DensityDB.findOne({project: project,index : index}));
    return DensityDB.find({project: project,index : index});

});
////////////////////////////
//main part of script that imports dbs if flags are present in the
// server/dbSettings.json file
var dbSettings;

//if server/dbSettings.json isn't there we complain and do nothing
try {
    dbSettings = readFromJsonFileSync(Meteor.settings.server.SERVER_DIR + 'dbSettings.json');
} catch (e) {
    console.log('dbSettings exception thrown.' +
        'your dbSettings.json belongs in the SERVER_DIR of Meteor\'s settings.json')
}

if (dbSettings) {
    //empty obj so flags below will still work and do nothing
    // when you have a messed up dbSettings file
    var managerInit = {};


    //load up settings for the db depending upon whether on dev or production
    if (Meteor.settings.public.DEV === true) {
        managerInit = dbSettings.dev;
    } else if (Meteor.settings.public.DEV === false) {
        managerInit = dbSettings.production;
    }

    //populate databases if specified in dbSettings.json
    if(managerInit.populateAttrDB) {
        console.log('Using all files to populate Attribute database');
        populate_attrib_database(managerInit.projectsToPopulate);
        fillEmptyDensityDBEntries();
    }
    if(managerInit.populateManagerHelperDbs) {
        console.log('Using dbSettings to initiate the MapManager helpers');
        initManagerHelper(managerInit)
    }
}
Meteor.methods( {
    tryagg : function(){
        console.log("tryagg got called...")
        DensityDB.aggregate({$match : {name: "Tissue"}},{$lookup : {}});
    }
}

)
/*
this function could be used if we decide to start storing a sorted
 version of the clumpiness per layout...

 if the sorting were done early on we wouldn't need a sort function for the
  our default,

//////////////////
function sortIndeces(toSort) {
 //returns the respective indeces
    // of a sorted array.
    // creates a
    for (var i = 0; i < toSort.length; i++) {
        toSort[i] = [toSort[i], i];
    }
    toSort.sort(function(left, right) {
        return left[0] > right[0] ? -1 : 1;
    });
    var sortIndices = [];
    for (var j = 0; j < toSort.length; j++) {
        sortIndices.push(toSort[j][1]);
        toSort[j] = toSort[j][0];
    }
    return sortIndices;
}
a = [12,4.5,4,1.1,0];
console.log( sortWithIndeces(a));
*/

/*
 var dirStructure = getMajorMinor();
_.each(dirStructure, function(minors,major){
    //console.log(major,minors)
    var minorCount = 0; //niave way of dealing with case where no minors exist
    _.each(minors,function(minor){
        minorCount+=1;
        var project = major+'/'+ minor +'/';
        console.log(VIEW_DIR + project);
        console.log(getNameSpace(project));

    })
});
*/

