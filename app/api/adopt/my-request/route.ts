import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const myRequests = await prisma.adoptionRequest.findMany({
      where: {
        user_id: userId, 
      },
      include: {
        post: {
          include: {
            images: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(myRequests);
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
