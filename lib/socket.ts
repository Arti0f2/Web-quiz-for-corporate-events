import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './jwt';
import QuizSession, { PlayerRoles } from '../models/mongoose/QuizSession';
import Quiz from '../models/mongoose/Quiz';
import dbConnect from './mongodb';
import { v4 as uuidv4 } from 'uuid';

let io: SocketIOServer;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);
    
    // Connect to MongoDB on socket connection
    await dbConnect();

    // Create a new room
    socket.on('create-room', async (data: { 
      quizId: string, 
      nickname: string 
    }) => {
      try {
        // Find the quiz by ID
        const quiz = await Quiz.findById(data.quizId);
        
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Create a new session with a random code
        const session = await QuizSession.create({
          quizId: data.quizId,
          code: generateRoomCode(),
          isActive: true,
          status: 'waiting',
          players: [{
            id: socket.id,
            nickname: data.nickname,
            score: 0,
            role: PlayerRoles.HOST_PLAYER
          }],
          answeredQuestions: [],
          startTime: new Date()
        });

        socket.join(session.code);
        
        socket.emit('room-created', { 
          code: session.code,
          players: session.players,
          quiz: {
            id: quiz._id,
            title: quiz.title,
            categories: quiz.categories
          }
        });
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Join an existing room
    socket.on('join-room', async (data: { 
      code: string, 
      nickname: string 
    }) => {
      try {
        // Find active session with the given code
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session) {
          return socket.emit('error', { message: 'Room not found or inactive' });
        }

        if (session.status !== 'waiting') {
          return socket.emit('error', { message: 'Game has already started' });
        }

        // Add player to the session
        const players = [...session.players];
        const playerExists = players.some(p => p.nickname === data.nickname);
        
        if (playerExists) {
          return socket.emit('error', { message: 'Nickname already taken' });
        }

        // Check if we have reached max players
        const hostPlayerExists = players.some(p => p.role === PlayerRoles.HOST_PLAYER);
        const hostExists = players.some(p => p.role === PlayerRoles.HOST);
        const playerCount = players.filter(p => p.role === PlayerRoles.PLAYER).length;
        const maxPlayers = hostPlayerExists ? 5 : 6;

        if (playerCount >= maxPlayers) {
          return socket.emit('error', { message: 'Room is full' });
        }

        // Add new player
        players.push({
          id: socket.id,
          nickname: data.nickname,
          score: 0,
          role: PlayerRoles.PLAYER
        });

        // Update the session with the new player
        session.players = players;
        await session.save();

        socket.join(data.code);

        // Notify all players in room
        io.to(data.code).emit('player-joined', {
          players: session.players
        });

        // Send game data to new player
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz data not found' });
        }

        socket.emit('room-joined', {
          code: session.code,
          players: session.players,
          quiz: {
            id: quiz._id,
            title: quiz.title,
            categories: quiz.categories
          }
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Update player role
    socket.on('update-role', async (data: { 
      code: string, 
      playerId: string, 
      role: string 
    }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session) {
          return socket.emit('error', { message: 'Room not found or inactive' });
        }

        if (session.status !== 'waiting') {
          return socket.emit('error', { message: 'Game has already started' });
        }

        // Check if requester is host
        const players = [...session.players];
        const requester = players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can update roles' });
        }

        // Update player role
        const targetPlayerIndex = players.findIndex((p: { id: string }) => p.id === data.playerId);
        
        if (targetPlayerIndex === -1) {
          return socket.emit('error', { message: 'Player not found' });
        }

        // Validate role changes
        const currentHostPlayer = players.find((p: { role: string }) => p.role === PlayerRoles.HOST_PLAYER);
        const currentHost = players.find((p: { role: string }) => p.role === PlayerRoles.HOST);

        if (data.role === PlayerRoles.HOST_PLAYER && currentHostPlayer && currentHostPlayer.id !== data.playerId) {
          return socket.emit('error', { message: 'There can only be one Host Player' });
        }

        if (data.role === PlayerRoles.HOST && currentHost && currentHost.id !== data.playerId) {
          return socket.emit('error', { message: 'There can only be one Host' });
        }

        if (data.role === PlayerRoles.HOST_PLAYER && currentHost && currentHost.id !== data.playerId) {
          return socket.emit('error', { message: 'Cannot have both Host and Host Player' });
        }

        if (data.role === PlayerRoles.HOST && currentHostPlayer && currentHostPlayer.id !== data.playerId) {
          return socket.emit('error', { message: 'Cannot have both Host and Host Player' });
        }

        // Assign the new role to the player
        players[targetPlayerIndex].role = data.role;
        
        // Update the session
        session.players = players;
        await session.save();

        // Notify all players in room
        io.to(data.code).emit('roles-updated', {
          players: session.players
        });
      } catch (error) {
        console.error('Error updating role:', error);
        socket.emit('error', { message: 'Failed to update role' });
      }
    });

    // Remove player from room
    socket.on('remove-player', async (data: { 
      code: string, 
      playerId: string 
    }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session) {
          return socket.emit('error', { message: 'Room not found or inactive' });
        }

        if (session.status !== 'waiting') {
          return socket.emit('error', { message: 'Game has already started' });
        }

        // Check if requester is host
        const players = [...session.players];
        const requester = players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can remove players' });
        }

        // Cannot remove yourself
        if (data.playerId === socket.id) {
          return socket.emit('error', { message: 'Cannot remove yourself' });
        }

        // Find the player to remove
        const targetPlayerIndex = players.findIndex((p: { id: string }) => p.id === data.playerId);
        
        if (targetPlayerIndex === -1) {
          return socket.emit('error', { message: 'Player not found' });
        }

        // Remove player
        players.splice(targetPlayerIndex, 1);
        
        // Update the session
        session.players = players;
        await session.save();

        // Notify the removed player
        io.to(data.playerId).emit('removed-from-room');

        // Notify remaining players
        io.to(data.code).emit('player-removed', {
          players: session.players
        });
      } catch (error) {
        console.error('Error removing player:', error);
        socket.emit('error', { message: 'Failed to remove player' });
      }
    });

    // Start the game
    socket.on('start-game', async (data: { code: string }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session) {
          return socket.emit('error', { message: 'Room not found or inactive' });
        }

        if (session.status !== 'waiting') {
          return socket.emit('error', { message: 'Game has already started' });
        }

        // Check if requester is host
        const players = [...session.players];
        const requester = players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can start the game' });
        }

        // Find all players
        const activePlayers = players.filter((p: { role: string }) => 
          p.role === PlayerRoles.PLAYER || p.role === PlayerRoles.HOST_PLAYER
        );
        
        if (activePlayers.length < 1) {
          return socket.emit('error', { message: 'Not enough players to start the game' });
        }

        // Start with the first player's turn
        const firstPlayer = activePlayers[0];
        
        // Update session
        session.status = 'in_progress';
        session.currentPlayerTurn = firstPlayer.id;
        await session.save();

        // Notify all players that the game has started
        io.to(data.code).emit('game-started', {
          players: session.players,
          currentPlayerTurn: firstPlayer.id
        });
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Select a question
    socket.on('select-question', async (data: { 
      code: string, 
      categoryIndex: number, 
      questionIndex: number 
    }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session || session.status !== 'in_progress') {
          return socket.emit('error', { message: 'Game not in progress' });
        }

        if (session.currentPlayerTurn !== socket.id) {
          return socket.emit('error', { message: 'Not your turn to select a question' });
        }

        // Check if question has already been answered
        const isAlreadyAnswered = session.answeredQuestions.some(
          (q: { categoryIndex: number; questionIndex: number }) => 
            q.categoryIndex === data.categoryIndex && q.questionIndex === data.questionIndex
        );
        
        if (isAlreadyAnswered) {
          return socket.emit('error', { message: 'Question already answered' });
        }

        // Get the question details
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz data not found' });
        }
        
        const category = quiz.categories[data.categoryIndex];
        const question = category?.questions[data.questionIndex];
        
        if (!category || !question) {
          return socket.emit('error', { message: 'Invalid question' });
        }

        // Update session
        session.currentCategoryIndex = data.categoryIndex;
        session.currentQuestionIndex = data.questionIndex;
        session.currentAnsweringPlayerId = null;
        await session.save();

        // Notify all players
        io.to(data.code).emit('question-selected', {
          categoryIndex: data.categoryIndex,
          questionIndex: data.questionIndex,
          question: {
            text: question.text,
            points: question.points
          }
        });

        // Set a timeout for question answering phase (usually 3 seconds before answering is allowed)
        setTimeout(() => {
          io.to(data.code).emit('answering-allowed');
        }, 3000);
      } catch (error) {
        console.error('Error selecting question:', error);
        socket.emit('error', { message: 'Failed to select question' });
      }
    });

    // Attempt to answer a question
    socket.on('attempt-answer', async (data: { code: string }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session || session.status !== 'in_progress') {
          return socket.emit('error', { message: 'Game not in progress' });
        }

        if (session.currentAnsweringPlayerId) {
          return socket.emit('error', { message: 'Someone is already answering' });
        }

        if (session.currentCategoryIndex === null || session.currentQuestionIndex === null) {
          return socket.emit('error', { message: 'No question selected' });
        }

        // Check if player is allowed to answer
        const players = [...session.players];
        const player = players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!player || (player.role !== PlayerRoles.PLAYER && player.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only players can answer questions' });
        }

        // Update session with answering player
        session.currentAnsweringPlayerId = socket.id;
        await session.save();

        // Notify all players
        io.to(data.code).emit('player-answering', {
          playerId: socket.id,
        });
      } catch (error) {
        console.error('Error attempting to answer:', error);
        socket.emit('error', { message: 'Failed to attempt answer' });
      }
    });

    // Judge the answer
    socket.on('judge-answer', async (data: { 
      code: string, 
      correct: boolean 
    }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session || session.status !== 'in_progress') {
          return socket.emit('error', { message: 'Game not in progress' });
        }

        // Check if requester is host
        const players = [...session.players];
        const requester = players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can judge answers' });
        }

        if (!session.currentAnsweringPlayerId) {
          return socket.emit('error', { message: 'No player is answering' });
        }

        if (session.currentCategoryIndex === null || session.currentQuestionIndex === null) {
          return socket.emit('error', { message: 'No question selected' });
        }

        // Get the question details
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz data not found' });
        }
        
        const category = quiz.categories[session.currentCategoryIndex];
        const question = category?.questions[session.currentQuestionIndex];
        
        if (!category || !question) {
          return socket.emit('error', { message: 'Invalid question' });
        }

        // Update player score
        const answeringPlayerIndex = players.findIndex((p: { id: string }) => p.id === session.currentAnsweringPlayerId);
        
        if (answeringPlayerIndex === -1) {
          return socket.emit('error', { message: 'Answering player not found' });
        }

        if (data.correct) {
          players[answeringPlayerIndex].score += question.points;
        } else {
          players[answeringPlayerIndex].score -= question.points;
        }

        // Add question to answered list
        const answeredQuestions = [...session.answeredQuestions];
        answeredQuestions.push({
          categoryIndex: session.currentCategoryIndex,
          questionIndex: session.currentQuestionIndex
        });

        // Update next player turn based on answer correctness
        let nextPlayerTurn;
        if (data.correct) {
          // If correct, the answering player gets to choose next
          nextPlayerTurn = session.currentAnsweringPlayerId;
        } else {
          // If incorrect, the player who chose the last question gets to choose again
          nextPlayerTurn = session.currentPlayerTurn;
        }

        // Check if all questions have been answered
        let totalQuestions = 0;
        quiz.categories.forEach((category: any) => {
          totalQuestions += category.questions.length;
        });

        // Update session
        session.players = players;
        session.answeredQuestions = answeredQuestions;
        session.currentPlayerTurn = nextPlayerTurn;
        
        // Check if game is over
        if (answeredQuestions.length >= totalQuestions) {
          session.status = 'completed';
          session.endTime = new Date();
        } else {
          // Reset current question
          session.currentCategoryIndex = null;
          session.currentQuestionIndex = null;
          session.currentAnsweringPlayerId = null;
        }
        
        await session.save();

        // Notify all players of the judgment
        io.to(data.code).emit('answer-judged', {
          playerId: session.currentAnsweringPlayerId,
          correct: data.correct,
          points: question.points,
          answer: question.answer,
          players: session.players,
          answeredQuestions: session.answeredQuestions
        });

        // If game is over, send game over event
        if (session.status === 'completed') {
          // Sort players by score
          const rankedPlayers = [...players].sort((a, b) => b.score - a.score);
          
          io.to(data.code).emit('game-completed', {
            players: rankedPlayers
          });
        } else {
          // Notify next turn
          io.to(data.code).emit('next-turn', {
            currentPlayerTurn: nextPlayerTurn
          });
        }
      } catch (error) {
        console.error('Error judging answer:', error);
        socket.emit('error', { message: 'Failed to judge answer' });
      }
    });

    // Admin panel functions
    socket.on('skip-question', async (data: { code: string }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session || session.status !== 'in_progress') {
          return socket.emit('error', { message: 'Game not in progress' });
        }

        // Check if requester is host
        const requester = session.players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can skip questions' });
        }

        if (session.currentCategoryIndex === null || session.currentQuestionIndex === null) {
          return socket.emit('error', { message: 'No question selected' });
        }

        // Get question details
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz data not found' });
        }
        
        const category = quiz.categories[session.currentCategoryIndex];
        const question = category?.questions[session.currentQuestionIndex];
        
        if (!category || !question) {
          return socket.emit('error', { message: 'Invalid question' });
        }

        // Add question to answered list
        const answeredQuestions = [...session.answeredQuestions];
        answeredQuestions.push({
          categoryIndex: session.currentCategoryIndex,
          questionIndex: session.currentQuestionIndex
        });

        // Update session
        session.answeredQuestions = answeredQuestions;
        session.currentCategoryIndex = null;
        session.currentQuestionIndex = null;
        session.currentAnsweringPlayerId = null;
        
        await session.save();

        // Notify all players
        io.to(data.code).emit('question-skipped', {
          answeredQuestions: session.answeredQuestions,
          answer: question.answer
        });
        
        // Notify next turn
        io.to(data.code).emit('next-turn', {
          currentPlayerTurn: session.currentPlayerTurn
        });
      } catch (error) {
        console.error('Error skipping question:', error);
        socket.emit('error', { message: 'Failed to skip question' });
      }
    });

    // Adjust player score
    socket.on('adjust-score', async (data: { 
      code: string, 
      playerId: string, 
      points: number 
    }) => {
      try {
        const session = await QuizSession.findOne({ 
          code: data.code, 
          isActive: true 
        });
        
        if (!session) {
          return socket.emit('error', { message: 'Room not found or inactive' });
        }

        // Check if requester is host
        const requester = session.players.find((p: { id: string; role: string }) => p.id === socket.id);
        
        if (!requester || (requester.role !== PlayerRoles.HOST && requester.role !== PlayerRoles.HOST_PLAYER)) {
          return socket.emit('error', { message: 'Only host can adjust scores' });
        }

        // Update player score
        const players = [...session.players];
        const playerIndex = players.findIndex((p: { id: string }) => p.id === data.playerId);
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'Player not found' });
        }

        players[playerIndex].score += data.points;
        session.players = players;
        await session.save();

        // Notify all players
        io.to(data.code).emit('score-adjusted', {
          playerId: data.playerId,
          points: data.points,
          players: session.players
        });
      } catch (error) {
        console.error('Error adjusting score:', error);
        socket.emit('error', { message: 'Failed to adjust score' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      try {
        // Find all active sessions where this player is
        const sessions = await QuizSession.find({ 
          isActive: true,
          "players.id": socket.id
        });
        
        for (const session of sessions) {
          const players = [...session.players];
          const playerIndex = players.findIndex((p: { id: string }) => p.id === socket.id);
          
          if (playerIndex !== -1) {
            // If game hasn't started, remove player
            if (session.status === 'waiting') {
              players.splice(playerIndex, 1);
              
              // If no players left, deactivate the session
              if (players.length === 0) {
                session.isActive = false;
              } else {
                // If the host left, assign host role to another player
                const player = players[playerIndex];
                if (player.role === PlayerRoles.HOST || player.role === PlayerRoles.HOST_PLAYER) {
                  if (players.length > 0) {
                    players[0].role = PlayerRoles.HOST_PLAYER;
                  }
                }
              }
              
              session.players = players;
              await session.save();
              
              // Notify remaining players
              io.to(session.code).emit('player-left', {
                players: session.players
              });
            } else {
              // If game is in progress, we keep the player but mark them as disconnected
              io.to(session.code).emit('player-disconnected', {
                playerId: socket.id
              });
            }
          }
        }
      } catch (error) {
        console.error('Error handling disconnection:', error);
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit events to specific rooms
export const emitToSession = (sessionId: string, event: string, data: any) => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  io.to(sessionId).emit(event, data);
};

// Helper function to generate a random room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 6 },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
} 