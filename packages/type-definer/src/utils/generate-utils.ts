import { ApiAST, Parameter, Schema, TypeAST } from '@/types';
import { isAscending } from '.';
import { getJsdoc } from './jsdoc';

function splitWithSkip(input: string) {
  const result = [];
  let temp = '';
  let insideBrackets = 0; // 用于判断是否在«和»之间

  for (const char of input) {
    if (char === '«') {
      insideBrackets++;
    } else if (char === '»') {
      insideBrackets--;
    }

    if (char === '/' && insideBrackets === 0) {
      result.push(temp);
      temp = '';
    } else {
      temp += char;
    }
  }

  if (temp) {
    result.push(temp);
  }

  return result;
}

function getResponses(res: ApiAST['responses'], types: TypeAST[]) {
  if (res?.$ref) {
    const refArray = splitWithSkip(res.$ref);

    if (refArray[refArray.length - 2] === 'requestBodies') {
      return res;
    }
    if (!/[\u4e00-\u9fa5]/.test(res?.$ref)) {
      return res;
    }

    let ref = refArray[refArray.length - 1];
    for (const item of types) {
      if (item.name === ref) {
        break;
      }

      if (item.schema?.title === ref) {
        ref = item.name;
        break;
      }
    }
    return { ...res, $ref: ref };
  }

  return res;
}

function getPathParams(parameters?: Parameter[]): Parameter[] {
  return (
    parameters?.filter(({ in: In }) => {
      return In === 'path';
    }) || []
  );
}

function getHeaderParams(
  parameters: Parameter[] | undefined,
  types: TypeAST[],
): { params: string; isNullable: boolean } {
  const queryParamsArray =
    parameters?.filter(({ in: In }) => {
      return In === 'header';
    }) || [];

  const params = getObjectType(queryParamsArray, types);

  return {
    params,
    isNullable: queryParamsArray.every(({ schema = {} }) => !schema.required),
  };
}

