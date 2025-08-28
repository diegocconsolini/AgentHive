#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse agent markdown file
function parseAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Parse frontmatter
    const frontmatterStart = lines.findIndex(line => line === '---');
    const frontmatterEnd = lines.findIndex((line, index) => index > frontmatterStart && line === '---');
    
    if (frontmatterStart === -1 || frontmatterEnd === -1) {
      console.warn(`No frontmatter found in ${filePath}`);
      return null;
    }
    
    const frontmatter = {};
    for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
      const line = lines[i];
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        frontmatter[key.trim()] = valueParts.join(':').trim();
      }
    }
    
    // Parse content sections
    const bodyContent = lines.slice(frontmatterEnd + 1).join('\n');
    
    // Extract focus areas
    const focusMatch = bodyContent.match(/## Focus Areas\n([\s\S]*?)(?=\n## |$)/);
    const focusAreas = focusMatch ? 
      focusMatch[1].split('\n')
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim())
        .filter(Boolean) : [];
    
    // Extract capabilities from description
    const capabilities = extractCapabilities(frontmatter.description || '');
    
    // Categorize agent
    const category = categorizeAgent(frontmatter.name, frontmatter.description);
    
    // Generate tags
    const tags = generateTags(frontmatter.name, frontmatter.description, focusAreas);
    
    return {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formatName(frontmatter.name),
      description: frontmatter.description,
      version: '1.0.0',
      category,
      model: frontmatter.model === 'opus' ? 'claude-3-opus' : 
             frontmatter.model === 'sonnet' ? 'claude-3-sonnet' : 'claude-3-haiku',
      tags,
      capabilities,
      dependencies: [],
      config: {
        temperature: frontmatter.model === 'opus' ? 0.3 : 0.7,
        maxTokens: 4000,
        timeout: 30000,
        retries: 3,
        customSettings: null
      },
      status: 'active',
      popularity: Math.floor(Math.random() * 1000) + 50,
      rating: (4.0 + Math.random() * 1.0).toFixed(1),
      systemPrompt: bodyContent.trim(),
      isPublic: true,
      authorId: 'admin',
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

function formatName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractCapabilities(description) {
  const capabilities = [];
  
  // Common capability patterns
  const patterns = [
    /write|implement|create|build|develop/i,
    /optimize|improve|enhance|refactor/i,
    /test|debug|troubleshoot|fix/i,
    /analyze|review|audit|assess/i,
    /deploy|configure|setup|manage/i,
    /integrate|connect|api/i,
    /design|architect|pattern/i,
    /performance|scale|monitor/i
  ];
  
  const capabilityNames = [
    'code-generation',
    'optimization', 
    'testing-debugging',
    'code-analysis',
    'deployment',
    'integration',
    'architecture-design',
    'performance-monitoring'
  ];
  
  patterns.forEach((pattern, index) => {
    if (pattern.test(description)) {
      capabilities.push(capabilityNames[index]);
    }
  });
  
  return capabilities.length > 0 ? capabilities : ['general-purpose'];
}

function categorizeAgent(name, description) {
  const categoryMap = {
    'development': [
      'python', 'javascript', 'typescript', 'java', 'rust', 'golang', 'cpp', 'csharp', 
      'php', 'ruby', 'scala', 'elixir', 'frontend', 'backend', 'mobile', 'android', 
      'ios', 'flutter', 'unity', 'code-reviewer', 'code-analyzer', 'debugger'
    ],
    'devops': [
      'deployment', 'docker', 'kubernetes', 'terraform', 'cloud', 'network', 
      'devops', 'incident', 'performance', 'config', 'database-admin'
    ],
    'testing': [
      'test', 'qa', 'automation'
    ],
    'ai-ml': [
      'ai', 'ml', 'mlops', 'data-scientist', 'data-engineer'
    ],
    'design': [
      'ui', 'ux', 'designer', 'accessibility'
    ],
    'business': [
      'business', 'product', 'analyst', 'hr', 'sales', 'customer', 'legal', 'startup'
    ],
    'content': [
      'content', 'technical-writer', 'docs', 'tutorial', 'seo'
    ],
    'security': [
      'security', 'audit'
    ],
    'blockchain': [
      'blockchain', 'crypto'
    ],
    'specialized': [
      'minecraft', 'vr', 'ar', 'wordpress', 'payment', 'quant', 'risk'
    ]
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => name.toLowerCase().includes(keyword) || 
                              description.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

function generateTags(name, description, focusAreas) {
  const tags = [];
  
  // Add category-based tags
  const words = [...name.split('-'), ...description.toLowerCase().split(/\s+/)];
  const commonTags = [
    'react', 'typescript', 'javascript', 'python', 'ai', 'ml', 'api', 
    'database', 'cloud', 'security', 'testing', 'performance', 'mobile',
    'backend', 'frontend', 'devops', 'design', 'seo', 'blockchain'
  ];
  
  commonTags.forEach(tag => {
    if (words.some(word => word.includes(tag))) {
      tags.push(tag);
    }
  });
  
  // Add focus area based tags
  focusAreas.forEach(area => {
    const areaWords = area.toLowerCase().split(/\s+/);
    commonTags.forEach(tag => {
      if (areaWords.some(word => word.includes(tag)) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

// Main execution
async function main() {
  const agentsDir = '/home/diegocc/AgentsReview/AgentsReview';
  const outputFile = '/home/diegocc/epic-memory-manager-unified/agents-data.json';
  
  try {
    const files = fs.readdirSync(agentsDir);
    const agentFiles = files.filter(file => file.endsWith('.md') && file !== 'README.md');
    
    console.log(`Found ${agentFiles.length} agent files`);
    
    const agents = [];
    for (const file of agentFiles) {
      const filePath = path.join(agentsDir, file);
      const agent = parseAgentFile(filePath);
      if (agent) {
        agents.push(agent);
      }
    }
    
    console.log(`Successfully parsed ${agents.length} agents`);
    
    // Write to output file
    fs.writeFileSync(outputFile, JSON.stringify(agents, null, 2));
    console.log(`Agent data written to ${outputFile}`);
    
    // Print summary
    const categories = [...new Set(agents.map(a => a.category))];
    console.log(`\nCategories found: ${categories.join(', ')}`);
    console.log(`Models: ${[...new Set(agents.map(a => a.model))].join(', ')}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();