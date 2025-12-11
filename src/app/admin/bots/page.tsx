import { getBotGroups, getBotGroupStats } from './actions'
import BotsClientPage from './bots-client'

export default async function BotsPage() {
    const [bots, stats] = await Promise.all([
        getBotGroups(),
        getBotGroupStats()
    ])

    return <BotsClientPage initialBots={bots} stats={stats} />
}
