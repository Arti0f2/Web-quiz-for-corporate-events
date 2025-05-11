import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Quiz from '../../../models/mongoose/Quiz';

// Get all quizzes
export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all quizzes with all fields
    const quizzes = await Quiz.find({})
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .exec();
    
    return NextResponse.json({
      success: true,
      data: quizzes
    });
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Ошибка при получении списка викторин',
      error: error.message
    }, { status: 500 });
  }
} 