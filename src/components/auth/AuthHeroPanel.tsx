interface AuthHeroPanelProps {
  mobileVisible?: boolean
}

export function AuthHeroPanel({ mobileVisible = false }: AuthHeroPanelProps) {
  return (
    <div className={`relative bg-slate-900 ${mobileVisible ? 'block' : 'hidden lg:block'}`}>
      <img
        src="/auth-image.jpg"
        alt="Team collaborating in a modern office"
        className="hidden h-full w-full object-cover opacity-70 lg:block"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-accent-700/85 via-slate-900/60 to-accent-500/40" />
      <div className="absolute left-6 top-6 sm:left-10 sm:top-10">
        <img src="/flow-Vantage-logo.jpeg" alt="Flow Vantage" className="h-10 w-auto rounded-md" />
      </div>
      <div className="absolute bottom-10 left-6 right-6 text-white sm:left-10 sm:right-10">
        <p className="text-sm uppercase tracking-[0.24em] text-accent-200">Flow Vantage</p>
        <h1 className="mt-4 hidden text-4xl font-semibold leading-tight lg:block">
          The unified workspace for projects, clients, and knowledge.
        </h1>
      </div>
    </div>
  )
}
