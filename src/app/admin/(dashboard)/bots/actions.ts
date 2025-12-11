'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type BotGroup = {
    id: string
    name: string
    display_name: string
    description: string | null
    is_active: boolean
    is_public: boolean
    total_predictions: number
    winning_predictions: number
    win_rate: number
    color: string | null
    icon_url: string | null
    created_at: string
    updated_at: string
}

export type BotGroupStats = {
    totalBots: number
    activeBots: number
    totalPredictions: number
    avgWinRate: number
}

// Get all bot groups with stats
export async function getBotGroups(): Promise<BotGroup[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bot_groups')
        .select('*')
        .order('win_rate', { ascending: false })

    if (error) {
        console.error('Error fetching bot groups:', error)
        return []
    }

    return data || []
}

// Get bot group stats
export async function getBotGroupStats(): Promise<BotGroupStats> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bot_groups')
        .select('is_active, total_predictions, win_rate')

    if (error || !data) {
        return { totalBots: 0, activeBots: 0, totalPredictions: 0, avgWinRate: 0 }
    }

    const totalBots = data.length
    const activeBots = data.filter(b => b.is_active).length
    const totalPredictions = data.reduce((sum, b) => sum + (b.total_predictions || 0), 0)
    const avgWinRate = totalBots > 0
        ? data.reduce((sum, b) => sum + (b.win_rate || 0), 0) / totalBots
        : 0

    return { totalBots, activeBots, totalPredictions, avgWinRate: Math.round(avgWinRate * 100) / 100 }
}

// Toggle bot active status
export async function toggleBotStatus(botId: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bot_groups')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', botId)

    if (error) {
        console.error('Error toggling bot status:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/bots')
    return { success: true }
}

// Toggle bot public status
export async function toggleBotPublic(botId: string, isPublic: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bot_groups')
        .update({ is_public: isPublic, updated_at: new Date().toISOString() })
        .eq('id', botId)

    if (error) {
        console.error('Error toggling bot public status:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/bots')
    return { success: true }
}

// Create new bot group
export async function createBotGroup(data: {
    name: string
    display_name: string
    description?: string
    color?: string
}) {
    const supabase = await createClient()

    const { data: newBot, error } = await supabase
        .from('bot_groups')
        .insert({
            name: data.name,
            display_name: data.display_name,
            description: data.description || null,
            color: data.color || '#10B981',
            is_active: true,
            is_public: false,
            total_predictions: 0,
            winning_predictions: 0,
            win_rate: 0
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating bot group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/bots')
    return { success: true, data: newBot }
}

// Update bot group
export async function updateBotGroup(botId: string, data: {
    name?: string
    display_name?: string
    description?: string
    color?: string
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bot_groups')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', botId)

    if (error) {
        console.error('Error updating bot group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/bots')
    return { success: true }
}

// Delete bot group
export async function deleteBotGroup(botId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bot_groups')
        .delete()
        .eq('id', botId)

    if (error) {
        console.error('Error deleting bot group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/bots')
    return { success: true }
}
