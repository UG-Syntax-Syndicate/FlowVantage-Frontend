import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthField, AuthSelect } from '../../components/auth/AuthField'
import { WizardProgress } from '../../components/onboarding/WizardProgress'
import { Alert } from '../../components/common/Alert'
import { useAuth } from '../../hooks/useAuth'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useCreateProject } from '../../hooks/useProjectsData'
import { useCreateOrganization } from '../../hooks/useWorkspacesData'
import { useWorkspace } from '../../hooks/useWorkspace'
import { updateBackendProfile, type BackendProfileUpdate } from '../../lib/backendApi'
import {
  clearPendingAccountType,
  readPendingAccountType,
  type AccountType,
} from '../../lib/pendingAccountType'
import { countryOptions, detectCountryCode, detectLocale, detectTimezone, TEAM_SIZES, timezoneOptions } from '../../lib/locales'
import { EASE_PREMIUM, slideVariants } from '../../lib/motion'
import { showToast } from '../../lib/toast'

/**
 * The onboarding wizard, run once after email verification.
 *
 * Four steps, every one skippable, each saving as it is left - so someone who
 * abandons halfway comes back to where they stopped rather than to the start.
 * That is the whole reason this data is collected *after* the account exists
 * rather than on the signup form: a partial answer here is kept, whereas a
 * half-filled signup form is lost along with the email address.
 *
 * Every field is optional and each one says what it is for. The PRD commits to
 * GDPR compliance for an EU user base, and data minimisation means not
 * requiring what the product does not need.
 */

const STEP_LABELS = ['About you', 'Where you are', 'Your work', 'Your first project']

// zod v3 here, not v4 - so z.coerce/.refine rather than z.iso.date().
const aboutYouSchema = z.object({
  dateOfBirth: z
    .string()
    .optional()
    .refine((value) => !value || new Date(value) <= new Date(), 'That date is in the future')
    .refine((value) => !value || new Date(value).getUTCFullYear() >= 1900, 'Check the year'),
  nationality: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^\+[1-9]\d{7,14}$/.test(value),
      'Use the full international format, starting with “+”',
    ),
})

const whereSchema = z.object({
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(32).optional(),
  country: z.string().trim().max(80).optional(),
  timezone: z.string().trim().max(80).optional(),
})

const workSchema = z.object({
  jobTitle: z.string().trim().max(120).optional(),
  company: z.string().trim().max(200).optional(),
  teamSize: z.string().trim().max(40).optional(),
  accountType: z.enum(['personal', 'organization']),
  organizationName: z.string().trim().max(200).optional(),
})

const projectSchema = z.object({
  projectName: z.string().trim().max(120).optional(),
  projectDescription: z.string().trim().max(500).optional(),
})

type AboutYouValues = z.infer<typeof aboutYouSchema>
type WhereValues = z.infer<typeof whereSchema>
type WorkValues = z.infer<typeof workSchema>
type ProjectValues = z.infer<typeof projectSchema>

