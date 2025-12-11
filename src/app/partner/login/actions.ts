
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginPartner(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Lütfen e-posta ve şifrenizi girin.' }
    }

    const supabase = await createClient()

    try {
        // 1. Authenticate standard user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (authError) {
            return { error: 'Giriş yapılamadı. Bilgilerinizi kontrol edin.' }
        }

        if (!authData.user) {
            return { error: 'Kullanıcı bulunamadı.' }
        }

        // 2. Check if this user is a Partner
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .select('id')
            .eq('id', authData.user.id)
            .single()

        if (partnerError || !partner) {
            // Not a partner, sign out immediately
            await supabase.auth.signOut()
            return { error: 'Bu hesabın partner yetkisi bulunmamaktadır.' }
        }

        // 3. Success -> Redirect
        // Redirect throws an error in Next.js Server Actions, so do it outside try/catch if possible, 
        // or let it bubble up (it's a specific type of error 'NEXT_REDIRECT').

    } catch (err: any) {
        if (err.message === 'NEXT_REDIRECT') throw err // Let Next.js handle redirect
        console.error('Partner Login Error:', err)
        return { error: 'Beklenmeyen bir hata oluştu.' }
    }

    redirect('/partner/dashboard')
}
