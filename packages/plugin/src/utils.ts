import { Source, Lexer, GraphQLSchema, Token, DocumentNode } from 'graphql';
import { GraphQLESlintRuleContext } from './types';
import { AST } from 'eslint';
import { SiblingOperations } from './sibling-operations';
import * as gqlLanguage from 'graphql/language';

export function requireSiblingsOperations(ruleName: string, context: GraphQLESlintRuleContext<any>): SiblingOperations {
  if (!context || !context.parserServices) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.operations' to be set and loaded. See http://bit.ly/graphql-eslint-operations for more info`
    );
  }

  if (!context.parserServices.siblingOperations.available) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.operations' to be set and loaded. See http://bit.ly/graphql-eslint-operations for more info`
    );
  }

  return context.parserServices.siblingOperations;
}

export function requireGraphQLSchemaFromContext(
  ruleName: string,
  context: GraphQLESlintRuleContext<any>
): GraphQLSchema {
  if (!context || !context.parserServices) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.schema' to be set. See http://bit.ly/graphql-eslint-schema for more info`
    );
  }

  if (!context.parserServices.hasTypeInfo) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.schema' to be set and schema to be loaded. See http://bit.ly/graphql-eslint-schema for more info`
    );
  }

  return context.parserServices.schema;
}

export function requireReachableTypesFromContext(
  ruleName: string,
  context: GraphQLESlintRuleContext<any>
): Set<string> {
  if (!context || !context.parserServices) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.schema' to be set. See http://bit.ly/graphql-eslint-schema for more info`
    );
  }

  if (!context.parserServices.schema) {
    throw new Error(
      `Rule '${ruleName}' requires 'parserOptions.schema' to be set and schema to be loaded. See http://bit.ly/graphql-eslint-schema for more info`
    );
  }

  return context.parserServices.getReachableTypes();
}

function getLexer(source: Source): Lexer {
  // GraphQL v14
  if (gqlLanguage && (gqlLanguage as any).createLexer) {
    return (gqlLanguage as any).createLexer(source, {});
  }

  // GraphQL v15
  if (Lexer && typeof Lexer === 'function') {
    return new Lexer(source);
  }

  throw new Error(`Unsupported GraphQL version! Please make sure to use GraphQL v14 or newer!`);
}

export function extractTokens(source: string): AST.Token[] {
  const lexer = getLexer(new Source(source));
  const tokens: AST.Token[] = [];
  let token = lexer.advance();

  while (token && token.kind !== '<EOF>') {
    tokens.push({
      type: token.kind as any,
      loc: {
        start: {
          line: token.line,
          column: token.column,
        },
        end: {
          line: token.line,
          column: token.column,
        },
      },
      value: token.value,
      range: [token.start, token.end],
    });
    token = lexer.advance();
  }

  return tokens;
}

export function checkForEslint(token: Token, rawNode: DocumentNode): boolean {
  if (token.kind !== 'Comment') {
    return false;
  }
  const string = rawNode.loc?.source.body.substring(token.start + 1, token.start + 8);
  if (string.toLocaleLowerCase().includes('eslint')) {
    return true;
  }
  return false;
}

export const normalizePath = (path: string): string => (path || '').replace(/\\/g, '/');
