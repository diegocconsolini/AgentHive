export function EmbeddedGraphiQLPage() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'white'
      }}
    >
      {/* Embedded GraphiQL iframe - full viewport */}
      <iframe
        src="http://localhost:4000/graphql"
        style={{
          width: '100%',
          height: '100%',
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