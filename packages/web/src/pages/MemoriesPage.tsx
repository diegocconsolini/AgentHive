import React, { useState, useEffect } from 'react';
import { Brain, Plus, Search, Filter, Tag, Calendar, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

// SmartMemoryIndex API Configuration
const SMARTMEMORY_API_URL = 'http://localhost:4001/api/memory';

interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// AgentMemory interface from SmartMemoryIndex
interface AgentMemory {
  id: string;
  agentId: string;
  userId: string;
  created: string;
  updated: string;
  interactions: Array<{
    timestamp: string;
    summary: string;
  }>;
  knowledge: {
    concepts: string[];
    expertise: string;
  };
  patterns: {
    userPreferences: string[];
  };
}

// Transform AgentMemory to frontend Memory format
const transformAgentMemoryToMemory = (agentMemory: AgentMemory): Memory => {
  // Extract title from first interaction or knowledge
  const title = agentMemory.interactions?.[0]?.summary || 
               agentMemory.knowledge?.expertise || 
               'Memory';
  
  // Safely get concepts array
  const concepts = Array.isArray(agentMemory.knowledge?.concepts) ? agentMemory.knowledge.concepts : [];
  const userPreferences = Array.isArray(agentMemory.patterns?.userPreferences) ? agentMemory.patterns.userPreferences : [];
  
  // Create content from knowledge and patterns
  const content = [
    `Expertise: ${agentMemory.knowledge?.expertise || 'N/A'}`,
    `Concepts: ${concepts.join(', ') || 'None'}`,
    ...(userPreferences.length > 0 ? 
        [`Preferences: ${userPreferences.join(', ')}`] : [])
  ].join('\n');
  
  // Use concepts as tags
  const tags = concepts;
  
  return {
    id: agentMemory.id,
    title,
    content,
    tags,
    createdAt: agentMemory.created,
    updatedAt: agentMemory.updated,
    userId: agentMemory.userId
  };
};

export const MemoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // REST API state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch memories from SmartMemoryIndex API
  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get analytics to find memory IDs
      const analyticsResponse = await fetch(`${SMARTMEMORY_API_URL}/analytics`);
      const analyticsData = await analyticsResponse.json();
      
      if (!analyticsData.success) {
        throw new Error('Failed to fetch memory analytics');
      }
      
      const memoryIds = analyticsData.analytics.topAccessedMemories.map((item: [string, number]) => item[0]);
      
      // Fetch individual memories
      const memoryPromises = memoryIds.map(async (id: string) => {
        const response = await fetch(`${SMARTMEMORY_API_URL}/${id}`);
        const data = await response.json();
        if (data.success) {
          return transformAgentMemoryToMemory(data.memory);
        }
        return null;
      });
      
      const fetchedMemories = (await Promise.all(memoryPromises)).filter(Boolean) as Memory[];
      
      // Apply filtering
      let filteredMemories = fetchedMemories;
      
      if (searchQuery) {
        filteredMemories = filteredMemories.filter(memory => 
          memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memory.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedTags.length > 0) {
        filteredMemories = filteredMemories.filter(memory =>
          selectedTags.some(tag => memory.tags.includes(tag))
        );
      }
      
      setMemories(filteredMemories);
    } catch (err) {
      console.error('Error fetching memories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memories');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch memories on component mount and when filters change
  useEffect(() => {
    fetchMemories();
  }, [searchQuery, selectedTags]);

  // Get all unique tags from memories
  const allTags = Array.from(new Set(memories.flatMap(memory => memory.tags)));

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      // Transform frontend memory to AgentMemory format for SmartMemoryIndex
      const agentMemoryData = {
        agentId: 'frontend-user',
        userId: 'current-user', // In real app, get from auth
        interactions: [{
          timestamp: new Date().toISOString(),
          summary: newTitle.trim()
        }],
        knowledge: {
          concepts: newTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          expertise: newContent.trim()
        },
        patterns: {
          userPreferences: []
        }
      };

      const response = await fetch(`${SMARTMEMORY_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentMemoryData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create memory');
      }
      
      // Reset form and close modal
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setShowNewMemoryForm(false);
      
      // Refresh memories
      await fetchMemories();
    } catch (err) {
      console.error('Failed to create memory:', err);
      setError(err instanceof Error ? err.message : 'Failed to create memory');
    }
  };

  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !newTitle.trim() || !newContent.trim()) return;

    try {
      // SmartMemoryIndex doesn't currently support direct updates
      // For now, we'll skip this functionality or implement via delete+create
      console.warn('Memory update not yet implemented in SmartMemoryIndex API');
      setError('Update functionality not available yet - coming soon!');
      
      // Reset form and close modal
      setEditingMemory(null);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    } catch (err) {
      console.error('Failed to update memory:', err);
      setError(err instanceof Error ? err.message : 'Failed to update memory');
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      // SmartMemoryIndex doesn't currently support direct deletes
      // For now, we'll skip this functionality
      console.warn('Memory delete not yet implemented in SmartMemoryIndex API');
      setError('Delete functionality not available yet - coming soon!');
    } catch (err) {
      console.error('Failed to delete memory:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  const startEditing = (memory: Memory) => {
    setEditingMemory(memory);
    setNewTitle(memory.title);
    setNewContent(memory.content);
    setNewTags(memory.tags.join(', '));
  };

  const cancelEditing = () => {
    setEditingMemory(null);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading memories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="text-red-600 dark:text-red-400">
            Error loading memories: {error}
          </div>
          <button 
            onClick={() => {
              setError(null);
              fetchMemories();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Memories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and organize your memory collection ({memories.length} memories)
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowNewMemoryForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Memory
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map((memory) => (
          <div key={memory.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {memory.title}
              </h3>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => startEditing(memory)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
              {memory.content}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(memory.createdAt)}
              </div>
              {memory.createdAt !== memory.updatedAt && (
                <div className="text-xs text-gray-400">
                  Updated: {formatDate(memory.updatedAt)}
                </div>
              )}
            </div>
            
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {memory.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {memories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No memories found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedTags.length > 0 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first memory!'
            }
          </p>
          <button
            onClick={() => setShowNewMemoryForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Memory
          </button>
        </div>
      )}

      {/* New Memory Modal */}
      {showNewMemoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Create New Memory
              </h2>
              <form onSubmit={handleCreateMemory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter memory title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter memory content"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., programming, tips, javascript"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMemoryForm(false);
                      setNewTitle('');
                      setNewContent('');
                      setNewTags('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Memory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Edit Memory
              </h2>
              <form onSubmit={handleUpdateMemory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter memory title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter memory content"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., programming, tips, javascript"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Memory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};