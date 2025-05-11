import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/mongoose/User';
import { generateToken } from '../../../../lib/jwt';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { email, password } = body;
    
    // Проверка обязательных полей
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }
    
    // Поиск пользователя по email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' }, 
        { status: 404 }
      );
    }
    
    // Проверка пароля
    const isMatch = await bcryptjs.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Неверный пароль' }, 
        { status: 401 }
      );
    }
    
    // Создаем JWT токен
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });
    
    // Успешный вход
    return NextResponse.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
    
  } catch (error: any) {
    console.error('Error in login API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Ошибка при попытке входа',
      error: error.message
    }, { status: 500 });
  }
} 