export function EmbeddedGraphiQLPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      {/* Embedded GraphiQL iframe - takes full content area */}
      <iframe
        src="http://localhost:4000/graphql"
        className="w-full h-full border-0"
        style={{
          minHeight: '80vh',
          height: 'calc(100vh - 120px)', // Account for header space
          border: 'none',
          background: 'white'
        }}
        title="GraphiQL API Explorer"
        allow="same-origin"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}