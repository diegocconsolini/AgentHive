import React from 'react';

const NodeJSSDK: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Node.js SDK Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Official Node.js client library for AgentHive AI orchestration platform
        </p>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          🚧 Documentation Under Construction
        </h3>
        <p className="text-yellow-800 dark:text-yellow-200">
          The Node.js SDK documentation is currently being updated. Please check back soon for complete installation and usage instructions.
        </p>
      </div>
    </div>
  );
};

export default NodeJSSDK;