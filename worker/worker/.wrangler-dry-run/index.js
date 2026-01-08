var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/rag.ts
async function generateEmbedding(env, text) {
  try {
    const response = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: [text]
    });
    return response.data[0];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}
__name(generateEmbedding, "generateEmbedding");
async function searchRelevantDocuments(env, customerId, query, topK = 3) {
  try {
    const queryEmbedding = await generateEmbedding(env, query);
    const results = await env.VECTORIZE.query(queryEmbedding, {
      topK,
      filter: { customer_id: customerId },
      returnMetadata: true
    });
    return results.matches.map((match) => ({
      id: match.id,
      content: typeof match.metadata?.content === "string" ? match.metadata.content : "",
      score: match.score,
      metadata: match.metadata
    }));
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
}
__name(searchRelevantDocuments, "searchRelevantDocuments");
async function getRelevantContext(env, db, customerId, query) {
  try {
    const embeddings = await searchRelevantDocuments(env, customerId, query, 3);
    if (embeddings.length === 0) {
      return [];
    }
    const documentIds = embeddings.map((e) => e.metadata?.document_id).filter(Boolean);
    if (documentIds.length === 0) {
      return embeddings.map((e) => e.content);
    }
    const placeholders = documentIds.map(() => "?").join(",");
    const query_result = await db.prepare(
      `SELECT id, content, title, source_url
				 FROM knowledge_base
				 WHERE customer_id = ? AND id IN (${placeholders})`
    ).bind(customerId, ...documentIds).all();
    const contextEntries = query_result.results.map((row) => {
      const parts = [];
      if (row.title) {
        parts.push(`Title: ${row.title}`);
      }
      if (row.source_url) {
        parts.push(`Source: ${row.source_url}`);
      }
      parts.push(row.content);
      return parts.join("\n");
    });
    return contextEntries;
  } catch (error) {
    console.error("Error getting relevant context:", error);
    return [];
  }
}
__name(getRelevantContext, "getRelevantContext");

// src/monitoring.ts
var StructuredLogger = class {
  constructor(service, environment, analytics) {
    this.service = service;
    this.environment = environment;
    this.analytics = analytics;
  }
  static {
    __name(this, "StructuredLogger");
  }
  async log(level, message, metadata) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      service: this.service,
      environment: this.environment,
      message,
      metadata
    };
    console.log(JSON.stringify(logEntry));
    if (this.analytics) {
      try {
        this.analytics.writeDataPoint({
          blobs: [level, this.service, message],
          doubles: [Date.now()],
          indexes: [level, this.service]
        });
      } catch (error) {
        console.error("Failed to send log to analytics:", error);
      }
    }
  }
  async info(message, metadata) {
    await this.log("info", message, metadata);
  }
  async warn(message, metadata) {
    await this.log("warn", message, metadata);
  }
  async error(message, metadata) {
    await this.log("error", message, metadata);
  }
  async debug(message, metadata) {
    if (this.environment === "development") {
      await this.log("debug", message, metadata);
    }
  }
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
var ZodError = class _ZodError extends Error {
  static {
    __name(this, "ZodError");
  }
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class _ParseStatus {
  static {
    __name(this, "ParseStatus");
  }
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  static {
    __name(this, "ParseInputLazyPath");
  }
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  static {
    __name(this, "ZodType");
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class _ZodString extends ZodType {
  static {
    __name(this, "ZodString");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class _ZodNumber extends ZodType {
  static {
    __name(this, "ZodNumber");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  static {
    __name(this, "ZodBigInt");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  static {
    __name(this, "ZodBoolean");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  static {
    __name(this, "ZodDate");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  static {
    __name(this, "ZodSymbol");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  static {
    __name(this, "ZodUndefined");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  static {
    __name(this, "ZodNull");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  static {
    __name(this, "ZodAny");
  }
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  static {
    __name(this, "ZodUnknown");
  }
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  static {
    __name(this, "ZodNever");
  }
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  static {
    __name(this, "ZodVoid");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  static {
    __name(this, "ZodArray");
  }
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class _ZodObject extends ZodType {
  static {
    __name(this, "ZodObject");
  }
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  static {
    __name(this, "ZodUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  static {
    __name(this, "ZodDiscriminatedUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  static {
    __name(this, "ZodIntersection");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  static {
    __name(this, "ZodTuple");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  static {
    __name(this, "ZodRecord");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  static {
    __name(this, "ZodMap");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  static {
    __name(this, "ZodSet");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  static {
    __name(this, "ZodFunction");
  }
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  static {
    __name(this, "ZodLazy");
  }
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  static {
    __name(this, "ZodLiteral");
  }
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class _ZodEnum extends ZodType {
  static {
    __name(this, "ZodEnum");
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  static {
    __name(this, "ZodNativeEnum");
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  static {
    __name(this, "ZodPromise");
  }
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  static {
    __name(this, "ZodEffects");
  }
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  static {
    __name(this, "ZodOptional");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  static {
    __name(this, "ZodNullable");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  static {
    __name(this, "ZodDefault");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  static {
    __name(this, "ZodCatch");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  static {
    __name(this, "ZodNaN");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  static {
    __name(this, "ZodBranded");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  static {
    __name(this, "ZodPipeline");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  static {
    __name(this, "ZodReadonly");
  }
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: /* @__PURE__ */ __name((arg) => ZodString.create({ ...arg, coerce: true }), "string"),
  number: /* @__PURE__ */ __name((arg) => ZodNumber.create({ ...arg, coerce: true }), "number"),
  boolean: /* @__PURE__ */ __name((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }), "boolean"),
  bigint: /* @__PURE__ */ __name((arg) => ZodBigInt.create({ ...arg, coerce: true }), "bigint"),
  date: /* @__PURE__ */ __name((arg) => ZodDate.create({ ...arg, coerce: true }), "date")
};
var NEVER = INVALID;

// src/validation.ts
var chatMessageSchema = external_exports.object({
  role: external_exports.enum(["system", "user", "assistant"]),
  content: external_exports.union([
    // String content for text-only messages
    external_exports.string().min(1, "Message cannot be empty").max(1e4, "Message exceeds maximum length of 10000 characters").refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        if (lowerVal.includes("sql") && val.includes(";")) return false;
        if (lowerVal.includes("drop table")) return false;
        if (lowerVal.includes("delete from")) return false;
        return true;
      },
      { message: "Invalid message content detected" }
    ),
    // Array content for multimodal messages (text + images)
    external_exports.array(
      external_exports.object({
        type: external_exports.enum(["text", "image_url"]),
        text: external_exports.string().optional(),
        image_url: external_exports.object({
          url: external_exports.string().url()
        }).optional()
      })
    )
  ])
});
var chatRequestSchema = external_exports.object({
  messages: external_exports.array(chatMessageSchema).min(1, "At least one message is required").max(50, "Too many messages in conversation"),
  stream: external_exports.boolean().optional().default(false),
  temperature: external_exports.number().min(0).max(2).optional(),
  max_tokens: external_exports.number().int().min(1).max(4e3).optional(),
  model: external_exports.string().max(100).optional()
});
var checkoutRequestSchema = external_exports.object({
  email: external_exports.string().email("Invalid email address").max(255),
  success_url: external_exports.string().url().optional(),
  cancel_url: external_exports.string().url().optional()
});
var stripeWebhookSchema = external_exports.object({
  id: external_exports.string(),
  type: external_exports.string(),
  data: external_exports.object({
    object: external_exports.any()
  }),
  created: external_exports.number()
});
var apiKeySchema = external_exports.string().min(10, "Invalid API key format").max(200, "Invalid API key format").regex(/^ib_sk_[a-zA-Z0-9_]+$/, "Invalid API key format");
var MAX_REQUEST_SIZE = 10 * 1024 * 1024;
function validateApiKey(apiKey) {
  if (!apiKey) return false;
  return apiKeySchema.safeParse(apiKey).success;
}
__name(validateApiKey, "validateApiKey");

// src/utils.ts
function generateApiKey() {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  return "ib_sk_" + hex;
}
__name(generateApiKey, "generateApiKey");
function extractTextFromMessage(content) {
  if (typeof content === "string") return content;
  return content.filter((part) => part.type === "text" && part.text).map((part) => part.text).join(" ");
}
__name(extractTextFromMessage, "extractTextFromMessage");

// src/errors.ts
var AppError = class extends Error {
  constructor(code, message, statusCode = 500, metadata) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.name = "AppError";
  }
  static {
    __name(this, "AppError");
  }
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...this.metadata && { details: this.metadata }
    };
  }
};
var ValidationError = class extends AppError {
  static {
    __name(this, "ValidationError");
  }
  constructor(message, field) {
    super("INVALID_REQUEST" /* INVALID_REQUEST */, message, 400, field ? { field } : void 0);
    this.name = "ValidationError";
  }
};
var AuthenticationError = class extends AppError {
  static {
    __name(this, "AuthenticationError");
  }
  constructor(code, message) {
    super(code, message, 401);
    this.name = "AuthenticationError";
  }
};
var RateLimitError = class extends AppError {
  static {
    __name(this, "RateLimitError");
  }
  constructor(retryAfter, limitType) {
    super("RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */, "Rate limit exceeded", 429, { retryAfter, limitType });
    this.name = "RateLimitError";
  }
};
var DatabaseError = class extends AppError {
  static {
    __name(this, "DatabaseError");
  }
  constructor(operation, originalError) {
    super("DATABASE_ERROR" /* DATABASE_ERROR */, `Database operation failed: ${operation}`, 500, {
      operation,
      originalError: originalError?.message
    });
    this.name = "DatabaseError";
  }
};
var ExternalServiceError = class extends AppError {
  static {
    __name(this, "ExternalServiceError");
  }
  constructor(service, operation, originalError) {
    super("AI_MODEL_ERROR" /* AI_MODEL_ERROR */, `${service} service error: ${operation}`, 503, {
      service,
      operation,
      originalError: originalError?.message
    });
    this.name = "ExternalServiceError";
  }
};
var ErrorHandler = class {
  constructor(environment, analytics, monitoring) {
    this.environment = environment;
    this.analytics = analytics;
    this.monitoring = monitoring;
  }
  static {
    __name(this, "ErrorHandler");
  }
  async handleError(error, context) {
    const timestamp = Date.now();
    let appError;
    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = new AppError(
        "INTERNAL_ERROR" /* INTERNAL_ERROR */,
        this.environment === "production" ? "Internal server error" : error.message,
        500,
        { originalError: error.message, stack: error.stack }
      );
    }
    const logData = {
      error: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      timestamp,
      ...context,
      ...appError.metadata && { metadata: appError.metadata }
    };
    console.error("Error handled:", JSON.stringify(logData));
    if (this.analytics) {
      try {
        this.analytics.writeDataPoint({
          blobs: [appError.code, appError.message, this.environment],
          doubles: [appError.statusCode, timestamp],
          indexes: [appError.code, "error"]
        });
      } catch (analyticsError) {
        console.error("Failed to log error to analytics:", analyticsError);
      }
    }
    if (appError.statusCode >= 500 && this.monitoring) {
      try {
        await this.monitoring.sendAlert({
          level: "error",
          title: `${appError.code} Error`,
          message: appError.message,
          metadata: { ...logData, environment: this.environment },
          timestamp
        });
      } catch (monitoringError) {
        console.error("Failed to send error alert:", monitoringError);
      }
    }
    const headers = {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block"
    };
    if (appError instanceof RateLimitError && appError.metadata?.retryAfter) {
      headers["Retry-After"] = String(appError.metadata.retryAfter);
    }
    return new Response(JSON.stringify(appError.toJSON()), {
      status: appError.statusCode,
      headers
    });
  }
};
async function withTimeout(operation, timeoutMs, operationName) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AppError("TIMEOUT_ERROR" /* TIMEOUT_ERROR */, `Operation ${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, `Operation ${operationName} failed: ${error}`);
  }
}
__name(withTimeout, "withTimeout");
async function withDatabase(operation, operationName) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database operation ${operationName} failed:`, error);
    throw new DatabaseError(operationName, error);
  }
}
__name(withDatabase, "withDatabase");
async function withRetry(operation, maxRetries = 3, delayMs = 1e3, operationName = "operation") {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new ExternalServiceError("external-service", operationName, lastError);
}
__name(withRetry, "withRetry");

// src/customer.ts
async function createCustomer(db, email, companyName) {
  return withDatabase(async () => {
    const customerId = "cust_" + generateApiKey().slice(6, 22);
    const apiKey = generateApiKey();
    const now = Math.floor(Date.now() / 1e3);
    await db.prepare(`
			INSERT INTO customers (customer_id, email, company_name, api_key, plan_type, status, rate_limit_per_hour, rate_limit_per_day, created_at, updated_at)
			VALUES (?, ?, ?, ?, 'free', 'active', 5, 20, ?, ?)
		`).bind(customerId, email, companyName, apiKey, now, now).run();
    await db.prepare(`
			INSERT INTO widget_configs (customer_id, created_at, updated_at)
			VALUES (?, ?, ?)
		`).bind(customerId, now, now).run();
    return {
      customer_id: customerId,
      email,
      company_name: companyName,
      api_key: apiKey,
      plan_type: "free",
      status: "active"
    };
  }, "createCustomer");
}
__name(createCustomer, "createCustomer");
async function getCustomerByEmail(db, email) {
  return withDatabase(async () => {
    return await db.prepare("SELECT * FROM customers WHERE email = ?").bind(email).first();
  }, "getCustomerByEmail");
}
__name(getCustomerByEmail, "getCustomerByEmail");
async function updateWidgetConfig(db, customerId, config) {
  return withDatabase(async () => {
    const updates = [];
    const values = [];
    if (config.primary_color) {
      updates.push("primary_color = ?");
      values.push(config.primary_color);
    }
    if (config.bot_name) {
      updates.push("bot_name = ?");
      values.push(config.bot_name);
    }
    if (config.bot_avatar_url !== void 0) {
      updates.push("bot_avatar_url = ?");
      values.push(config.bot_avatar_url || null);
    }
    if (config.greeting_message) {
      updates.push("greeting_message = ?");
      values.push(config.greeting_message);
    }
    if (config.system_prompt) {
      updates.push("system_prompt = ?");
      values.push(config.system_prompt);
    }
    if (updates.length === 0) return false;
    updates.push("updated_at = ?");
    values.push(Math.floor(Date.now() / 1e3));
    values.push(customerId);
    await db.prepare(`
			UPDATE widget_configs SET ${updates.join(", ")} WHERE customer_id = ?
		`).bind(...values).run();
    return true;
  }, "updateWidgetConfig");
}
__name(updateWidgetConfig, "updateWidgetConfig");

// src/playground.ts
function getPlaygroundHTML(origin) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insertabot Playground - Chat with AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
            display: flex;
            flex-direction: column;
        }

        .playground-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
            background: #1e293b;
            box-shadow: 0 0 40px rgba(0,0,0,0.4);
        }

        .playground-header {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            color: white;
            padding: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-title h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }

        .header-title p {
            font-size: 13px;
            opacity: 0.9;
            margin: 4px 0 0 0;
        }

        .quota-badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .quota-bar {
            width: 120px;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            overflow: hidden;
        }

        .quota-fill {
            height: 100%;
            background: rgba(255,255,255,0.9);
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(to bottom, #1e293b, #0f172a);
        }

        .message {
            display: flex;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user {
            justify-content: flex-end;
        }

        .message-bubble {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 12px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .message.assistant .message-bubble {
            background: #334155;
            color: #e2e8f0;
            border-radius: 12px 12px 12px 4px;
        }

        .message.user .message-bubble {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white;
            border-radius: 12px 12px 4px 12px;
        }

        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94a3b8;
            animation: bounce 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        .input-area {
            padding: 20px 24px;
            background: #0f172a;
            border-top: 2px solid #334155;
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .input-form {
            display: flex;
            gap: 12px;
            width: 100%;
            align-items: flex-end;
        }

        .input-field {
            flex: 1;
            padding: 14px 16px;
            border: 2px solid #334155;
            border-radius: 12px;
            font-size: 15px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
            background: #1e293b;
            color: #e2e8f0;
        }

        .input-field:focus {
            border-color: #6366f1;
            background: #0f172a;
            color: #e2e8f0;
        }

        .send-btn {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 80px;
        }

        .send-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            text-align: center;
            padding: 40px;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            color: #cbd5e1;
            margin: 0 0 8px 0;
        }

        .empty-state p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
        }

        @media (max-width: 768px) {
            .playground-container {
                max-width: 100%;
                border-radius: 0;
            }

            .message-bubble {
                max-width: 85%;
            }
        }
    </style>
</head>
<body>
    <div class="playground-container">
        <div class="playground-header">
            <div class="header-info">
                <div class="header-title">
                    <h1>Insertabot Playground</h1>
                    <p>Chat with AI, test unlimited ideas</p>
                </div>
            </div>
            <div class="quota-badge">
                <span id="quota-text">50/50</span>
                <div class="quota-bar">
                    <div class="quota-fill" id="quota-fill" style="width: 100%"></div>
                </div>
            </div>
        </div>

        <div class="messages-area" id="messages"></div>

        <div class="input-area">
            <form class="input-form" id="chat-form">
                <input
                    type="text"
                    id="user-input"
                    class="input-field"
                    placeholder="Ask me anything..."
                    autocomplete="off"
                />
                <button type="submit" class="send-btn" id="send-btn">Send</button>
            </form>
        </div>
    </div>

    <script>
        const API_ENDPOINT = '${origin}/v1/chat/completions';
        // Demo API key - automatically configured for the playground
        const API_KEY = 'ib_sk_demo_0fc7793e948d37c9ef0422ff3df1edc6bb47dfd9458ff2b03f9e614c57b3898f';
        const QUOTA_MAX = 50;
        const STORAGE_KEY = 'playground_quota';

        let conversationHistory = [];
        let quotaUsed = 0;
        let isProcessing = false;

        function initPlayground() {
            loadQuota();
            updateQuotaDisplay();

            const messagesDiv = document.getElementById('messages');
            if (messagesDiv.children.length === 0) {
                showEmptyState();
            }

            document.getElementById('chat-form').addEventListener('submit', handleSendMessage);
        }

        function showEmptyState() {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u{1F4AC}</div><h3>Welcome to Insertabot</h3><p>Start a conversation by typing a message below</p></div>';
        }

        function loadQuota() {
            const today = new Date().toDateString();
            const stored = localStorage.getItem(STORAGE_KEY);

            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    quotaUsed = data.used;
                    return;
                }
            }

            quotaUsed = 0;
            saveQuota();
        }

        function saveQuota() {
            const today = new Date().toDateString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: today,
                used: quotaUsed
            }));
        }

        function updateQuotaDisplay() {
            const remaining = QUOTA_MAX - quotaUsed;
            document.getElementById('quota-text').textContent = remaining + '/50';
            const percentUsed = (quotaUsed / QUOTA_MAX) * 100;
            document.getElementById('quota-fill').style.width = (100 - percentUsed) + '%';
        }

        async function handleSendMessage(e) {
            e.preventDefault();

            if (isProcessing) return;

            const input = document.getElementById('user-input');
            const message = input.value.trim();

            if (!message) return;

            if (quotaUsed >= QUOTA_MAX) {
                alert('Daily limit reached! Upgrade to Pro for unlimited messages.');
                return;
            }

            input.value = '';
            input.disabled = true;
            document.getElementById('send-btn').disabled = true;
            isProcessing = true;

            const messagesDiv = document.getElementById('messages');
            if (messagesDiv.querySelector('.empty-state')) {
                messagesDiv.innerHTML = '';
            }

            addMessage('user', message);
            conversationHistory.push({ role: 'user', content: message });

            try {
                const systemMessage = {
                    role: 'system',
                    content: 'You are a helpful, friendly AI assistant. Answer questions directly and concisely.'
                };

                const messagesToSend = [systemMessage, ...conversationHistory];

                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY
                    },
                    body: JSON.stringify({
                        messages: messagesToSend,
                        stream: true,
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = '';
                let messageDiv = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const token = parsed.choices?.[0]?.delta?.content;

                                if (token) {
                                    accumulatedText += token;

                                    if (!messageDiv) {
                                        messageDiv = addMessage('assistant', token);
                                    } else {
                                        messageDiv.querySelector('.message-bubble').textContent = accumulatedText;
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                }

                conversationHistory.push({ role: 'assistant', content: accumulatedText });
                quotaUsed++;
                saveQuota();
                updateQuotaDisplay();

            } catch (error) {
                console.error('Error:', error);
                addMessage('assistant', '\u26A0\uFE0F Sorry, something went wrong. Please try again.');
            } finally {
                input.disabled = false;
                document.getElementById('send-btn').disabled = false;
                isProcessing = false;
                input.focus();
            }
        }

        function addMessage(role, content) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + role;

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = content;

            messageDiv.appendChild(bubble);
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            return messageDiv;
        }

        initPlayground();
    <\/script>
</body>
</html>`;
}
__name(getPlaygroundHTML, "getPlaygroundHTML");

// src/html/dashboard.ts
function getDashboardHTML(customer, widgetConfig, origin) {
  const embedCode = `<script src="${origin}/widget.js" data-api-key="${customer.api_key}"><\/script>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) - Loaded only after user consent -->
    <script>
      window.dataLayer = window.dataLayer || [];
      
      function gtag(){dataLayer.push(arguments);}
      
      function loadGoogleTag() {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-PDSX0R0Q3Y';
        document.head.appendChild(s);
        
        gtag('js', new Date());
        gtag('config', 'G-PDSX0R0Q3Y');
      }
      
      // Load if consent already exists
      if (localStorage.getItem('cookieConsent') === 'true') {
        loadGoogleTag();
      }
      
      // Listen for consent being granted
      window.addEventListener('storage', function(e) {
        if (e.key === 'cookieConsent' && e.newValue === 'true') {
          loadGoogleTag();
        }
      });
    <\/script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000000;
            color: #e2e8f0;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(10, 10, 10, 0.8);
            border: 1px solid rgba(0, 245, 255, 0.3);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00f5ff, #ff00ff, #00f5ff, transparent);
        }
        .header h1 {
            font-size: 28px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .plan-badge {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .card {
            background: rgba(10, 10, 10, 0.8);
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s;
            position: relative;
        }
        .card:hover {
            border-color: rgba(0, 245, 255, 0.5);
            box-shadow: 0 0 25px rgba(0, 245, 255, 0.1);
            transform: translateY(-2px);
        }
        .card h2 {
            font-size: 18px;
            margin-bottom: 16px;
            color: #00f5ff;
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
        }
        .code-box {
            background: #000000;
            border: 1px solid rgba(0, 245, 255, 0.3);
            border-radius: 8px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            word-break: break-all;
            position: relative;
        }
        .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
            transition: all 0.2s;
        }
        .copy-btn:hover {
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.5);
            transform: scale(1.05);
        }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #94a3b8; }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 10px;
            background: #000000;
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
            transition: all 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: #00f5ff;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.2);
        }
        .btn {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
            transition: all 0.2s;
        }
        .btn:hover {
            box-shadow: 0 0 25px rgba(0, 245, 255, 0.5);
            transform: translateY(-2px);
        }
        .stat {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }
        .stat-label { font-size: 14px; color: #94a3b8; }
        .success {
            background: linear-gradient(135deg, #00f5ff, #00ff88);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
        }
    </style>
</head>
<body>
    <div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#fff;padding:20px;z-index:9999999;box-shadow:0 -2px 10px rgba(0,0,0,0.3);"><div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;"><p style="margin:0;font-size:14px;flex:1;min-width:250px;">We use cookies to improve your experience. By clicking "Accept", you consent to our use of cookies.</p><div style="display:flex;gap:10px;"><button onclick="acceptCookies()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Accept</button><button onclick="declineCookies()" style="background:#6b7280;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Decline</button></div></div></div>
    <script>if(!localStorage.getItem('cookieConsent'))document.getElementById('cookie-banner').style.display='block';function acceptCookies(){localStorage.setItem('cookieConsent','true');document.getElementById('cookie-banner').style.display='none';location.reload();}function declineCookies(){localStorage.setItem('cookieConsent','false');document.getElementById('cookie-banner').style.display='none';}<\/script>
    <div class="container">
        <div class="header">
            <div>
                <h1>Dashboard</h1>
                <p style="color: #94a3b8; margin-top: 4px;">${customer.company_name}</p>
            </div>
            <div class="plan-badge">${customer.plan_type} Plan</div>
        </div>

        <div id="success-msg" class="success">Settings saved successfully!</div>

        <div class="grid">
            <div class="card">
                <h2>\u{1F511} API Key</h2>
                <div class="code-box">
                    ${customer.api_key}
                    <button class="copy-btn" onclick="copy('${customer.api_key}')">Copy</button>
                </div>
            </div>

            <div class="card">
                <h2>\u{1F4CA} Usage</h2>
                <div class="stat">${customer.rate_limit_per_day}</div>
                <div class="stat-label">Messages per day</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
            <h2>\u{1F4DD} Embed Code</h2>
            <p style="color: #94a3b8; margin-bottom: 12px; font-size: 14px;">
                Copy and paste this code before the closing &lt;/body&gt; tag on your website:
            </p>
            <div class="code-box">
                ${embedCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                <button class="copy-btn" onclick="copy(\`${embedCode}\`)">Copy</button>
            </div>
        </div>

        <div class="card">
            <h2>\u{1F3A8} Widget Customization</h2>
            <form id="config-form">
                <div class="form-group">
                    <label>Bot Name</label>
                    <input type="text" name="bot_name" value="${widgetConfig.bot_name}" />
                </div>
                <div class="form-group">
                    <label>Bot Avatar URL (optional)</label>
                    <input type="url" name="bot_avatar_url" value="${widgetConfig.bot_avatar_url || ""}" placeholder="https://example.com/logo.png" />
                </div>
                <div class="form-group">
                    <label>Primary Color</label>
                    <input type="color" name="primary_color" value="${widgetConfig.primary_color}" />
                </div>
                <div class="form-group">
                    <label>Greeting Message</label>
                    <input type="text" name="greeting_message" value="${widgetConfig.greeting_message}" />
                </div>
                <div class="form-group">
                    <label>System Prompt</label>
                    <textarea name="system_prompt" rows="4">${widgetConfig.system_prompt}</textarea>
                </div>
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
    </div>

    <script>
        function copy(text) {
            navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        }

        document.getElementById('config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            const response = await fetch('/api/customer/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': '${customer.api_key}'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                document.getElementById('success-msg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('success-msg').style.display = 'none';
                }, 3000);
            }
        });
    <\/script>
</body>
</html>`;
}
__name(getDashboardHTML, "getDashboardHTML");

// src/html/signup.ts
function getSignupHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) - Loaded only after user consent -->
    <script>
      window.dataLayer = window.dataLayer || [];
      
      function gtag(){dataLayer.push(arguments);}
      
      function loadGoogleTag() {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-PDSX0R0Q3Y';
        document.head.appendChild(s);
        
        gtag('js', new Date());
        gtag('config', 'G-PDSX0R0Q3Y');
      }
      
      // Load if consent already exists
      if (localStorage.getItem('cookieConsent') === 'true') {
        loadGoogleTag();
      }
      
      // Listen for consent being granted
      window.addEventListener('storage', function(e) {
        if (e.key === 'cookieConsent' && e.newValue === 'true') {
          loadGoogleTag();
        }
      });
    <\/script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Insertabot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000000;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.03), transparent 50%);
            pointer-events: none;
        }
        .signup-container {
            background: rgba(10, 10, 10, 0.9);
            border: 1px solid rgba(0, 245, 255, 0.3);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 0 40px rgba(0, 245, 255, 0.15);
            position: relative;
            z-index: 1;
        }
        .signup-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00f5ff, #ff00ff, #00f5ff, transparent);
            border-radius: 20px 20px 0 0;
        }
        h1 {
            font-size: 36px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle { color: #94a3b8; margin-bottom: 32px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #94a3b8; }
        .form-group input {
            width: 100%;
            padding: 12px;
            background: #000000;
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
            transition: all 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #00f5ff;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.2);
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            margin-top: 8px;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
            transition: all 0.2s;
        }
        .btn:hover {
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.5);
            transform: translateY(-2px);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        .error {
            background: linear-gradient(135deg, #ff0055, #ff00ff);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
        }
        .features {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(0, 245, 255, 0.2);
        }
        .feature {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #94a3b8;
        }
        .back-link {
            text-align: center;
            margin-top: 24px;
        }
        .back-link a {
            color: #00f5ff;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s;
        }
        .back-link a:hover {
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
    </style>
</head>
<body>
    <div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#fff;padding:20px;z-index:9999999;box-shadow:0 -2px 10px rgba(0,0,0,0.3);"><div style="max-width:800px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;"><p style="margin:0;font-size:14px;flex:1;min-width:250px;">We use cookies to improve your experience. By clicking "Accept", you consent to our use of cookies.</p><div style="display:flex;gap:10px;"><button onclick="acceptCookies()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Accept</button><button onclick="declineCookies()" style="background:#6b7280;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">Decline</button></div></div></div>
    <script>if(!localStorage.getItem('cookieConsent'))document.getElementById('cookie-banner').style.display='block';function acceptCookies(){localStorage.setItem('cookieConsent','true');document.getElementById('cookie-banner').style.display='none';location.reload();}function declineCookies(){localStorage.setItem('cookieConsent','false');document.getElementById('cookie-banner').style.display='none';}<\/script>
    <div class="signup-container">
        <h1>Start Free Trial</h1>
        <p class="subtitle">Get 20 free messages per day. No credit card required.</p>

        <div id="error-msg" class="error"></div>

        <form id="signup-form">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="you@company.com" />
            </div>
            <div class="form-group">
                <label>Company Name</label>
                <input type="text" name="company_name" required placeholder="Your Company" />
            </div>
            <button type="submit" class="btn" id="submit-btn">Create Free Account</button>
        </form>

        <div class="features">
            <div class="feature">\u2713 20 messages per day</div>
            <div class="feature">\u2713 Full AI capabilities</div>
            <div class="feature">\u2713 Customizable widget</div>
            <div class="feature">\u2713 Upgrade anytime</div>
        </div>

        <div class="back-link">
            <a href="/">\u2190 Back to home</a>
        </div>
    </div>

    <script>
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const errorMsg = document.getElementById('error-msg');
            
            btn.disabled = true;
            btn.textContent = 'Creating account...';
            errorMsg.style.display = 'none';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/customer/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // amazonq-ignore-next-line
                    window.location.href = '/dashboard?key=' + result.api_key;
                } else {
                    errorMsg.textContent = result.error || 'Failed to create account';
                    errorMsg.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = 'Create Free Account';
                }
            } catch (error) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Create Free Account';
            }
        });
    <\/script>
</body>
</html>`;
}
__name(getSignupHTML, "getSignupHTML");

// src/html/landing.ts
function getLandingHTML(origin) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insertabot by Mistyk Media - AI Chatbot Platform for Every Brand</title>
    <meta name="description" content="Deploy white-label AI chatbots powered by Cloudflare Workers AI. No code required. Multi-tenant SaaS platform.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            background: #000000;
            color: #e2e8f0;
        }
        nav {
            background: rgba(10, 10, 10, 0.95);
            border-bottom: 1px solid rgba(0, 245, 255, 0.2);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        nav .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        nav .nav-links {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        nav a {
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s;
            font-size: 15px;
        }
        nav a:hover {
            color: #00f5ff;
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
        nav .nav-cta {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
        }
        nav .nav-cta:hover {
            box-shadow: 0 0 25px rgba(0, 245, 255, 0.5);
            transform: translateY(-1px);
        }
        .hero {
            background: linear-gradient(135deg, #050505 0%, #0a0a0a 100%);
            color: white;
            padding: 120px 20px;
            text-align: center;
            position: relative;
            border-bottom: 2px solid transparent;
            border-image: linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff) 1;
        }
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.05), transparent 70%);
            pointer-events: none;
        }
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #00f5ff, #ff00ff, #00f5ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
        }
        .hero p {
            font-size: 1.5rem;
            margin-bottom: 40px;
            color: #94a3b8;
            position: relative;
            z-index: 1;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            padding: 16px 48px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            transition: all 0.3s;
            border: 2px solid transparent;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
            position: relative;
            z-index: 1;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3);
        }
        .features {
            max-width: 1200px;
            margin: 80px auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .feature {
            text-align: center;
            padding: 40px 30px;
            background: rgba(10, 10, 10, 0.6);
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 16px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .feature::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00f5ff, transparent);
            transition: left 0.5s;
        }
        .feature:hover::before {
            left: 100%;
        }
        .feature:hover {
            border-color: rgba(0, 245, 255, 0.5);
            box-shadow: 0 0 30px rgba(0, 245, 255, 0.1);
            transform: translateY(-5px);
        }
        .feature h3 {
            color: #00f5ff;
            margin-bottom: 15px;
            font-size: 1.5rem;
            text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
        }
        .feature p {
            color: #94a3b8;
            line-height: 1.8;
        }
        .demo {
            background: linear-gradient(135deg, #050505 0%, #0a0a0a 100%);
            padding: 100px 20px;
            text-align: center;
            border-top: 2px solid transparent;
            border-bottom: 2px solid transparent;
            border-image: linear-gradient(90deg, #ff00ff, #00f5ff, #ff00ff) 1;
            position: relative;
        }
        .demo::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.05), transparent 70%);
            pointer-events: none;
        }
        .demo h2 {
            font-size: 2.8rem;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ff00ff, #00f5ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
        }
        .demo p {
            font-size: 1.2rem;
            color: #94a3b8;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }
        footer {
            background: #000000;
            color: #64748b;
            padding: 50px 20px;
            text-align: center;
            border-top: 1px solid rgba(0, 245, 255, 0.2);
        }
    </style>
</head>
<body>
    <nav>
        <div class="logo">Insertabot</div>
        <div class="nav-links">
            <a href="/playground">Playground</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/signup" class="nav-cta">Get Started Free</a>
        </div>
    </nav>
    <div class="hero">
        <img src="/logo.png" alt="Insertabot Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h1>Insertabot</h1>
        <p>AI-Powered Chatbot Widget for Your Website</p>
        <div style="display: flex; gap: 20px; justify-content: center; align-items: center;">
            <a href="/signup" class="cta-button">Get Started Free</a>
            <a href="/playground" class="cta-button" style="background: transparent; border: 2px solid #00f5ff; box-shadow: none;">Try Live Demo \u2192</a>
        </div>
    </div>

    <div class="features">
        <div class="feature">
            <h3>\u26A1 Instant Setup</h3>
            <p>Add AI chat to your website with one script tag. No complex configuration required.</p>
        </div>
        <div class="feature">
            <h3>\u{1F3A8} Fully Customizable</h3>
            <p>Colors, position, bot name, avatar, and system prompts - make it yours.</p>
        </div>
        <div class="feature">
            <h3>\u{1F9E0} Smart AI</h3>
            <p>Powered by Cloudflare Workers AI with web search capabilities for current information.</p>
        </div>
        <div class="feature">
            <h3>\u{1F512} Secure</h3>
            <p>API key authentication, rate limiting, and CORS protection built-in.</p>
        </div>
        <div class="feature">
            <h3>\u{1F4B3} Stripe Integration</h3>
            <p>Built-in subscription management with Stripe for easy monetization.</p>
        </div>
        <div class="feature">
            <h3>\u{1F4CA} Analytics</h3>
            <p>Track usage and performance with built-in analytics engine.</p>
        </div>
    </div>

    <div class="demo">
        <h2>See It In Action</h2>
        <p>Click the chat button in the bottom right corner to try our demo bot!</p>
        <p style="color: #999; font-size: 0.9rem;">Powered by Cloudflare Workers AI \u2022 Llama 3.1 8B</p>
    </div>

    <footer>
        <p>&copy; 2024 Mistyk Media. All rights reserved.</p>
        <p style="margin-top: 10px; opacity: 0.7;">Built with Cloudflare Workers \u2022 D1 \u2022 KV \u2022 Vectorize</p>
    </footer>

    <!-- Live Demo Widget -->
    <script src="${origin}/widget.js" data-api-key="ib_sk_demo_0fc7793e948d37c9ef0422ff3df1edc6bb47dfd9458ff2b03f9e614c57b3898f"><\/script>
</body>
</html>`;
}
__name(getLandingHTML, "getLandingHTML");

// src/html/widget-script.ts
function getWidgetScript(apiOrigin) {
  return `(function() {
    'use strict';

    // ============================================================================
    // API KEY VALIDATION - Prevents silent failures
    // ============================================================================
    const scriptElement = document.currentScript;
    const apiKey = scriptElement?.getAttribute("data-api-key");
    
    // Validate API key exists and is not a placeholder
    if (!apiKey || apiKey === "" || apiKey === "ib_sk_demo_REPLACE") {
        console.error("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
        console.error("\u{1F6AB} [Insertabot] MISSING OR INVALID API KEY");
        console.error("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
        console.error("");
        console.error("The Insertabot widget requires a valid API key to function.");
        console.error("");
        console.error("\u274C Current value:", apiKey || "(empty)");
        console.error("");
        console.error("\u{1F4DD} Correct usage:");
        console.error('   <script src="' + scriptElement?.src + '"');
        console.error('           data-api-key="YOUR_API_KEY_HERE"><\/script>');
        console.error("");
        console.error("\u{1F511} Get your API key:");
        console.error("   \u2192 Sign up at: https://insertabot.io/signup");
        console.error("   \u2192 Or visit dashboard: https://insertabot.io/dashboard");
        console.error("");
        console.error("\u{1F4A1} Need help? Check the docs:");
        console.error("   https://github.com/M1ztick/insertabot_by_mistyk_media/blob/main/SETUP_GUIDE.md");
        console.error("");
        console.error("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
        
        // Show visual error indicator on page
        const errorBanner = document.createElement("div");
        errorBanner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#dc2626;color:white;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(220,38,38,0.4);z-index:9999999;font-family:system-ui,-apple-system,sans-serif;max-width:400px;animation:slideInRight 0.3s ease-out';
        errorBanner.innerHTML = '<div style="display:flex;align-items:start;gap:12px"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><div><strong style="display:block;font-size:15px;margin-bottom:4px">Insertabot Configuration Error</strong><p style="margin:0;font-size:13px;opacity:0.95;line-height:1.4">Missing API key. Check browser console for details.</p></div><button onclick="this.parentElement.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;padding:4px;border-radius:6px;margin-left:auto" aria-label="Dismiss"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4L4 12M4 4l8 8"/></svg></button></div><style>@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}</style>';
        document.body.appendChild(errorBanner);
        
        // Auto-dismiss after 15 seconds
        setTimeout(() => errorBanner.remove(), 15000);
        
        return; // Stop widget initialization
    }

    // Configuration & State Management
    const InsertabotCore = {
        scriptRef: scriptElement,
        credentials: {
            key: apiKey, // Now guaranteed to be valid
            endpoint: scriptElement?.getAttribute("data-api-base") || "${apiOrigin}"
        },
        quotas: {
            freeTierMax: 50,
            storageIdentifier: 'ib_usage_tracker'
        },
        state: {
            widgetConfig: null,
            isWidgetVisible: false,
            conversationHistory: [],
            processingRequest: false,
            userQuota: { consumed: 0, resetDate: null },
            requestAbortSignal: null,
            subscriptionTier: 'free'
        },
        ui: {
            launcher: null,
            chatFrame: null,
            messageContainer: null,
            inputField: null,
            submitForm: null
        }
    };

    // Quota Management System
    const QuotaManager = {
        retrieveUsageData() {
            const cached = localStorage.getItem(InsertabotCore.quotas.storageIdentifier);
            if (!cached) return this.resetQuota();

            const parsedData = JSON.parse(cached);
            const currentDate = new Date().toDateString();

            if (parsedData.resetDate !== currentDate) {
                return this.resetQuota();
            }
            return parsedData;
        },

        resetQuota() {
            const freshQuota = { consumed: 0, resetDate: new Date().toDateString() };
            localStorage.setItem(InsertabotCore.quotas.storageIdentifier, JSON.stringify(freshQuota));
            return freshQuota;
        },

        recordUsage() {
            const usage = this.retrieveUsageData();
            usage.consumed++;
            localStorage.setItem(InsertabotCore.quotas.storageIdentifier, JSON.stringify(usage));
            return usage.consumed;
        },

        hasReachedLimit() {
            const usage = this.retrieveUsageData();
            return usage.consumed >= InsertabotCore.quotas.freeTierMax;
        }
    };

    // Upgrade Prompt System
    const UpgradePrompt = {
        display() {
            const overlay = document.createElement('div');
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000000;font-family:system-ui,-apple-system,sans-serif;animation:fadeIn 0.2s ease-out';

            overlay.innerHTML = '<div style="background:#ffffff;border-radius:20px;padding:40px;max-width:440px;box-shadow:0 25px 75px rgba(0,0,0,0.25);text-align:center;animation:slideUp 0.3s ease-out"><div style="width:64px;height:64px;margin:0 auto 20px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:50%;display:flex;align-items:center;justify-content:center"><svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><h2 style="margin:0 0 12px;font-size:28px;color:#111827;font-weight:700">Daily Limit Reached</h2><p style="margin:0 0 28px;color:#6b7280;font-size:17px;line-height:1.6">You\\'ve used all <strong>50 free messages</strong> today.<br>Upgrade to Pro for unlimited playground chats + 500 embedded messages/month.</p><div style="display:flex;gap:12px;flex-direction:column"><a href="#pricing" style="display:block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:16px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(99,102,241,0.4);transition:transform 0.2s,box-shadow 0.2s" onmouseover="this.style.transform=\\'translateY(-2px)\\';this.style.boxShadow=\\'0 6px 20px rgba(99,102,241,0.5)\\'" onmouseout="this.style.transform=\\'\\';this.style.boxShadow=\\'0 4px 14px rgba(99,102,241,0.4)\\'" onclick="this.closest(\\'[role=dialog]\\').remove();document.querySelector(\\'#pricing\\')?.scrollIntoView({behavior:\\'smooth\\'})">\u26A1 Upgrade to Pro \u2014 $9.99/mo</a><button onclick="this.closest(\\'[role=dialog]\\').remove()" style="background:#f3f4f6;color:#374151;padding:14px 28px;border:2px solid #e5e7eb;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\\'#e5e7eb\\'" onmouseout="this.style.background=\\'#f3f4f6\\'">Continue Tomorrow</button></div><p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Resets at midnight in your local timezone</p></div><style>@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>';
            document.body.appendChild(overlay);
        }
    };

    // Configuration Loader
    const ConfigLoader = {
        async fetch() {
            try {
                const response = await fetch(InsertabotCore.credentials.endpoint + '/v1/widget/config', {
                    headers: { "X-API-Key": InsertabotCore.credentials.key }
                });

                if (!response.ok) {
                    throw new Error('Configuration fetch failed with status: ' + response.status);
                }

                InsertabotCore.state.widgetConfig = await response.json();
                return InsertabotCore.state.widgetConfig;
            } catch (err) {
                console.error("[Insertabot] Configuration retrieval error:", err);
                throw err;
            }
        }
    };

    // UI Builder - Launcher Button
    const LauncherButton = {
        build() {
            const cfg = InsertabotCore.state.widgetConfig;
            const button = document.createElement("button");
            button.id = "ib-launcher";
            button.setAttribute('aria-label', 'Open chat widget');
            button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';

            const position = cfg.position === "bottom-left" ? "left:28px" : "right:28px";
            button.style.cssText = 'position:fixed;bottom:28px;' + position + ';width:64px;height:64px;background:' + cfg.primary_color + ';border:none;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);z-index:9999998;';

            button.addEventListener("mouseenter", function() {
                button.style.transform = "scale(1.15) rotate(5deg)";
                button.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
            });
            button.addEventListener("mouseleave", function() {
                button.style.transform = "scale(1) rotate(0deg)";
                button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
            });
            button.addEventListener("click", function() {
                WidgetController.toggle();
            });

            document.body.appendChild(button);
            InsertabotCore.ui.launcher = button;
        }
    };

    // Message Renderer
    const MessageRenderer = {
        create(sender, textContent) {
            InsertabotCore.state.conversationHistory.push({ role: sender, content: textContent });

            const bubble = document.createElement("div");
            bubble.className = 'ib-msg ib-msg-' + sender;
            bubble.innerHTML = '<div class="ib-msg-text">' + this.sanitize(textContent) + '</div>';

            InsertabotCore.ui.messageContainer.appendChild(bubble);
            this.scrollToBottom();
            return bubble;
        },

        update(bubbleElement, textContent) {
            bubbleElement.querySelector(".ib-msg-text").textContent = textContent;
            this.scrollToBottom();
            return bubbleElement;
        },

        sanitize(rawText) {
            const wrapper = document.createElement('div');
            wrapper.textContent = rawText;
            return wrapper.innerHTML;
        },

        scrollToBottom() {
            InsertabotCore.ui.messageContainer.scrollTop = InsertabotCore.ui.messageContainer.scrollHeight;
        }
    };

    // AI Communication Handler
    const AIMessenger = {
        async process(userInput) {
            const usageCount = QuotaManager.recordUsage();
            console.log('[Insertabot] Request #' + usageCount + '/' + InsertabotCore.quotas.freeTierMax);

            InsertabotCore.state.requestAbortSignal = new AbortController();
            const cfg = InsertabotCore.state.widgetConfig;

            const payload = {
                messages: InsertabotCore.state.conversationHistory,
                stream: true,
                temperature: cfg.temperature,
                max_tokens: cfg.max_tokens
            };

            try {
                const apiResponse = await fetch(InsertabotCore.credentials.endpoint + '/v1/chat/completions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": InsertabotCore.credentials.key
                    },
                    body: JSON.stringify(payload),
                    signal: InsertabotCore.state.requestAbortSignal.signal
                });

                if (!apiResponse.ok) {
                    let errText = null;
                    try {
                        const json = await apiResponse.json();
                        errText = json?.error || JSON.stringify(json);
                    } catch (e) {
                        try { errText = await apiResponse.text(); } catch (e2) { }
                    }
                    console.error('[Insertabot] API response error', apiResponse.status, errText);
                    throw new Error(errText || 'API request failed (status=' + apiResponse.status + ')');
                }

                const streamReader = apiResponse.body.getReader();
                const textDecoder = new TextDecoder();
                let accumulatedResponse = "";
                let messageBubble = null;

                while (true) {
                    const result = await streamReader.read();
                    if (result.done) break;

                    const chunk = textDecoder.decode(result.value, { stream: true });
                    chunk.split("\\n")
                        .filter(function(line) { return line.trim(); })
                        .forEach(function(line) {
                            if (line.startsWith("data: ")) {
                                const payload = line.slice(6);
                                if (payload === "[DONE]") return;

                                try {
                                    const parsed = JSON.parse(payload);
                                    const token = parsed.choices?.[0]?.delta?.content;
                                    if (token) {
                                        accumulatedResponse += token;
                                        messageBubble = messageBubble
                                            ? MessageRenderer.update(messageBubble, accumulatedResponse)
                                            : MessageRenderer.create("assistant", accumulatedResponse);
                                    }
                                } catch (parseErr) {
                                    // Ignore malformed JSON chunks
                                }
                            }
                        });
                }

                InsertabotCore.state.conversationHistory.push({
                    role: "assistant",
                    content: accumulatedResponse
                });

                // Check quota limit
                if (usageCount >= InsertabotCore.quotas.freeTierMax) {
                    setTimeout(function() { UpgradePrompt.display(); }, 1200);
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("[Insertabot] Communication error:", err);
                    MessageRenderer.create("assistant", "\u26A0\uFE0F Unable to process your message. Please retry.");
                }
            }
        }
    };

    // Main Chat Interface Builder
    const ChatInterface = {
        build() {
            const cfg = InsertabotCore.state.widgetConfig;
            const frame = document.createElement("div");
            frame.id = "ib-chat-frame";
            frame.setAttribute('role', 'complementary');
            frame.setAttribute('aria-label', 'Chat interface');

            const alignment = cfg.position === "bottom-left" ? "left:28px" : "right:28px";
            frame.style.cssText = 'position:fixed;bottom:28px;' + alignment + ';width:420px;max-width:calc(100vw - 56px);height:640px;max-height:calc(100vh - 120px);background:#ffffff;border-radius:20px;box-shadow:0 12px 48px rgba(0,0,0,0.18);display:none;flex-direction:column;overflow:hidden;z-index:9999998;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,\\'Helvetica Neue\\',Arial,sans-serif;';

            frame.innerHTML = '<header style="background:' + cfg.primary_color + ';color:#fff;padding:20px;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0"><div style="display:flex;align-items:center;gap:12px">' + (cfg.bot_avatar_url ? '<img src="' + cfg.bot_avatar_url + '" alt="Bot avatar" style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);object-fit:cover"/>' : '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:bold">' + cfg.bot_name[0] + '</div>') + '<div><div style="font-weight:600;font-size:16px;letter-spacing:-0.2px">' + cfg.bot_name + '</div><div style="font-size:12px;opacity:0.9;margin-top:2px">\u{1F7E2} Active now</div></div></div><button id="ib-close-btn" aria-label="Close chat" style="background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div id="ib-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(to bottom, #f8fafc, #f1f5f9)"></div><footer style="padding:18px;background:#fff;border-top:2px solid #e2e8f0"><form id="ib-input-form" style="display:flex;gap:10px;align-items:flex-end"><input type="text" id="ib-text-input" placeholder="Ask me anything..." aria-label="Message input" style="flex:1;padding:14px 16px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;outline:none;font-family:inherit;transition:border-color 0.2s;background:#f8fafc"/><button type="submit" id="ib-send-btn" aria-label="Send message" style="background:' + cfg.primary_color + ';color:white;border:none;border-radius:12px;padding:14px 24px;cursor:pointer;font-weight:700;font-size:15px;transition:opacity 0.2s;min-width:80px" onmouseover="if(!this.disabled) this.style.opacity=\\'0.85\\'" onmouseout="this.style.opacity=\\'1\\'">Send</button></form></footer>';

            // Inject custom styles
            const styleSheet = document.createElement("style");
            styleSheet.textContent = '#ib-messages::-webkit-scrollbar { width: 8px; }#ib-messages::-webkit-scrollbar-track { background: transparent; }#ib-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }#ib-messages::-webkit-scrollbar-thumb:hover { background: #94a3b8; }.ib-msg { display: flex; gap: 10px; max-width: 85%; animation: slideIn 0.3s ease-out; }.ib-msg-user { margin-left: auto; flex-direction: row-reverse; }.ib-msg-text { background: #ffffff; color: #1e293b; padding: 12px 16px; border-radius: 16px; font-size: 15px; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.06); word-wrap: break-word; }.ib-msg-user .ib-msg-text { background: ' + cfg.primary_color + '; color: #fff; border-bottom-right-radius: 4px; }.ib-msg-assistant .ib-msg-text { border-bottom-left-radius: 4px; }#ib-text-input:focus { border-color: ' + cfg.primary_color + '; background: #fff; }#ib-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }';
            document.head.appendChild(styleSheet);
            document.body.appendChild(frame);

            // Store UI references
            InsertabotCore.ui.chatFrame = frame;
            InsertabotCore.ui.messageContainer = document.getElementById("ib-messages");
            InsertabotCore.ui.inputField = document.getElementById("ib-text-input");
            InsertabotCore.ui.submitForm = document.getElementById("ib-input-form");

            // Display welcome message
            MessageRenderer.create("assistant", cfg.greeting_message);

            // Wire up event handlers
            document.getElementById("ib-close-btn").addEventListener("click", function() {
                WidgetController.toggle();
            });

            InsertabotCore.ui.submitForm.addEventListener("submit", async function(evt) {
                evt.preventDefault();

                const userText = InsertabotCore.ui.inputField.value.trim();
                if (!userText || InsertabotCore.state.processingRequest) return;

                MessageRenderer.create("user", userText);
                InsertabotCore.ui.inputField.value = "";

                InsertabotCore.state.processingRequest = true;
                InsertabotCore.ui.inputField.disabled = true;
                document.getElementById("ib-send-btn").disabled = true;

                try {
                    InsertabotCore.state.conversationHistory.push({
                        role: "user",
                        content: userText
                    });
                    await AIMessenger.process(userText);
                } catch (processingErr) {
                    console.error("[Insertabot] Processing error:", processingErr);
                    MessageRenderer.create("assistant", "\u26A0\uFE0F Unable to process your message. Please retry.");
                } finally {
                    InsertabotCore.state.processingRequest = false;
                    InsertabotCore.ui.inputField.disabled = false;
                    document.getElementById("ib-send-btn").disabled = false;
                    InsertabotCore.ui.inputField.focus();
                }
            });
        }
    };

    // Widget Visibility Controller
    const WidgetController = {
        toggle() {
            InsertabotCore.state.isWidgetVisible = !InsertabotCore.state.isWidgetVisible;

            if (InsertabotCore.state.isWidgetVisible) {
                InsertabotCore.ui.launcher.style.display = "none";
                InsertabotCore.ui.chatFrame.style.display = "flex";
                InsertabotCore.ui.inputField.focus();
            } else {
                InsertabotCore.ui.launcher.style.display = "flex";
                InsertabotCore.ui.chatFrame.style.display = "none";
            }
        }
    };

    // Application Bootstrapper
    async function bootstrap() {
        try {
            // Initialize quota tracking
            const usage = QuotaManager.retrieveUsageData();
            InsertabotCore.state.userQuota = usage;
            console.log('[Insertabot] Usage: ' + usage.consumed + '/' + InsertabotCore.quotas.freeTierMax);

            // Fetch widget configuration
            await ConfigLoader.fetch();

            // Add system prompt to conversation
            InsertabotCore.state.conversationHistory.push({
                role: "system",
                content: InsertabotCore.state.widgetConfig.system_prompt
            });

            // Build UI components
            LauncherButton.build();
            ChatInterface.build();

            console.log("[Insertabot] Widget initialized successfully \u2713");
        } catch (initError) {
            console.error("[Insertabot] Initialization failed:", initError);
        }
    }

    // Start widget when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();`;
}
__name(getWidgetScript, "getWidgetScript");

// src/search.ts
async function performWebSearch(query, apiKey, count = 5) {
  if (!apiKey) {
    console.warn("[Search] Tavily API key not configured");
    return [];
  }
  try {
    console.log(
      `[Search] Performing search for: "${query.substring(0, 50)}..."`
    );
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        max_results: count,
        search_depth: "basic",
        // 'basic' or 'advanced'
        include_answer: false,
        // We want raw results, not Tavily's answer
        include_raw_content: false,
        // Don't need full HTML
        include_images: false
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Search] Tavily API error: ${response.status} ${response.statusText}`,
        errorText
      );
      if (errorText.includes("PII detected")) {
        console.warn(
          "[Search] Query blocked due to PII detection. This is common with specific addresses/names on free tier."
        );
        return [];
      }
      throw new Error(
        `Tavily API request failed: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[Search] Received ${data.results?.length || 0} results`);
    const results = data.results || [];
    return results.slice(0, count).map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
      published_date: result.published_date
    }));
  } catch (error) {
    console.error("[Search] Web search error:", error);
    throw error;
  }
}
__name(performWebSearch, "performWebSearch");
function formatSearchResultsForAI(results) {
  if (results.length === 0) {
    return "";
  }
  const formatted = results.map((result, index) => {
    return `[${index + 1}] ${result.title}
Source: ${result.url}
${result.content}${result.published_date ? `
Published: ${result.published_date}` : ""}${result.score ? `
Relevance: ${(result.score * 100).toFixed(0)}%` : ""}`;
  }).join("\n\n");
  return `

=== Web Search Results ===
${formatted}
=== End of Search Results ===

Use the above search results to provide accurate, up-to-date information. Always cite your sources using the [number] format when referencing these results.`;
}
__name(formatSearchResultsForAI, "formatSearchResultsForAI");
function shouldPerformSearch(message) {
  const lowerMessage = message.toLowerCase();
  const searchIndicators = [
    "latest",
    "recent",
    "current",
    "today",
    "now",
    "news",
    "what is happening",
    "what happened",
    "price of",
    "stock price",
    "weather",
    "score",
    "who won",
    "when is",
    "search for",
    "look up",
    "find information",
    "tell me about"
  ];
  const needsSearch = searchIndicators.some(
    (indicator) => lowerMessage.includes(indicator)
  );
  const questionWords = ["what", "when", "where", "who", "how"];
  const isQuestion = questionWords.some(
    (word) => lowerMessage.startsWith(word)
  );
  if (isQuestion && (lowerMessage.includes("2024") || lowerMessage.includes("2025"))) {
    console.log(
      `[Search] Query needs search (recent year mentioned): "${message.substring(0, 50)}..."`
    );
    return true;
  }
  if (needsSearch) {
    console.log(
      `[Search] Query needs search (keyword match): "${message.substring(0, 50)}..."`
    );
  } else {
    console.log(
      `[Search] Query does NOT need search: "${message.substring(0, 50)}..."`
    );
  }
  return needsSearch;
}
__name(shouldPerformSearch, "shouldPerformSearch");

// src/index.ts
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
function isOriginAllowed(origin, allowedDomains) {
  if (!origin || typeof origin !== "string") return false;
  if (!allowedDomains || typeof allowedDomains !== "string") return false;
  try {
    const domains = allowedDomains.split(",").map((d) => d.trim()).filter((d) => d.length > 0);
    return domains.some((domain) => {
      if (domain === "*") return true;
      if (domain === origin) return true;
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        if (!baseDomain || baseDomain.length === 0) return false;
        return origin === baseDomain || origin.endsWith("." + baseDomain);
      }
      return false;
    });
  } catch (error) {
    console.error("Error validating origin:", error);
    return false;
  }
}
__name(isOriginAllowed, "isOriginAllowed");
function createCorsHeaders(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
__name(createCorsHeaders, "createCorsHeaders");
function validateCorsConfig(env) {
  if (env.ENVIRONMENT === "production") {
    const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim());
    if (origins.includes("*")) {
      throw new AppError(
        "INVALID_REQUEST" /* INVALID_REQUEST */,
        "CORS_ORIGINS must not contain wildcard '*' in production",
        400
      );
    }
  }
}
__name(validateCorsConfig, "validateCorsConfig");
async function checkPublicRateLimit(kv, clientIP, pathname) {
  const key = `public:${pathname}:${clientIP}`;
  try {
    const count = parseInt(await kv.get(key) || "0");
    if (count >= 100) {
      throw new RateLimitError(3600, "hourly");
    }
    await kv.put(key, String(count + 1), { expirationTtl: 3600 });
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    throw new AppError("SERVICE_UNAVAILABLE" /* SERVICE_UNAVAILABLE */, "Rate limiting service unavailable");
  }
}
__name(checkPublicRateLimit, "checkPublicRateLimit");
function getApiKey(request) {
  const headerKey = request.headers.get("X-API-Key");
  if (headerKey) return headerKey;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}
__name(getApiKey, "getApiKey");
async function fetchSingle(db, query, params, operationName = "fetch") {
  return withDatabase(async () => {
    const result = await db.prepare(query).bind(...params).first();
    return result || null;
  }, operationName);
}
__name(fetchSingle, "fetchSingle");
async function getCustomerConfig(db, apiKey) {
  if (!validateApiKey(apiKey)) {
    throw new AuthenticationError("INVALID_API_KEY" /* INVALID_API_KEY */, "Invalid API key format");
  }
  const config = await fetchSingle(
    db,
    `SELECT customer_id, api_key, plan_type, status, rate_limit_per_hour, rate_limit_per_day, rag_enabled
		 FROM customers WHERE api_key = ? AND status = 'active'`,
    [apiKey],
    "getCustomerConfig"
  );
  if (!config) {
    throw new AuthenticationError("INVALID_API_KEY" /* INVALID_API_KEY */, "Invalid or inactive API key");
  }
  return config;
}
__name(getCustomerConfig, "getCustomerConfig");
async function getWidgetConfig(db, customerId) {
  const config = await fetchSingle(
    db,
    `SELECT primary_color, position, greeting_message, bot_name, bot_avatar_url,
		        model, temperature, max_tokens, system_prompt, allowed_domains,
		        COALESCE(placeholder_text, 'Type your message...') as placeholder_text,
		        COALESCE(show_branding, 1) as show_branding
		 FROM widget_configs WHERE customer_id = ?`,
    [customerId],
    "getWidgetConfig"
  );
  if (!config) {
    throw new AppError("CONFIG_NOT_FOUND" /* CONFIG_NOT_FOUND */, "Widget configuration not found");
  }
  return config;
}
__name(getWidgetConfig, "getWidgetConfig");
async function checkRateLimit(kv, customerId, limitPerHour, limitPerDay) {
  const now = Date.now();
  const hourKey = `ratelimit:${customerId}:hour:${Math.floor(now / 36e5)}`;
  const dayKey = `ratelimit:${customerId}:day:${Math.floor(now / 864e5)}`;
  const increment = /* @__PURE__ */ __name(async (key, ttl) => {
    try {
      const current = parseInt(await kv.get(key) || "0");
      const updated = current + 1;
      await kv.put(key, updated.toString(), { expirationTtl: ttl });
      return updated;
    } catch (error) {
      throw new AppError("SERVICE_UNAVAILABLE" /* SERVICE_UNAVAILABLE */, "Rate limiting service unavailable");
    }
  }, "increment");
  const currentHourCount = await increment(hourKey, 3600);
  const currentDayCount = await increment(dayKey, 86400);
  if (currentHourCount > limitPerHour) {
    throw new RateLimitError(3600, "hourly");
  }
  if (currentDayCount > limitPerDay) {
    throw new RateLimitError(86400, "daily");
  }
}
__name(checkRateLimit, "checkRateLimit");
function validateChatMessage(message) {
  if (Array.isArray(message)) {
    const textPart = message.find((part) => part.type === "text");
    if (!textPart || !textPart.text) {
      throw new ValidationError("Multimodal message must contain text content");
    }
    const trimmed2 = textPart.text.trim();
    if (trimmed2.length > 1e4) {
      throw new ValidationError("Message exceeds maximum length of 10000 characters");
    }
    return;
  }
  if (!message || typeof message !== "string") {
    throw new ValidationError("Message must be a non-empty string");
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Message cannot be empty");
  }
  if (trimmed.length > 1e4) {
    throw new ValidationError("Message exceeds maximum length of 10000 characters");
  }
  if (trimmed.toLowerCase().includes("sql") && trimmed.includes(";")) {
    throw new ValidationError("Invalid message content detected");
  }
}
__name(validateChatMessage, "validateChatMessage");
function isCoherentResponse(content) {
  if (!content || content.length === 0) return false;
  if (content.length < 10) return false;
  if (content.length > 5e4) return false;
  if (content.toLowerCase() === "[error]") return false;
  if (content.includes("undefined") || content.includes("null")) return false;
  const words = content.split(/\s+/);
  const wordCounts = /* @__PURE__ */ new Map();
  for (const word of words) {
    wordCounts.set(
      word.toLowerCase(),
      (wordCounts.get(word.toLowerCase()) || 0) + 1
    );
  }
  const maxRepetition = Math.max(...Array.from(wordCounts.values()));
  if (maxRepetition > words.length * 0.3) return false;
  return true;
}
__name(isCoherentResponse, "isCoherentResponse");
function getFallbackResponse(widgetConfig) {
  const fallbacks = [
    `Hi! I'm ${widgetConfig.bot_name}. I'm having a moment of confusion. Could you try asking your question again?`,
    `I appreciate your message, but I need to reset. Could you rephrase that for me?`,
    `Sorry, I lost my train of thought. What was your question?`,
    `My apologies! I didn't process that correctly. Could you try again?`
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
__name(getFallbackResponse, "getFallbackResponse");
async function handleChatRequest(request, env, customerId, customerConfig, widgetConfig, corsHeaders) {
  const logger = new StructuredLogger("chat-handler", env.ENVIRONMENT, env.ANALYTICS);
  try {
    const startTime = Date.now();
    const chatRequest = await request.json();
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      throw new ValidationError("Invalid request: messages array required");
    }
    const userMessage = chatRequest.messages[chatRequest.messages.length - 1];
    validateChatMessage(userMessage?.content);
    const textContent = extractTextFromMessage(userMessage.content);
    let ragContext = "";
    if (customerConfig.rag_enabled && env.VECTORIZE) {
      try {
        const contextResults = await withTimeout(
          () => getRelevantContext(env, env.DB, customerId, textContent),
          5e3,
          "RAG context retrieval"
        );
        if (contextResults.length > 0) {
          ragContext = `

Relevant context:
${contextResults.join("\n\n")}`;
        }
      } catch (error) {
        logger.warn("RAG context retrieval failed", { error: String(error) });
      }
    }
    let searchContext = "";
    const shouldSearch = shouldPerformSearch(textContent);
    if (env.TAVILY_API_KEY && shouldSearch) {
      logger.info("Triggering web search", {
        query: textContent.substring(0, 100),
        customerId
      });
      try {
        const searchResults = await withRetry(
          () => withTimeout(
            () => performWebSearch(textContent, env.TAVILY_API_KEY, 5),
            1e4,
            "web search"
          ),
          2,
          1e3,
          "web search with retry"
        );
        if (searchResults.length > 0) {
          searchContext = formatSearchResultsForAI(searchResults);
          logger.info("Web search completed", {
            resultCount: searchResults.length,
            customerId
          });
        }
      } catch (searchError) {
        logger.error("Web search failed", {
          error: String(searchError),
          customerId
        });
      }
    }
    const maxTokens = chatRequest.max_tokens ?? widgetConfig.max_tokens ?? 500;
    const messages = [
      {
        role: "system",
        content: widgetConfig.system_prompt + ragContext + searchContext
      },
      ...chatRequest.messages
    ];
    const shouldStream = chatRequest.stream === true;
    const aiResponse = await withRetry(
      () => withTimeout(
        () => env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content
          })),
          max_tokens: Math.min(maxTokens, 2e3),
          stream: false
        }),
        3e4,
        "AI model inference"
      ),
      2,
      1e3,
      "AI model call"
    ).catch((error) => {
      logger.error("AI model error", { error: String(error) });
      return {
        result: { response: getFallbackResponse(widgetConfig) },
        fallback: true
      };
    });
    const responseText = aiResponse?.result?.response || aiResponse?.response || "";
    if (!isCoherentResponse(responseText)) {
      logger.warn("Incoherent response detected", {
        response: responseText.substring(0, 100)
      });
      const fallbackText = getFallbackResponse(widgetConfig);
      if (shouldStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const sseChunk = `data: ${JSON.stringify({
              choices: [{ delta: { content: fallbackText } }]
            })}

`;
            controller.enqueue(encoder.encode(sseChunk));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        });
        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
            ...SECURITY_HEADERS
          }
        });
      }
      return new Response(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          content: fallbackText,
          model: widgetConfig.model,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
        }
      );
    }
    if (shouldStream) {
      const encoder = new TextEncoder();
      const words = responseText.split(/(\s+)/);
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (const word of words) {
              if (word.trim().length > 0 || word.match(/\s/)) {
                const sseChunk = `data: ${JSON.stringify({
                  choices: [{ delta: { content: word } }]
                })}

`;
                controller.enqueue(encoder.encode(sseChunk));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...corsHeaders,
          ...SECURITY_HEADERS
        }
      });
    }
    const responseTime = Date.now() - startTime;
    await logger.info("Chat request processed", {
      customerId,
      responseTime,
      messageLength: userMessage.content.length
    });
    return new Response(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        content: responseText,
        model: widgetConfig.model,
        usage: {
          prompt_tokens: messages.reduce(
            (acc, m) => acc + extractTextFromMessage(m.content).split(/\s+/).length,
            0
          ),
          completion_tokens: responseText.split(/\s+/).length,
          total_tokens: messages.reduce(
            (acc, m) => acc + extractTextFromMessage(m.content).split(/\s+/).length,
            0
          ) + responseText.split(/\s+/).length
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
      }
    );
  } catch (error) {
    logger.error("Chat request error", { error: String(error) });
    const fallbackText = getFallbackResponse(widgetConfig);
    return new Response(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        content: fallbackText,
        model: widgetConfig.model,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        error: "service_temporarily_unavailable"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
      }
    );
  }
}
__name(handleChatRequest, "handleChatRequest");
async function handleHealthCheck(env) {
  try {
    const result = await withTimeout(
      () => env.DB.prepare("SELECT 1").first(),
      5e3,
      "health check database query"
    );
    const dbHealthy = !!result;
    return new Response(
      JSON.stringify({
        status: dbHealthy ? "healthy" : "degraded",
        checks: {
          database: dbHealthy,
          tavily_configured: !!env.TAVILY_API_KEY,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      }),
      {
        status: dbHealthy ? 200 : 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: String(error)
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleHealthCheck, "handleHealthCheck");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const logger = new StructuredLogger("request-handler", env.ENVIRONMENT, env.ANALYTICS);
    const errorHandler = new ErrorHandler(env.ENVIRONMENT, env.ANALYTICS);
    try {
      validateCorsConfig(env);
    } catch (error) {
      return errorHandler.handleError(
        error instanceof AppError ? error : new AppError("INVALID_REQUEST" /* INVALID_REQUEST */, String(error), 400),
        { url: url.pathname, origin, clientIP }
      );
    }
    const publicRoutes = [
      "/",
      "/signup",
      "/playground",
      "/health",
      "/dashboard",
      "/favicon.ico",
      "/logo.png",
      "/widget.js",
      "/v1/stripe/webhook",
      "/checkout-success",
      "/api/customer/create"
    ];
    if (publicRoutes.includes(url.pathname)) {
      const globalOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
      const allowed = globalOrigins.includes("*") || globalOrigins.includes(origin);
      const corsHeaders = createCorsHeaders(origin, allowed);
      if (url.pathname !== "/favicon.ico") {
        try {
          await checkPublicRateLimit(env.RATE_LIMITER, clientIP, url.pathname);
        } catch (error) {
          if (error instanceof RateLimitError) {
            const response = await errorHandler.handleError(error, { url: url.pathname, clientIP });
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });
            return new Response(response.body, {
              status: response.status,
              headers: { ...responseHeaders, ...corsHeaders }
            });
          }
          throw error;
        }
      }
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
      }
      try {
        if (url.pathname === "/playground" && request.method === "GET") {
          const html = getPlaygroundHTML(url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS
            }
          });
        }
        if (url.pathname === "/widget.js" && request.method === "GET") {
          const widgetJs = getWidgetScript(url.origin);
          return new Response(widgetJs, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS
            }
          });
        }
        if (url.pathname === "/" && request.method === "GET") {
          const html = getLandingHTML(url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS
            }
          });
        }
        if (url.pathname === "/signup" && request.method === "GET") {
          const html = getSignupHTML();
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders,
              ...SECURITY_HEADERS
            }
          });
        }
        if (url.pathname === "/dashboard" && request.method === "GET") {
          const apiKeyParam = url.searchParams.get("key");
          if (!apiKeyParam) {
            throw new AuthenticationError(
              "MISSING_API_KEY" /* MISSING_API_KEY */,
              "API key required. Access dashboard via your signup confirmation or use ?key=YOUR_API_KEY"
            );
          }
          const customer = await getCustomerConfig(env.DB, apiKeyParam);
          const widgetConfigData = await getWidgetConfig(env.DB, customer.customer_id);
          const html = getDashboardHTML(customer, widgetConfigData, url.origin);
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "private, no-cache",
              ...corsHeaders,
              ...SECURITY_HEADERS
            }
          });
        }
        if (url.pathname === "/api/customer/create" && request.method === "POST") {
          const body = await request.json();
          const existingCustomer = await getCustomerByEmail(env.DB, body.email);
          if (existingCustomer) {
            throw new AppError("INVALID_REQUEST" /* INVALID_REQUEST */, "Email already registered", 409);
          }
          const customer = await createCustomer(env.DB, body.email, body.company_name);
          if (!customer) {
            throw new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, "Failed to create account", 500);
          }
          return new Response(
            JSON.stringify({
              success: true,
              api_key: customer.api_key,
              message: "Account created successfully"
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
            }
          );
        }
        if (url.pathname === "/favicon.ico") {
          return new Response(null, { status: 204 });
        }
        if (url.pathname === "/health" && request.method === "GET") {
          const response = await handleHealthCheck(env);
          const responseHeaders = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          return new Response(response.body, {
            status: response.status,
            headers: { ...responseHeaders, ...corsHeaders, ...SECURITY_HEADERS }
          });
        }
      } catch (error) {
        const response = await errorHandler.handleError(
          error instanceof AppError ? error : new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, "Public route error"),
          { url: url.pathname, origin, clientIP }
        );
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        return new Response(response.body, {
          status: response.status,
          headers: { ...responseHeaders, ...corsHeaders }
        });
      }
    }
    if (request.method === "OPTIONS") {
      const globalOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
      const allowed = globalOrigins.includes("*") || globalOrigins.includes(origin);
      const preflightCors = createCorsHeaders(origin, allowed);
      return new Response(null, { status: 204, headers: { ...preflightCors, ...SECURITY_HEADERS } });
    }
    try {
      const apiKey = getApiKey(request);
      if (!apiKey) {
        throw new AuthenticationError("MISSING_API_KEY" /* MISSING_API_KEY */, "Missing API key");
      }
      const customerConfig = await getCustomerConfig(env.DB, apiKey);
      const widgetConfig = await getWidgetConfig(env.DB, customerConfig.customer_id);
      const originAllowed = isOriginAllowed(origin, widgetConfig.allowed_domains);
      const corsHeaders = createCorsHeaders(origin, originAllowed);
      if (!originAllowed && origin) {
        await logger.warn("Blocked origin attempt", {
          origin,
          apiKey: apiKey.substring(0, 12) + "...",
          customerId: customerConfig.customer_id,
          path: url.pathname
        });
        throw new AppError("ORIGIN_NOT_ALLOWED" /* ORIGIN_NOT_ALLOWED */, "Origin not allowed", 403);
      }
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
      }
      if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
        await checkRateLimit(
          env.RATE_LIMITER,
          customerConfig.customer_id,
          customerConfig.rate_limit_per_hour,
          customerConfig.rate_limit_per_day
        );
        return handleChatRequest(
          request,
          env,
          customerConfig.customer_id,
          customerConfig,
          widgetConfig,
          corsHeaders
        );
      }
      if (url.pathname === "/v1/widget/config" && request.method === "GET") {
        return new Response(
          JSON.stringify({
            primary_color: widgetConfig.primary_color,
            position: widgetConfig.position,
            greeting_message: widgetConfig.greeting_message,
            bot_name: widgetConfig.bot_name,
            bot_avatar_url: widgetConfig.bot_avatar_url,
            temperature: widgetConfig.temperature,
            max_tokens: widgetConfig.max_tokens,
            system_prompt: widgetConfig.system_prompt,
            placeholder_text: widgetConfig.placeholder_text,
            show_branding: widgetConfig.show_branding
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
          }
        );
      }
      if (url.pathname === "/api/customer/config" && request.method === "PUT") {
        const body = await request.json();
        const result = await updateWidgetConfig(env.DB, customerConfig.customer_id, body);
        if (!result) {
          throw new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, "Failed to update configuration", 500);
        }
        return new Response(
          JSON.stringify({ success: true, message: "Configuration updated" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS }
          }
        );
      }
      throw new AppError("INVALID_REQUEST" /* INVALID_REQUEST */, "Endpoint not found", 404);
    } catch (error) {
      const response = await errorHandler.handleError(
        error instanceof AppError ? error : new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, "Request processing failed"),
        { url: url.pathname, origin, clientIP, method: request.method }
      );
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      try {
        const corsHeaders = createCorsHeaders(origin, false);
        return new Response(response.body, {
          status: response.status,
          headers: { ...responseHeaders, ...corsHeaders }
        });
      } catch {
        return response;
      }
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
