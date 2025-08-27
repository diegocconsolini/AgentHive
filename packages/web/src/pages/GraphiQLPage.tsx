import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import 'graphiql/graphiql.css';

const fetcher = createGraphiQLFetcher({
  url: 'http://localhost:4000/graphql',
});

export function GraphiQLPage() {
  const { token } = useAuth();

  // Reset any conflicting styles when component mounts
  useEffect(() => {
    // Add GraphiQL-specific CSS reset
    const style = document.createElement('style');
    style.textContent = `
      .graphiql-container {
        /* Reset any inherited styles from your main app */
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        
        /* Ensure full height */
        height: 100% !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      /* Override any conflicting Tailwind/main app styles */
      .graphiql-container * {
        box-sizing: border-box;
      }
      
      /* Ensure proper GraphiQL styling */
      .graphiql-container .graphiql-session {
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      .graphiql-container .graphiql-main {
        flex: 1 !important;
        display: flex !important;
      }
      
      /* Fix any button/input conflicts */
      .graphiql-container button,
      .graphiql-container input,
      .graphiql-container textarea,
      .graphiql-container select {
        all: revert;
        font-family: inherit;
      }
      
      /* Ensure proper colors */
      .graphiql-container {
        background: #f6f8fa !important;
        color: #24292e !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    <div style={{ 
      height: 'calc(100vh - 4rem)', // Account for header height
      width: '100%',
      position: 'relative',
      background: '#f6f8fa'
    }}>
      {/* Header bar with connection status */}
      <div style={{
        background: '#24292e',
        color: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #d1d5da',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div>
          <strong>GraphiQL API Explorer</strong>
          <span style={{ marginLeft: '16px', opacity: 0.8 }}>
            Memory Manager GraphQL Playground
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            background: '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Connected: localhost:4000
          </span>
          {token && (
            <span style={{
              background: '#0366d6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Authenticated
            </span>
          )}
        </div>
      </div>
      
      {/* GraphiQL container with isolated styling */}
      <div style={{ 
        height: 'calc(100% - 49px)', // Subtract header height
        width: '100%'
      }}>
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