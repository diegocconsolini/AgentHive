import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { EnvUtils } from '@memory-manager/shared';

const config = EnvUtils.getConfig();

// HTTP Link
const httpLink = createHttpLink({
  uri: config.GRAPHQL_URL,
});

// Auth Link - adds authorization header
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage or your auth store
  const token = localStorage.getItem('auth-token');
  
  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle authentication errors
    if (networkError.message.includes('401')) {
      // Clear auth tokens and redirect to login
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
  }
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          memories: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});