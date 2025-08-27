import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useAuth } from '../context/AuthContext';
import 'graphiql/graphiql.css';

const fetcher = createGraphiQLFetcher({
  url: 'http://localhost:4000/graphql',
});

export function GraphiQLPage() {
  const { token } = useAuth();

  const authenticatedFetcher = async (graphQLParams: any, opts?: any) => {
    const headers = {
      ...opts?.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };
    
    return fetcher(graphQLParams, { ...opts, headers });
  };

  const defaultQuery = `# Welcome to GraphiQL! 
# This is an interactive GraphQL playground for your Memory Manager API
# Try running this query to get started:

query GetMemories {
  memories(limit: 5) {
    id
    title
    content
    createdAt
    tags
  }
}

# You can also try user queries:
# query GetCurrentUser {
#   me {
#     id
#     email
#     role
#   }
# }

# Or explore contexts:
# query GetContexts {
#   contexts(limit: 5) {
#     id
#     title
#     description
#     createdAt
#   }
# }`;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              GraphiQL API Explorer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Interactive GraphQL playground for your Memory Manager API
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected to localhost:4000
            </span>
            {token && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Authenticated
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1" style={{ minHeight: '600px' }}>
        <GraphiQL
          fetcher={authenticatedFetcher}
          defaultQuery={defaultQuery}
          headerEditorEnabled
          shouldPersistHeaders
        />
      </div>
    </div>
  );
}