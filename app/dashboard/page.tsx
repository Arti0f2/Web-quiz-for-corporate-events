'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  categories: Array<{
    name: string;
    questions: Array<any>;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const response = await fetch('/api/quizzes');
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
        }
        
        const data = await response.json();
        if (data.success) {
          setQuizzes(data.data || []);
        } else {
          toast.error(data.message || 'Failed to fetch quizzes');
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast.error('Failed to load quizzes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuizzes();
    
    // Check for saved nickname
    if (typeof window !== 'undefined') {
      const savedNickname = localStorage.getItem('tempNickname');
      if (savedNickname) {
        setNickname(savedNickname);
      }
    }
  }, []);

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      return toast.error('Please enter your nickname');
    }
    
    if (!selectedQuiz) {
      return toast.error('Please select a quiz');
    }
    
    // Save nickname for future use
    localStorage.setItem('tempNickname', nickname.trim());
    
    const socket = io(window.location.origin, { 
      transports: ['websocket'] 
    });
    
    socket.on('connect', () => {
      socket.emit('create-room', {
        quizId: selectedQuiz,
        nickname: nickname.trim()
      });
    });
    
    socket.on('room-created', (data) => {
      // Copy room code to clipboard
      navigator.clipboard.writeText(data.code)
        .then(() => {
          toast.success(`Room created with code: ${data.code} (copied to clipboard)`);
        })
        .catch(() => {
          toast.success(`Room created with code: ${data.code}`);
        });
      
      router.push(`/room/${data.code}?nickname=${encodeURIComponent(nickname.trim())}`);
    });
    
    socket.on('error', (data) => {
      toast.error(data.message);
      socket.disconnect();
    });

    setShowCreateModal(false);
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      return toast.error('Please enter your nickname');
    }
    
    if (!roomCode.trim()) {
      return toast.error('Please enter a room code');
    }
    
    // Save nickname for future use
    localStorage.setItem('tempNickname', nickname.trim());
    
    router.push(`/room/${roomCode.trim()}?nickname=${encodeURIComponent(nickname.trim())}`);
    setShowJoinModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button 
              onClick={() => {
                setSelectedQuiz(null);
                setShowCreateModal(true);
              }}
              className="py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
            >
              <span>Create a Room</span>
            </button>
            
            <button
              onClick={() => {
                setRoomCode('');
                setShowJoinModal(true);
              }}
              className="py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              <span>Join a Room</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Quizzes</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (quizzes && quizzes.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-2">{quiz.description}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {quiz.categories ? `${quiz.categories.length} categories, ${quiz.categories.reduce((total, cat) => total + (cat.questions ? cat.questions.length : 0), 0)} questions` : 'Loading categories...'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedQuiz(quiz._id);
                      setShowCreateModal(true);
                    }}
                    className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Create Game
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No quizzes available yet.</p>
              <Link 
                href="/create-quiz" 
                className="inline-block py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create a Quiz
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create a Room</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Your Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your nickname"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Select Quiz</label>
              <select
                value={selectedQuiz || ''}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select a quiz --</option>
                {quizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Your Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your nickname"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter room code"
                maxLength={6}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 