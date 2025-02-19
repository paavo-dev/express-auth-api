import express from 'express';
import jwt from 'jsonwebtoken';
import { upload, handleFileUpload } from '../middleware/upload.js';
import { User } from '../models/user.js';

const router = express.Router();

// Signup Route
router.post('/signup', upload.single('avatar'), handleFileUpload, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    console.log('Signup attempt:', { username, email });

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      console.log('User already exists:', { username, email });
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    const user = new User({
      username,
      password, 
      email,
      avatar: req.fileUrl
    });

    await user.save();
    console.log('User created successfully:', { id: user._id, username });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    // Validate input
    if (!username || !password) {
      console.log('Missing credentials:', { username, hasPassword: !!password });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    console.log('User found:', !!user);

    if (!user || user.password !== password) { // Directly compare passwords
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful:', { username });
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

export default router;
