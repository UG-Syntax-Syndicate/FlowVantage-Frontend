import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Mail, XCircle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAcceptInvite } from '../hooks/useWorkspacesData'

/**
 * Reached via the invite link an invitee is emailed. This route sits inside
 * ProtectedRoute (see App.tsx), so an unauthenticated visitor is already
 * redirected through /login (with `state.from` pointing back here) before
 * this component ever renders — by the time it does, the caller is signed
 * in and the token just needs accepting.
 */
export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const acceptInvite = useAcceptInvite()
  const [result, setResult] = useState<'accepted' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleAccept() {
    if (!token) return
    try {
      await acceptInvite.mutateAsync(token)
      setResult('accepted')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not accept this invite')
      setResult('error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          {result === 'accepted' ? (
            <>
              <CheckCircle2 size={40} strokeWidth={1.7} className="text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">You're in</p>
                <p className="mt-1 text-sm text-slate-500">The workspace now shows up in your workspace switcher.</p>
              </div>
              <Button type="button" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </>
          ) : result === 'error' ? (
            <>
              <XCircle size={40} strokeWidth={1.7} className="text-rose-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Couldn't accept this invite</p>
                <p className="mt-1 text-sm text-slate-500">{errorMessage}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </>
          ) : (
            <>
              <Mail size={40} strokeWidth={1.7} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-slate-800">You've been invited to a workspace</p>
                <p className="mt-1 text-sm text-slate-500">Accept to join and start collaborating.</p>
              </div>
              <Button type="button" onClick={handleAccept} loading={acceptInvite.isPending} disabled={acceptInvite.isPending}>
                Accept invite
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
