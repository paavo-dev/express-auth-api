import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

const Profile = () => {
  const { username } = useParams(); // Get username from URL
  const { user: loggedInUser, token, login } = useAuth();
  const [avatar, setAvatar] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Fetch user profile based on username
  const { data: profileUser, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${username}`
      );
      return data;
    },
    enabled: !!username,
  });

  // Fetch user's posts
  const { data: posts } = useQuery({
    queryKey: ['userPosts', username],
    queryFn: async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
      return data.filter((post: any) => post.author.username === username);
    },
    enabled: !!profileUser,
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/upd/${profileUser?._id}`,
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
    onSuccess: (data) => {
      if (loggedInUser?.username === username) {
        login(token!, { ...loggedInUser!, avatar: data.avatar });
      }
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!avatar) return;

    const formData = new FormData();
    formData.append('avatar', avatar);
    updateMutation.mutate(formData);
  };

  // Update document title to 'memehub - {user.name}'
  useEffect(() => {
    if (profileUser) {
      document.title = `memehub - ${profileUser.username}`;
    }
  }, [profileUser]);

  if (isLoading) return <p>Loading...</p>;
  if (!profileUser) return <p>User not found</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <img
              src={preview || profileUser?.avatar || 'https://via.placeholder.com/128'}
              alt={profileUser?.username}
              className="w-32 h-32 rounded-full object-cover"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold mb-2">{profileUser?.username}</h1>
            <p className="text-gray-600 mb-4">{profileUser?.email}</p>
            
            {loggedInUser?.username === username && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500"
                >
                  <input {...getInputProps()} />
                  <div className="text-gray-500">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p>Click to update avatar</p>
                  </div>
                </div>

                {avatar && (
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Avatar'}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">{profileUser?.username}'s Posts</h2>
      <div className="grid gap-6">
        {posts?.map((post: any) => (
          <div key={post._id} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            <p className="text-gray-600 mb-4">{post.content}</p>

            {post.media && (
              <div className="rounded-lg overflow-hidden">
                {post.media.type === 'image' ? (
                  <img
                    src={post.media.url}
                    alt={post.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <video
                    src={post.media.url}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
