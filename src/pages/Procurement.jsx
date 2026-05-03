import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Package, Check, Clock, ChevronDown, ChevronLeft, Plus, Truck, FileDown } from 'lucide-react'
import { formatCurrency, formatDate } from '../data/mockData'
import { getPurchases, updatePurchase, getProject } from '../data/store'

// כל פריט רכש יכול להכיל מספר הזמנות (orders)
// order = { id, date, supplier, quantity, unitCost, total, status: 'ordered'|'delivered' }

export default function Procurement() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [purchases, setPurchases] = useState(() => getPurchases().filter(p => p.projectId === pid))
  const [expanded, setExpanded] = useState({})
  const [addingOrder, setAddingOrder] = useState(null) // id של purchase שמוסיפים לו הזמנה
  const [orderForm, setOrderForm] = useState({ supplier: '', quantity: '', unitCost: '', date: new Date().toISOString().split('T')[0], expectedDelivery: '', deliveryDays: '' })

  const refresh = () => setPurchases(getPurchases().filter(p => p.projectId === pid))

  const totalBudget = purchases.reduce((s, p) => s + p.budgetTotal, 0)
  const totalOrdered = purchases.reduce((s, p) => {
    const orders = p.orders || []
    return s + orders.reduce((os, o) => os + (o.quantity * o.unitCost), 0)
  }, 0)
  const totalDelivered = purchases.reduce((s, p) => {
    const orders = (p.orders || []).filter(o => o.status === 'delivered')
    return s + orders.reduce((os, o) => os + (o.quantity * o.unitCost), 0)
  }, 0)

  const handleAddOrder = (purchaseId) => {
    const purchase = purchases.find(p => p.id === purchaseId)
    if (!purchase) return
    const qty = Number(orderForm.quantity) || 0
    const cost = Number(orderForm.unitCost) || purchase.budgetUnitCost
    if (qty <= 0) return

    // חישוב תאריך אספקה צפוי
    let expectedDelivery = orderForm.expectedDelivery
    if (!expectedDelivery && orderForm.deliveryDays) {
      const d = new Date(orderForm.date)
      d.setDate(d.getDate() + Number(orderForm.deliveryDays))
      expectedDelivery = d.toISOString().split('T')[0]
    }

    const orders = [...(purchase.orders || []), {
      id: Date.now(),
      date: orderForm.date,
      supplier: orderForm.supplier,
      quantity: qty,
      unitCost: cost,
      total: qty * cost,
      status: 'ordered',
      expectedDelivery: expectedDelivery || '',
    }]

    // עדכון סכומים
    const totalOrderedQty = orders.reduce((s, o) => s + o.quantity, 0)
    const totalActual = orders.reduce((s, o) => s + o.total, 0)

    updatePurchase(purchaseId, {
      orders,
      orderedQty: totalOrderedQty,
      actualTotal: totalActual,
      actualUnitCost: totalOrderedQty > 0 ? Math.round(totalActual / totalOrderedQty) : 0,
      orderStatus: 'ordered',
      supplier: orderForm.supplier || purchase.supplier,
    })
    refresh()
    setAddingOrder(null)
    setOrderForm({ supplier: '', quantity: '', unitCost: '', date: new Date().toISOString().split('T')[0], expectedDelivery: '', deliveryDays: '' })
  }

  // הפקת הזמנת רכש PDF
  const handleExportPO = (purchase, order) => {
    const totalWithVat = Math.round(order.total * 1.18)
    const vat = totalWithVat - order.total
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8">
<title>הזמנת רכש — ${purchase.name}</title>
<style>
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,'Heebo',sans-serif;color:#222;font-size:11px;line-height:1.4;direction:rtl;padding:20mm 16mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hdr{border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end}
.logo{font-size:28px;font-weight:900;color:#D4A843;font-family:Arial}
.logo span{display:block;font-size:9px;font-weight:400;color:#999;letter-spacing:2px}
.title{font-size:14px;font-weight:700;color:#D4A843}
.info{margin-bottom:16px;font-size:11px;color:#555}
.info b{color:#333}
table{width:100%;border-collapse:collapse;margin:16px 0}
th{background:#f5f0e3;color:#8a7530;padding:8px 10px;font-size:10px;border-bottom:2px solid #D4A843;text-align:right}
td{padding:8px 10px;border-bottom:1px solid #eee}
.tot td{background:#fdf8ec;font-weight:700;color:#D4A843;border-top:2px solid #D4A843}
.sum{margin:16px 0;padding:12px;background:#f7f7f7;border-radius:6px}
.sum div{display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px}
.sum .total{font-size:14px;font-weight:700;color:#D4A843;border-top:1px solid #ddd;padding-top:8px;margin-top:8px}
.notes{margin:16px 0;padding:12px;background:#faf7f0;border-right:3px solid #D4A843;font-size:11px}
.sig{margin-top:30px;display:flex;justify-content:space-between}
.sig div{width:40%;text-align:center}
.sig .line{border-bottom:1px solid #bbb;height:30px;margin-bottom:4px}
.sig .name{font-size:9px;color:#888}
.ft{text-align:center;color:#ccc;font-size:8px;margin-top:20px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<div class="hdr">
  <div><div class="logo">NH<span>NOA HOLDINGS</span></div></div>
  <div style="text-align:left"><div class="title">הזמנת רכש</div>${formatDate(order.date)}</div>
</div>
<div class="info">
  <div><b>לכבוד:</b> ${order.supplier}</div>
  <div><b>פרויקט:</b> ${project?.name || ''}</div>
  <div><b>כתובת:</b> ${project?.address || ''}</div>
</div>
<table>
  <thead><tr><th>פריט</th><th>יחידה</th><th>כמות</th><th>מחיר ליחידה</th><th>סה"כ</th></tr></thead>
  <tbody>
    <tr><td style="font-weight:500">${purchase.name}</td><td>${purchase.category}</td><td>${order.quantity}</td><td>${order.unitCost.toLocaleString()} ₪</td><td style="font-weight:600;color:#D4A843">${order.total.toLocaleString()} ₪</td></tr>
  </tbody>
</table>
<div class="sum">
  <div><span>סה"כ לפני מע"מ</span><span>${order.total.toLocaleString()} ₪</span></div>
  <div><span>מע"מ 18%</span><span>${vat.toLocaleString()} ₪</span></div>
  <div class="total"><span>סה"כ לתשלום</span><span>${totalWithVat.toLocaleString()} ₪</span></div>
</div>
<div class="notes">
  <b>תאריך אספקה נדרש:</b> ${formatDate(order.date)}<br>
  <b>הערות:</b> נא לתאם אספקה מראש. הפריקה באחריות הספק.
</div>
<div class="sig">
  <div><div class="line"></div><div class="name">חתימת מזמין</div></div>
  <div><div class="line"></div><div class="name">חתימת ספק</div></div>
</div>
<div class="ft">נעה אחזקות | הזמנת רכש | ${formatDate(order.date)}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`)
    win.document.close()
  }

  const handleOrderStatus = (purchaseId, orderId, status) => {
    const purchase = purchases.find(p => p.id === purchaseId)
    if (!purchase) return
    const orders = (purchase.orders || []).map(o => o.id === orderId ? { ...o, status } : o)
    const allDelivered = orders.every(o => o.status === 'delivered')
    updatePurchase(purchaseId, { orders, orderStatus: allDelivered ? 'delivered' : 'ordered' })
    refresh()
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>רכש וכמויות</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project?.name}</p>
      </div>

      {/* סטטיסטיקות */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'תקציב כולל', value: formatCurrency(totalBudget), icon: Package, color: 'var(--gold)', bg: 'var(--gold-bg)' },
          { label: 'הוזמן בפועל', value: formatCurrency(totalOrdered), icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
          { label: 'סופק', value: formatCurrency(totalDelivered), icon: Check, color: 'var(--success)', bg: 'var(--success-bg)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* רשימת פריטי רכש */}
      {purchases.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין רכישות. הן נוצרות אוטומטית מפריטי חומר בהצעת המחיר.
        </div>
      )}

      {purchases.map(p => {
        const isExpanded = expanded[p.id]
        const orders = p.orders || []
        const orderedQty = orders.reduce((s, o) => s + o.quantity, 0)
        const remaining = p.budgetQty - orderedQty
        const totalActual = orders.reduce((s, o) => s + o.total, 0)
        const overBudget = totalActual > p.budgetTotal && totalActual > 0
        const allDelivered = orders.length > 0 && orders.every(o => o.status === 'delivered')

        return (
          <div key={p.id} className="card" style={{ marginBottom: '10px', padding: 0 }}>
            {/* כותרת פריט */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
                cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--dark-border)' : 'none',
              }}
              onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
            >
              {/* סטטוס */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: allDelivered ? 'var(--success)' : orders.length > 0 ? 'var(--warning)' : 'var(--text-muted)',
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.category}</div>
              </div>

              {/* תקציב */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>תקציב</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.budgetQty} × {formatCurrency(p.budgetUnitCost)}</div>
                <div style={{ fontSize: '12px', color: 'var(--gold)' }}>{formatCurrency(p.budgetTotal)}</div>
              </div>

              {/* הוזמן */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>הוזמן</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>{orderedQty} / {p.budgetQty}</div>
                <div style={{ fontSize: '12px', color: overBudget ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {formatCurrency(totalActual)}
                </div>
              </div>

              {/* נותר */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>נותר להזמנה</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: remaining > 0 ? 'var(--info)' : 'var(--success)' }}>
                  {remaining > 0 ? remaining : 'הושלם'}
                </div>
              </div>

              {isExpanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
            </div>

            {/* הזמנות מפורטות */}
            {isExpanded && (
              <div style={{ padding: '0' }}>
                {orders.length > 0 && (
                  <table>
                    <thead>
                      <tr>
                        <th>תאריך</th>
                        <th>ספק</th>
                        <th>כמות</th>
                        <th>מחיר ליח׳</th>
                        <th>סה"כ</th>
                        <th>אספקה צפויה</th>
                        <th>סטטוס</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o, i) => (
                        <tr key={o.id}>
                          <td>{formatDate(o.date)}</td>
                          <td>{o.supplier}</td>
                          <td>{o.quantity}</td>
                          <td>{formatCurrency(o.unitCost)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(o.total)}</td>
                          <td>
                            {o.expectedDelivery ? (() => {
                              const days = Math.ceil((new Date(o.expectedDelivery) - new Date()) / (1000*60*60*24))
                              return (
                                <span style={{
                                  fontSize: '12px', fontWeight: 600,
                                  color: o.status === 'delivered' ? 'var(--success)' : days <= 0 ? 'var(--danger)' : days <= 2 ? 'var(--warning)' : 'var(--text-muted)',
                                }}>
                                  {o.status === 'delivered' ? 'סופק' : days <= 0 ? `באיחור ${Math.abs(days)} ימים!` : days <= 2 ? `בעוד ${days} ימים — לאשר מול ספק` : formatDate(o.expectedDelivery)}
                                </span>
                              )
                            })() : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td>
                            <select value={o.status} onChange={e => handleOrderStatus(p.id, o.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--dark)', border: '1px solid var(--dark-border)', borderRadius: '4px', color: o.status === 'delivered' ? 'var(--success)' : 'var(--warning)' }}>
                              <option value="ordered">הוזמן</option>
                              <option value="delivered">סופק</option>
                            </select>
                          </td>
                          <td>
                            <button onClick={() => handleExportPO(p, o)}
                              style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '4px' }}
                              title="הפק הזמנת רכש">
                              <FileDown size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {orders.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    לא בוצעו הזמנות עדיין
                  </div>
                )}

                {/* הוספת הזמנה */}
                {addingOrder === p.id ? (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--dark-border)', background: 'var(--gold-bg)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginBottom: '10px' }}>הזמנה חדשה</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ margin: 0, flex: '1 1 120px' }}>
                        <label style={{ fontSize: '11px' }}>ספק</label>
                        <input value={orderForm.supplier} onChange={e => setOrderForm(prev => ({ ...prev, supplier: e.target.value }))} placeholder="שם ספק" style={{ padding: '6px 10px', fontSize: '13px' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: '0 0 80px' }}>
                        <label style={{ fontSize: '11px' }}>כמות</label>
                        <input type="number" value={orderForm.quantity} onChange={e => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))} placeholder={String(remaining > 0 ? remaining : 0)} style={{ padding: '6px 10px', fontSize: '13px', textAlign: 'center' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: '0 0 90px' }}>
                        <label style={{ fontSize: '11px' }}>מחיר ליח׳</label>
                        <input type="number" value={orderForm.unitCost} onChange={e => setOrderForm(prev => ({ ...prev, unitCost: e.target.value }))} placeholder={String(p.budgetUnitCost)} style={{ padding: '6px 10px', fontSize: '13px', textAlign: 'center' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: '0 0 110px' }}>
                        <label style={{ fontSize: '11px' }}>תאריך הזמנה</label>
                        <input type="date" value={orderForm.date} onChange={e => setOrderForm(prev => ({ ...prev, date: e.target.value }))} style={{ padding: '6px 10px', fontSize: '13px' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: '0 0 80px' }}>
                        <label style={{ fontSize: '11px' }}>ימי אספקה</label>
                        <input type="number" min="0" value={orderForm.deliveryDays} onChange={e => setOrderForm(prev => ({ ...prev, deliveryDays: e.target.value, expectedDelivery: '' }))} placeholder="ימים" style={{ padding: '6px 10px', fontSize: '13px', textAlign: 'center' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: '0 0 110px' }}>
                        <label style={{ fontSize: '11px' }}>אספקה צפויה</label>
                        <input type="date" value={orderForm.expectedDelivery || (orderForm.deliveryDays ? (() => { const d = new Date(orderForm.date); d.setDate(d.getDate() + Number(orderForm.deliveryDays)); return d.toISOString().split('T')[0] })() : '')} onChange={e => setOrderForm(prev => ({ ...prev, expectedDelivery: e.target.value, deliveryDays: '' }))} style={{ padding: '6px 10px', fontSize: '13px' }} />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddOrder(p.id)}>אשר</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setAddingOrder(null)}>ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--dark-border)' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setAddingOrder(p.id)
                      setOrderForm({ supplier: p.supplier || '', quantity: String(remaining > 0 ? remaining : ''), unitCost: String(p.budgetUnitCost), date: new Date().toISOString().split('T')[0], expectedDelivery: '', deliveryDays: '' })
                    }}>
                      <Plus size={14} />הוסף הזמנה
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
