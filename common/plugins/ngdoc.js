exports.defineTags = function(dictionary) {
  dictionary.defineTag('ngdoc', {
    mustHaveValue: true,
    onTagged : function(doclet, tag) {
      if (tag.value == "method") {
        doclet.addTag('kind', 'function');
      } else {
        doclet.addTag('kind', 'class');
      }
      doclet.ngdoc = tag.value;
    }
  });

  dictionary.defineTag('attribute', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      doclet.attributes = parseParamTypes(doclet.attributes, tag);
    }
  })
  .synonym('attr');

  dictionary.defineTag('param', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      doclet.params = parseParamTypes(doclet.params, tag);
    }
  });

  dictionary.defineTag('property', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      doclet.properties = parseParamTypes(doclet.properties, tag);
    }
  });

  dictionary.defineTag('returns', {
    mustHaveValue: false,
    canHaveType: true,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      var returnsText = new RegExp(/@returns? (\{.*\}.*)/).exec(doclet.comment);

      if (returnsText) {
        tag.text = returnsText[1];
        doclet.returns = parseParamTypes(doclet.returns, tag);
      }
    }
  });

  dictionary.defineTag('restrict', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      var restricts={
          'A': 'Attribute',
          'E': 'Element',
          'C': 'Class'
      }
      var s = tag.value.split('').map(function(aec) {
        return restricts[aec];
      })
      doclet.restrict = s;
    }
  });

  dictionary.defineTag('priority', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      doclet.priority = tag.value;
    }
  });

  dictionary.defineTag('eventType', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      doclet.eventType = tag.value;
    }
  });

  dictionary.defineTag('animations', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      doclet.animations = tag.value;
    }
  });

  dictionary.defineTag('scope', {
    onTagged: function (doclet, tag) {
      var scopeType = {
        'object': 'Isolated Scope',
        '{}': 'Isolated Scope',
        'true': 'Child Scope',
        'false': 'Shared Scope'
      };

      if (!scopeType.hasOwnProperty(tag.value)) {
        doclet.directiveScope = 'New Scope';
      } else {
        doclet.directiveScope = scopeType[tag.value];
      }
    }
  });
};

function parseParamTypes(docletParams, tag) {
  if (!docletParams) {
    docletParams = [];
  }

  var result = {
    name: wrapDefaultNotation(tag),
    description: tag.value.description,
    optional: !!tag.value.optional,
    default: tag.value.defaultvalue
  };

  var defaultTypes = ['boolean', 'string', 'expression', '*', 'mixed', 'number', 'null', 'undefined', 'function',
    'object', 'array', 'void', '$q'];
  var defaultTypeStarts = ['\'', '"', '[', '{'];

  var typeDoc = new RegExp(/\{(.*?)\}/).exec(tag.text);

  if (!typeDoc) {
    result.typeDefinition =  '*';
    docletParams.push(result);
    return;
  }



  var types = typeDoc[1].split('|');
  var typeRegex = new RegExp(/(.*?)(\[\])?$/);
  var qRegex = new RegExp(/^\$q\.?(?:<|\&lt;?)(.+)>$/);
  var hashRegex = new RegExp(/^Object\.?(?:<|\&lt;?)(.+)(?:\s*)\,(?:\s*)(.+)>$/);

  var parseTypeDefinitionUrl = '';
  var parseTypeDefinition = '';
  var i = 0;


  function parseType(type) {
    var q = qRegex.exec(type);


    if (q) {
      return parseQ(q)
    }

    var hash = hashRegex.exec(type);


    if (hash) {
      return parseHash(hash)
    }

    var t = typeRegex.exec(type)

    if (t) {
      return parseNormalType(t)
    }

    return {
      name: '',
      url: ''
    }
  }


  function parseNormalType(t) {

    var array = !!t[2];

    var name = t[1] + (array ? '[]' : '');
    var url = '<a href="' + t[1] + '.html">' + name + '</a>';

    if (defaultTypes.indexOf(t[1].toLowerCase()) !== -1) {
      url = name;
    }

    return {
      name: name,
      url: url
    }
  }

  function parseQ(q) {
    var type = parseType(q[1]);

    return {
      name: q[0],
      url: '$q&lt;' + type.url + '>'
    }
  }

  function parseHash(hash) {
    var key = parseType(hash[1]);
    var type = parseType(hash[2]);

    return {
      name: hash[0],
      url: 'Object&lt;' + key.url + ', ' + type.url + '>'
    }
  }


  var parsedTypes = types.map(function(type) {

    var parsed = parseType(type);

    return {
      name: parsed.name,
      url: parsed.url
    }
  });

  result.typeDefinitionUrl = parsedTypes.map(function(type) {
    return type.url;
  }).join(' | ');

  result.typeDefinition = parsedTypes.map(function(type) {
    return type.name;
  }).join(' | ');


  docletParams.push(result);

  return docletParams;
}

function wrapDefaultNotation(tag) {
  var returnName = '';

  if (tag.value.optional) {
    returnName += '[';
    returnName += tag.value.name;

    if (tag.value.defaultvalue) {
      returnName += '=' + tag.value.defaultvalue;
    }

    returnName += ']';
    return returnName;
  }

  return tag.value.name;
}
