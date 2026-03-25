import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Grid, Bookmark, UserSquare2, Heart, MessageCircle } from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setProfileUser(userDoc.data());
        } else {
          setError('사용자를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error(err);
        setError('사용자 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchUser();

    const q = query(
      collection(db, 'posts'),
      where('authorUid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!profileUser) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Profile Header */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10 border-b border-gray-300 pb-10">
        <div className="flex-shrink-0">
          <img 
            src={profileUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`} 
            alt={profileUser.username} 
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border border-gray-200 object-cover"
          />
        </div>
        <div className="flex flex-col items-center sm:items-start flex-1">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-xl font-light">{profileUser.username}</h1>
            <button className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-semibold hover:bg-gray-200">
              프로필 편집
            </button>
          </div>
          <div className="flex gap-6 mb-4 text-sm">
            <div>게시물 <span className="font-semibold">{posts.length}</span></div>
            <div>팔로워 <span className="font-semibold">0</span></div>
            <div>팔로우 <span className="font-semibold">0</span></div>
          </div>
          <div className="text-sm">
            <span className="font-semibold block">{profileUser.displayName}</span>
            <span className="whitespace-pre-wrap">Instagram Clone User</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-12 border-t border-gray-300 -mt-10 mb-6">
        <button className="flex items-center gap-2 border-t border-gray-900 pt-4 text-xs font-semibold uppercase tracking-widest text-gray-900">
          <Grid className="h-4 w-4" /> 게시물
        </button>
        <button className="flex items-center gap-2 pt-4 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-900">
          <Bookmark className="h-4 w-4" /> 저장됨
        </button>
        <button className="flex items-center gap-2 pt-4 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-900">
          <UserSquare2 className="h-4 w-4" /> 태그됨
        </button>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">게시물이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {posts.map(post => (
            <div key={post.id} className="group relative aspect-square bg-gray-100 overflow-hidden">
              <img src={post.imageUrl} alt="Post" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 fill-white" /> {post.likesCount || 0}
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 fill-white" /> 0
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
