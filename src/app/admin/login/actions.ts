
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAdmin(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Lütfen e-posta ve şifrenizi girin.' }
    }

    const supabase = await createClient()

    try {
        // 1. Authenticate
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (authError) {
            console.error('Login error:', authError.message)
            return { error: 'Giriş yapılamadı. Bilgilerinizi kontrol edin.' }
        }

        if (!authData.user) {
            return { error: 'Kullanıcı bulunamadı.' }
        }

        // 2. Check Admin Role (app_metadata)
        const role = authData.user.app_metadata?.role
        console.log('User Role Check:', role)

        if (role !== 'admin') {
            // Not authorized, kick them out
            await supabase.auth.signOut()
            return { error: 'Bu alana erişim yetkiniz yok (403 Forbidden).' }
        }

    } catch (err: any) {
        if (err.message === 'NEXT_REDIRECT') throw err
        console.error('Admin Login Error:', err)
        return { error: 'Beklenmeyen bir hata oluştu.' }
    }

    redirect('/admin')
}
