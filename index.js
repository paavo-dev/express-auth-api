import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: { 
    url: { type: String },
    type: { type: String, enum: ['image', 'video'] }
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User ', userSchema);
const Post = mongoose.model('Post', postSchema);

const handleFileUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    const uploadOptions = {
      resource_type: isVideo ? 'video' : 'image',
      ...(isVideo && {
        eager: [
          { width: 720, crop: "scale" }
        ]
      })
    };

    const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
    req.fileUrl = result.secure_url;
    req.fileType = isVideo ? 'video' : 'image';
    
    fs.unlinkSync(req.file.path);
    next();
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error uploading file' });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/users', async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 });
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(users, null, 2)); 
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  });
  

app.get('/users/:username', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username }, { password: 0 });
      if (!user) return res.status(404).json({ error: 'User  not found' });
      
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(user, null, 2)); 
    } catch (error) {
      res.status(500).json({ error: 'Error fetching user' });
    }
  });

app.delete('/users/del/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User  not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

app.put('/users/upd/:id', authenticateToken, upload.single('avatar'), handleFileUpload, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.fileUrl) {
      updates.avatar = req.fileUrl;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ error: 'User  not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

app.get('/posts', async (req, res) => {
    try {
      const posts = await Post.find().populate('author', '-password');
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(posts, null, 2)); 
    } catch (error) {
      res.status(500).json({ error: 'Error fetching posts' });
    }
  });

  app.get('/posts/:id', async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate('author', '-password');
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(post, null, 2)); // Pretty print JSON
    } catch (error) {
      res.status(500).json({ error: 'Error fetching post' });
    }
  });

app.post('/posts/new', authenticateToken, upload.single('media'), handleFileUpload, async (req, res) => {
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

app.delete('/posts/del/:id', authenticateToken, async (req, res) => {
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

app.put('/posts/upd/:id', authenticateToken, upload.single('media'), handleFileUpload, async (req, res) => {
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

app.post('/auth/signup', upload.single('avatar'), handleFileUpload, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const avatar = req.fileUrl || 'https://res.cloudinary.com/dyuabsnoo/image/upload/v1739880832/1200px-Default_pfp.svg_rv2dcl.png';

    const user = new User({
      username,
      password, 
      email,
      avatar: avatar
    });
    
    await user.save();
    
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
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
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
    res.status(500).json({ error: 'Error logging in' });
  }
});

const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});