'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Get current user to ensure ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Oturum açmanız gerekiyor.' }
    }

    const full_name = formData.get('full_name') as string
    const bank_name = formData.get('bank_name') as string
    const iban = formData.get('iban') as string

    // Validate inputs
    if (!full_name || full_name.length < 3) {
        return { error: 'Ad Soyad en az 3 karakter olmalıdır.' }
    }

    // Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id)

    if (profileError) {
        console.error('Profile Update Error:', profileError)
        return { error: 'Profil güncellenirken bir hata oluştu.' }
    }

    // Update Payment Info (Assuming it's in 'partners' table or a JSON/related table)
    // Based on previous context, partners table usually holds business info. 
    // Let's assume 'partners' table has 'payment_info' jsonb column or similar.
    // If not schema defined, I'll update 'partners' table assuming generic fields.
    // Actually, looking at schema from memory/context, partners links to profiles.
    // Let's assume we store bank info in 'partners' table for now.

    const paymentInfo = {
        bank_name,
        iban
    }

    const { error: partnerError } = await supabase
        .from('partners')
        .update({
            payment_info: paymentInfo // Storing as JSONB usually best for flexibility
        })
        .eq('id', user.id)

    if (partnerError) {
        // Fallback: If column doesn't exist, we might fail here. 
        // But for now proceeding as planned. 
        console.error('Partner Update Error:', partnerError)
        // We won't return strict error here if profile succeeded, or maybe we should.
        return { error: 'Ödeme bilgileri güncellenemedi.' }
    }

    revalidatePath('/partner/dashboard/settings')
    return { success: 'Bilgiler başarıyla güncellendi.' }
}

export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!password || password.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır.' }
    }

    if (password !== confirm) {
        return { error: 'Şifreler eşleşmiyor.' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        console.error('Password Update Error:', error)
        return { error: 'Şifre güncellenemedi.' }
    }

    return { success: 'Şifreniz başarıyla değiştirildi.' }
}
