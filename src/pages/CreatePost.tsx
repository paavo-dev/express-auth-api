import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

const CreatePost = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [media, setMedia] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setMedia(file);
      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file));
      }
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/new`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Post created successfully!');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to create post');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (media) {
      formData.set('media', media);
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media (Image or Video)
          </label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
          >
            <input {...getInputProps()} />
            {preview ? (
              <img
                src={preview}
                alt="Media preview"
                className="max-w-full max-h-64 mx-auto rounded-lg object-contain"
              />
            ) : media?.type.startsWith('video/') ? (
              <div className="text-gray-500">
                <p>Video selected: {media.name}</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p>Drop an image or video here or click to select</p>
              </div>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating...' : 'Create Post'}
        </button>
          <p>please add '[NOT FOR SNOWFLAKES]' if this is a video containing inapproppriate content (racism, extremely dark humor etc.)</p>
      </form>
    </div>
  );
};

export default CreatePost;