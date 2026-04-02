"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Message } from "@/lib/api";

export async function getUserSessions() {
  const session = await getServerSession();
  if (!session?.user?.email) return { error: "Not authenticated" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) return { error: "User not found" };

    const chats = await prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const parsedChats = chats.map((c: any) => ({
      id: c.id,
      name: c.title,
      messages: JSON.parse(c.messages) as Message[],
    }));

    return { sessions: parsedChats };
  } catch (err) {
    console.error("Database fetch error:", err);
    return { error: "Failed to load chats" };
  }
}

export async function saveUserSession(id: string, name: string, messages: Message[]) {
  const session = await getServerSession();
  if (!session?.user?.email) return { error: "Not authenticated" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) return { error: "User not found" };

    await prisma.chatSession.upsert({
      where: { id },
      update: { title: name, messages: JSON.stringify(messages) },
      create: { id, userId: user.id, title: name, messages: JSON.stringify(messages) },
    });

    return { success: true };
  } catch (err) {
    console.error("Database save error:", err);
    return { error: "Failed to save chat" };
  }
}

export async function deleteUserSession(id: string) {
  const session = await getServerSession();
  if (!session?.user?.email) return { error: "Not authenticated" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) return { error: "User not found" };

    await prisma.chatSession.deleteMany({
      where: { id, userId: user.id },
    });

    return { success: true };
  } catch (err) {
    console.error("Database delete error:", err);
    return { error: "Failed to delete chat" };
  }
}
