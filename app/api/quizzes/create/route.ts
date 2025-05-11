import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '../../../../lib/mongodb';
import Quiz from '../../../../models/mongoose/Quiz';
import User from '../../../../models/mongoose/User';
import { verifyToken } from '../../../../lib/jwt';

// Create a new quiz
export async function POST(request: Request) {
  // CORS handling
  const origin = headers().get('origin') || '';
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      return NextResponse.json(
        { success: false, message: 'Невірний формат JSON у запиті' },
        { status: 400 }
      );
    }
    
    // Check authorization
    const authHeader = headers().get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Авторизація обов\'язкова' },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    let userId;
    try {
      const token = authHeader.split(' ')[1];
      const decoded = await verifyToken(token);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Недійсний токен авторизації' },
        { status: 401 }
      );
    }
    
    const { title, description, categories, questionTimeLimit = 60, answerTimeLimit = 60 } = body;
    
    // Check required fields
    if (!title || !description || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Не всі обов\'язкові поля заповнені' },
        { status: 400 }
      );
    }
    
    // Validate categories and questions
    for (const category of categories) {
      if (!category.name || !Array.isArray(category.questions) || category.questions.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Неправильний формат категорій або питань' },
          { status: 400 }
        );
      }
      
      for (const question of category.questions) {
        if (!question.text || !question.answer || !question.points) {
          return NextResponse.json(
            { success: false, message: 'Всі питання повинні мати текст, відповідь і кількість балів' },
            { status: 400 }
          );
        }
      }
    }
    
    try {
      // Connect to MongoDB
      await dbConnect();
      
      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Користувача не знайдено' },
          { status: 404 }
        );
      }
      
      // Create the quiz
      const quiz = await Quiz.create({
        title,
        description,
        categories,
        questionTimeLimit,
        answerTimeLimit,
        creatorId: userId
      });
      
      return NextResponse.json({
        success: true,
        message: 'Вікторину успішно створено',
        data: {
          id: quiz._id,
          title: quiz.title
        }
      }, { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Помилка підключення до бази даних',
        error: dbError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in quiz creation API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Помилка при створенні вікторини',
      error: error.message
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  const origin = headers().get('origin') || '';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 