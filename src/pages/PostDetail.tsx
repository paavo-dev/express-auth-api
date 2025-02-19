import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const { data: post, isLoading, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${id}`);
      return data;
    }
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/like/${id}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      refetch(); // Re-fetch post data to update likes count
      toast.success('Post liked/unliked successfully!');
    },
    onError: () => {
      toast.error('Failed to like/unlike post');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/posts/del/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      toast.success('Post deleted successfully!');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate();
    }
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img
              src={post.author.avatar || 'https://via.placeholder.com/40'}
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium">{post.author.username}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {user?.id === post.author._id && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">{post.content}</p>
        
        {post.media && (
          <div className="rounded-lg overflow-hidden">
            {post.media.type === 'image' ? (
              <img
                src={post.media.url}
                alt={post.title}
                className="w-full max-h-96 object-contain"
              />
            ) : (
              <video
                src={post.media.url}
                controls
                className="w-full max-h-96"
              />
            )}
          </div>
        )}

        <div className="flex items-center mt-4">
          <button onClick={handleLike} className="flex items-center space-x-2 text-blue-500 hover:text-blue-600">
            <span>{post.likes.length} Likes</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export default PostDetail;