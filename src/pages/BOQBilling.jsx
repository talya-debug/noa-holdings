import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { FileDown, Plus, Check, CreditCard, Settings, Percent } from 'lucide-react'
import { formatCurrency, formatDate } from '../data/mockData'
import { getProject, updateProject, getBOQQuote, getPartialInvoices, addPartialInvoice, updatePartialInvoice } from '../data/store'
import * as XLSX from 'xlsx'

// תנאי תשלום
const PAYMENT_TERMS = [
  { value: 'immediate', label: 'מיידי' },
  { value: 'shotef', label: 'שוטף' },
  { value: 'shotef30', label: 'שוטף + 30' },
  { value: 'shotef60', label: 'שוטף + 60' },
  { value: 'shotef90', label: 'שוטף + 90' },
]

// חישוב תאריך תשלום
function calcPaymentDue(invoiceDate, terms) {
  const d = new Date(invoiceDate)
  switch (terms) {
    case 'immediate': return d
    case 'shotef': d.setMonth(d.getMonth() + 1, 1); return d
    case 'shotef30': d.setMonth(d.getMonth() + 1, 1); d.setDate(d.getDate() + 30); return d
    case 'shotef60': d.setMonth(d.getMonth() + 1, 1); d.setDate(d.getDate() + 60); return d
    case 'shotef90': d.setMonth(d.getMonth() + 1, 1); d.setDate(d.getDate() + 90); return d
    default: return d
  }
}

