
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. ADMIN PROTECTION
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Allow access to login page
        if (request.nextUrl.pathname === '/admin/login') {
            // If already logged in as admin, go dashboard
            if (user?.app_metadata?.role === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return response
        }

        // Block access if not admin
        if (!user || user.app_metadata?.role !== 'admin') {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // 2. PARTNER PROTECTION
    if (request.nextUrl.pathname.startsWith('/partner') && !request.nextUrl.pathname.startsWith('/partner/login') && !request.nextUrl.pathname.startsWith('/partner/referrals')) {
        // Check table? Or assumes session is enough for now?
        // For Partner, we usually verify with table query, but middleware shouldn't query DB if possible (perf).
        // If we rely on valid session, that's basic protection.
        if (!user) {
            return NextResponse.redirect(new URL('/partner/login', request.url))
        }
    }

    return response
}
