'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { PlayerRole, Player, Category, Question, Quiz, AnsweredQuestion } from '@/types/quiz';

enum GameState {
  GRID = 'grid',
  QUESTION = 'question',
  ANSWERING = 'answering',
  SHOWING_ANSWER = 'showing_answer',
  GAME_OVER = 'game_over'
}

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = params.code as string;
  const nickname = searchParams.get('nickname');
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.GRID);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<string | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [currentAnsweringPlayer, setCurrentAnsweringPlayer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  
  // Timers
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const [answerTimer, setAnswerTimer] = useState<number | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Admin panel
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedPlayerForScore, setSelectedPlayerForScore] = useState<string | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState<number>(0);
  
  // Game results
  const [gameResults, setGameResults] = useState<Player[]>([]);
  
  useEffect(() => {
    // Redirect if no nickname
    if (!nickname) {
      router.replace('/');
      return;
    }
    
    // Connect to socket server
    const newSocket = io(window.location.origin, { 
      transports: ['websocket'] 
    });
    
    setSocket(newSocket);
    
    // Handle connection and reconnection
    newSocket.on('connect', () => {
      // Try to join the room again in case of reconnection
      newSocket.emit('join-room', { code: roomCode, nickname });
    });
    
    // Room joined event
    newSocket.on('room-joined', (data) => {
      setIsLoading(false);
      setPlayers(data.players);
      setQuiz(data.quiz);
      
      // Find current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
    });
    
    // Game started event
    newSocket.on('game-started', (data) => {
      setAnsweredQuestions(data.answeredQuestions);
      setPlayers(data.players);
      setCurrentPlayerTurn(data.currentPlayerTurn);
      
      // Update current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
      
      setGameState(GameState.GRID);
    });
    
    // Question selected event
    newSocket.on('question-selected', (data) => {
      setCurrentCategoryIndex(data.categoryIndex);
      setCurrentQuestionIndex(data.questionIndex);
      setCurrentQuestion(data.question);
      setGameState(GameState.QUESTION);
      
      // Start question timer (60 seconds)
      setQuestionTimer(60);
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
      
      questionTimerRef.current = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev === null || prev <= 1) {
            if (questionTimerRef.current) {
              clearInterval(questionTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    
    // Answering allowed event (after 3 seconds)
    newSocket.on('answering-allowed', () => {
      // The button becomes clickable
    });
    
    // Player answering event
    newSocket.on('player-answering', (data) => {
      setCurrentAnsweringPlayer(data.playerId);
      setGameState(GameState.ANSWERING);
      
      // Stop question timer
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        setQuestionTimer(null);
      }
      
      // Start answer timer (60 seconds)
      setAnswerTimer(60);
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
      }
      
      answerTimerRef.current = setInterval(() => {
        setAnswerTimer((prev) => {
          if (prev === null || prev <= 1) {
            if (answerTimerRef.current) {
              clearInterval(answerTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    
    // Answer judged event
    newSocket.on('answer-judged', (data) => {
      setPlayers(data.players);
      setAnsweredQuestions(data.answeredQuestions);
      setCurrentAnswer(data.answer);
      setGameState(GameState.SHOWING_ANSWER);
      
      // Stop answer timer
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        setAnswerTimer(null);
      }
      
      // Find current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
      
      // Auto transition back to grid after 5 seconds
      setTimeout(() => {
        setGameState(GameState.GRID);
        setCurrentCategoryIndex(null);
        setCurrentQuestionIndex(null);
        setCurrentQuestion(null);
        setCurrentAnswer(null);
        setCurrentAnsweringPlayer(null);
      }, 5000);
    });
    
    // Question skipped event
    newSocket.on('question-skipped', (data) => {
      setAnsweredQuestions(data.answeredQuestions);
      setCurrentAnswer(data.answer);
      setGameState(GameState.SHOWING_ANSWER);
      
      // Stop timers
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        setQuestionTimer(null);
      }
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        setAnswerTimer(null);
      }
      
      // Auto transition back to grid after 5 seconds
      setTimeout(() => {
        setGameState(GameState.GRID);
        setCurrentCategoryIndex(null);
        setCurrentQuestionIndex(null);
        setCurrentQuestion(null);
        setCurrentAnswer(null);
        setCurrentAnsweringPlayer(null);
      }, 5000);
    });
    
    // Next turn event
    newSocket.on('next-turn', (data) => {
      setCurrentPlayerTurn(data.currentPlayerTurn);
    });
    
    // Game completed event
    newSocket.on('game-completed', (data) => {
      setGameResults(data.players);
      setGameState(GameState.GAME_OVER);
    });
    
    // Score adjusted event
    newSocket.on('score-adjusted', (data) => {
      setPlayers(data.players);
      
      // Find current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
      
      toast.success(`Рахунок змінено: ${data.points > 0 ? '+' : ''}${data.points}`);
    });
    
    // Error event
    newSocket.on('error', (data) => {
      toast.error(data.message);
      
      // If it's a critical error, redirect to home
      if (data.message === 'Room not found or inactive') {
        router.replace('/');
      }
    });
    
    // Clean up
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
      }
      newSocket.disconnect();
    };
  }, [roomCode, nickname, router]);
  
  const isHost = currentPlayer?.role === PlayerRole.HOST || currentPlayer?.role === PlayerRole.HOST_PLAYER;
  const isPlayer = currentPlayer?.role === PlayerRole.PLAYER || currentPlayer?.role === PlayerRole.HOST_PLAYER;
  const isMyTurn = currentPlayerTurn === currentPlayer?.id;
  
  const handleSelectQuestion = (categoryIndex: number, questionIndex: number) => {
    if (!socket || !isMyTurn || gameState !== GameState.GRID) return;
    
    // Check if question has already been answered
    if (answeredQuestions.some(q => q.categoryIndex === categoryIndex && q.questionIndex === questionIndex)) {
      return;
    }
    
    socket.emit('select-question', { 
      code: roomCode, 
      categoryIndex, 
      questionIndex 
    });
  };
  
  const handleAttemptAnswer = () => {
    if (!socket || !isPlayer || gameState !== GameState.QUESTION || currentAnsweringPlayer) return;
    
    socket.emit('attempt-answer', { code: roomCode });
  };
  
  const handleJudgeAnswer = (correct: boolean) => {
    if (!socket || !isHost || gameState !== GameState.ANSWERING) return;
    
    socket.emit('judge-answer', { code: roomCode, correct });
  };
  
  const handleSkipQuestion = () => {
    if (!socket || !isHost || (gameState !== GameState.QUESTION && gameState !== GameState.ANSWERING)) return;
    
    socket.emit('skip-question', { code: roomCode });
  };
  
  const handleAdjustScore = () => {
    if (!socket || !isHost || !selectedPlayerForScore || scoreAdjustment === 0) return;
    
    socket.emit('adjust-score', { 
      code: roomCode, 
      playerId: selectedPlayerForScore, 
      points: parseInt(scoreAdjustment.toString(), 10) 
    });
    
    setSelectedPlayerForScore(null);
    setScoreAdjustment(0);
  };
  
  // Player name and score display
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.nickname : 'Невідомий гравець';
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-700 mb-4">Завантаження гри...</div>
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <Toaster position="top-center" />
        
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">Гра завершена!</h1>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Результати</h2>
            
            <div className="space-y-4">
              {gameResults.map((player, index) => (
                <div 
                  key={player.id}
                  className={`p-4 border rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border-yellow-200' : 
                    index === 1 ? 'bg-gray-50 border-gray-300' : 
                    index === 2 ? 'bg-orange-50 border-orange-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="font-bold text-2xl mr-4">{index + 1}</div>
                      <div>
                        <div className="font-medium">{player.nickname}</div>
                        <div className="text-sm text-gray-600">
                          {player.role === PlayerRole.HOST && 'Ведучий'}
                          {player.role === PlayerRole.HOST_PLAYER && 'Ведучий + Гравець'}
                          {player.role === PlayerRole.PLAYER && 'Гравець'}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-xl">{player.score} балів</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.replace('/')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                На головну
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      
      {/* Game header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Кімната: {roomCode}</h1>
            <p className="text-sm text-gray-600">
              Тематика: {quiz?.title || 'Завантаження...'}
            </p>
          </div>
          
          {/* Current player turn */}
          {gameState === GameState.GRID && (
            <div className="mt-3 sm:mt-0 text-center sm:text-right">
              <div className="text-sm text-gray-600">Хід гравця</div>
              <div className="font-medium text-indigo-600">
                {getPlayerName(currentPlayerTurn || '')}
                {isMyTurn && ' (Ви)'}
              </div>
            </div>
          )}
          
          {/* Admin panel toggle */}
          {isHost && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="mt-3 sm:mt-0 ml-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {showAdminPanel ? 'Сховати панель' : 'Панель ведучого'}
            </button>
          )}
        </div>
      </header>
      
      {/* Admin panel */}
      {isHost && showAdminPanel && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-medium text-purple-700 mb-3">Панель ведучого</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Skip question/answer controls */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">Керування грою</h3>
                <button
                  onClick={handleSkipQuestion}
                  disabled={gameState !== GameState.QUESTION && gameState !== GameState.ANSWERING}
                  className={`w-full px-4 py-2 text-white rounded-md ${
                    gameState === GameState.QUESTION || gameState === GameState.ANSWERING
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Пропустити питання
                </button>
              </div>
              
              {/* Score adjustment */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">Зміна балів</h3>
                <div className="space-y-2">
                  <select
                    value={selectedPlayerForScore || ''}
                    onChange={(e) => setSelectedPlayerForScore(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Виберіть гравця</option>
                    {players
                      .filter(p => p.role === PlayerRole.PLAYER || p.role === PlayerRole.HOST_PLAYER)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nickname} ({p.score} балів)
                        </option>
                      ))}
                  </select>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setScoreAdjustment(prev => prev - 100)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      -100
                    </button>
                    <input
                      type="number"
                      value={scoreAdjustment}
                      onChange={(e) => setScoreAdjustment(parseInt(e.target.value, 10) || 0)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={() => setScoreAdjustment(prev => prev + 100)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      +100
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAdjustScore}
                    disabled={!selectedPlayerForScore || scoreAdjustment === 0}
                    className={`w-full px-4 py-2 text-white rounded-md ${
                      selectedPlayerForScore && scoreAdjustment !== 0
                        ? 'bg-indigo-500 hover:bg-indigo-600'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Змінити бали
                  </button>
                </div>
              </div>
              
              {/* Current game state info */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">Статус гри</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Стан:</span>{' '}
                    {gameState === GameState.GRID && 'Вибір питання'}
                    {gameState === GameState.QUESTION && 'Показ питання'}
                    {gameState === GameState.ANSWERING && 'Відповідь на питання'}
                    {gameState === GameState.SHOWING_ANSWER && 'Показ відповіді'}
                  </p>
                  {currentAnsweringPlayer && (
                    <p>
                      <span className="font-medium">Відповідає:</span>{' '}
                      {getPlayerName(currentAnsweringPlayer)}
                    </p>
                  )}
                  {(questionTimer !== null || answerTimer !== null) && (
                    <p>
                      <span className="font-medium">Таймер:</span>{' '}
                      {questionTimer !== null ? questionTimer : answerTimer} сек.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main game area */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Players list */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {players
            .filter(p => p.role === PlayerRole.PLAYER || p.role === PlayerRole.HOST_PLAYER)
            .map(player => (
              <div 
                key={player.id}
                className={`p-3 border rounded-lg ${
                  player.id === currentPlayer?.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : player.id === currentPlayerTurn
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-medium truncate">{player.nickname}</div>
                <div className="text-lg font-bold">{player.score}</div>
              </div>
            ))}
        </div>
        
        {/* Question Grid */}
        {gameState === GameState.GRID && quiz && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-px bg-gray-200">
              {quiz.categories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  {/* Category header */}
                  <div className="bg-indigo-600 text-white p-3 text-center font-semibold">
                    {category.name}
                  </div>
                  
                  {/* Questions */}
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((question, questionIndex) => {
                      const isAnswered = answeredQuestions.some(
                        q => q.categoryIndex === categoryIndex && q.questionIndex === questionIndex
                      );
                      
                      return (
                        <button
                          key={questionIndex}
                          onClick={() => handleSelectQuestion(categoryIndex, questionIndex)}
                          disabled={isAnswered || !isMyTurn}
                          className={`block w-full p-4 text-center ${
                            isAnswered
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isMyTurn
                              ? 'bg-white hover:bg-indigo-50 text-indigo-600 font-bold'
                              : 'bg-white text-indigo-600 font-bold cursor-not-allowed'
                          }`}
                        >
                          {isAnswered ? '—' : question.points}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Question Display */}
        {gameState === GameState.QUESTION && currentQuestion && (
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <div className="text-xl font-medium text-gray-600 mb-2">
              Питання за {currentQuestion.points} балів
            </div>
            
            <div className="text-2xl font-bold text-center my-8">
              {currentQuestion.text}
            </div>
            
            {/* Timer */}
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className="bg-indigo-600 h-4 rounded-full"
                style={{ width: `${((questionTimer || 0) / 60) * 100}%` }}
              ></div>
            </div>
            
            {/* Answer button */}
            {isPlayer && (
              <button
                onClick={handleAttemptAnswer}
                disabled={questionTimer === null || questionTimer < 57} // Disabled for first 3 seconds
                className={`px-6 py-3 text-white text-lg font-semibold rounded-md ${
                  questionTimer !== null && questionTimer <= 57
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Я знаю відповідь!
              </button>
            )}
            
            {/* Skip button for host */}
            {isHost && (
              <button
                onClick={handleSkipQuestion}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Пропустити питання
              </button>
            )}
          </div>
        )}
        
        {/* Answering */}
        {gameState === GameState.ANSWERING && currentQuestion && (
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <div className="text-xl font-medium text-gray-600 mb-2">
              Питання за {currentQuestion.points} балів
            </div>
            
            <div className="text-2xl font-bold text-center my-4">
              {currentQuestion.text}
            </div>
            
            <div className="my-4 text-xl">
              <span className="font-medium">Відповідає: </span>
              <span className="text-indigo-600 font-bold">
                {getPlayerName(currentAnsweringPlayer || '')}
                {currentAnsweringPlayer === currentPlayer?.id ? ' (Ви)' : ''}
              </span>
            </div>
            
            {/* Timer */}
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className="bg-indigo-600 h-4 rounded-full"
                style={{ width: `${((answerTimer || 0) / 60) * 100}%` }}
              ></div>
            </div>
            
            {/* Judge buttons for host */}
            {isHost && (
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => handleJudgeAnswer(true)}
                  className="px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-md hover:bg-green-700"
                >
                  Правильно
                </button>
                <button
                  onClick={() => handleJudgeAnswer(false)}
                  className="px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-md hover:bg-red-700"
                >
                  Неправильно
                </button>
              </div>
            )}
            
            {/* Skip button for host */}
            {isHost && (
              <button
                onClick={handleSkipQuestion}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Пропустити відповідь
              </button>
            )}
          </div>
        )}
        
        {/* Showing Answer */}
        {gameState === GameState.SHOWING_ANSWER && currentAnswer && (
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <div className="text-xl font-medium text-indigo-600 mb-4">
              Правильна відповідь
            </div>
            
            <div className="text-3xl font-bold text-center my-8">
              {currentAnswer}
            </div>
            
            <div className="text-sm text-gray-500">
              Повернення до дошки...
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 