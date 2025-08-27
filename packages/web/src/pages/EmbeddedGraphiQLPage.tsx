import { useEffect } from 'react';

export function EmbeddedGraphiQLPage() {
  // Override parent container styles for full-width iframe
  useEffect(() => {
    // Find the main content container and adjust it for GraphiQL
    const mainContent = document.querySelector('main');
    const contentDiv = document.querySelector('main > div');
    const containerDiv = document.querySelector('main > div > div');
    
    if (mainContent && contentDiv && containerDiv) {
      // Store original styles
      const originalMainClass = mainContent.className;
      const originalContentClass = contentDiv.className;
      const originalContainerClass = containerDiv.className;
      
      // Apply full-width styles
      mainContent.className = 'flex-1 overflow-hidden';
      contentDiv.className = 'h-full w-full';
      containerDiv.className = 'h-full w-full p-0 max-w-none';
      
      // Cleanup on unmount
      return () => {
        mainContent.className = originalMainClass;
        contentDiv.className = originalContentClass;
        containerDiv.className = originalContainerClass;
      };
    }
  }, []);

  return (
    <div className="h-full w-full">
      {/* Embedded GraphiQL iframe - takes full available space */}
      <iframe
        src="http://localhost:4000/graphql"
        style={{
          width: '100%',
          height: '100%',
          minHeight: 'calc(100vh - 64px)', // Account for header
          border: 'none',
          background: 'white',
          display: 'block'
        }}
        title="GraphiQL API Explorer"
        allow="same-origin"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}