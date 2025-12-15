import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get('team')

    if (!team) {
        return NextResponse.json({ error: 'Missing team parameter' }, { status: 400 })
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        const { data: predictions, error } = await supabase
            .from('predictions_raw')
            .select('*')
            .or(`home_team_name.ilike.%${team}%,away_team_name.ilike.%${team}%`)
            .order('received_at', { ascending: false })
            .limit(10)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            query: team,
            found: predictions?.length || 0,
            predictions
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
