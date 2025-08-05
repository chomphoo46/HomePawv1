import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน' }),
        { status: 400 }
      )
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10)

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // ตอบกลับข้อมูลที่ไม่รวม password
    return new Response(
      JSON.stringify({
        message: 'สมัครสมาชิกสำเร็จ',
        User: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
        },
      }),
      { status: 201 }
    )

  } catch (error) {
    console.error('Register Error:', error)
    return new Response(
      JSON.stringify({ error: 'เกิดข้อผิดพลาดในระบบ' }),
      { status: 500 }
    )
  }
}
