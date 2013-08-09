var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require("htmlparser");

var helper = require('./helper');
var format = require('./formatter');

function htmlToText(html, options) {
	options = options || {};
	_.defaults(options, {
		wordwrap: 80,
		tables: []
	});

	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		
	}, { 
		verbose: true, 
		ignoreWhitespace: true 
	});
	new htmlparser.Parser(handler).parseComplete(html);
	
	var result = walk(filterBody(handler.dom), options);
	return _s.strip(result);
}

function filterBody(dom) {
	var result = null;
	function walk(dom) {
		if (result) return;
		_.each(dom, function(elem) {
			if (elem.name === 'body') {
				result = elem.children;
				return;
			}
			if (elem.children) walk(elem.children);
		});
	}
	walk(dom);
	return result || dom;
}

function containsTable(attr, tables) {
	if (tables === true) return true;

	function removePrefix(key) {
		return key.substr(1);
	}
	function checkPrefix(prefix) {
		return function(key) {
			return _s.startsWith(key, prefix);
		};
	}
	function filterByPrefix(tables, prefix) {
		return _(tables).chain()
						.filter(checkPrefix(prefix))
						.map(removePrefix)
						.value();
	}
	var classes = filterByPrefix(tables, '.');
	var ids = filterByPrefix(tables, '#');
	return attr && (_.include(classes, attr.class) || _.include(ids, attr.id));
}

function walk(dom, options) {
	var result = '';
	_.each(dom, function(elem) {
		switch(elem.type) {
			case 'tag':
				switch(elem.name.toLowerCase()) {
					case 'a':
						try{
							result += format.anchor(elem, walk, options);
						}catch(err){
							
						}
						break;
					case 'p':
						try{
							result += format.paragraph(elem, walk, options);
						}catch(err){
							
						}
						break;
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
						try{
							result += format.heading(elem, walk, options);
						}catch(err){
							
						}
						break;
					case 'br':
						try{
							result += format.lineBreak(elem, walk, options);
						}catch(err){
							
						}
						break;
					case 'hr':
						try{
							result += format.horizontalLine(elem, walk, options);
						break;
					case 'ul':
						try{
							result += format.unorderedList(elem, walk, options);
						}catch(err){
							
						}
						break;
					case 'ol':
						try{
							result += format.orderedList(elem, walk, options);
						}catch(err){
				
						}
						break;
					case 'table':
						if (containsTable(elem.attribs, options.tables)) {
							try{
								result += format.table(elem, walk, options);
							}catch(err){
							
							}
							break;
						}
					default:
						result += walk(elem.children || [], options);
				}
				break;
			case 'text':
				if (elem.raw !== '\r\n') result += format.text(elem, options);
				break;
			default:
				result += walk(elem.children || [], options);
		}
	});
	return result;
}

exports.fromFile = function(file, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}
	fs.readFile(file, 'utf8', function(err, str) {
		var result = htmlToText(str, options);
		return callback(null, result);
	});
};

exports.fromString = function(str, options) {
	return htmlToText(str, options || {});
};