export default function BOQBilling() {
  const { id } = useParams()
  const pid = Number(id)
  const [project, setProject] = useState(() => getProject(pid))
  const [invoices, setInvoices] = useState(() => getPartialInvoices(pid))
  const [showPayment, setShowPayment] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  if (!project) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '40px' }}>פרויקט לא נמצא</div></div>

  const boq = project.boqQuoteId ? getBOQQuote(project.boqQuoteId) : null
  const boqItems = boq?.items || []

  // הגדרות ניכויים (ברמת הפרויקט)
  const deductions = {
    insurance: project.deductionInsurance || 0,
    retention: project.deductionRetention || 0,
    labTests: project.deductionLabTests || 0,
  }
  const discountPct = project.discountPercentage || 0
  const discountAmount = project.discountAmount || 0
  const vatRate = project.vatRate ?? 18
  const paymentTerms = project.paymentTerms || 'shotef30'

  // שמירת הגדרות
  const handleSaveSettings = (updates) => {
    updateProject(pid, updates)
    setProject(prev => ({ ...prev, ...updates }))
  }

  // כמויות מצטברות מחשבונות קודמים
  const getPreviousQty = (itemIdx, beforeInvoiceIdx) => {
    let total = 0
    invoices.forEach((inv, i) => {
      if (i < beforeInvoiceIdx && inv.status !== 'draft') {
        const line = inv.items?.find(li => li.itemIdx === itemIdx)
        if (line) total += line.currentQty
      }
    })
    return total
  }

  // חישוב סכומי חשבון עם ניכויים
  const calcInvoiceTotals = (invoice) => {
    const rawSubtotal = (invoice.items || []).reduce((s, li) => {
      const item = boqItems[li.itemIdx]
      return s + (li.currentQty * (item?.clientPrice || 0))
    }, 0)

    // הנחה
    const discount = discountPct > 0 ? Math.round(rawSubtotal * discountPct / 100) : discountAmount
    const afterDiscount = rawSubtotal - discount

    // ניכויים
    const insuranceDeduction = Math.round(afterDiscount * deductions.insurance / 100)
    const retentionDeduction = Math.round(afterDiscount * deductions.retention / 100)
    const labTestsDeduction = Math.round(afterDiscount * deductions.labTests / 100)
    const totalDeductions = insuranceDeduction + retentionDeduction + labTestsDeduction
    const afterDeductions = afterDiscount - totalDeductions

    // מע"מ
    const vat = Math.round(afterDeductions * vatRate / 100)
    const finalTotal = afterDeductions + vat

    return { rawSubtotal, discount, afterDiscount, insuranceDeduction, retentionDeduction, labTestsDeduction, totalDeductions, afterDeductions, vat, finalTotal }
  }

  // חישובים כלליים
  const contractTotal = boqItems.reduce((s, i) => s + (i.clientPrice * i.quantity), 0)
  const totalInvoiced = invoices.filter(i => i.status !== 'draft').reduce((s, inv) => s + calcInvoiceTotals(inv).finalTotal, 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, inv) => s + (inv.paidAmount || calcInvoiceTotals(inv).finalTotal), 0)

  // חשבון חלקי חדש
  const handleNewInvoice = () => {
    addPartialInvoice(pid, boqItems)
    setInvoices(getPartialInvoices(pid))
  }

  // עדכון כמות/אחוז בשורה
  const handleLineChange = (invoiceId, itemIdx, value, mode = 'quantity') => {
    const inv = invoices.find(i => i.id === invoiceId)
    if (!inv) return
    const item = boqItems[itemIdx]
    let qty = Number(value) || 0
    if (mode === 'percentage' && item) {
      qty = Math.round(item.quantity * qty / 100 * 100) / 100
    }
    const newItems = (inv.items || []).map(li =>
      li.itemIdx === itemIdx ? { ...li, currentQty: qty } : li
    )
    const totalAmount = newItems.reduce((s, li) => {
      const boqItem = boqItems[li.itemIdx]
      return s + (li.currentQty * (boqItem?.clientPrice || 0))
    }, 0)
    updatePartialInvoice(invoiceId, { items: newItems, totalAmount })
    setInvoices(getPartialInvoices(pid))
  }

  const handleSendInvoice = (invoiceId) => {
    updatePartialInvoice(invoiceId, { status: 'sent' })
    setInvoices(getPartialInvoices(pid))
  }

  const handlePayment = (invoiceId) => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    updatePartialInvoice(invoiceId, { status: 'paid', paidAmount: amount, paidDate: new Date().toISOString().split('T')[0] })
    setInvoices(getPartialInvoices(pid))
    setShowPayment(null)
    setPaymentAmount('')
  }

  // ייצוא אקסל עם ניכויים
  const handleExportInvoice = (invoice, invoiceIdx) => {
    const totals = calcInvoiceTotals(invoice)
    const rows = boqItems.map((item, idx) => {
      const line = invoice.items?.find(li => li.itemIdx === idx)
      const prevQty = getPreviousQty(idx, invoiceIdx)
      const currentQty = line?.currentQty || 0
      const cumulativeQty = prevQty + currentQty
      const pctDone = item.quantity > 0 ? Math.round((cumulativeQty / item.quantity) * 100) : 0
      return {
        'סעיף': item.clause,
        'קטגוריה': item.category,
        'מהות': item.name,
        'יחידה': item.unit,
        'כמות חוזית': item.quantity,
        'מחיר ליחידה': item.clientPrice,
        'ביצוע קודם': prevQty,
        'ביצוע נוכחי': currentQty,
        'ביצוע מצטבר': cumulativeQty,
        '% ביצוע': `${pctDone}%`,
        'סכום נוכחי': currentQty * item.clientPrice,
        'סכום מצטבר': cumulativeQty * item.clientPrice,
      }
    })

    // שורות סיכום
    rows.push({})
    rows.push({ 'מהות': 'סה"כ לפני ניכויים', 'סכום נוכחי': totals.rawSubtotal })
    if (totals.discount > 0) rows.push({ 'מהות': `הנחה${discountPct > 0 ? ` (${discountPct}%)` : ''}`, 'סכום נוכחי': -totals.discount })
    if (totals.insuranceDeduction > 0) rows.push({ 'מהות': `ניכוי ביטוח (${deductions.insurance}%)`, 'סכום נוכחי': -totals.insuranceDeduction })
    if (totals.retentionDeduction > 0) rows.push({ 'מהות': `ניכוי עיכבון (${deductions.retention}%)`, 'סכום נוכחי': -totals.retentionDeduction })
    if (totals.labTestsDeduction > 0) rows.push({ 'מהות': `ניכוי מעבדה (${deductions.labTests}%)`, 'סכום נוכחי': -totals.labTestsDeduction })
    rows.push({ 'מהות': 'סה"כ אחרי ניכויים', 'סכום נוכחי': totals.afterDeductions })
    rows.push({ 'מהות': `מע"מ (${vatRate}%)`, 'סכום נוכחי': totals.vat })
    rows.push({ 'מהות': 'סה"כ לתשלום', 'סכום נוכחי': totals.finalTotal })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 25 }, { wch: 7 }, { wch: 10 },
      { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'חשבון חלקי')
    XLSX.writeFile(wb, `חשבון-חלקי-${invoice.invoiceNumber}-${project.name}.xlsx`)
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>חשבון חלקי</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={16} />הגדרות
          </button>
          <button className="btn btn-primary" onClick={handleNewInvoice}>
            <Plus size={16} />חשבון חלקי חדש
          </button>
        </div>
      </div>

      {/* הגדרות ניכויים */}
      {showSettings && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--gold-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            <Settings size={16} style={{ verticalAlign: 'middle', marginLeft: '6px' }} />
            הגדרות חשבון — ניכויים, הנחה ותנאי תשלום
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {/* ניכויים */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={12} />ניכוי ביטוח (%)
              </label>
              <input type="number" min="0" max="100" step="0.5"
                value={deductions.insurance || ''}
                onChange={e => handleSaveSettings({ deductionInsurance: Number(e.target.value) || 0 })}
                placeholder="0" style={{ textAlign: 'center' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={12} />ניכוי עיכבון (%)
              </label>
              <input type="number" min="0" max="100" step="0.5"
                value={deductions.retention || ''}
                onChange={e => handleSaveSettings({ deductionRetention: Number(e.target.value) || 0 })}
                placeholder="0" style={{ textAlign: 'center' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={12} />ניכוי מעבדה (%)
              </label>
              <input type="number" min="0" max="100" step="0.5"
                value={deductions.labTests || ''}
                onChange={e => handleSaveSettings({ deductionLabTests: Number(e.target.value) || 0 })}
                placeholder="0" style={{ textAlign: 'center' }}
              />
            </div>

            {/* הנחה */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px' }}>הנחה (%)</label>
              <input type="number" min="0" max="100" step="0.5"
                value={discountPct || ''}
                onChange={e => handleSaveSettings({ discountPercentage: Number(e.target.value) || 0, discountAmount: 0 })}
                placeholder="0" style={{ textAlign: 'center' }}
              />
            </div>

            {/* מע"מ */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px' }}>מע"מ (%)</label>
              <input type="number" min="0" max="100" step="1"
                value={vatRate}
                onChange={e => handleSaveSettings({ vatRate: Number(e.target.value) || 0 })}
                style={{ textAlign: 'center' }}
              />
            </div>

            {/* תנאי תשלום */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px' }}>תנאי תשלום</label>
              <select value={paymentTerms} onChange={e => handleSaveSettings({ paymentTerms: e.target.value })}>
                {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* סיכום ניכויים פעילים */}
          {(deductions.insurance > 0 || deductions.retention > 0 || deductions.labTests > 0 || discountPct > 0) && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--dark)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              ניכויים פעילים:
              {deductions.insurance > 0 && <span style={{ color: 'var(--warning)', marginRight: '8px' }}> ביטוח {deductions.insurance}%</span>}
              {deductions.retention > 0 && <span style={{ color: 'var(--warning)', marginRight: '8px' }}> עיכבון {deductions.retention}%</span>}
              {deductions.labTests > 0 && <span style={{ color: 'var(--warning)', marginRight: '8px' }}> מעבדה {deductions.labTests}%</span>}
              {discountPct > 0 && <span style={{ color: 'var(--info)', marginRight: '8px' }}> הנחה {discountPct}%</span>}
              <span style={{ marginRight: '8px' }}> | סה"כ ניכוי: {deductions.insurance + deductions.retention + deductions.labTests + discountPct}%</span>
            </div>
          )}
        </div>
      )}

      {/* סיכום */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px', marginBottom: '24px'
      }}>
        {[
          { label: 'ערך חוזה', value: formatCurrency(contractTotal), color: 'var(--gold)' },
          { label: 'חויב (כולל מע"מ)', value: formatCurrency(totalInvoiced), color: 'var(--info)' },
          { label: 'שולם', value: formatCurrency(totalPaid), color: 'var(--success)' },
          { label: 'יתרה', value: formatCurrency(contractTotal - totalPaid), color: contractTotal - totalPaid > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'חשבונות', value: invoices.length, color: 'var(--text-primary)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* פרוגרס */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>התקדמות גבייה</span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {contractTotal > 0 ? Math.round((totalPaid / contractTotal) * 100) : 0}%
          </span>
        </div>
        <div style={{ height: '10px', background: 'var(--dark)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${contractTotal > 0 ? Math.min(Math.round((totalPaid / contractTotal) * 100), 100) : 0}%`,
            borderRadius: '5px',
            background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
          }} />
        </div>
      </div>

      {/* רשימת חשבונות */}
      {invoices.map((inv, invIdx) => {
        const isEditing = inv.status === 'draft'
        const totals = calcInvoiceTotals(inv)
        const paymentDue = calcPaymentDue(inv.date, paymentTerms)

        return (
          <div key={inv.id} className="card" style={{ marginBottom: '20px' }}>
            {/* כותרת חשבון */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>חשבון חלקי #{inv.invoiceNumber}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatDate(inv.date)}
                  {inv.status !== 'paid' && <span> • תשלום עד: {formatDate(paymentDue.toISOString().split('T')[0])}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'sent' ? 'badge-warning' : 'badge-info'}`}>
                  {inv.status === 'paid' ? 'שולם' : inv.status === 'sent' ? 'נשלח' : 'טיוטה'}
                </span>

                {inv.status === 'draft' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleSendInvoice(inv.id)}>שלח חשבון</button>
                )}

                {inv.status === 'sent' && (
                  <>
                    {showPayment === inv.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="number" value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          placeholder="סכום" style={{ width: '100px', padding: '6px' }} autoFocus
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handlePayment(inv.id)}>אשר</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowPayment(null)}>X</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setShowPayment(inv.id)
                        setPaymentAmount(String(totals.finalTotal))
                      }}>
                        <CreditCard size={14} />רשום תשלום
                      </button>
                    )}
                  </>
                )}

                <button className="btn btn-secondary btn-sm" onClick={() => handleExportInvoice(inv, invIdx)}>
                  <FileDown size={14} />אקסל
                </button>
              </div>
            </div>

            {inv.status === 'paid' && inv.paidDate && (
              <div style={{ fontSize: '12px', color: 'var(--success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} />שולם ב-{formatDate(inv.paidDate)} — {formatCurrency(inv.paidAmount || totals.finalTotal)}
              </div>
            )}

            {/* טבלת ביצוע */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>סעיף</th>
                    <th>מהות</th>
                    <th>יחידה</th>
                    <th>כמות חוזית</th>
                    <th>מחיר</th>
                    <th>קודם</th>
                    <th style={{ width: '80px' }}>נוכחי</th>
                    <th>מצטבר</th>
                    <th>% ביצוע</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map((item, itemIdx) => {
                    const line = inv.items?.find(li => li.itemIdx === itemIdx)
                    const prevQty = getPreviousQty(itemIdx, invIdx)
                    const currentQty = line?.currentQty || 0
                    const cumulative = prevQty + currentQty
                    const lineAmount = currentQty * item.clientPrice
                    const pctDone = item.quantity > 0 ? Math.round((cumulative / item.quantity) * 100) : 0

                    if (!isEditing && currentQty === 0 && prevQty === 0) return null

                    return (
                      <tr key={itemIdx}>
                        <td style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '12px' }}>{item.clause}</td>
                        <td style={{ fontWeight: 500, fontSize: '13px' }}>{item.name}</td>
                        <td style={{ fontSize: '12px' }}>{item.unit}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.clientPrice)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{prevQty || '-'}</td>
                        <td>
                          {isEditing ? (
                            <input type="number" min="0" max={item.quantity - prevQty}
                              value={currentQty || ''}
                              onChange={e => handleLineChange(inv.id, itemIdx, e.target.value)}
                              placeholder="0"
                              style={{ width: '70px', textAlign: 'center', padding: '5px', fontSize: '13px' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600 }}>{currentQty || '-'}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 500 }}>{cumulative}</td>
                        <td>
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: pctDone >= 100 ? 'var(--success)' : pctDone >= 50 ? 'var(--warning)' : 'var(--text-muted)',
                          }}>
                            {pctDone}%
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: lineAmount > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                          {lineAmount > 0 ? formatCurrency(lineAmount) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* סיכום חשבון עם ניכויים */}
            {totals.rawSubtotal > 0 && (
              <div style={{
                marginTop: '16px', padding: '16px', background: 'var(--dark)', borderRadius: '10px',
                display: 'grid', gap: '8px', fontSize: '13px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>סה"כ ביצוע</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(totals.rawSubtotal)}</span>
                </div>

                {totals.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--info)' }}>
                    <span>הנחה {discountPct > 0 ? `(${discountPct}%)` : ''}</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}

                {totals.insuranceDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                    <span>ניכוי ביטוח ({deductions.insurance}%)</span>
                    <span>-{formatCurrency(totals.insuranceDeduction)}</span>
                  </div>
                )}
                {totals.retentionDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                    <span>ניכוי עיכבון ({deductions.retention}%)</span>
                    <span>-{formatCurrency(totals.retentionDeduction)}</span>
                  </div>
                )}
                {totals.labTestsDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                    <span>ניכוי מעבדה ({deductions.labTests}%)</span>
                    <span>-{formatCurrency(totals.labTestsDeduction)}</span>
                  </div>
                )}

                {totals.totalDeductions > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--dark-border)' }}>
                    <span>אחרי ניכויים</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(totals.afterDeductions)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>מע"מ ({vatRate}%)</span>
                  <span>{formatCurrency(totals.vat)}</span>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: '10px', borderTop: '2px solid var(--gold-border)',
                  fontSize: '16px', fontWeight: 700, color: 'var(--gold)',
                }}>
                  <span>סה"כ לתשלום</span>
                  <span>{formatCurrency(totals.finalTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {invoices.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div>אין חשבונות חלקיים. לחץ "חשבון חלקי חדש" ליצירת חשבון ראשון.</div>
        </div>
      )}
    </div>
  )
}
