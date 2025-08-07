// app/api/rehoming-report/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from "../auth/[...nextauth]/route";
import { HealthStatus, PetRehomeStatus } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // หา user จาก email
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        user_id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const formData = await req.formData()

    const pet_name = formData.get('pet_name') as string
    const type = formData.get('type') as string
    const age = formData.get('age') as string
    const health_status = formData.get('health_status') as string
    const reason = formData.get('reason') as string
    const phone = formData.get('phone') as string

    if (!pet_name || !type || !age || !health_status || !reason || !phone) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // สร้างโพสต์
    const newPost = await prisma.petRehomePost.create({
      data: {
        pet_name,
        type,
        age,
        health_status: HealthStatus[health_status as keyof typeof HealthStatus],
        reason,
        phone,
        user_id: user.user_id,
        status: PetRehomeStatus.AVAILABLE,
      },
    })

    // บันทึกรูป
    const images = formData.getAll('images') as File[]
    const savedImages = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer())
        const ext = path.extname(image.name)
        const fileName = `${uuidv4()}${ext}`
        const filePath = path.join(process.cwd(), 'public/uploads', fileName)

        await fs.writeFile(filePath, buffer)

        return prisma.petRehomeImages.create({
          data: {
            post_id: newPost.post_id,
            image_url: `/uploads/${fileName}`,
          },
        })
      })
    )

    return NextResponse.json(
      {
        message: 'โพสต์หาบ้านสำเร็จ',
        post: newPost,
        images: savedImages,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST_PET_REHOME]', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
