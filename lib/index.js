'use strict';

var multimatch = require('multimatch'),
    findup = require('findup-sync'),
    path = require('path');

module.exports = function(options) {

    var defaultOptions = {
            prefix: 'gulp',
            pattern: null,
            replaceExpr: null,
            scope: ['dependencies', 'devDependencies', 'peerDependencies'],
            config: findup('package.json', {cwd: parentDir}),
            requireFn: require,
            camelize: true,
            lazy: true,
            renameObj: {}
        };

    options = options || {};
    options.prefix = isType('String', options) ? options : (isType('String', options.prefix) ? options.prefix : defaultOptions.prefix);
    options.pattern = isType('String', options.pattern, true) ? arrayify(options.pattern) : [options.prefix + '-*', options.prefix + '.*'];
    options.replaceExp = isType('RegExp', options.replaceExp) ? options.replaceExp : new RegExp('^' + options.prefix + '(-|\.)');
    options.scope = isType('String', options.scope, true) ? arrayify(options.scope) : defaultOptions.scope;
    options.config = isType('String', options.config) || isType('Object', options.config) ? options.config : defaultOptions.config;
    options.requireFn = isType('Function', options.requireFn) ? options.requireFn : defaultOptions.requireFn;
    options.camelize = isType('Boolean', options.camelize) ? options.camelize : defaultOptions.camelize;
    options.lazy = isType('Boolean', options.lazy) ? options.lazy : defaultOptions.lazy;
    options.renameObj = isType('Object', options.renameObj) ? options.renameObj : defaultOptions.renameObj;

    if (isType('String', options.config)) {
        options.config = require(options.config);
    }

    if (!options.config) {
        throw new Error('Could not find dependencies.');
    }

    options.pattern.push('!auto-plug');

    var names = options.scope.reduce(function(result, prop) {
        return result.concat(Object.keys(options.config[prop] || {}));
    }, []);

    var container = {};

    multimatch(names, options.pattern).forEach(function(name) {
        var requireName;
        if(options.renameObj[name]) {
            requireName = options.rename[name];
        }
        else {
            requireName = name.replace(options.replaceExp, '');
            requireName = options.camelize ? camelize(requireName) : requireName;
        }
        Object.defineProperty(container, requireName, options.lazy ? {
            get: function() {
                return options.requireFn(name);
            }
        } : options.requireFn(name));
    });

    return container;

};

function arrayify(object) {
    return Object.prototype.toString.call(object) === '[object Array]' ? object : [object];
}

function camelize(str) {
    return str.replace(/-(\w)/g, function(m, p1) {
        return p1.toUpperCase();
    });
}

function isType(type, object, allowArrayOfSameType) {
    var testType = function(obj) {
        return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    };
    if (allowArrayOfSameType && Object.prototype.toString.call(object) === '[object Array]') {
        return object.every(testType);
    }
    return testType(object);
}

var parentDir = path.dirname(module.parent.filename);

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
