import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Camera } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Map username to a dummy email for Firebase Auth
    const email = `${username.toLowerCase()}@instaclone.local`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: username,
          displayName: username,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 border border-gray-300 rounded-sm">
        <div className="flex flex-col items-center">
          <Camera className="h-12 w-12 text-gray-900" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'cursive' }}>
            Instagram Clone
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="space-y-2 rounded-md shadow-sm">
            <div>
              <input
                type="text"
                required
                className="relative block w-full appearance-none rounded-sm border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-gray-50"
                placeholder="아이디 (ID)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full appearance-none rounded-sm border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-gray-50"
                placeholder="비밀번호 (6자리 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-500 py-2 px-4 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '처리중...' : (isLogin ? '로그인' : '가입하기')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-500 hover:text-blue-800"
          >
            {isLogin ? '계정이 없으신가요? 가입하기' : '계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
