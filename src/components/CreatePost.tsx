import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ImagePlus, X } from 'lucide-react';

export default function CreatePost() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setPreview(URL.createObjectURL(droppedFile));
      } else {
        setError('이미지 파일만 업로드 가능합니다.');
      }
    }
  };

  const clearImage = () => {
    setFile(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 이미지를 압축하여 Base64 문자열로 변환하는 함수
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 화질을 0.6으로 낮추어 용량 최적화 (Firestore 1MB 제한 대비)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('이미지를 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. 이미지를 압축하여 Base64로 변환 (Storage 없이 Firestore에 직접 저장하기 위함)
      const base64Image = await compressImage(file);

      // 2. Firestore에 게시물 정보 저장
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const userData = userDoc.data();

      const newPostRef = doc(collection(db, 'posts'));
      await setDoc(newPostRef, {
        id: newPostRef.id,
        authorUid: auth.currentUser!.uid,
        authorUsername: userData?.username || 'user',
        authorPhotoURL: userData?.photoURL || '',
        imageUrl: base64Image,
        caption,
        likesCount: 0,
        createdAt: serverTimestamp()
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '게시물 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-sm border border-gray-300 bg-white p-6">
      <h2 className="mb-6 text-2xl font-semibold">새 게시물 만들기</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500 text-sm whitespace-pre-wrap">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">이미지 업로드</label>
          <div 
            className={`mt-2 flex flex-col items-center justify-center w-full aspect-square rounded-sm border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500 pointer-events-none">
                <ImagePlus className="w-12 h-12 mb-3 text-gray-400" />
                <p className="mb-2 text-sm font-semibold">클릭하거나 이미지를 드래그하여 업로드</p>
                <p className="text-xs">PNG, JPG, GIF 등 이미지 파일</p>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">설명 (선택사항)</label>
          <textarea
            className="mt-1 block w-full rounded-sm border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="문구 입력..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50 font-semibold"
        >
          {loading ? '업로드 중...' : '공유하기'}
        </button>
      </form>
    </div>
  );
}
