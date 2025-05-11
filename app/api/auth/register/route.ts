import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/mongoose/User';
import { generateToken } from '../../../../lib/jwt';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password } = body;
    
    // Проверка необходимых полей
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }
    
    // Проверка, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Пользователь с таким email уже зарегистрирован' },
        { status: 400 }
      );
    }
    
    // Хешируем пароль
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    // Создаем нового пользователя
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user' // По умолчанию роль - обычный пользователь
    });
    
    // Создаем JWT токен
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });
    
    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
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
    console.error('Error in register API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Ошибка при регистрации пользователя',
      error: error.message
    }, { status: 500 });
  }
} 