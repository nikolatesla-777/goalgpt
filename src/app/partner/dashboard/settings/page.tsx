
import { getPartner } from '../../utils'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
    const partner = await getPartner()
    if (!partner) return null
    return <SettingsClient partner={partner} />
}
