import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './type-defs.js';
import { resolvers } from '../resolvers/index.js';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});