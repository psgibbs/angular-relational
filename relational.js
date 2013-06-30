(function(angular){
'use strict';


var module = angular.module('relational', ['relational.ngResource', 'relational.config']);

module.factory('RelationalResource', ['ResourceBase', 'relational.config',
               function(ResourceBase, config) {

    var _library = {};
    var _relationalConstructors = {};

    function _retrieve(name, id){
        return function(){
            return _library[name][this[id]];
        };
    }

    function _retrieveChildren(name, primaryId, referenceId){
        //create an array for a backref

        return function(){
            var children = [];
            var parent = this;
            angular.forEach(_library[name], function(child, child_id){
                if(child[referenceId] === parent[primaryId]){
                    children.push(child);
                }
            });
            return children;
        };
    }

    function _register(name, id, obj){
        //place an object in the library

        // console.log("Registering " + name +"<"+obj[id]+">");
        if(typeof(obj[id]) !== 'undefined'){
            if(typeof(_library[name][obj[id]]) !== 'undefined'){
                angular.extend(_library[name][obj[id]], obj);
            }else{
                _library[name][obj[id]] = obj;
            }
        }
    }

    function _deregister(name, id, obj){
        //remove an object from the library

        // console.log("De-Registering " + name +"<"+obj[id]+">");
        delete _library[name][obj[id]];
    }


    function RelationalConstructorFactory(name){
        //returns the constructor for the relational object matched by name

        var myConfig = config[name];

        function RelationalResource(data){

            RelationalResource.copy(data || {}, this);

            if (this.initialize){
                //in case the user defines a custom constructor
                this.initialize();
            }

            this.register();
        }

        // RelationalResource.bootstrap = function(item){
        //     console.log("Bootstrap?");
        //     if(angular.isArray(item)){
        //         var rtn = [];
        //         angular.forEach(item, function(i){
        //             rtn.push(new RelationalResource(i));
        //         });
        //         return rtn;
        //     }else{
        //         return new RelationalResource(item);
        //     }
        // };


        RelationalResource.deregister = function(obj){
            _deregister(name, myConfig.id, obj);
        };
        RelationalResource.prototype.deregister = function(){
            _deregister(name, myConfig.id, this);
        };

        RelationalResource.prototype.register = function(){
            _register(name, myConfig.id, this);
        };

        RelationalResource.copy = function(data, target){
            angular.forEach(RelationalResource.relations, function(relation){
                if(typeof(data[relation]) !== 'undefined') {
                    var Constructor = relationalConstructors(relation);
                    var object = new Constructor(data[relation]);
                    delete data[relation];
                }
            });

            angular.forEach(RelationalResource.backrefs, function(backref, sourceName){
                if(angular.isArray(data[backref])) {
                    var Constructor = relationalConstructors(sourceName);

                    angular.forEach(data[backref], function(item){
                        var object = new Constructor(item);
                    });

                    delete data[backref];
                }
            });

            return angular.copy(data, target);
        };

        RelationalResource.relations = [];
        RelationalResource.backrefs = {};

        for(var referenceId in myConfig.relationships){

            //for each target reference add a function that returns the objectt based  on the id
            var rel = myConfig.relationships[referenceId];
            RelationalResource.prototype[rel] = _retrieve(rel, referenceId);
            RelationalResource.relations.push(rel);

            if(typeof(myConfig.backref) !== 'undefined'){
                var referenceObject = relationalConstructors(rel);
                referenceObject.prototype[myConfig.backref] = _retrieveChildren(name, config[rel].id, referenceId);
                referenceObject.backrefs[name] = myConfig.backref;
            }
        }

        return RelationalResource;
    }

    function relationalConstructors(name){
        if(typeof(_relationalConstructors[name]) === 'undefined'){
            _relationalConstructors[name] = new RelationalConstructorFactory(name);
        }
        return _relationalConstructors[name];
    }

    function initializeRelationships(){
        for(var relation in config){
            _library[relation]={};
        }
    }

    function RelationalResourceFactory(name, _args){
        //name is the name of the object in the config, _args are the standared $resource arguments
        var relationalObject = relationalConstructors(name);

        var args = Array.prototype.slice.call(arguments, 1, arguments.length);

        //add the relational object to the customized $resource call, this will now serve as a base (automatically registering resources)
        args.push(relationalObject);
        var myResource = ResourceBase.apply(null, args);

        return relationalObject;
    }

    initializeRelationships();
    return RelationalResourceFactory;
}]);


})(angular);
