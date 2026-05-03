import { useParams, Link } from 'react-router-dom'
import { BarChart3, FileText } from 'lucide-react'
import { formatCurrency, calcQuoteTotals, categoryIcons, findPriceItem, formatNumber } from '../data/mockData'
import { getProject, getQuote, getBOQQuote, getMilestones, getSubcontractors, getWorkLogs, getPurchases, getProjectTasks, getPartialInvoices } from '../data/store'

export default function ProjectOverview() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)

  if (!project) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '40px' }}>פרויקט לא נמצא</div></div>

  const isBOQ = project.billingType === 'boq'
  const quote = project.quoteId ? getQuote(project.quoteId) : null
  const boqQuote = project.boqQuoteId ? getBOQQuote(project.boqQuoteId) : null
  const boqItems = boqQuote?.items || []
  const milestones = getMilestones().filter(m => m.projectId === pid)
  const subs = getSubcontractors().filter(s => s.projectId === pid)
  const logs = getWorkLogs().filter(l => l.projectId === pid)
  const purchases = getPurchases().filter(p => p.projectId === pid)
  const tasks = getProjectTasks().filter(t => t.projectId === pid)
  const partialInvoices = isBOQ ? getPartialInvoices(pid) : []

  // === 1. ערך חוזה — כמה הלקוח משלם לי על הפרויקט ===
  let contractValue = 0
  if (quote) contractValue = calcQuoteTotals(quote.items || []).totalSell
  if (boqQuote) contractValue = boqItems.reduce((s, i) => s + (i.clientPrice || 0) * (i.quantity || 0), 0)

  // === 2. עלות מתוכננת — כמה אני מתכנן להוציא ===
  let plannedMaterials = 0, plannedSubs = 0, plannedLabor = 0
  if (quote) {
    (quote.items || []).forEach(qi => {
      const pi = findPriceItem(qi.priceItemId)
      if (!pi) return
      const cost = pi.costPrice * qi.quantity
      if (pi.type === 'material') plannedMaterials += cost
      else if (pi.type === 'subcontractor') plannedSubs += cost
      else if (pi.type === 'labor') plannedLabor += cost
    })
  }
  if (boqQuote) {
    boqItems.forEach(i => {
      const cost = (i.costPrice || 0) * (i.quantity || 0)
      if (i.itemType === 'procurement') plannedMaterials += cost
      else if (i.itemType === 'subcontractor') plannedSubs += cost
      else if (i.itemType === 'labor') plannedLabor += cost
    })
  }
  const plannedCost = plannedMaterials + plannedSubs + plannedLabor

  // === 3. כמה גביתי מהלקוח ===
  let collected = 0
  collected += milestones.filter(m => m.billingStatus === 'שולם').reduce((s, m) => s + (m.paidAmount || 0), 0)
  collected += partialInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paidAmount || 0), 0)

  // === 4. כמה הוצאתי בפועל ===
  const materialSpent = purchases
    .filter(p => {
      const task = tasks.find(t => t.id === p.taskId)
      return !task || task.type !== 'subcontractor'
    })
    .reduce((s, p) => s + (p.actualTotal || 0), 0)
  const subSpent = subs.reduce((s, sub) => s + (sub.paid || 0), 0)
  const laborSpent = logs.reduce((s, l) => s + (l.laborCost || 0), 0)
  const totalSpent = materialSpent + subSpent + laborSpent

  // === 5. רווח/הפסד ===
  const currentProfit = collected - totalSpent
  const expectedProfit = contractValue - plannedCost
  const expectedMargin = contractValue > 0 ? Math.round((expectedProfit / contractValue) * 100) : 0

  // === 6. אחוז ביצוע — כתב כמויות ===
  // כמות מצטברת שדווחה בחשבונות חלקיים לכל סעיף
  const boqExecution = isBOQ ? boqItems.map((item, idx) => {
    let executedQty = 0
    partialInvoices.forEach(inv => {
      const line = (inv.items || []).find(li => li.itemIdx === idx)
      if (line) executedQty += line.currentQty
    })
    const totalQty = item.quantity || 0
    const pct = totalQty > 0 ? Math.round((executedQty / totalQty) * 100) : 0
    const executedValue = executedQty * (item.clientPrice || 0)
    const totalValue = totalQty * (item.clientPrice || 0)
    return { ...item, idx, executedQty, totalQty, pct, executedValue, totalValue }
  }) : []

  // קיבוץ ביצוע לפי קטגוריה (לכתב כמויות)
  const boqCategoryExec = isBOQ ? (() => {
    const cats = [...new Set(boqItems.map(i => i.category))]
    return cats.map(cat => {
      const items = boqExecution.filter(i => i.category === cat)
      const totalValue = items.reduce((s, i) => s + i.totalValue, 0)
      const executedValue = items.reduce((s, i) => s + i.executedValue, 0)
      const pct = totalValue > 0 ? Math.round((executedValue / totalValue) * 100) : 0
      return { category: cat, icon: categoryIcons[cat] || '📦', items, totalValue, executedValue, pct }
    })
  })() : []

  // אחוז ביצוע כולל (כתב כמויות)
  const totalBOQValue = boqExecution.reduce((s, i) => s + i.totalValue, 0)
  const totalBOQExecuted = boqExecution.reduce((s, i) => s + i.executedValue, 0)
  const totalBOQPct = totalBOQValue > 0 ? Math.round((totalBOQExecuted / totalBOQValue) * 100) : 0

  // === 7. פירוט לפי קטגוריה — הצעת מחיר (לא BOQ) ===
  const categoryData = !isBOQ ? (() => {
    const cats = [...new Set(tasks.map(t => t.category))].sort()
    return cats.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat)
      const plannedMat = catTasks.filter(t => t.type === 'material').reduce((s, t) => s + (t.budgetCost * t.budgetQty), 0)
      const plannedSub = catTasks.filter(t => t.type === 'subcontractor').reduce((s, t) => s + (t.budgetCost * t.budgetQty), 0)
      const plannedLab = catTasks.filter(t => t.type === 'labor').reduce((s, t) => s + (t.budgetCost * t.budgetQty), 0)
      const plannedTotal = plannedMat + plannedSub + plannedLab
      const plannedSell = catTasks.reduce((s, t) => s + (t.clientPrice * t.budgetQty), 0)
      const catPurchases = purchases.filter(p => p.category === cat)
      const actualMat = catPurchases
        .filter(p => { const task = tasks.find(t => t.id === p.taskId); return !task || task.type !== 'subcontractor' })
        .reduce((s, p) => s + (p.actualTotal || 0), 0)
      const catSubs = subs.filter(s => s.specialty === cat)
      const actualSub = catSubs.reduce((s, sub) => s + (sub.paid || 0), 0)
      const totalActual = actualMat + actualSub
      const pct = plannedTotal > 0 ? Math.round((totalActual / plannedTotal) * 100) : 0
      return { category: cat, icon: categoryIcons[cat] || '📦', plannedTotal, plannedSell, actualMat, actualSub, totalActual, pct, over: totalActual > plannedTotal && plannedTotal > 0 }
    }).filter(c => c.plannedTotal > 0 || c.totalActual > 0)
  })() : []

  // בר ויזואלי
  const Bar = ({ value, max, color, height = 8 }) => (
    <div style={{ height: `${height}px`, background: 'var(--dark-border)', borderRadius: '4px', overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', borderRadius: '4px',
        width: `${max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0}%`,
        background: color,
        transition: 'width 0.3s',
      }} />
    </div>
  )

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>סקירה כספית</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
      </div>

      {/* === כרטיסי סיכום === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ערך חוזה (הלקוח משלם)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{formatCurrency(contractValue)}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>גביתי עד עכשיו</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(collected)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contractValue > 0 ? Math.round((collected / contractValue) * 100) : 0}% מהחוזה</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>הוצאתי עד עכשיו</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(totalSpent)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{plannedCost > 0 ? Math.round((totalSpent / plannedCost) * 100) : 0}% מהתקציב</div>
        </div>
        <div className="card" style={{ padding: '16px', borderColor: currentProfit >= 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>רווח/הפסד כרגע</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: currentProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(currentProfit)}
          </div>
        </div>
      </div>

      {/* === אחוז ביצוע כולל — כתב כמויות === */}
      {isBOQ && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)' }}>אחוז ביצוע כולל</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>{totalBOQPct}%</span>
          </div>
          <Bar value={totalBOQExecuted} max={totalBOQValue} color="var(--gold)" height={12} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>בוצע: {formatCurrency(totalBOQExecuted)}</span>
            <span>מתוך: {formatCurrency(totalBOQValue)}</span>
          </div>
        </div>
      )}

      {/* === רווח צפוי === */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>רווח מתוכנן על הפרויקט</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: expectedProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(expectedProfit)} ({expectedMargin}%)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>חוזה: {formatCurrency(contractValue)}</span>
          <span>−</span>
          <span>עלות מתוכננת: {formatCurrency(plannedCost)}</span>
          <span>=</span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatCurrency(expectedProfit)}</span>
        </div>
      </div>

      {/* === ביצוע לפי תחום — כתב כמויות === */}
      {isBOQ && boqCategoryExec.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ verticalAlign: 'middle', marginLeft: '6px' }} />
            ביצוע לפי תחום
          </h2>
          {boqCategoryExec.map(cat => (
            <div key={cat.category} style={{
              padding: '14px', background: 'var(--dark)', borderRadius: '10px', marginBottom: '8px',
              borderRight: `3px solid ${cat.pct >= 100 ? 'var(--success)' : cat.pct > 0 ? 'var(--gold-border)' : 'var(--dark-border)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{cat.icon} {cat.category}</span>
                <span style={{
                  fontSize: '15px', fontWeight: 700,
                  color: cat.pct >= 100 ? 'var(--success)' : cat.pct > 0 ? 'var(--gold)' : 'var(--text-muted)',
                }}>
                  {cat.pct}%
                </span>
              </div>
              <Bar value={cat.executedValue} max={cat.totalValue} color={cat.pct >= 100 ? 'var(--success)' : 'var(--gold)'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>בוצע: {formatCurrency(cat.executedValue)}</span>
                <span>מתוך: {formatCurrency(cat.totalValue)}</span>
              </div>
              {/* פירוט סעיפים */}
              <div style={{ marginTop: '10px' }}>
                {cat.items.map(item => (
                  <div key={item.idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', fontSize: '12px',
                    borderBottom: '1px solid var(--dark-border)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.clause} </span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: '200px', justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatNumber(item.executedQty)} / {formatNumber(item.totalQty)} {item.unit}
                      </span>
                      <span style={{
                        fontWeight: 600, minWidth: '40px', textAlign: 'left',
                        color: item.pct >= 100 ? 'var(--success)' : item.pct > 0 ? 'var(--gold)' : 'var(--text-muted)',
                      }}>
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === תכנון מול ביצוע — הצעת מחיר (לא BOQ) === */}
      {!isBOQ && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            תכנון מול ביצוע — לאן הולך הכסף
          </h2>
          {[
            { label: '🧱 רכש חומרים', planned: plannedMaterials, actual: materialSpent, color: 'var(--info)' },
            { label: '👷 קבלני משנה', planned: plannedSubs, actual: subSpent, color: 'var(--warning)' },
            { label: '🔨 כוח אדם (יומנים)', planned: plannedLabor, actual: laborSpent, color: 'var(--gold)' },
          ].map((row, i) => (
            <div key={i} style={{ padding: '14px', background: 'var(--dark)', borderRadius: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.label}</span>
                <span style={{ fontSize: '13px', color: row.planned > 0 && row.actual > row.planned ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {row.planned > 0 ? Math.round((row.actual / row.planned) * 100) : 0}%
                </span>
              </div>
              <Bar value={row.actual} max={row.planned} color={row.actual > row.planned ? 'var(--danger)' : row.color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>תקציב: {formatCurrency(row.planned)}</span>
                <span>בפועל: {formatCurrency(row.actual)}</span>
              </div>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px', background: 'var(--gold-bg)', borderRadius: '8px', marginTop: '8px',
            border: '1px solid var(--gold-border)',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>סה"כ</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>תקציב: {formatCurrency(plannedCost)}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>בפועל: {formatCurrency(totalSpent)}</div>
            </div>
          </div>
        </div>
      )}

      {/* === פירוט לפי תחום — הצעת מחיר === */}
      {!isBOQ && categoryData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ verticalAlign: 'middle', marginLeft: '6px' }} />
            פירוט לפי תחום
          </h2>
          {categoryData.map(cat => (
            <div key={cat.category} style={{
              padding: '14px', background: 'var(--dark)', borderRadius: '10px', marginBottom: '8px',
              borderRight: cat.over ? '3px solid var(--danger)' : '3px solid var(--gold-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{cat.icon} {cat.category}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: cat.over ? 'var(--danger)' : cat.pct >= 80 ? 'var(--warning)' : 'var(--text-muted)' }}>
                  {cat.pct}%{cat.over && ' — חריגה!'}
                </span>
              </div>
              <Bar value={cat.totalActual} max={cat.plannedTotal} color={cat.over ? 'var(--danger)' : 'var(--gold)'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>תקציב: {formatCurrency(cat.plannedTotal)}</span>
                <span style={{ color: cat.over ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 500 }}>בפועל: {formatCurrency(cat.totalActual)}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap' }}>
                {cat.actualMat > 0 && <span>חומרים: {formatCurrency(cat.actualMat)}</span>}
                {cat.actualSub > 0 && <span>קבלן: {formatCurrency(cat.actualSub)}</span>}
                {cat.plannedSell > 0 && <span style={{ color: 'var(--gold)' }}>הלקוח משלם: {formatCurrency(cat.plannedSell)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === תכנון מול ביצוע כספי — כתב כמויות === */}
      {isBOQ && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            הוצאות בפועל מול תקציב
          </h2>
          {[
            { label: '🧱 רכש חומרים', planned: plannedMaterials, actual: materialSpent, color: 'var(--info)' },
            { label: '👷 קבלני משנה', planned: plannedSubs, actual: subSpent, color: 'var(--warning)' },
            { label: '🔨 כוח אדם', planned: plannedLabor, actual: laborSpent, color: 'var(--gold)' },
          ].map((row, i) => (
            <div key={i} style={{ padding: '14px', background: 'var(--dark)', borderRadius: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.label}</span>
                <span style={{ fontSize: '13px', color: row.planned > 0 && row.actual > row.planned ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {row.planned > 0 ? Math.round((row.actual / row.planned) * 100) : 0}%
                </span>
              </div>
              <Bar value={row.actual} max={row.planned} color={row.actual > row.planned ? 'var(--danger)' : row.color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>תקציב: {formatCurrency(row.planned)}</span>
                <span>בפועל: {formatCurrency(row.actual)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === אבני דרך === */}
      {milestones.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '14px' }}>אבני דרך — גבייה מהלקוח</h2>
          {milestones.map(ms => {
            const amount = ms.amount > 0 ? ms.amount : Math.round(contractValue * ms.percentage / 100)
            const isPaid = ms.billingStatus === 'שולם'
            return (
              <div key={ms.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', background: 'var(--dark)', borderRadius: '8px', marginBottom: '6px',
                borderRight: isPaid ? '3px solid var(--success)' : '3px solid var(--dark-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{ms.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ms.percentage}% • {ms.billingStatus}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: isPaid ? 'var(--success)' : 'var(--text-secondary)' }}>{formatCurrency(amount)}</div>
                  {isPaid && ms.paidDate && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>שולם {ms.paidDate}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* === חשבונות חלקיים === */}
      {partialInvoices.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '14px' }}>חשבונות חלקיים</h2>
          {partialInvoices.map(inv => {
            const isPaid = inv.status === 'paid'
            return (
              <div key={inv.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', background: 'var(--dark)', borderRadius: '8px', marginBottom: '6px',
                borderRight: isPaid ? '3px solid var(--success)' : '3px solid var(--warning)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    <FileText size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                    חשבון #{inv.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.date} • {isPaid ? 'שולם' : inv.status === 'sent' ? 'נשלח ללקוח' : 'טיוטה'}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: isPaid ? 'var(--success)' : 'var(--warning)' }}>
                    {formatCurrency(inv.paidAmount || inv.totalAmount || 0)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* === קבלני משנה === */}
      {subs.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '14px' }}>קבלני משנה</h2>
          {subs.map(sub => {
            const remaining = sub.contractAmount - sub.paid
            return (
              <div key={sub.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', background: 'var(--dark)', borderRadius: '8px', marginBottom: '6px',
                borderRight: !sub.hasContract ? '3px solid var(--danger)' : '3px solid var(--dark-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {sub.name}
                    {!sub.hasContract && <span style={{ color: 'var(--danger)', fontSize: '11px', marginRight: '8px' }}>⚠ בלי חוזה</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.specialty} • חוזה: {formatCurrency(sub.contractAmount)}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--success)' }}>שולם: {formatCurrency(sub.paid)}</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>נותר: {formatCurrency(remaining)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
