import { DateTimeResolver } from 'graphql-scalars';
import { authResolvers } from './auth.js';
import { memoryResolvers } from './memory.js';
import { userResolvers } from './user.js';
import { contextResolvers } from './context.js';
import { agentResolvers } from './agent.js';
import { analyticsResolvers } from './analytics.js';

export const resolvers = {
  DateTime: DateTimeResolver,
  
  Query: {
    ...(memoryResolvers.Query || {}),
    ...(userResolvers.Query || {}),
    ...(contextResolvers.Query || {}),
    ...(agentResolvers.Query || {}),
    ...(analyticsResolvers.Query || {}),
  },
  
  Mutation: {
    ...(authResolvers.Mutation || {}),
    ...(memoryResolvers.Mutation || {}),
    ...(userResolvers.Mutation || {}),
    ...(contextResolvers.Mutation || {}),
    ...(agentResolvers.Mutation || {}),
    ...(analyticsResolvers.Mutation || {}),
  },
  
  // Include any type resolvers
  ...(userResolvers.User && { User: userResolvers.User }),
  ...(memoryResolvers.Memory && { Memory: memoryResolvers.Memory }),
  ...(contextResolvers.Context && { Context: contextResolvers.Context }),
  ...(agentResolvers.Agent && { Agent: agentResolvers.Agent }),
};