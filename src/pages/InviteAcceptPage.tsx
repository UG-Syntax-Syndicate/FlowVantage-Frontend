import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Mail, TriangleAlert, XCircle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAcceptInvite } from '../hooks/useWorkspacesData'
import { useAuth } from '../hooks/useAuth'
import { useLogout } from '../hooks/useLogout'
import { fetchInvitePreview } from '../api/workspacesApi'
import { clearPendingInvite, rememberPendingInvite } from '../lib/pendingInvite'

/**
 * Where an invite link lands. Public, so a visitor sees who invited them, to
 * what, and which address to sign in with before being asked to. Someone
 * without an account goes through signup, verification and two-factor setup;
 * the token is remembered (lib/pendingInvite.ts) and the dashboard sends them
 * back here at the end of it.
 */
export function InviteAcceptPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { currentUser, loading } = useAuth()
  const logout = useLogout()
  const acceptInvite = useAcceptInvite()
  const [result, setResult] = useState<'accepted' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const preview = useQuery({
    queryKey: ['invitePreview', token],
    queryFn: () => fetchInvitePreview(token),
    enabled: Boolean(token),
    retry: false,
  })

  const signedIn = Boolean(currentUser)
  useEffect(() => {
    if (!token) return
    // Signed out: keep it for after signup. Signed in: this page is the
    // destination, so the dashboard should stop sending them here.
    if (signedIn) clearPendingInvite()
    else rememberPendingInvite(token)
  }, [token, signedIn])

  const invite = preview.data
  const pending = invite?.status === 'pending'
  const signedInEmail = currentUser?.email?.toLowerCase() ?? null
  const wrongAccount = Boolean(signedIn && invite && signedInEmail && signedInEmail !== invite.email)
  const target = invite?.projectName
    ? `${invite.projectName} in ${invite.workspaceName ?? 'their workspace'}`
    : (invite?.workspaceName ?? 'a workspace')

  async function handleAccept() {
    try {
      await acceptInvite.mutateAsync(token)
      setResult('accepted')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not accept this invite')
      setResult('error')
    }
  }

  async function switchAccount() {
    await logout({ redirectTo: `/invite/${encodeURIComponent(token)}`, toastVariant: 'info', toastMessage: 'Signed out' })
  }

  const authState = { from: { pathname: `/invite/${token}` } }

  let body: React.ReactNode
  if (loading || preview.isLoading) {
    body = <Loader2 size={32} className="animate-spin text-slate-400" />
  } else if (result === 'accepted') {
    body = (
      <>
        <CheckCircle2 size={40} strokeWidth={1.7} className="text-emerald-500" />
        <div>
          <p className="text-sm font-medium text-slate-800">You're in</p>
          <p className="mt-1 text-sm text-slate-500">
            You joined {target}. It now shows up in your workspace switcher.
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/dashboard')}>
          Go to dashboard
        </Button>
      </>
    )
  } else if (result === 'error' || preview.isError || (invite && !pending)) {
    const message =
      result === 'error'
        ? errorMessage
        : preview.isError
          ? 'This invite link is not valid. Ask the person who invited you to send a new one.'
          : invite?.status === 'accepted'
            ? 'This invitation has already been accepted.'
            : invite?.status === 'expired'
              ? 'This invitation has expired. Ask the person who invited you to send a new one.'
              : 'This invitation was withdrawn.'
    body = (
      <>
        <XCircle size={40} strokeWidth={1.7} className="text-rose-500" />
        <div>
          <p className="text-sm font-medium text-slate-800">Couldn't accept this invite</p>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearPendingInvite()
            navigate(signedIn ? '/dashboard' : '/login')
          }}
        >
          {signedIn ? 'Go to dashboard' : 'Go to sign in'}
        </Button>
      </>
    )
  } else {
    body = (
      <>
        <Mail size={40} strokeWidth={1.7} className="text-primary" />
        <div>
          <p className="text-sm font-medium text-slate-800">
            {invite?.inviterName ? `${invite.inviterName} invited you` : "You've been invited"} to join {target}
          </p>
          {invite?.email && (
            <p className="mt-1 text-sm text-slate-500">
              This invitation is for <span className="font-medium text-slate-700">{invite.email}</span>.
            </p>
          )}
        </div>

        {!signedIn ? (
          <div className="flex w-full flex-col gap-2">
            <Button type="button" onClick={() => navigate('/signup', { state: authState })}>
              Create an account
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/login', { state: authState })}>
              I already have an account
            </Button>
            <p className="text-xs text-slate-400">Use {invite?.email ?? 'the invited address'}; you'll come back here afterwards.</p>
          </div>
        ) : wrongAccount ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-800">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              <span>
                You're signed in as {currentUser?.email}. Sign in as {invite?.email} to accept this invitation.
              </span>
            </div>
            <Button type="button" onClick={switchAccount}>
              Switch account
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={handleAccept} loading={acceptInvite.isPending} disabled={acceptInvite.isPending}>
            Accept invite
          </Button>
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">{body}</CardContent>
      </Card>
    </div>
  )
}
