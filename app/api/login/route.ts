import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('BODY:', body) // ✅ ตรวจว่ามีค่าอะไร

    const { email, password } = body

    if (!email || !password) {
      console.log('Missing email or password') // ✅ เช็กว่าเงื่อนไขนี้ทำงานไหม
      return new Response(
        JSON.stringify({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }),
        { status: 400 }
      )
    }

    // ค้นหาผู้ใช้จากอีเมล
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิก' }),
        { status: 404 }
      )
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'รหัสผ่านไม่ถูกต้อง' }),
        { status: 401 }
      )
    }

    // ส่งกลับข้อมูลผู้ใช้ (ไม่รวม password)
    return new Response(
      JSON.stringify({
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
        },
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('Login Error:', error)
    return new Response(
      JSON.stringify({ error: 'เกิดข้อผิดพลาดในระบบ' }),
      { status: 500 }
    )
  }
}
