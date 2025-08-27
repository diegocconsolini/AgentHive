import { useState, useEffect, useCallback } from 'react';
import type { ConfigurationEnvironment, ConfigurationItem } from '@/types/admin';

// Mock data
const mockEnvironments: ConfigurationEnvironment[] = [
  {
    name: 'development',
    description: 'Development environment configuration',
    isActive: false,
    configurations: [],
    lastDeployed: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    name: 'staging',
    description: 'Staging environment configuration',
    isActive: false,
    configurations: [],
    lastDeployed: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    name: 'production',
    description: 'Production environment configuration',
    isActive: true,
    configurations: [],
    lastDeployed: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

const mockConfigurations: ConfigurationItem[] = [
  {
    key: 'database.host',
    value: 'localhost',
    type: 'string',
    environment: 'development',
    description: 'Database host address',
    isSecret: false,
    isRequired: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'admin@example.com'
  },
  {
    key: 'database.password',
    value: 'secret123',
    type: 'string',
    environment: 'development',
    description: 'Database password',
    isSecret: true,
    isRequired: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'admin@example.com'
  },
  {
    key: 'api.rate_limit',
    value: 1000,
    type: 'number',
    environment: 'development',
    description: 'API rate limit per hour',
    isSecret: false,
    isRequired: false,
    lastModified: new Date().toISOString(),
    modifiedBy: 'admin@example.com'
  }
];

export const useConfigManagement = () => {
  const [environments, setEnvironments] = useState<ConfigurationEnvironment[]>([]);
  const [activeEnvironment, setActiveEnvironmentState] = useState<ConfigurationEnvironment | null>(null);
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEnvironments(mockEnvironments);
      setActiveEnvironmentState(mockEnvironments[0]);
      setConfigurations(mockConfigurations);
    } catch (err) {
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveEnvironment = useCallback(async (environmentName: string) => {
    const env = environments.find(e => e.name === environmentName);
    if (env) {
      setActiveEnvironmentState(env);
      // Load configurations for this environment
      const envConfigs = mockConfigurations.filter(c => c.environment === environmentName);
      setConfigurations(envConfigs);
    }
  }, [environments]);

  const createConfiguration = useCallback(async (configData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsDirty(true);
  }, []);

  const updateConfiguration = useCallback(async (key: string, configData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsDirty(true);
  }, []);

  const deleteConfiguration = useCallback(async (key: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsDirty(true);
  }, []);

  const saveChanges = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsDirty(false);
  }, []);

  const discardChanges = useCallback(() => {
    fetchData();
    setIsDirty(false);
  }, [fetchData]);

  const deployConfiguration = useCallback(async (environmentName: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, []);

  const importConfiguration = useCallback(async (file: File) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }, []);

  const exportConfiguration = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const validateConfiguration = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {};
  }, []);

  const getConfigurationHistory = useCallback(async (key: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    environments,
    activeEnvironment,
    configurations,
    loading,
    error,
    isDirty,
    validationErrors,
    setActiveEnvironment,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    saveChanges,
    discardChanges,
    deployConfiguration,
    importConfiguration,
    exportConfiguration,
    validateConfiguration,
    getConfigurationHistory
  };
};