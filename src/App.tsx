import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Layout from './components/Layout';
import Profile from './components/Profile';
import CreatePost from './components/CreatePost';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" />}>
          <Route index element={<Feed />} />
          <Route path="create" element={<CreatePost />} />
          <Route path="profile/:uid" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
