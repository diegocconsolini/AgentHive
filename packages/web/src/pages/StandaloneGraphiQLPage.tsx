import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import 'graphiql/graphiql.css';

const fetcher = createGraphiQLFetcher({
  url: 'http://localhost:4000/graphql',
});

export function StandaloneGraphiQLPage() {
  const { token } = useAuth();

  // Completely reset document styles for GraphiQL
  useEffect(() => {
    // Store original body styles
    const originalBodyClass = document.body.className;
    const originalBodyStyle = document.body.style.cssText;
    
    // Reset body for GraphiQL
    document.body.className = '';
    document.body.style.cssText = `
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      background: #f6f8fa;
      color: #24292e;
      height: 100vh;
      overflow: hidden;
    `;

    // Add comprehensive CSS reset for GraphiQL
    const style = document.createElement('style');
    style.id = 'graphiql-reset';
    style.textContent = `
      /* Complete reset for GraphiQL page */
      .graphiql-standalone-container {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
        background: #f6f8fa !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        color: #24292e !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .graphiql-standalone-container * {
        box-sizing: border-box !important;
      }

      /* Override ALL inherited styles */
      .graphiql-standalone-container .graphiql-container {
        all: unset !important;
        display: flex !important;
        flex-direction: column !important;
        flex: 1 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        font-size: 14px !important;
        background: #f6f8fa !important;
        color: #24292e !important;
      }

      .graphiql-standalone-container .graphiql-session {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .graphiql-standalone-container .graphiql-main {
        flex: 1 !important;
        display: flex !important;
        min-height: 0 !important;
      }

      /* Fix all form elements */
      .graphiql-standalone-container button,
      .graphiql-standalone-container input,
      .graphiql-standalone-container textarea,
      .graphiql-standalone-container select {
        all: revert !important;
        font-family: inherit !important;
      }

      /* Toolbar styles */
      .graphiql-standalone-container .graphiql-toolbar {
        background: #fff !important;
        border-bottom: 1px solid #e1e4e8 !important;
        padding: 8px 16px !important;
        display: flex !important;
        align-items: center !important;
        min-height: auto !important;
      }

      /* Editor styles */
      .graphiql-standalone-container .graphiql-editor {
        font-family: 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }

      /* Results panel */
      .graphiql-standalone-container .graphiql-response {
        font-family: 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace !important;
        font-size: 14px !important;
      }

      /* Documentation Explorer */
      .graphiql-standalone-container .graphiql-doc-explorer {
        background: #fff !important;
        border-left: 1px solid #e1e4e8 !important;
      }

      /* Header */
      .graphiql-standalone-header {
        background: #24292e !important;
        color: #fff !important;
        padding: 8px 16px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        font-size: 14px !important;
        font-weight: 500 !important;
      }

      .graphiql-standalone-header .status-badges {
        display: flex !important;
        gap: 8px !important;
      }

      .graphiql-standalone-header .status-badge {
        padding: 4px 8px !important;
        border-radius: 3px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .graphiql-standalone-header .status-badge.connected {
        background: #28a745 !important;
        color: #fff !important;
      }

      .graphiql-standalone-header .status-badge.authenticated {
        background: #0366d6 !important;
        color: #fff !important;
      }
    `;
    
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      document.body.className = originalBodyClass;
      document.body.style.cssText = originalBodyStyle;
      const styleElement = document.getElementById('graphiql-reset');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const authenticatedFetcher = async (graphQLParams: any, opts?: any) => {
    const headers = {
      ...opts?.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };
    
    return fetcher(graphQLParams, { ...opts, headers });
  };

  const defaultQuery = `# GraphiQL for Memory Manager API
# Connected to http://localhost:4000/graphql

query GetMemories {
  memories(limit: 5) {
    id
    title
    content
    createdAt
    tags
  }
}

query GetCurrentUser {
  me {
    id
    email
    role
  }
}

query GetContexts {
  contexts(limit: 5) {
    id
    title
    description
    createdAt
  }
}`;

  return (
    <div className="graphiql-standalone-container">
      <div className="graphiql-standalone-header">
        <div>
          <strong>GraphiQL</strong>
          <span style={{ marginLeft: 16, opacity: 0.8 }}>Memory Manager API Explorer</span>
        </div>
        <div className="status-badges">
          <span className="status-badge connected">
            ● localhost:4000
          </span>
          {token && (
            <span className="status-badge authenticated">
              🔒 Authenticated
            </span>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
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