import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Profile from "./pages/Profile.js";
import CreatePost from "./pages/CreatePost.js";
import PostDetail from "./pages/PostDetail.js";
import NotFound from "./pages/NotFound.js";
import { AuthProvider } from "./context/AuthContext.js";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const token = localStorage.getItem("token"); 
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/posts/:id" element={<PostDetail />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/create-post" element={<CreatePost />} />
                {/* <Route path="/profile/me" element={<MyProfile/>} /> */}
                </Route>

                {/* 404 Catch-All Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
