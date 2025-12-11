
import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export const LoggerService = {
    async logApiRequest(data: {
        endpoint: string
        method: string
        headers?: any
        body?: any
        response_status: number
        response_body?: any
        ip_address?: string
        user_agent?: string
    }) {
        try {
            const supabase = getSupabaseAdmin()
            await supabase.from('api_logs').insert([
                {
                    endpoint: data.endpoint,
                    method: data.method,
                    headers: data.headers,
                    body: data.body,
                    response_status: data.response_status,
                    response_body: data.response_body,
                    ip_address: data.ip_address,
                    user_agent: data.user_agent,
                    created_at: new Date().toISOString()
                }
            ])
        } catch (error) {
            console.error('Failed to log API request:', error)
        }
    }
}
