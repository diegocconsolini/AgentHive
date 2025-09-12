import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface AgentMemory {
  id: string;
  agentId: string;
  userId: string;
  knowledge: {
    concepts: string[];
    relationships: string[];
    confidence: number;
  };
  interactions: Array<{
    id: string;
    timestamp: string;
    summary: string;
    success: boolean;
    duration?: number;
    tokens?: number;
  }>;
  patterns: {
    successPatterns: string[];
    preferences: string[];
    commonTasks: string[];
  };
  performance: {
    successRate: number;
    averageTime: number;
    totalInteractions: number;
    lastPerformanceUpdate: string;
  };
  created: string;
  updated: string;
  lastAccessed?: string;
}

interface MemorySearchResult {
  memory: AgentMemory;
  similarity: number;
  category: string;
  relationships: Array<{
    memoryId: string;
    similarity: number;
    relationshipType: string;
  }>;
}

interface MemoryAnalytics {
  totalMemories: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  topAccessedMemories: Array<{
    memoryId: string;
    accessCount: number;
  }>;
  averageRelationships: number;
  memoryHealth: {
    indexingHealth: number;
    categorizationHealth: number;
    relationshipHealth: number;
    overallHealth: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`memory-tabpanel-${index}`}
      aria-labelledby={`memory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const MemoryManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [analytics, setAnalytics] = useState<MemoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<AgentMemory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch agent memories
  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/memory/analytics');
      if (!response.ok) throw new Error('Failed to fetch memories');
      
      const data = await response.json();
      if (data.success) {
        // For now, just show empty state until we have actual memories
        setMemories([]);
        setError(null);
      } else {
        throw new Error('Failed to fetch memory analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Search memories
  const searchMemories = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10, threshold: 0.3 }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      if (data.success) {
        const formattedResults = data.results.map((result: any) => ({
          memory: result.memory,
          similarity: result.similarity,
          category: result.category,
          relationships: result.relationships || []
        }));
        setSearchResults(formattedResults);
        setError(null);
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/memory/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      if (data.success) {
        const analytics: MemoryAnalytics = {
          totalMemories: data.analytics.totalMemories,
          categoryDistribution: Object.entries(data.analytics.categoryDistribution || {}).map(([category, count]) => ({
            category,
            count: count as number
          })),
          topAccessedMemories: data.analytics.topAccessedMemories || [],
          averageRelationships: data.analytics.averageRelationships || 0,
          memoryHealth: {
            indexingHealth: data.analytics.memoryHealth?.indexingHealth || 1.0,
            categorizationHealth: data.analytics.memoryHealth?.categorizationHealth || 1.0,
            relationshipHealth: data.analytics.memoryHealth?.relationshipHealth || 1.0,
            overallHealth: data.analytics.memoryHealth?.overallHealth || 1.0,
          },
        };
        
        setAnalytics(analytics);
        setError(null);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchAnalytics();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = () => {
    searchMemories(searchQuery);
  };

  const handleMemoryClick = (memory: AgentMemory) => {
    setSelectedMemory(memory);
    setDialogOpen(true);
  };

  const formatHealthScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const getHealthColor = (score: number): string => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <MemoryIcon sx={{ mr: 1 }} />
        Smart Memory Index
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="memory management tabs">
          <Tab label="Memories" />
          <Tab label="Search" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Agent Memories ({memories.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={fetchMemories}
            sx={{ mb: 2 }}
          >
            Refresh Memories
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {memories.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No memories found. Smart Memory Index is ready but no agent memories have been created yet.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              memories.map((memory) => (
                <Grid item xs={12} md={6} key={memory.id}>
                  <Card sx={{ cursor: 'pointer' }} onClick={() => handleMemoryClick(memory)}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Agent: {memory.agentId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Success Rate: {Math.round(memory.performance.successRate * 100)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Interactions: {memory.performance.totalInteractions}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {memory.knowledge.concepts.slice(0, 3).map((concept, index) => (
                          <Chip key={index} label={concept} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                        {memory.knowledge.concepts.length > 3 && (
                          <Chip label={`+${memory.knowledge.concepts.length - 3} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Semantic Memory Search
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search memories by content, patterns, or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {searchResults.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchQuery ? 'No matching memories found.' : 'Enter a search query to find relevant memories.'}
                </Typography>
              </Paper>
            ) : (
              searchResults.map((result, index) => (
                <ListItem
                  key={index}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleMemoryClick(result.memory)}
                >
                  <ListItemText
                    primary={`Agent: ${result.memory.agentId}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Similarity: {Math.round(result.similarity * 100)}% | Category: {result.category}
                        </Typography>
                        <br />
                        <Typography variant="body2" color="text.secondary">
                          {result.memory.knowledge.concepts.slice(0, 5).join(', ')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          Memory System Analytics
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : analytics ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Overview
                  </Typography>
                  <Typography variant="body1">
                    Total Memories: {analytics.totalMemories}
                  </Typography>
                  <Typography variant="body1">
                    Average Relationships: {analytics.averageRelationships.toFixed(1)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Memory Health
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Overall Health:</Typography>
                      <Chip 
                        label={formatHealthScore(analytics.memoryHealth.overallHealth)}
                        color={getHealthColor(analytics.memoryHealth.overallHealth) as any}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Indexing:</Typography>
                      <Typography variant="body2">
                        {formatHealthScore(analytics.memoryHealth.indexingHealth)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Categorization:</Typography>
                      <Typography variant="body2">
                        {formatHealthScore(analytics.memoryHealth.categorizationHealth)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Relationships:</Typography>
                      <Typography variant="body2">
                        {formatHealthScore(analytics.memoryHealth.relationshipHealth)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {analytics.categoryDistribution.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Category Distribution
                    </Typography>
                    <List>
                      {analytics.categoryDistribution.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={item.category}
                            secondary={`${item.count} memories`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Analytics data not available
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* Memory Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Memory Details: {selectedMemory?.agentId}
        </DialogTitle>
        <DialogContent>
          {selectedMemory && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">Success Rate:</Typography>
                  <Typography variant="h6" color="primary">
                    {Math.round(selectedMemory.performance.successRate * 100)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Total Interactions:</Typography>
                  <Typography variant="h6" color="primary">
                    {selectedMemory.performance.totalInteractions}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Knowledge Concepts
              </Typography>
              <Box sx={{ mb: 3 }}>
                {selectedMemory.knowledge.concepts.map((concept, index) => (
                  <Chip key={index} label={concept} sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Success Patterns
              </Typography>
              <Box sx={{ mb: 3 }}>
                {selectedMemory.patterns.successPatterns.map((pattern, index) => (
                  <Chip key={index} label={pattern} variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Recent Interactions ({selectedMemory.interactions.length})
              </Typography>
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {selectedMemory.interactions.slice(0, 5).map((interaction) => (
                  <ListItem key={interaction.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={interaction.summary}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {new Date(interaction.timestamp).toLocaleString()}
                          </Typography>
                          <Chip
                            label={interaction.success ? 'Success' : 'Failed'}
                            size="small"
                            color={interaction.success ? 'success' : 'error'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemoryManager;