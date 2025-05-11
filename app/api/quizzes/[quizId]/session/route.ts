import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import QuizSession from '@/models/QuizSession';

// Start a new quiz session
export async function POST(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    await connectDB();
    const headersList = headers();
    const organizerId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');

    if (!organizerId || userRole !== 'organizer') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const quiz = await Quiz.findOne({ _id: params.quizId, organizerId });
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active session
    const activeSession = await QuizSession.findOne({
      quizId: params.quizId,
      status: { $in: ['waiting', 'active'] }
    });

    if (activeSession) {
      return NextResponse.json(
        { success: false, message: 'A session is already active for this quiz' },
        { status: 400 }
      );
    }

    // Create new session
    const session = await QuizSession.create({
      quizId: params.quizId,
      startTime: new Date(),
      status: 'waiting'
    });

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get current session status
export async function GET(
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

    const session = await QuizSession.findOne({
      quizId: params.quizId,
      status: { $in: ['waiting', 'active'] }
    }).populate('quizId', '-questions.correctOption');

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// Update session status
export async function PATCH(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    await connectDB();
    const headersList = headers();
    const organizerId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');

    if (!organizerId || userRole !== 'organizer') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status, currentQuestionIndex } = await request.json();

    const session = await QuizSession.findOne({
      quizId: params.quizId,
      status: { $in: ['waiting', 'active'] }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 404 }
      );
    }

    if (status) {
      session.status = status;
    }

    if (typeof currentQuestionIndex === 'number') {
      session.currentQuestionIndex = currentQuestionIndex;
    }

    if (status === 'finished') {
      session.endTime = new Date();
    }

    await session.save();

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
} 