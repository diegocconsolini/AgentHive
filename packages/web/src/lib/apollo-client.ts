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
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors from GraphQL
      if (extensions?.code === 'UNAUTHENTICATED' || message.includes('Not authenticated')) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        console.log('Authentication expired, clearing tokens');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle authentication errors from network
    if (networkError.message.includes('401') || 
        (networkError as any)?.statusCode === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      console.log('Network authentication error, clearing tokens');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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