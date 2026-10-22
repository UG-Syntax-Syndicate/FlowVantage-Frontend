import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { Building2, Loader2, UserRound } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { logAuditEvent } from '../../lib/auditLog'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { markActivityNow } from '../../lib/sessionExpiry'
import { signInWithGoogle, signInWithMicrosoft } from '../../lib/oauth'
import { setPendingAuthRedirect } from '../../lib/pendingAuthRedirect'
import { setPendingAccountType, type AccountType } from '../../lib/pendingAccountType'
import { showToast } from '../../lib/toast'
import { isPasswordStrong } from '../../lib/passwordStrength'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthField } from '../../components/auth/AuthField'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { MicrosoftButton } from '../../components/auth/MicrosoftButton'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter'
import { Alert } from '../../components/common/Alert'

/**
 * Signup stays deliberately short: name, email, password, and who the account
 * is for.
 *
 * Everything else - date of birth, address, nationality, work details - moves
 * to the onboarding wizard that runs after email verification. The reasoning is
 * conversion: every field in front of the account is a chance to lose someone,
 * and if they drop out here you lose the email too. A wizard afterwards runs
 * against an account that already exists, so partial answers are saved and
 * abandonment is recoverable.
 */
const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(isPasswordStrong, 'Password does not meet all the requirements below'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    accountType: z.enum(['personal', 'organization']),
    organizationName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.accountType !== 'organization' || (data.organizationName ?? '').trim().length > 0, {
    message: "Give your organization a name - you can change it later",
    path: ['organizationName'],
  })

type FormValues = z.infer<typeof schema>

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string; Icon: typeof UserRound }[] = [
  { value: 'personal', label: 'Just me', description: 'A private workspace for your own projects.', Icon: UserRound },
  {
    value: 'organization',
    label: 'My organization',
    description: 'A shared workspace you can invite your team into.',
    Icon: Building2,
  },
]

export function SignupPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'personal', organizationName: '' },
  })

  const password = watch('password', '')
  const accountType = watch('accountType')

  const onSubmit = async (values: FormValues) => {
    setFormError('')
    markActivityNow()
    try {
      setPendingAuthRedirect('/verify-email-pending')
      // Parked for the onboarding wizard, which is the first point at which a
      // backend session exists to create the organization with.
      setPendingAccountType({
        type: values.accountType,
        organizationName: values.accountType === 'organization' ? values.organizationName?.trim() : undefined,
      })

      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      await updateProfile(credential.user, { displayName: values.name })
      // No client-side profile doc to create anymore - POST /auth/login
      // (fired by AuthProvider's token-exchange effect right after this
      // resolves) upserts the backend user row with these same defaults.
      await logAuditEvent(credential.user.uid, 'account_created', {
        provider: 'password',
        accountType: values.accountType,
      }).catch((error) => {
        console.warn('Failed to log account-created audit event', error)
      })
      // Deliberately not sending the verification email here: PublicOnlyRoute
      // reacts to onAuthStateChanged and force-navigates to
      // /verify-email-pending as soon as createUserWithEmailAndPassword
      // above resolves - often before this line would even run - so this
      // component can already be unmounted by the time we get here. See
      // VerifyEmailPendingPage's mount effect, which sends it instead from a
      // destination that's guaranteed to still be mounted.
      navigate('/verify-email-pending', { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    }
  }

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setFormError('')
    setOauthLoading(provider)
    markActivityNow()
    try {
      // The choice still applies: an OAuth signup goes through the same wizard.
      setPendingAccountType({
        type: accountType,
        organizationName: accountType === 'organization' ? watch('organizationName')?.trim() : undefined,
      })

      if (provider === 'google') {
        const signedIn = await signInWithGoogle()
        if (!signedIn) return
      } else {
        const signedIn = await signInWithMicrosoft()
        if (!signedIn) return
      }
      showToast('success', 'Account created', 'Welcome to Flow Vantage.')
      navigate('/setup-two-factor', { replace: true, state: { next: '/dashboard' } })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold text-slate-900">Create an account</h2>
        <p className="text-sm text-slate-500">Manage your projects from one secure, centralized workspace.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <AuthField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register('name')}
        />

        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Example@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register('password')}
            placeholder="at least 8 characters"
          />
          {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
          {/* The meter lists every rule and ticks them off as they are met, so
              the requirements are stated up front rather than discovered on a
              rejected submit. */}
          <PasswordStrengthMeter password={password} />
          {!password && (
            <p className="text-xs text-slate-400">
              8+ characters, with upper and lowercase letters, a number and a symbol.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register('confirmPassword')}
            placeholder="at least 8 characters"
          />
          {errors.confirmPassword && <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p>}
        </div>

        {/* Asked here rather than later because it decides which workspace the
            account lands in - and so who owns the branding and the billing from
            the start. */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Who is this for?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACCOUNT_TYPES.map((option) => {
              const selected = accountType === option.value
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-2.5 rounded-xl border p-3 transition ${
                    selected ? 'border-accent-400 bg-accent-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={selected}
                    onChange={() => setValue('accountType', option.value, { shouldValidate: true })}
                    className="sr-only"
                  />
                  <option.Icon
                    size={18}
                    strokeWidth={1.9}
                    className={`mt-0.5 shrink-0 ${selected ? 'text-accent-600' : 'text-slate-400'}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.description}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {accountType === 'organization' && (
          <AuthField
            label="Organization name"
            placeholder="Acme Construction"
            autoComplete="organization"
            hint="We'll create a shared workspace with this name once your email is verified."
            error={errors.organizationName?.message}
            {...register('organizationName')}
          />
        )}

        {formError && <Alert variant="error">{formError}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rail px-4 py-3 font-semibold text-white transition hover:bg-rail-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs tracking-wide text-slate-400 uppercase">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <GoogleButton onClick={() => handleOAuth('google')} disabled={oauthLoading !== null} label="Sign up with Google" />
        <MicrosoftButton
          onClick={() => handleOAuth('microsoft')}
          disabled={oauthLoading !== null}
          label="Sign up with Microsoft"
        />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
