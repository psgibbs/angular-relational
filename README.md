angular-relational
==================

Library to add basic relational constructs to AngularJS [$resource](http://docs.angularjs.org/api/ngResource.$resource) objects.

## Usage
1.  Add dependencies ('relational') to your app, and a module 'relational.config' module to configure relationships:

    app.js
    
    ```javascript
    
    angular.module('myApp',['relational']);
    
    
    var mod = angular.module('relational.config', []);
    mod.value('relational.config', {
        'child':{id:'childId',
                 relationships: {'parentId':'parent'},
                 backref:'children'},
       'parent':{id: 'parentId',
                 relationships: {}}
    });
    ```
    
    Each top level item defines an object type.
    * `id` points to the primary key for that object
    * `relationships` maps from fields on the object to the names of other relational objects
    * `backref` (optional) allows parent objects to reference the collection of children


2.  Declare your `RelationalResource` objects using the same identifiers in the config:
    ```javascript
    var module = angular.module('myApp.services', ['relational']);

    module.factory('Child', function(RelationalResource){

        // parameters for RelationalResource are same as for $resource, but with addition of the
        // identifier as the first argument
        return RelationalResource('child', '/api/:childId', {childId:'@childId'});
    });

    module.factory('Parent', function(RelationalResource){
        return RelationalResource('parent', '/api/:parentId', {parentId:'@parentId'},
                                            {update:  {method:'PUT', isArray:false}});
    });
    ```

3.  Reference relationships through the associated functions
    ```javascript
    child.parent();    // returns the parent matching the parentId
    parent.children(); // returns an array of 'Child' objects with the matching parentId

    //all the usual $resource constructs work as well
    child.$save();   // automatically adds child to parent.children();
    child.$delete(); // if successful, this child will no longer appear in parent.children()
    ```
    
## Current status
Alpha.  Lacking tests.  Searches for back-references aren't optimized, no autoloading, circular references will probably break things.

## Immediate Next Steps
* Tests
* Automatically load related objects when retrieved
* Nested Relationships
* Make attached relational functions hybrid getter/setters


