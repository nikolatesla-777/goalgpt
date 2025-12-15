import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Config missing' })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const twoDaysAgo = new Date()
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

        // "Brighton" veya "Paris" içeren kayıtları getir
        const { data, error } = await supabase
            .from('predictions_raw')
            .select('*')
            .gte('received_at', twoDaysAgo.toISOString())
            .or('home_team_name.ilike.%Brighton%,home_team_name.ilike.%Paris%,away_team_name.ilike.%Brighton%,away_team_name.ilike.%Paris%')
            .order('received_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            count: data?.length || 0,
            predictions: data
        })
    } catch (e) {
        return NextResponse.json({ error: String(e) })
    }
}
