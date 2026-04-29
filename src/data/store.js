// מנהל נתונים - localStorage (יוחלף ב-Supabase)

import { masterPriceList, demoQuotes, demoProjects, demoMilestones, demoProjectTasks, demoPurchases, demoWorkLogs, demoSubcontractors, demoDocuments, demoBOQQuotes, demoPartialInvoices, findPriceItem, defaultMilestones } from './mockData'

function load(key, fallback) {
  try {
    const d = localStorage.getItem(`pb_${key}`)
    if (d) return JSON.parse(d)
    // אם אין נתונים — שמור את הדמו ל-localStorage מיד
    if (fallback && (Array.isArray(fallback) ? fallback.length > 0 : true)) {
      localStorage.setItem(`pb_${key}`, JSON.stringify(fallback))
    }
    return fallback
  } catch { return fallback }
}
function save(key, data) { localStorage.setItem(`pb_${key}`, JSON.stringify(data)) }

// ===== מחירון =====
export function getPriceList() { return load('priceList', masterPriceList) }
export function savePriceList(list) { save('priceList', list) }
export function addPriceItem(item) {
  const list = getPriceList()
  item.id = Date.now()
  list.push(item)
  savePriceList(list)
  return item
}

export function updatePriceItem(id, updates) {
  const list = getPriceList()
  const idx = list.findIndex(i => i.id === id)
  if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; savePriceList(list) }
}
export function deletePriceItem(id) {
  savePriceList(getPriceList().filter(i => i.id !== id))
}

// ===== הצעות מחיר =====
export function getQuotes() { return load('quotes', demoQuotes) }
export function saveQuotes(q) { save('quotes', q) }
export function getQuote(id) { return getQuotes().find(q => q.id === id) }
export function addQuote(quote) {
  const quotes = getQuotes()
  quote.id = Date.now()
  quote.number = `Q-2026-${String(quotes.length + 1).padStart(3, '0')}`
  quote.date = new Date().toISOString().split('T')[0]
  quote.status = 'draft'
  quote.items = []
  quote.milestones = [...defaultMilestones]
  quotes.push(quote)
  saveQuotes(quotes)
  return quote
}
export function deleteQuote(id) {
  saveQuotes(getQuotes().filter(q => q.id !== id))
}
export function updateQuote(id, updates) {
  const quotes = getQuotes()
  const idx = quotes.findIndex(q => q.id === id)
  if (idx !== -1) { quotes[idx] = { ...quotes[idx], ...updates }; saveQuotes(quotes) }
  return quotes[idx]
}

// ===== אישור הצעה → יצירת פרויקט אוטומטית =====
export function approveQuote(quoteId) {
  const quote = getQuote(quoteId)
  if (!quote) return null

  // עדכון סטטוס הצעה
  updateQuote(quoteId, { status: 'approved' })

  // חישוב סה"כ מכירה
  let totalSell = 0
  quote.items.forEach(qi => {
    totalSell += qi.clientPrice * qi.quantity
  })

  // יצירת פרויקט
  const project = {
    id: Date.now(),
    quoteId,
    name: `${quote.clientName} - ${quote.address}`,
    clientName: quote.clientName,
    address: quote.address,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    expectedEnd: '',
    laborCostPerWorker: 600,
  }
  const projects = getProjects()
  projects.push(project)
  saveProjects(projects)

  // יצירת אבני דרך
  const milestones = getMilestones()
  quote.milestones.forEach((ms, i) => {
    milestones.push({
      id: Date.now() + i + 1,
      projectId: project.id,
      name: ms.name,
      percentage: ms.percentage,
      amount: Math.round(totalSell * ms.percentage / 100),
      status: i === 0 ? 'pending' : 'pending',
      billingStatus: 'גבייה עתידית',
      completionCriteria: ms.completionCriteria || '',
      paidAmount: 0,
      paidDate: null,
    })
  })
  saveMilestones(milestones)

  // יצירת משימות + רכישות
  const tasks = getProjectTasks()
  const purchases = getPurchases()

  const currentPriceList = getPriceList()
  quote.items.forEach((qi, i) => {
    const pi = currentPriceList.find(p => p.id === qi.priceItemId) || findPriceItem(qi.priceItemId)
    if (!pi) return

    // משימה
    const task = {
      id: Date.now() + 100 + i,
      projectId: project.id,
      priceItemId: qi.priceItemId,
      name: pi.name,
      category: pi.category,
      type: pi.type,
      unit: pi.unit,
      budgetQty: qi.quantity,
      budgetCost: pi.costPrice,
      clientPrice: qi.clientPrice,
      status: 'pending',
    }
    tasks.push(task)

    // רכישה (חומר או קבלן משנה - הוצאות שצריך לעקוב)
    if (pi.type === 'material' || pi.type === 'subcontractor') {
      purchases.push({
        id: Date.now() + 200 + i,
        projectId: project.id,
        taskId: task.id,
        name: pi.name,
        category: pi.category,
        supplier: '',
        budgetQty: qi.quantity,
        budgetUnitCost: pi.costPrice,
        budgetTotal: pi.costPrice * qi.quantity,
        orderedQty: 0,
        actualUnitCost: 0,
        actualTotal: 0,
        orderStatus: 'not_ordered',
        orders: [], // מערך הזמנות - כל הזמנה נפרדת
        date: null,
      })
    }
  })
  saveProjectTasks(tasks)
  savePurchases(purchases)

  return project
}

