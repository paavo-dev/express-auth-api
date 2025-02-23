import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const Home = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
      return data;
    },
  });

  if (isLoading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-center mb-8">Latest Posts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any) => (
          <div
            key={post._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <img
              src={post.media?.url || "https://placehold.co/400x400?text=Video"}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={
                    post.author?.avatar ||
                    "https://placehold.co/40?text=Unknown%20Avatar"
                  }
                  alt={post.author?.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <Link
                    to={`/profile/${post.author?.username}`}
                    className="font-medium text-lg"
                  >
                    {post.author?.username || "Unknown"}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
              <Link
                to={`/posts/${post._id}`}
                className="text-blue-500 hover:underline"
              >
                Read more...
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
