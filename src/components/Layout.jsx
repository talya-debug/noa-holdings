import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, FolderKanban, FileText, ListChecks,
  ShoppingCart, Users, ClipboardList, BarChart3, CreditCard,
  Menu, X, ExternalLink, BookOpen, Zap, FileArchive, AlertTriangle, CalendarDays, FilePlus
} from 'lucide-react'
import { getProjects, getProject } from '../data/store'

function Logo() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '20px 24px', borderBottom: '1px solid var(--dark-border)'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '10px',
        background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', fontWeight: 800, color: 'var(--dark)', fontFamily: 'Arial',
      }}>נעה</div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>נעה אחזקות</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px' }}>NOA HOLDINGS</div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { id } = useParams()

  const mainNav = [
    { to: '/', icon: LayoutDashboard, label: 'דשבורד', end: true },
    { to: '/price-list', icon: ListChecks, label: 'מחירון' },
    { to: '/quotes', icon: FileText, label: 'הצעות מחיר' },
    { to: '/projects', icon: FolderKanban, label: 'פרויקטים' },
    { to: '/tutorial', icon: BookOpen, label: 'הדרכה' },
  ]

  const currentProjectData = id ? getProject(Number(id)) : null
  const isBOQProject = currentProjectData?.billingType === 'boq'

  const projectNav = id ? [
    { to: `/project/${id}`, icon: FolderKanban, label: 'סקירה', end: true },
    { to: `/project/${id}/tasks`, icon: ListChecks, label: 'משימות' },
    { to: `/project/${id}/procurement`, icon: ShoppingCart, label: 'רכש' },
    { to: `/project/${id}/subcontractors`, icon: Users, label: 'קבלני משנה' },
    { to: `/project/${id}/logs`, icon: ClipboardList, label: 'יומני עבודה' },
    isBOQProject
      ? { to: `/project/${id}/boq-billing`, icon: CreditCard, label: 'חשבון חלקי' }
      : { to: `/project/${id}/billing`, icon: CreditCard, label: 'אבני דרך וגבייה' },
    { to: `/project/${id}/changes`, icon: FilePlus, label: 'תוספות ושינויים' },
    { to: `/project/${id}/documents`, icon: FileArchive, label: 'מסמכים' },
    { to: `/project/${id}/timeline`, icon: CalendarDays, label: 'לוח זמנים' },
    { to: `/project/${id}/alerts`, icon: AlertTriangle, label: 'התראות' },
    { to: `/project/${id}/overview`, icon: BarChart3, label: 'סקירה כספית' },
  ] : []

  const currentProject = id ? getProjects().find(p => p.id === Number(id)) : null

  const navLink = (item) => (
    <NavLink key={item.to} to={item.to} end={item.end}
      onClick={() => setMobileOpen(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '8px', textDecoration: 'none',
        fontSize: '14px', fontWeight: 500, marginBottom: '2px',
        color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
        background: isActive ? 'var(--gold-bg)' : 'transparent',
      })}
    >
      <item.icon size={18} />{item.label}
    </NavLink>
  )

  const sidebarContent = (
    <>
      <Logo />
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ marginBottom: '8px' }}>{mainNav.map(navLink)}</div>

        {currentProject && (
          <>
            <div style={{
              padding: '12px 14px 8px', fontSize: '11px', fontWeight: 600,
              color: 'var(--text-muted)', borderTop: '1px solid var(--dark-border)', marginTop: '8px'
            }}>
              {currentProject.name}
            </div>
            {projectNav.map(navLink)}

            <div style={{
              margin: '16px 12px 0', padding: '14px',
              background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.05))',
              borderRadius: '10px', border: '1px solid var(--gold-border)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, marginBottom: '6px' }}>
                לינק למנהל עבודה
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/log/${id}`)
                  alert('הלינק הועתק!')
                }}>
                <ExternalLink size={14} />העתק לינק
              </button>
            </div>
          </>
        )}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--dark-border)', fontSize: '11px', color: 'var(--text-muted)' }}>
        נעה אחזקות © 2026
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 'var(--sidebar-width)', background: 'var(--dark-sidebar)',
        borderLeft: '1px solid var(--dark-border)', position: 'fixed',
        top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto',
      }} className="desktop-sidebar">{sidebarContent}</aside>

      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setMobileOpen(false)} />}

      <aside className="mobile-sidebar" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px',
        background: 'var(--dark-sidebar)', borderLeft: '1px solid var(--dark-border)',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s', zIndex: 999, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <button onClick={() => setMobileOpen(false)} style={{
          position: 'absolute', left: '12px', top: '20px',
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
        }}><X size={20} /></button>
        {sidebarContent}
      </aside>

      <main style={{ flex: 1, marginRight: 'var(--sidebar-width)', padding: '28px 32px', minHeight: '100vh' }}>
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 99,
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--gold)', display: 'none',
        }}><Menu size={22} /></button>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          main { margin-right: 0 !important; padding: 20px 16px !important; padding-top: 60px !important; }
        }
        @media (min-width: 769px) { .mobile-sidebar { display: none !important; } }
      `}</style>
    </div>
  )
}
