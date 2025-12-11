
import { getPartner } from '../../utils'
import SubAffiliatesClient from './SubAffiliatesClient'

export default async function SubAffiliatesPage() {
    const partner = await getPartner()
    if (!partner) return null
    return <SubAffiliatesClient partner={partner} />
}
