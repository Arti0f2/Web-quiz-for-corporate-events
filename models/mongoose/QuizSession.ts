import mongoose from 'mongoose';

// Player roles enum for mongoose model
export const PlayerRoles = {
  HOST: 'host',
  HOST_PLAYER: 'host_player',
  PLAYER: 'player',
  OBSERVER: 'observer'
};

// Define player schema as a subdocument
const playerSchema = new mongoose.Schema({
  id: String,
  nickname: String,
  score: { type: Number, default: 0 },
  role: {
    type: String,
    enum: Object.values(PlayerRoles),
    default: PlayerRoles.PLAYER
  }
}, { _id: false });

// Define answered questions schema as a subdocument
const answeredQuestionSchema = new mongoose.Schema({
  categoryIndex: Number,
  questionIndex: Number
}, { _id: false });

// Define mongoose schema for quiz sessions
const quizSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  players: [playerSchema],
  answeredQuestions: [answeredQuestionSchema],
  currentCategoryIndex: {
    type: Number,
    default: null
  },
  currentQuestionIndex: {
    type: Number,
    default: null
  },
  currentAnsweringPlayerId: {
    type: String,
    default: null
  },
  currentPlayerTurn: {
    type: String,
    default: null
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save hook to generate a unique room code if not provided
quizSessionSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  if (!this.code) {
    this.code = generateRoomCode();
    
    // Check if code already exists and regenerate if needed
    let attempts = 0;
    let existingSession = null;
    
    do {
      if (attempts > 0) {
        this.code = generateRoomCode();
      }
      // This syntax handles the case when the model might not be registered yet
      const QuizSession = mongoose.models.QuizSession || mongoose.model('QuizSession', quizSessionSchema);
      existingSession = await QuizSession.findOne({ code: this.code });
      attempts++;
    } while (existingSession && attempts < 5);
    
    if (existingSession) {
      return next(new Error('Could not generate a unique room code'));
    }
  }
  
  next();
});

// Function to generate a random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 6 },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

const QuizSession = mongoose.models.QuizSession || mongoose.model('QuizSession', quizSessionSchema);

export default QuizSession; 