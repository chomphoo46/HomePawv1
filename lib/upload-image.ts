import { put } from '@vercel/blob';

export async function uploadToBlob(formData: FormData) {
  // 1. ดึงไฟล์ออกมาจาก FormData โดยระบุ Type เป็น File
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  // 2. ใช้คำสั่ง put โดยส่ง file (ตัวแปร) ไม่ใช่ File (ตัวใหญ่ที่เป็น Class)
  const blob = await put(file.name, file, {
    access: 'public',
  });

  return blob.url;
}