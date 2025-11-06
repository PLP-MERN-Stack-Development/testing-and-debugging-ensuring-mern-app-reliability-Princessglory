// Unit tests for posts routes  
const request = require('supertest');
const express = require('express');
const Post = require('../../src/models/Post');

// Mock express-validator
jest.mock('express-validator', () => {
  const mockChain = {
    isLength: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isArray: jest.fn().mockReturnThis()
  };
  
  return {
    body: jest.fn().mockImplementation(() => Object.assign((req, res, next) => next(), mockChain)),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    })
  };
});

// Mock dependencies
jest.mock('../../src/models/Post');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { _id: 'user123', username: 'testuser' };
  next();
});

const postsRoutes = require('../../src/routes/posts');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { _id: 'user123', username: 'testuser' };
  next();
};

app.use('/posts', mockAuth, postsRoutes);

describe('Posts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /posts', () => {
    test('should get all posts successfully', async () => {
      const mockPosts = [
        {
          _id: 'post1',
          title: 'Test Post 1',
          content: 'Content 1',
          author: { _id: 'user123', username: 'testuser' }
        },
        {
          _id: 'post2',
          title: 'Test Post 2', 
          content: 'Content 2',
          author: { _id: 'user456', username: 'otheruser' }
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockPosts)
      };

      Post.find = jest.fn().mockReturnValue(mockQuery);
      Post.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.posts).toEqual(mockPosts);
      expect(response.body.data.totalPosts).toBe(2);
    });

    test('should handle pagination parameters', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      Post.find = jest.fn().mockReturnValue(mockQuery);
      Post.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/posts?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(mockQuery.skip).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /posts/:id', () => {
    test('should get single post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        title: 'Test Post',
        content: 'Test Content',
        author: { _id: 'user123', username: 'testuser' }
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockPost)
      };

      Post.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app).get('/posts/post123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.post).toEqual(mockPost);
    });

    test('should return 404 for non-existent post', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Post.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app).get('/posts/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('POST /posts', () => {
    test('should create new post successfully', async () => {
      const postData = {
        title: 'New Test Post',
        content: 'New test content',
        tags: ['test', 'unit-testing']
      };

      const mockPost = {
        _id: 'newpost123',
        ...postData,
        author: 'user123',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'newpost123',
          ...postData,
          author: { _id: 'user123', username: 'testuser' }
        })
      };

      Post.mockImplementation(() => mockPost);

      const response = await request(app)
        .post('/posts')
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(mockPost.save).toHaveBeenCalled();
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/posts')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /posts/:id', () => {
    test('should update post successfully by author', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const mockPost = {
        _id: 'post123',
        title: 'Original Title',
        author: { _id: 'user123' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'post123',
          ...updateData,
          author: { _id: 'user123', username: 'testuser' }
        })
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/posts/post123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(mockPost.save).toHaveBeenCalled();
    });

    test('should return 403 when user tries to update others post', async () => {
      const mockPost = {
        _id: 'post123',
        author: { _id: 'otheruser456' }
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/posts/post123')
        .send({ title: 'Updated' });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized to update this post');
    });
  });

  describe('DELETE /posts/:id', () => {
    test('should delete post successfully by author', async () => {
      const mockPost = {
        _id: 'post123',
        author: { _id: 'user123' },
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app).delete('/posts/post123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Post deleted successfully');
    });

    test('should return 403 when user tries to delete others post', async () => {
      const mockPost = {
        _id: 'post123',
        author: { _id: 'otheruser456' }
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app).delete('/posts/post123');

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized to delete this post');
    });
  });

  describe('POST /posts/:id/like', () => {
    test('should like post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        likes: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app).post('/posts/post123/like');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(mockPost.likes).toContainEqual({ user: 'user123' });
    });

    test('should unlike post if already liked', async () => {
      const mockPost = {
        _id: 'post123',
        likes: [{ user: 'user123' }],
        save: jest.fn().mockResolvedValue(true)
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app).post('/posts/post123/like');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(mockPost.likes).toHaveLength(0);
    });
  });

  describe('POST /posts/:id/comment', () => {
    test('should add comment successfully', async () => {
      const commentData = {
        content: 'Great post!'
      };

      const mockPost = {
        _id: 'post123',
        comments: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'post123',
          comments: [{ content: 'Great post!', user: 'user123' }]
        })
      };

      Post.findById = jest.fn().mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/posts/post123/comment')
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(mockPost.comments).toContainEqual({
        content: 'Great post!',
        user: 'user123'
      });
    });

    test('should return 400 for missing comment content', async () => {
      const response = await request(app)
        .post('/posts/post123/comment')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
});