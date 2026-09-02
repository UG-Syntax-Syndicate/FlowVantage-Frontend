import { LogoBadge } from './LogoBadge'

interface AuthHeroPanelProps {
  mobileVisible?: boolean
}

export function AuthHeroPanel({ mobileVisible = false }: AuthHeroPanelProps) {
  return (
    <div className={`relative h-full min-h-0 bg-slate-900 ${mobileVisible ? 'block' : 'hidden lg:block'}`}>
      <img
        src="/login-art.png"
        alt="Abstract mural artwork"
        className="hidden h-full w-full object-cover lg:block"
      />
      <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
        <LogoBadge />
      </div>
    </div>
  )
}
