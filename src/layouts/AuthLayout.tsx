import type { PropsWithChildren, ReactNode } from 'react'

type AuthLayoutProps = PropsWithChildren<{
  aside: ReactNode
}>

export function AuthLayout({ aside, children }: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-layout__brand" aria-label="Identidade visual">
        {aside}
      </section>
      <section className="auth-layout__content" aria-label="Acesso administrativo">
        {children}
      </section>
    </main>
  )
}
