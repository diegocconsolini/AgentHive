export function EmbeddedGraphiQLPage() {
  return (
    <div className="w-full h-full overflow-hidden">
      {/* Embedded GraphiQL iframe - full viewport */}
      <iframe
        src="http://localhost:4000/graphql"
        className="w-full h-full border-none"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          background: 'white',
          display: 'block'
        }}
        title="GraphiQL API Explorer"
        allow="same-origin"
      />
    </div>
  );
}