// ===== פרויקטים =====
export function getProjects() { return load('projects', demoProjects) }
export function saveProjects(p) { save('projects', p) }
export function getProject(id) { return getProjects().find(p => p.id === id) }
export function deleteProject(id) {
  saveProjects(getProjects().filter(p => p.id !== id))
  // מחיקת כל הנתונים המקושרים
  saveMilestones(getMilestones().filter(m => m.projectId !== id))
  saveProjectTasks(getProjectTasks().filter(t => t.projectId !== id))
  savePurchases(getPurchases().filter(p => p.projectId !== id))
  saveWorkLogs(getWorkLogs().filter(l => l.projectId !== id))
  saveSubcontractors(getSubcontractors().filter(s => s.projectId !== id))
}
export function updateProject(id, updates) {
  const projects = getProjects()
  const idx = projects.findIndex(p => p.id === id)
  if (idx !== -1) { projects[idx] = { ...projects[idx], ...updates }; saveProjects(projects) }
}

// ===== אבני דרך =====
export function getMilestones() { return load('milestones', demoMilestones) }
export function saveMilestones(ms) { save('milestones', ms) }
export function updateMilestone(id, updates) {
  const ms = getMilestones()
  const idx = ms.findIndex(m => m.id === id)
  if (idx !== -1) { ms[idx] = { ...ms[idx], ...updates }; saveMilestones(ms) }
  return ms[idx]
}

// ===== משימות פרויקט =====
export function getProjectTasks() { return load('projectTasks', demoProjectTasks) }
export function saveProjectTasks(t) { save('projectTasks', t) }
export function updateProjectTask(id, updates) {
  const tasks = getProjectTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...updates }; saveProjectTasks(tasks) }
}

// ===== רכישות =====
export function getPurchases() { return load('purchases', demoPurchases) }
export function savePurchases(p) { save('purchases', p) }
export function updatePurchase(id, updates) {
  const ps = getPurchases()
  const idx = ps.findIndex(p => p.id === id)
  if (idx !== -1) { ps[idx] = { ...ps[idx], ...updates }; savePurchases(ps) }
}

// ===== יומני עבודה =====
export function getWorkLogs() { return load('workLogs', demoWorkLogs) }
export function saveWorkLogs(l) { save('workLogs', l) }
export function deleteWorkLog(id) {
  saveWorkLogs(getWorkLogs().filter(l => l.id !== id))
}
export function addWorkLog(log) {
  const logs = getWorkLogs()
  log.id = Date.now()
  logs.push(log)
  saveWorkLogs(logs)
  return log
}

// ===== קבלני משנה =====
export function getSubcontractors() { return load('subcontractors', demoSubcontractors) }
export function saveSubcontractors(s) { save('subcontractors', s) }
export function deleteSubcontractor(id) {
  saveSubcontractors(getSubcontractors().filter(s => s.id !== id))
}
export function addSubcontractor(sub) {
  const subs = getSubcontractors()
  sub.id = Date.now()
  subs.push(sub)
  saveSubcontractors(subs)
  return sub
}
export function addPaymentToSub(subId, amount) {
  const subs = getSubcontractors()
  const idx = subs.findIndex(s => s.id === subId)
  if (idx !== -1) { subs[idx].paid += amount; saveSubcontractors(subs) }
}

