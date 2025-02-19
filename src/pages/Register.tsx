import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [avatar, setAvatar] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': []
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/signup`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success('Registered successfully!');
      navigate('/');
    },
    onError: () => {
      toast.error('Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (avatar) {
      formData.set('avatar', avatar);
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar
          </label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
          >
            <input {...getInputProps()} />
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                className="w-32 h-32 mx-auto rounded-full object-cover"
              />
            ) : (
              <div className="text-gray-500">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p>Drop an image here or click to select</p>
              </div>
             )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {mutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;