/** Strips empty strings so a skipped field clears rather than storing blank. */
function toProfileUpdate(values: Record<string, string | undefined>): BackendProfileUpdate {
  const update: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue
    update[key] = value.trim() === '' ? null : value.trim()
  }
  return update as BackendProfileUpdate
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { backendSessionToken, refreshUserProfile, userProfile } = useAuth()
  const { data: onboarding } = useOnboarding()
  const updateOnboarding = useUpdateOnboarding()
  const createProject = useCreateProject()
  const createOrganization = useCreateOrganization()
  const { activeWorkspaceId } = useWorkspace()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pending = readPendingAccountType()

  // Resume where they stopped. Deliberately only once, on first load: reacting
  // to every change of `onboarding` would yank the step back whenever the
  // server state round-trips mid-wizard.
  const [resumed, setResumed] = useState(false)
  useEffect(() => {
    if (resumed || !onboarding) return
    setResumed(true)
    if (onboarding.wizardStep > 0 && onboarding.wizardStep < STEP_LABELS.length) {
      setStep(onboarding.wizardStep)
    }
  }, [onboarding, resumed])

  const aboutYou = useForm<AboutYouValues>({
    resolver: zodResolver(aboutYouSchema),
    defaultValues: {
      dateOfBirth: userProfile?.dateOfBirth ?? '',
      nationality: userProfile?.nationality ?? '',
      phone: userProfile?.phone ?? '',
    },
  })

  const where = useForm<WhereValues>({
    resolver: zodResolver(whereSchema),
    defaultValues: {
      addressLine1: userProfile?.addressLine1 ?? '',
      addressLine2: userProfile?.addressLine2 ?? '',
      city: userProfile?.city ?? '',
      postalCode: userProfile?.postalCode ?? '',
      // Prefilled from the browser, so nobody has to hunt their own timezone
      // out of a 400-entry list.
      country: userProfile?.country ?? detectCountryCode() ?? '',
      timezone: userProfile?.timezone ?? detectTimezone(),
    },
  })

  const work = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      jobTitle: userProfile?.jobTitle ?? '',
      company: userProfile?.company ?? pending?.organizationName ?? '',
      teamSize: userProfile?.teamSize ?? '',
      accountType: (pending?.type ?? 'personal') as AccountType,
      organizationName: pending?.organizationName ?? '',
    },
  })

  const project = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { projectName: '', projectDescription: '' },
  })

  const countries = countryOptions()
  const timezones = timezoneOptions()
  const accountType = work.watch('accountType')

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    // Fire-and-forget: losing the resume position is a small annoyance, not
    // worth blocking the step transition on or surfacing an error for.
    updateOnboarding.mutate({ wizardStep: next })
  }

  async function saveProfile(update: BackendProfileUpdate) {
    if (!backendSessionToken) throw new Error('Not signed in')
    await updateBackendProfile(backendSessionToken, update)
  }

  /** Saves the current step, then advances. A validation failure keeps them here. */
  async function next() {
    setError('')

    try {
      setSaving(true)

      if (step === 0) {
        const valid = await aboutYou.trigger()
        if (!valid) return
        await saveProfile(toProfileUpdate(aboutYou.getValues() as Record<string, string | undefined>))
      }

      if (step === 1) {
        const valid = await where.trigger()
        if (!valid) return
        await saveProfile({
          ...toProfileUpdate(where.getValues() as Record<string, string | undefined>),
          locale: detectLocale(),
        })
      }

      if (step === 2) {
        const valid = await work.trigger()
        if (!valid) return
        const { accountType: chosenType, organizationName, ...profileFields } = work.getValues()
        await saveProfile(toProfileUpdate(profileFields as Record<string, string | undefined>))

        // Creating the organization is the one irreversible thing in this
        // wizard, so it happens on an explicit continue rather than on skip -
        // and only if one does not already exist under that name.
        if (chosenType === 'organization' && organizationName && organizationName.trim().length > 0) {
          await createOrganization.mutateAsync(organizationName.trim())
          showToast('success', `${organizationName.trim()} created`, 'You can invite your team from settings.')
        }
        clearPendingAccountType()
      }

      if (step === STEP_LABELS.length - 1) {
        await finish()
        return
      }

      goTo(step + 1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save that. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /** Marks the wizard done and leaves. Creates the first project if one was named. */
  async function finish() {
    const { projectName, projectDescription } = project.getValues()

    if (projectName && projectName.trim().length > 0 && activeWorkspaceId) {
      try {
        await createProject.mutateAsync({
          name: projectName.trim(),
          description: projectDescription?.trim() ?? '',
          image: null,
          memberIds: [],
          workspaceId: activeWorkspaceId,
          startDate: new Date().toISOString(),
          // A month out, so the project is not born overdue. They can change it.
          dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        })
      } catch {
        // A failed first project must not trap someone in the wizard - they can
        // create one from the dashboard, and the checklist will still ask.
        showToast('error', 'Could not create that project', 'You can add one from the dashboard.')
      }
    }

    await Promise.allSettled([
      saveProfile({ profileCompletedAt: true }),
      updateOnboarding.mutateAsync({ wizardCompletedAt: true, wizardStep: STEP_LABELS.length }),
    ])
    await refreshUserProfile().catch(() => {})

    navigate('/dashboard', { replace: true })
  }

  /** Skips the rest. Progress already saved stays saved; the wizard does not reappear. */
  async function skipAll() {
    setSaving(true)
    try {
      await finish()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-semibold text-slate-900">Let's set you up</h2>
          <p className="text-sm text-slate-500">
            All of this is optional — it just makes FlowVantage fit how you work. You can change any of it later in
            settings.
          </p>
        </div>

        <WizardProgress current={step} total={STEP_LABELS.length} labels={STEP_LABELS} />

        {/* AnimatePresence lives inside AuthLayout's children, not around it:
            AuthLayout animates its children once on mount, and wrapping it
            would re-run that entrance on every step. */}
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: EASE_PREMIUM }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <AuthField
                  label="Date of birth"
                  type="date"
                  optional
                  hint="Used to tailor defaults and date formats. We never show it to anyone else."
                  error={aboutYou.formState.errors.dateOfBirth?.message}
                  {...aboutYou.register('dateOfBirth')}
                />
                <AuthSelect
                  label="Nationality"
                  optional
                  hint="Sets your default language and date format."
                  error={aboutYou.formState.errors.nationality?.message}
                  {...aboutYou.register('nationality')}
                >
                  <option value="">Prefer not to say</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </AuthSelect>
                <AuthField
                  label="Phone number"
                  type="tel"
                  optional
                  placeholder="+233241234567"
                  hint="Only used if you turn on WhatsApp notifications."
                  error={aboutYou.formState.errors.phone?.message}
                  {...aboutYou.register('phone')}
                />
              </>
            )}

            {step === 1 && (
              <>
                <AuthField
                  label="Address"
                  optional
                  placeholder="12 Independence Avenue"
                  hint="Appears on invoices and exported reports."
                  error={where.formState.errors.addressLine1?.message}
                  {...where.register('addressLine1')}
                />
                <AuthField
                  label="Address line 2"
                  optional
                  placeholder="Suite 4"
                  {...where.register('addressLine2')}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField label="City" optional placeholder="Accra" {...where.register('city')} />
                  <AuthField label="Postal code" optional placeholder="GA-184" {...where.register('postalCode')} />
                </div>
                <AuthSelect label="Country" optional {...where.register('country')}>
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </AuthSelect>
                <AuthSelect
                  label="Timezone"
                  hint="Prefilled from your browser. Deadlines and reminders use this."
                  {...where.register('timezone')}
                >
                  {timezones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </AuthSelect>
              </>
            )}

            {step === 2 && (
              <>
                <AuthField
                  label="Job title"
                  optional
                  placeholder="Project Manager"
                  {...work.register('jobTitle')}
                />
                <AuthField label="Company" optional placeholder="Acme Construction" {...work.register('company')} />
                <AuthSelect label="Team size" optional {...work.register('teamSize')}>
                  <option value="">Select a size</option>
                  {TEAM_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </AuthSelect>

                {/* Only asked if the signup choice did not survive - a fresh
                    browser, or an OAuth signup that skipped the form. */}
                {!pending && (
                  <AuthSelect
                    label="Who is this workspace for?"
                    hint="An organization workspace can be shared with your team."
                    {...work.register('accountType')}
                  >
                    <option value="personal">Just me</option>
                    <option value="organization">My organization</option>
                  </AuthSelect>
                )}

                {accountType === 'organization' && (
                  <AuthField
                    label="Organization name"
                    placeholder="Acme Construction"
                    hint="We'll create a shared workspace with this name."
                    error={work.formState.errors.organizationName?.message}
                    {...work.register('organizationName')}
                  />
                )}
              </>
            )}

            {step === 3 && (
              <>
                <AuthField
                  label="Project name"
                  optional
                  placeholder="Riverside office fit-out"
                  hint="Gives you somewhere to start. You can rename or delete it any time."
                  {...project.register('projectName')}
                />
                <AuthField
                  label="What is it about?"
                  optional
                  placeholder="Phase one of the Riverside build"
                  {...project.register('projectDescription')}
                />
                <Alert variant="info">
                  Next you'll get a short tour of the dashboard. Complete your first task and we'll make a bit of a
                  fuss about it.
                </Alert>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0 || saving}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:invisible"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={skipAll}
              disabled={saving}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-rail px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rail-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {step === STEP_LABELS.length - 1 ? (
                <>
                  <Check size={15} />
                  Finish
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
