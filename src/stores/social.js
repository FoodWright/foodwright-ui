import { defineStore } from 'pinia'
import { fetchWithAuth, fetchPublic } from 'src/services/api'

export const useSocialStore = defineStore('social', {
  state: () => ({
    followingFeed: [],
    exploreFeed: [],
    userPosts: {},  // Keyed by userId
    followStatus: {},  // Keyed by userId
    feedPage: 1,
    explorePage: 1,
    hasMoreFollowing: true,
    hasMoreExplore: true,
  }),

  actions: {
    async fetchFeed(page = 1) {
      try {
        const data = await fetchWithAuth(`/feed?page=${page}`)

        if (page === 1) {
          this.followingFeed = data.posts || []
        } else {
          this.followingFeed.push(...(data.posts || []))
        }

        this.feedPage = page
        this.hasMoreFollowing = page < (data.total_pages || 1)
        return data
      } catch (error) {
        console.error('Error fetching feed:', error)
        throw error
      }
    },

    async fetchExploreFeed(page = 1) {
      try {
        const data = await fetchPublic(`/explore?page=${page}`)

        if (page === 1) {
          this.exploreFeed = data.posts || []
        } else {
          this.exploreFeed.push(...(data.posts || []))
        }

        this.explorePage = page
        this.hasMoreExplore = page < (data.total_pages || 1)
        return data
      } catch (error) {
        console.error('Error fetching explore feed:', error)
        throw error
      }
    },

    async createQuickPost(payload) {
      try {
        const data = await fetchWithAuth('/posts/quick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        // Refresh feed to show new post
        await this.fetchFeed(1)
        return data
      } catch (error) {
        console.error('Error creating quick post:', error)
        throw error
      }
    },

    async shareRecipe(recipeId) {
      try {
        const data = await fetchWithAuth(`/recipes/${recipeId}/share`, {
          method: 'POST'
        })

        // Refresh feed to show new post
        await this.fetchFeed(1)
        return data
      } catch (error) {
        console.error('Error sharing recipe:', error)
        throw error
      }
    },

    async likePost(postId) {
      try {
        const data = await fetchWithAuth(`/posts/${postId}/like`, {
          method: 'POST'
        })

        // Update like status in feeds
        this.updatePostLike(postId, data.liked)
        return data
      } catch (error) {
        console.error('Error liking post:', error)
        throw error
      }
    },

    async repostToFeed(postId) {
      try {
        const data = await fetchWithAuth(`/posts/${postId}/repost`, {
          method: 'POST'
        })

        // Refresh feed to show repost
        await this.fetchFeed(1)
        return data
      } catch (error) {
        console.error('Error reposting:', error)
        throw error
      }
    },

    async deletePost(postId) {
      try {
        await fetchWithAuth(`/posts/${postId}`, {
          method: 'DELETE'
        })

        // Remove post from feeds
        this.followingFeed = this.followingFeed.filter(p => p.id !== postId)
        this.exploreFeed = this.exploreFeed.filter(p => p.id !== postId)
      } catch (error) {
        console.error('Error deleting post:', error)
        throw error
      }
    },

    async followUser(userId) {
      try {
        await fetchWithAuth(`/users/${userId}/follow`, {
          method: 'POST'
        })
        this.followStatus[userId] = true
      } catch (error) {
        console.error('Error following user:', error)
        throw error
      }
    },

    async unfollowUser(userId) {
      try {
        await fetchWithAuth(`/users/${userId}/follow`, {
          method: 'DELETE'
        })
        this.followStatus[userId] = false
      } catch (error) {
        console.error('Error unfollowing user:', error)
        throw error
      }
    },

    async fetchUserPosts(userId, page = 1) {
      try {
        const data = await fetchPublic(`/users/${userId}/posts?page=${page}`)

        if (!this.userPosts[userId]) {
          this.userPosts[userId] = []
        }

        if (page === 1) {
          this.userPosts[userId] = data.posts || []
        } else {
          this.userPosts[userId].push(...(data.posts || []))
        }

        return data
      } catch (error) {
        console.error('Error fetching user posts:', error)
        throw error
      }
    },

    async checkFollowStatus(userId) {
      try {
        const data = await fetchWithAuth(`/users/${userId}/follow-status`)
        this.followStatus[userId] = data.is_following
        return data.is_following
      } catch (error) {
        console.error('Error checking follow status:', error)
        return false
      }
    },

    updatePostLike(postId, isLiked) {
      // Helper to toggle like status in feeds
      const updateInFeed = (feed) => {
        const post = feed.find(p => p.id === postId)
        if (post) {
          post.is_liked = isLiked
          post.like_count += isLiked ? 1 : -1
        }
      }
      updateInFeed(this.followingFeed)
      updateInFeed(this.exploreFeed)
    },

    clearFeeds() {
      this.followingFeed = []
      this.exploreFeed = []
      this.userPosts = {}
      this.feedPage = 1
      this.explorePage = 1
      this.hasMoreFollowing = true
      this.hasMoreExplore = true
    }
  }
})
