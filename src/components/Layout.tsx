import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, User, LogOut, Camera } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-300 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold" style={{ fontFamily: 'cursive' }}>
            <Camera className="h-6 w-6" />
            Instagram Clone
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-900 hover:text-gray-600">
              <Home className="h-6 w-6" />
            </Link>
            <Link to="/create" className="text-gray-900 hover:text-gray-600">
              <PlusSquare className="h-6 w-6" />
            </Link>
            <Link to={`/profile/${auth.currentUser?.uid}`} className="text-gray-900 hover:text-gray-600">
              <User className="h-6 w-6" />
            </Link>
            <button onClick={handleLogout} className="text-gray-900 hover:text-gray-600">
              <LogOut className="h-6 w-6" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
