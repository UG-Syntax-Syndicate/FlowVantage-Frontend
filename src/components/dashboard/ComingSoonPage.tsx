import { Construction } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

interface ComingSoonPageProps {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Construction size={20} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
