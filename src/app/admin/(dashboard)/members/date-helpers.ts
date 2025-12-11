// Date Range Helper - NOT a server action, used client-side
// This file is imported by page.tsx to get date ranges

export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'all_time'

export type DateRange = {
    startDate: string | null
    endDate: string | null
}

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
    today: 'Bugün',
    yesterday: 'Dün',
    last_7_days: 'Son 7 Gün',
    this_month: 'Bu Ay',
    last_month: 'Geçen Ay',
    all_time: 'Tümü'
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
        case 'today':
            return {
                startDate: today.toISOString(),
                endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
            }
        case 'yesterday':
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            return {
                startDate: yesterday.toISOString(),
                endDate: new Date(today.getTime() - 1).toISOString()
            }
        case 'last_7_days':
            return {
                startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString()
            }
        case 'this_month':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
                endDate: now.toISOString()
            }
        case 'last_month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            return {
                startDate: lastMonthStart.toISOString(),
                endDate: lastMonthEnd.toISOString()
            }
        case 'all_time':
        default:
            return { startDate: null, endDate: null }
    }
}
