import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Своя Гра - Інтерактивна вікторина',
  description: 'Грайте в інтерактивну вікторину "Своя Гра" з друзями',
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 