import express from 'express';
import { Post } from '../models/post.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleFileUpload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', '-password');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '-password');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching post' });
  }
});

router.post('/new', authenticateToken, upload.single('media'), handleFileUpload, async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user.id,
      media: req.fileUrl ? {
        url: req.fileUrl,
        type: req.fileType
      } : undefined
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

router.delete('/del/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id
    });
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

router.put('/upd/:id', authenticateToken, upload.single('media'), handleFileUpload, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.fileUrl) {
      updates.media = {
        url: req.fileUrl,
        type: req.fileType
      };
    }
    updates.updatedAt = new Date();
    
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      updates,
      { new: true }
    ).populate('author', '-password');
    
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error updating post' });
  }
});

router.post('/like/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const userId = req.user.id;
    
    // Check if user has already liked the post
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // If user has already liked, remove their like
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // If user hasn't liked, add their like
      post.likes.push(userId);
    }
    
    await post.save();
    res.json({ likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Error liking the post' });
  }
});


export default router;