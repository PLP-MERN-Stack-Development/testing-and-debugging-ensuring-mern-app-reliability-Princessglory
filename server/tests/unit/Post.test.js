// Unit tests for Post model
const mongoose = require('mongoose');
const Post = require('../../src/models/Post');

describe('Post Model', () => {
  describe('Schema Validation', () => {
    test('should be valid with all required fields', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError).toBeUndefined();
    });

    test('should require title', () => {
      const postData = {
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title is required');
    });

    test('should require content', () => {
      const postData = {
        title: 'Test Post Title',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors.content).toBeDefined();
      expect(validationError.errors.content.message).toBe('Content is required');
    });

    test('should require author', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content'
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors.author).toBeDefined();
    });

    test('should validate title length', () => {
      const longTitle = 'a'.repeat(101); // exceeds 100 character limit
      const postData = {
        title: longTitle,
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title cannot exceed 100 characters');
    });

    test('should validate content length', () => {
      const longContent = 'a'.repeat(2001); // exceeds 2000 character limit
      const postData = {
        title: 'Test Post Title',
        content: longContent,
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors.content).toBeDefined();
      expect(validationError.errors.content.message).toBe('Content cannot exceed 2000 characters');
    });

    test('should validate tag length', () => {
      const longTag = 'a'.repeat(21); // exceeds 20 character limit
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        tags: [longTag]
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors['tags.0']).toBeDefined();
      expect(validationError.errors['tags.0'].message).toBe('Tag cannot exceed 20 characters');
    });

    test('should validate comment content length', () => {
      const longComment = 'a'.repeat(501); // exceeds 500 character limit
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        comments: [{
          user: new mongoose.Types.ObjectId(),
          content: longComment
        }]
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError.errors['comments.0.content']).toBeDefined();
      expect(validationError.errors['comments.0.content'].message).toBe('Comment cannot exceed 500 characters');
    });

    test('should set default values correctly', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      
      expect(post.isPublished).toBe(true);
      expect(post.tags).toEqual([]);
      expect(post.likes).toEqual([]);
      expect(post.comments).toEqual([]);
    });

    test('should trim whitespace from title but not content', () => {
      const postData = {
        title: '  Test Post Title  ',
        content: '  This is test post content  ',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      
      expect(post.title).toBe('Test Post Title');
      expect(post.content).toBe('  This is test post content  ');
    });

    test('should trim whitespace from tags', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        tags: ['  tag1  ', '  tag2  ']
      };

      const post = new Post(postData);
      
      expect(post.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate likeCount correctly', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        likes: [
          { user: new mongoose.Types.ObjectId() },
          { user: new mongoose.Types.ObjectId() },
          { user: new mongoose.Types.ObjectId() }
        ]
      };

      const post = new Post(postData);
      
      expect(post.likeCount).toBe(3);
    });

    test('should return 0 for likeCount when no likes', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      
      expect(post.likeCount).toBe(0);
    });

    test('should calculate commentCount correctly', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        comments: [
          { user: new mongoose.Types.ObjectId(), content: 'Comment 1' },
          { user: new mongoose.Types.ObjectId(), content: 'Comment 2' }
        ]
      };

      const post = new Post(postData);
      
      expect(post.commentCount).toBe(2);
    });

    test('should return 0 for commentCount when no comments', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId()
      };

      const post = new Post(postData);
      
      expect(post.commentCount).toBe(0);
    });
  });

  describe('JSON Transformation', () => {
    test('should exclude __v from JSON output and include virtuals', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        likes: [{ user: new mongoose.Types.ObjectId() }],
        comments: [{ user: new mongoose.Types.ObjectId(), content: 'Great post!' }]
      };

      const post = new Post(postData);
      post._id = 'mockid123';
      post.__v = 0;

      const jsonOutput = post.toJSON();
      
      expect(jsonOutput.__v).toBeUndefined();
      expect(jsonOutput.title).toBe('Test Post Title');
      expect(jsonOutput.content).toBe('This is test post content');
      expect(jsonOutput.likeCount).toBe(1);
      expect(jsonOutput.commentCount).toBe(1);
    });
  });

  describe('Nested Schema Validation', () => {
    test('should validate likes structure', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        likes: [{ user: new mongoose.Types.ObjectId() }]
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError).toBeUndefined();
    });

    test('should validate comments structure', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        comments: [{ 
          user: new mongoose.Types.ObjectId(),
          content: 'Test comment'
        }]
      };

      const post = new Post(postData);
      const validationError = post.validateSync();
      
      expect(validationError).toBeUndefined();
    });

    test('should set default createdAt for likes and comments', () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        likes: [{ user: new mongoose.Types.ObjectId() }],
        comments: [{ 
          user: new mongoose.Types.ObjectId(), 
          content: 'Great post!' 
        }]
      };

      const post = new Post(postData);
      
      expect(post.likes[0].createdAt).toBeInstanceOf(Date);
      expect(post.comments[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Schema References', () => {
    test('should reference User model for author', () => {
      const authorId = new mongoose.Types.ObjectId();
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: authorId
      };

      const post = new Post(postData);
      
      expect(post.author).toEqual(authorId);
      expect(post.author).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    test('should reference User model for likes.user', () => {
      const userId = new mongoose.Types.ObjectId();
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        likes: [{ user: userId }]
      };

      const post = new Post(postData);
      
      expect(post.likes[0].user).toEqual(userId);
      expect(post.likes[0].user).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    test('should reference User model for comments.user', () => {
      const userId = new mongoose.Types.ObjectId();
      const postData = {
        title: 'Test Post Title',
        content: 'This is test post content',
        author: new mongoose.Types.ObjectId(),
        comments: [{ 
          user: userId,
          content: 'Great post!'
        }]
      };

      const post = new Post(postData);
      
      expect(post.comments[0].user).toEqual(userId);
      expect(post.comments[0].user).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });
});