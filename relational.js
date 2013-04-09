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
        console.log("Registering " + name +"<"+obj[id]+">");
        if(typeof(obj[id]) !== 'undefined'){
            _library[name][obj[id]] = obj;
        }
    }

    function _deregister(name, id, obj){
        console.log("De-Registering " + name +"<"+obj[id]+">");
        delete _library[name][obj[id]];
    }


    function RelationalConstructorFactory(name){
        //returns the constructor for the relational object matched by name

        var myConfig = config[name];

        function RelationalResource(data){
            angular.copy(data || {}, this);
            this.register();
        }

        RelationalResource.deregister = function(obj){
            _deregister(name, myConfig.id, obj);
        };

        RelationalResource.prototype.register = function(){
            _register(name, myConfig.id, this);
        };


        for(var referenceId in myConfig.relationships){
            var rel = myConfig.relationships[referenceId];
            RelationalResource.prototype[rel] = _retrieve(rel, referenceId);

            if(typeof(myConfig.backref) !== 'undefined'){
                var referenceObject = relationalConstructors(rel);
                referenceObject.prototype[myConfig.backref] = _retrieveChildren(name, config[rel].id, referenceId);
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
