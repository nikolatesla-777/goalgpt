import { redirect } from 'next/navigation'

export default function MembersPageRedirect() {
    redirect('/partner/dashboard/members/all')
}
