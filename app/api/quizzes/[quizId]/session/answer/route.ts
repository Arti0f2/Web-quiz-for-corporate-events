import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import QuizSession from '@/models/QuizSession';

export async function POST(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    await connectDB();
    const headersList = headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { questionId, selectedOption, timeToAnswer } = await request.json();

    // Validate input
    if (typeof selectedOption !== 'number' || typeof timeToAnswer !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid answer data' },
        { status: 400 }
      );
    }

    // Get active session and quiz
    const session = await QuizSession.findOne({
      quizId: params.quizId,
      status: 'active'
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 404 }
      );
    }

    const quiz = await Quiz.findById(params.quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Find the current question
    const question = quiz.questions[session.currentQuestionIndex];
    if (!question || question._id.toString() !== questionId) {
      return NextResponse.json(
        { success: false, message: 'Invalid question' },
        { status: 400 }
      );
    }

    // Check if participant has already answered
    const participantIndex = session.participants.findIndex(
      (p: any) => p.userId.toString() === userId
    );

    let participant;
    if (participantIndex === -1) {
      // Add new participant
      participant = {
        userId,
        score: 0,
        answers: [],
        joinedAt: new Date()
      };
      session.participants.push(participant);
    } else {
      participant = session.participants[participantIndex];
      // Check if already answered this question
      if (participant.answers.some((a: any) => a.questionId.toString() === questionId)) {
        return NextResponse.json(
          { success: false, message: 'Already answered this question' },
          { status: 400 }
        );
      }
    }

    // Calculate points
    const isCorrect = selectedOption === question.correctOption;
    const maxPoints = question.points;
    const timeLimit = question.timeLimit;
    const pointsEarned = isCorrect
      ? Math.round(maxPoints * (1 - timeToAnswer / (timeLimit * 1000)))
      : 0;

    // Add answer and update score
    const answer = {
      questionId,
      selectedOption,
      timeToAnswer,
      isCorrect,
      pointsEarned
    };

    participant.answers.push(answer);
    participant.score += pointsEarned;

    await session.save();

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        pointsEarned,
        totalScore: participant.score,
        leaderboard: session.getLeaderboard()
      }
    });
  } catch (error: any) {
    console.error('Answer submission error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
} 