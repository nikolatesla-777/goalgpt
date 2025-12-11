
'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreatePartnerState {
    success?: boolean
    error?: string
    message?: string
}

export async function createPartner(prevState: CreatePartnerState, formData: FormData): Promise<CreatePartnerState> {
    const supabase = await createAdminClient()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const refCode = formData.get('refCode') as string
    const commissionRate = parseFloat(formData.get('commissionRate') as string) || 10
    const tier = formData.get('tier') as string || 'bronze'

    if (!email || !fullName || !refCode) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun.' }
    }

    try {
        // 1. Check if Ref Code exists
        const { data: existingRef } = await supabase
            .from('partners')
            .select('id')
            .eq('ref_code', refCode)
            .single()

        if (existingRef) {
            return { error: 'Bu referans kodu zaten kullanımda. Başka bir tane seçin.' }
        }

        // 2. Create or Get Auth User
        // We set a temporary password. In a real app, we might send an invite email.
        // For now, let's use a standard temp password.
        const tempPassword = 'GoalGPT_Partner_2024!'

        let userId: string | undefined

        // Try to create user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        })

        if (authError) {
            // If user exists, try to find them
            if (authError.message.includes('already registered')) {
                // Fetch user by email via profiles (proxy for auth id)
                const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
                if (!existingUser) {
                    return { error: 'Kullanıcı sistemde kayıtlı ancak profili bulunamadı. Lütfen teknik destekle iletişime geçin.' }
                }
                userId = existingUser.id
            } else {
                return { error: `Kullanıcı oluşturulurken hata: ${authError.message}` }
            }
        } else {
            userId = authUser.user.id
        }

        if (!userId) return { error: 'Kullanıcı ID alınamadı.' }

        // 3. Create Partner Record
        // First ensure Profile exists (Trigger should handle this, but just in case for existing users)
        await supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName,
        })

        const { error: partnerError } = await supabase
            .from('partners')
            .insert({
                id: userId, // One-to-one with Auth User
                ref_code: refCode,
                tier,
                commission_rate: commissionRate,
                balance: 0,
                total_earnings: 0
            })

        if (partnerError) {
            if (partnerError.code === '23505') return { error: 'Bu kullanıcı zaten bir partner.' } // Unique constraint on PKEY
            return { error: `Partner kaydı oluşturulamadı: ${partnerError.message}` }
        }

        revalidatePath('/admin/partners')
        return { success: true, message: 'Partner başarıyla oluşturuldu! Geçici şifre: GoalGPT_Partner_2024!' }

    } catch (err: any) {
        console.error('Create Partner Error:', err)
        return { error: 'Beklenmeyen bir hata oluştu.' }

    }
}

export async function resetPartnerPassword(userId: string, newPassword: string): Promise<{ success?: boolean; error?: string; message?: string }> {
    const supabase = await createAdminClient()

    try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) {
            return { error: `Şifre güncellenemedi: ${error.message}` }
        }

        return { success: true, message: 'Şifre başarıyla güncellendi.' }
    } catch (err: any) {
        console.error('Reset Password Error:', err)
        return { error: 'Beklenmeyen bir hata oluştu.' }
    }
}
