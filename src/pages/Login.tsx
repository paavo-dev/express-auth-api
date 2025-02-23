import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext.tsx";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        credentials
      );
      return data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success("Logged in successfully!");
      navigate("/");
    },
    onError: () => {
      toast.error("Invalid credentials");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    mutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-8">
        Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-3"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {mutation.isPending ? "Logging in..." : "Login"}
        </button>

        <p>
          Need account? click{" "}
          <a className="text-blue" href="/register">
            here
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