// ===== כתב כמויות (BOQ) =====
export function getBOQQuotes() { return load('boqQuotes', demoBOQQuotes) }
export function saveBOQQuotes(q) { save('boqQuotes', q) }
export function getBOQQuote(id) { return getBOQQuotes().find(q => q.id === id) }
export function addBOQQuote(data) {
  const quotes = getBOQQuotes()
  const boq = {
    id: Date.now(),
    number: `BOQ-${String(quotes.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    type: 'boq',
    ...data,
  }
  quotes.push(boq)
  saveBOQQuotes(quotes)
  return boq
}
export function updateBOQQuote(id, updates) {
  const quotes = getBOQQuotes()
  const idx = quotes.findIndex(q => q.id === id)
  if (idx !== -1) { quotes[idx] = { ...quotes[idx], ...updates }; saveBOQQuotes(quotes) }
  return quotes[idx]
}
export function deleteBOQQuote(id) {
  saveBOQQuotes(getBOQQuotes().filter(q => q.id !== id))
}

// ===== אישור כתב כמויות → יצירת פרויקט =====
export function approveBOQQuote(boqId) {
  const boq = getBOQQuote(boqId)
  if (!boq) return null

  updateBOQQuote(boqId, { status: 'approved' })

  // יצירת פרויקט
  const project = {
    id: Date.now(),
    boqQuoteId: boqId,
    billingType: 'boq', // גבייה בחשבון חלקי
    name: boq.projectName || `${boq.clientName} - ${boq.address}`,
    clientName: boq.clientName,
    address: boq.address,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    expectedEnd: '',
    laborCostPerWorker: 600,
  }
  const projects = getProjects()
  projects.push(project)
  saveProjects(projects)

  // יצירת משימות + רכש/קבלני משנה לפי סיווג
  const tasks = getProjectTasks()
  const purchases = getPurchases()
  const subsList = getSubcontractors()

  boq.items.forEach((item, i) => {
    // משימה לכל סעיף
    const task = {
      id: Date.now() + 100 + i,
      projectId: project.id,
      name: item.name,
      category: item.category,
      type: item.itemType === 'procurement' ? 'material' : item.itemType === 'subcontractor' ? 'subcontractor' : 'labor',
      unit: item.unit,
      budgetQty: item.quantity,
      budgetCost: item.costPrice,
      clientPrice: item.clientPrice,
      clause: item.clause,
      status: 'pending',
    }
    tasks.push(task)

    // רכש
    if (item.itemType === 'procurement') {
      purchases.push({
        id: Date.now() + 200 + i,
        projectId: project.id,
        taskId: task.id,
        name: item.name,
        category: item.category,
        supplier: '',
        budgetQty: item.quantity,
        budgetUnitCost: item.costPrice,
        budgetTotal: item.costPrice * item.quantity,
        orderedQty: 0,
        actualUnitCost: 0,
        actualTotal: 0,
        orderStatus: 'not_ordered',
        orders: [],
        date: null,
      })
    }

    // קבלן משנה
    if (item.itemType === 'subcontractor') {
      subsList.push({
        id: Date.now() + 300 + i,
        name: item.name,
        phone: '',
        specialty: item.category,
        projectId: project.id,
        contractAmount: item.clientPrice * item.quantity,
        paid: 0,
        pending: 0,
        hasContract: false,
      })
    }
  })

  saveProjectTasks(tasks)
  savePurchases(purchases)
  saveSubcontractors(subsList)

  return project
}

// ===== חשבונות חלקיים =====
export function getPartialInvoices(projectId) {
  const all = load('partialInvoices', demoPartialInvoices)
  return projectId ? all.filter(i => i.projectId === projectId) : all
}
export function savePartialInvoices(invoices) { save('partialInvoices', invoices) }
export function addPartialInvoice(projectId, boqItems) {
  const all = load('partialInvoices', [])
  const projectInvoices = all.filter(i => i.projectId === projectId)
  const invoice = {
    id: Date.now(),
    projectId,
    invoiceNumber: projectInvoices.length + 1,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    items: boqItems.map((_, idx) => ({ itemIdx: idx, currentQty: 0 })),
    totalAmount: 0,
    paidAmount: 0,
    paidDate: null,
  }
  all.push(invoice)
  savePartialInvoices(all)
  return invoice
}
export function updatePartialInvoice(id, updates) {
  const all = load('partialInvoices', [])
  const idx = all.findIndex(i => i.id === id)
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; savePartialInvoices(all) }
}

// ===== מסמכים =====
export function getDocuments(projectId) {
  const all = load('documents', demoDocuments)
  return projectId ? all.filter(d => d.projectId === projectId) : all
}
export function saveDocuments(docs) { save('documents', docs) }
export function addDocument(doc) {
  const all = load('documents', [])
  doc.id = Date.now()
  all.push(doc)
  saveDocuments(all)
  return doc
}
export function deleteDocument(id) {
  saveDocuments(load('documents', []).filter(d => d.id !== id))
}

// ===== הגדרות =====
export function getProjectSettings(projectId) {
  const p = getProject(projectId)
  return { laborCostPerWorker: p?.laborCostPerWorker || 600 }
}

// ===== איפוס — שומר את כל נתוני הדמו ל-localStorage =====
export function resetAllData() {
  Object.keys(localStorage).filter(k => k.startsWith('pb_')).forEach(k => localStorage.removeItem(k))
  // שמירה מפורשת של כל נתוני הדמו
  save('priceList', masterPriceList)
  save('quotes', demoQuotes)
  save('projects', demoProjects)
  save('milestones', demoMilestones)
  save('projectTasks', demoProjectTasks)
  save('purchases', demoPurchases)
  save('workLogs', demoWorkLogs)
  save('subcontractors', demoSubcontractors)
  save('documents', demoDocuments)
  save('boqQuotes', demoBOQQuotes)
  save('partialInvoices', demoPartialInvoices)
}

// טעינה אוטומטית — כל פעם שהגרסה משתנה הדמו נטען מחדש
const DEMO_VERSION = '12'
if (localStorage.getItem('pb_version') !== DEMO_VERSION) {
  Object.keys(localStorage).forEach(k => localStorage.removeItem(k))
  resetAllData()
  localStorage.setItem('pb_version', DEMO_VERSION)
}
