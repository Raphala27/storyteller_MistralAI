/**
 * Utility functions for managing local (unauthenticated) stories
 * Max 3 stories for non-authenticated users
 */

const LOCAL_STORIES_KEY = 'storyteller_local_stories'
const MAX_LOCAL_STORIES = 3

/**
 * Get all local stories from localStorage
 */
export const getLocalStories = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORIES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading local stories:', error)
    return []
  }
}

/**
 * Save a story to localStorage
 * Enforces max 3 stories limit (removes oldest if needed)
 */
export const saveLocalStory = (storyData) => {
  try {
    let stories = getLocalStories()
    
    // Check if story already exists (update it)
    const existingIndex = stories.findIndex(s => s.id === storyData.id)
    
    if (existingIndex >= 0) {
      // Update existing story
      stories[existingIndex] = {
        ...stories[existingIndex],
        ...storyData,
        updated_at: new Date().toISOString()
      }
    } else {
      // Add new story
      // If we have 3 stories already, remove the oldest one
      if (stories.length >= MAX_LOCAL_STORIES) {
        // Sort by updated_at and remove oldest
        stories.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        stories.pop() // Remove oldest
      }
      
      stories.push({
        ...storyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(stories))
    return true
  } catch (error) {
    console.error('Error saving local story:', error)
    return false
  }
}

/**
 * Get a specific local story by ID
 */
export const getLocalStory = (storyId) => {
  const stories = getLocalStories()
  return stories.find(s => s.id === storyId)
}

/**
 * Delete a local story
 */
export const deleteLocalStory = (storyId) => {
  try {
    const stories = getLocalStories()
    const filtered = stories.filter(s => s.id !== storyId)
    localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting local story:', error)
    return false
  }
}

/**
 * Clear all local stories (used when user logs in)
 */
export const clearLocalStories = () => {
  try {
    localStorage.removeItem(LOCAL_STORIES_KEY)
    return true
  } catch (error) {
    console.error('Error clearing local stories:', error)
    return false
  }
}

/**
 * Get count of local stories
 */
export const getLocalStoriesCount = () => {
  return getLocalStories().length
}

/**
 * Check if user can create more local stories
 */
export const canCreateLocalStory = () => {
  return getLocalStoriesCount() < MAX_LOCAL_STORIES
}

/**
 * Format local story to match API response format
 */
export const formatLocalStoryForDisplay = (story) => {
  return {
    story_id: story.id,
    title: story.title || 'Untitled Story',
    genre: story.genre || 'Unknown',
    is_complete: story.is_complete || false,
    created_at: story.created_at,
    updated_at: story.updated_at,
    segment_count: story.segments ? story.segments.length : 0,
    isLocal: true // Flag to identify local stories
  }
}
