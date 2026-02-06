import { SERVICE_BEGINNING, SERVICE_NEEDED_FUNCTIONS } from '@/template/tmp';
import {
  ApiAST,
  ConstantsAST,
  Method,
  Parameter,
  Schema,
  SwaggerJson,
  SwaggerRequest,
  SwaggerResponse,
  TypeAST,
} from '@/types';
import {
  generateServiceName,
  getHeaderParams,
  getParametersInfo,
  getPathParams,
  getRefName,
  getSchemaName,
  isTypeAny,
  toPascalCase,
} from '@/utils/generate-utils';
import { generateApis } from './generate-apis.mjs';
import { generateConstants } from './generate-constants.mjs';
import { generateTypes } from './generate-types.mjs';

const getBodyContent = (responses?: SwaggerResponse): Schema | undefined => {
  if (!responses) {
    return responses;
  }

  return responses.content
    ? Object.values(responses.content)[0].schema
    : responses.$ref
      ? ({
          $ref: responses.$ref,
        } as Schema)
      : undefined;
};

const generator = async (input: SwaggerJson, name: string | number) => {
  const apis: ApiAST[] = [];
  const types: TypeAST[] = [];
  let constantsCounter = 0;
  const constants: ConstantsAST[] = [];

  const getConstantName = (value: string) => {
    const constant = constants.find((_constant) => _constant.value === value);
    if (constant) {
      return constant.name;
    }

    const name = `_CONSTANT${constantsCounter++}`;

    constants.push({
      name,
      value,
    });

    return name;
  };

  try {
    Object.entries(input.paths).forEach(([endPoint, value]) => {
      const parametersExtended = value.parameters as Parameter[] | undefined;
      Object.entries(value).forEach(([method, options]: [string, SwaggerRequest]) => {
        if (method === 'parameters') {
          return;
        }

        const { operationId, security } = options;

        const allParameters =
          parametersExtended || options.parameters
            ? [...(parametersExtended || []), ...(options.parameters || [])]
            : undefined;

        const parameters = allParameters?.map<Parameter>((parameter) => {
          const { $ref } = parameter;
          if ($ref) {
            const name = $ref.replace('#/components/parameters/', '');
            return {
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              ...input.components?.parameters?.[name]!,
              $ref,
              schema: { $ref } as Schema,
            };
          }
          return parameter;
        });

        const serviceName = generateServiceName(endPoint, method, operationId);

        const pathParams = getPathParams(parameters);

        const {
          exist: isQueryParamsExist,
          isNullable: isQueryParamsNullable,
          params: queryParameters,
        } = getParametersInfo(parameters, 'query');
        const queryParamsTypeName: string | false = isQueryParamsExist
          ? `${toPascalCase(serviceName)}QueryParams`
          : false;

        if (queryParamsTypeName) {
          types.push({
            name: queryParamsTypeName,
            schema: {
              type: 'object',
              nullable: isQueryParamsNullable,
              properties: queryParameters?.reduce((prev, { name, schema, $ref, required: _required, description }) => {
                return {
                  ...prev,
                  [name]: {
                    ...($ref ? { $ref } : schema),
                    nullable: !_required,
                    description,
                  } as Schema,
                };
              }, {}),
            },
          });
        }

        const { params: headerParams, isNullable: hasNullableHeaderParams } = getHeaderParams(parameters, types);

        const requestBody = getBodyContent(options.requestBody);

        // 为请求体类型创建类型定义
        const requestBodyTypeName: string | false = requestBody && !isTypeAny(requestBody)
          ? `${toPascalCase(serviceName)}RequestBody`
          : false;

        if (requestBodyTypeName) {
          types.push({
            name: requestBodyTypeName,
            schema: requestBody,
            description: options.requestBody?.description,
          });
        }

        const contentType = Object.keys(
          options.requestBody?.content ||
            (options.requestBody?.$ref &&
              input.components?.requestBodies?.[getRefName(options.requestBody.$ref as string)]?.content) || {
              'application/json': null,
            },
        )[0] as ApiAST['contentType'];

        const accept = Object.keys(
          options.responses?.[200]?.content || {
            'application/json': null,
          },
        )[0];

        const responses = getBodyContent(options.responses?.[200]);

        // 为响应类型创建类型定义
        const responseTypeName: string | false = responses && !isTypeAny(responses)
          ? `${toPascalCase(serviceName)}Response`
          : false;

        if (responseTypeName) {
          types.push({
            name: responseTypeName,
            schema: responses,
            description: options.responses?.[200]?.description,
          });
        }

        let pathParamsRefString: string | undefined = pathParams.reduce((prev, { name }) => `${prev}${name},`, '');
        pathParamsRefString = pathParamsRefString ? `{${pathParamsRefString}}` : undefined;

        const additionalAxiosConfig = headerParams
          ? `{
              headers:{
                ...${getConstantName(`{
                  "Content-Type": "${contentType}",
                  Accept: "${accept}",

                }`)},
                ...configOverride?.headers,
              },
            }`
          : getConstantName(`{
              headers: {
                "Content-Type": "${contentType}",
                Accept: "${accept}",
              },
            }`);

        apis.push({
          tags: options.tags,
          contentType,
          summary: options.summary,
          deprecated: options.deprecated,
          serviceName,
          queryParamsTypeName,
          pathParams,
          requestBody,
          requestBodyTypeName,
          headerParams,
          isQueryParamsNullable,
          isHeaderParamsNullable: hasNullableHeaderParams,
          responses,
          responseTypeName,
          pathParamsRefString,
          endPoint,
          method: method as Method,
          security: security ? getConstantName(JSON.stringify(security)) : 'undefined',
          additionalAxiosConfig,
          queryParameters,
        });
      });
    });

    if (input?.components?.schemas) {
      types.push(
        ...Object.entries(input.components.schemas).map(([name, schema]) => {
          return {
            name,
            schema,
          };
        }),
      );
    }

    if (input?.components?.parameters) {
      types.push(
        ...Object.entries(input.components.parameters).map(([key, value]) => ({
          ...value,
          name: key,
        })),
      );
    }

    if (input?.components?.requestBodies) {
      types.push(
        ...(Object.entries(input.components.requestBodies)
          .map(([name, _requestBody]) => {
            return {
              name: `RequestBody${getRefName(name)}`,
              schema: Object.values(_requestBody.content || {})[0]?.schema,
              description: _requestBody.description,
            };
          })
          .filter((v) => v.schema) as any),
      );
    }

    let code = SERVICE_BEGINNING;
    code +=
      types.reduce((prev, { name: _name }) => {
        const name = getSchemaName(_name);

        return prev + ` ${name},`;
      }, 'import type {') + `}  from "./types-${name}"\n`;
    code += generateApis(apis, types, 'createFetch');
    code += generateApis(apis, types, 'createHookFetch');
    code += SERVICE_NEEDED_FUNCTIONS;
    code += generateConstants(constants);

    const type = generateTypes(types);
    const hooks = '';

    return { code, hooks, type };
  } catch (error) {
    console.error({ error });
    return { code: '', hooks: '', type: '' };
  }
};

export { generator };
