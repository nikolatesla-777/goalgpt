import { fetchLiveMatchesSimplified } from '@/app/admin/(dashboard)/predictions/manual/actions'
import LiveScoreBoard from './LiveScoreBoard'

export const dynamic = 'force-dynamic'

export default async function LiveScorePage() {
    const matches = await fetchLiveMatchesSimplified()

    // Initial sort
    const sortedMatches = matches.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1
        if (a.status !== 'live' && b.status === 'live') return 1
        return (b.rawTime || 0) - (a.rawTime || 0)
    })

    return <LiveScoreBoard initialMatches={sortedMatches} />
}
