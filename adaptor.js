'use strict';

const util = require('util');

const yaml = require('js-yaml');
const deref = require('reftools/lib/dereference.js').dereference;
const walkSchema = require('swagger2openapi/walkSchema').walkSchema;
const wsGetState = require('swagger2openapi/walkSchema').getDefaultState;

function transform(api, defaults) {
    let obj = Object.assign({},defaults);

    obj["swagger-yaml"] = yaml.safeDump(api, {lineWidth:-1});
    obj["swagger-json"] = JSON.stringify(api, null, 2);
    
    obj.implFolder = 'nodejs';
    
    obj.projectName = api.info.title;
    obj.appVersion = api.info.version;
    obj.version = api.info.version;
    obj.appDescription = api.info.description||'No description';
    obj.classname = api.info.title.toLowerCase().split(' ').join('_').split('-').join('_');
    obj.exportedName = obj.classname;
    obj.infoEmail = api.info.contact ? api.info.contact.email : null;
    obj.infoUrl = api.info.contact ? api.info.contact.url : null;
    obj.licenseInfo = api.info.license ? api.info.license.name : null;
    obj.licenseUrl = api.info.license ? api.info.license.url : null;

    api = deref(api,api);

    obj.operations = [];
    for (let p in api.paths) {
        let pathItem = api.paths[p];
        for (let o in pathItem) {
            if (o === 'description') {
            }
            else if (o === 'summary') {
            }
            else if (o === 'parameters') {
            }
            else if (o === '$ref') {
            }
            else if (o.startsWith('x-')) {
            }
            else {
                let op = pathItem[o];
                let operation = {};
                operation.nickname = op.operationId;
                operation.httpMethod = o;
                operation.path = p;
                operation.operationId = op.operationId;
                operation.allParams = [];
                operation.summary = op.summary;
                operation.notes = op.description;
                for (let pa in op.parameters) {
                    let param = op.parameters[pa];
                    let parameter = {};
                    parameter.paramName = param.name;
                    parameter.baseName = param.name;
                    parameter.dataType = param.schema.type;
                    parameter.description = param.description;
                    parameter.required = param.required;
                    parameter.hasMore = (pa != op.parameters.length-1);
                    operation.allParams.push(parameter);
                }
                let container = {};
                container.classname = operation.nickname;
                container.operation = operation;
                obj.operations.push(container);
            }
        }
    }

    obj.apiInfo = {};
    obj.apiInfo.apis = [];
    obj.apiInfo.apis.push( { operations: obj.operations } );

    obj.models = [];
    if (api.components) {
        for (let s in api.components.schemas) {
            let schema = api.components.schemas[s];
            let container = {}
            let model = {};
            model.name = s;
            model.title = schema.title;
            model.unescapedDescription = schema.description;
            model.vars = [];
            walkSchema(schema,{},wsGetState,function(schema,parent,state){
                let entry = {};
                entry.name = schema.name || schema.title;
                if (!entry.name && state.property && (state.property.startsWith('properties') || 
                    state.property.startsWith('additionalProperties'))) {
                    entry.name = state.property.split('/')[1];
                }
                entry.type = schema.type;
                entry.required = (parent.required && parent.required.indexOf(entry.name)>=0);
                entry.isPrimitiveType = ((schema.type !== 'object') && (schema.type !== 'array'));
                entry.complexType = schema.type;
                entry.dataFormat = schema.format;
                if (entry.name) model.vars.push(entry);
            });
            container.model = model;
            obj.models.push(container);
        }
    }

    return obj;
}

module.exports = {
    transform : transform
};