function toPascalCase(str: string): string {
  return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`;
}
function replaceWithUpper(str: string, sp: string) {
  let pointArray = str.split(sp);
  pointArray = pointArray.map((point) => toPascalCase(point));

  return pointArray.join('');
}

function generateServiceName(endPoint: string, method: string, operationId: string | undefined): string {
  const path = getSchemaName(endPoint);

  const methodNameTemplate = getTemplate('', operationId);

  const serviceName = template(methodNameTemplate, {
    path,
    method,
    ...(operationId ? { operationId } : {}),
  });

  return serviceName;
}

function getTemplate(methodName?: string, operationId?: string) {
  const defaultTemplate = '{method}{path}';
  if (!methodName) {
    return defaultTemplate;
  }

  const hasMethodNameOperationId = /(\{operationId\})/i.test(methodName);

  if (hasMethodNameOperationId) {
    return operationId ? methodName : defaultTemplate;
  }

  return methodName;
}

const TYPES = {
  integer: 'number',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
  string: 'string',
  array: 'array',
};

function getDefineParam(
  types: TypeAST[],
  name: string,
  required: boolean = false,
  schema: Schema | undefined,
  description?: string,
): string {
  return getParamString(name, required, getTsType(schema, types), description);
}

function getParamString(
  name: string,
  required: boolean = false,
  type: string,
  description?: string,
  isPartial?: boolean,
): string {
  return `${getJsdoc({
    description,
  })}${name}${required ? '' : '?'}: ${isPartial ? `Partial<${type}>` : type}`;
}
//x-nullable
function normalizeObjectPropertyNullable(propertyName: string, schema: Schema, required?: string[]) {
  if (schema.nullable !== undefined) {
    return schema.nullable;
  }
  if (schema['x-nullable'] !== undefined) {
    return schema['x-nullable'];
  }
  if (required) {
    return !required.includes(propertyName);
  }
  return true;
}

function getTsType(_schema: undefined | true | Record<string, any> | Schema, types: TypeAST[]): string {
  const schema = getResponses(_schema as any, types);

  if (isTypeAny(schema)) {
    return 'any';
  }

  const { type, $ref, enum: Enum, items, properties, oneOf, additionalProperties, required, allOf } = schema as Schema;

  if ($ref) {
    const refArray = splitWithSkip($ref);

    if (refArray[refArray.length - 2] === 'requestBodies') {
      return `RequestBody${getRefName($ref)}`;
    } else {
      return getRefName($ref);
    }
  }
  if (Enum) {
    return `${Enum.map((e) => JSON.stringify(e)).join(' | ')}`;
  }

  if (items) {
    return `${getTsType(items, types)}[]`;
  }

  let result = '';

  if (properties) {
    result += getObjectType(
      Object.entries(properties).map(([pName, _schema]) => ({
        schema: {
          ..._schema,
          nullable: normalizeObjectPropertyNullable(pName, _schema, required),
        },
        name: pName,
      })),
      types,
    );
  }

  if (oneOf) {
    result = `${result} & (${oneOf.map((t) => `(${getTsType(t, types)})`).join(' | ')})`;
  }

  if (allOf) {
    result = `${result} & (${allOf.map((_schema) => getTsType(_schema, types)).join(' & ')})`;
  }

  if (type === 'object' && !result) {
    if (additionalProperties) {
      return `{[x: string]: ${getTsType(additionalProperties, types)}}`;
    }

    return '{[x in string | number ]: any}';
  }

  return result || TYPES[type as keyof typeof TYPES];
}

function getObjectType(parameter: { schema?: Schema; name: string }[], types: TypeAST[] = []): string {
  const object = parameter.reduce(
    (
      prev,
      { schema: { deprecated, 'x-deprecatedMessage': deprecatedMessage, example, nullable } = {}, schema, name },
    ) => {
      return `${prev}${getJsdoc({
        ...schema,
        deprecated: deprecated || deprecatedMessage ? deprecatedMessage : undefined,
        example,
      })}"${name}"${nullable ? '?' : ''}: ${getTsType(schema, types)};`;
    },
    '',
  );

  return object ? `{${object}}` : '';
}

function getSchemaName(name: string): string {
  ['/', '.', '`', '[', ']', '-', '*', '{', '}'].forEach((str) => {
    name = replaceWithUpper(name, str);
  });

  return name;
}

function getRefName($ref: string): string {
  const parts = splitWithSkip($ref).pop();
  return getSchemaName(parts || '');
}

function getParametersInfo(parameters: Parameter[] | undefined, type: 'query' | 'header') {
  const params =
    parameters?.filter(({ in: In }) => {
      return In === type;
    }) || [];

  return {
    params,
    exist: params.length > 0,
    isNullable: !params.some(
      ({ schema, required }) =>
        //swagger 2
        required ||
        // openapi 3
        schema?.required,
    ),
  };
}

function isTypeAny(type: true | undefined | Record<string, any> | Schema) {
  if (type === true) {
    return true;
  }

  if (typeof type === 'object' && Object.keys(type).length <= 0) {
    return true;
  }

  if (!type || (type as Schema).AnyValue) {
    return true;
  }

  return false;
}

/** Used to replace {name} in string with obj.name */
function template(str: string, obj: { [x: string]: string } = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    const re = new RegExp(`{${key}}`, 'i');
    str = str.replace(re, value);
  });

  const re = new RegExp('{*}', 'g');
  if (re.test(str)) {
    throw new Error(`methodName: Some A key is missed "${str}"`);
  }
  return str;
}

export {
  generateServiceName,
  getDefineParam,
  getHeaderParams,
  getParamString,
  getParametersInfo,
  getPathParams,
  getRefName,
  getResponses,
  getSchemaName,
  getTsType,
  isAscending,
  isTypeAny,
  template,
  toPascalCase,
};
