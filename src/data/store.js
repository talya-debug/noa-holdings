// מנהל נתונים — Firestore עם cache מקומי
// כל הקריאות סינכרוניות (מהזיכרון), כל הכתיבות מסנכרנות ל-Firestore
// Multi-tenancy: כל משתמש שומר תחת users/{uid}/

import { db, auth } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { masterPriceList, findPriceItem, defaultMilestones } from './mockData'

// ===== Cache מקומי =====
const cache = {}

// כל הטבלאות — משתמש חדש מתחיל עם מחירון בלבד, בלי דמו
const TABLES = {
  priceList: masterPriceList,
  quotes: [],
  projects: [],
  milestones: [],
  projectTasks: [],
  purchases: [],
  workLogs: [],
  subcontractors: [],
  documents: [],
  boqQuotes: [],
  partialInvoices: [],
  changeOrders: [],
}

// נתיב Firestore — נתונים משותפים לכל משתמשי המערכת
function userDoc(key) {
  return doc(db, 'appData', key)
}

// טעינה ראשונית מ-Firestore — קורה פעם אחת אחרי התחברות
export async function loadAllData() {
  const promises = Object.keys(TABLES).map(async (key) => {
    try {
      const snap = await getDoc(userDoc(key))
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        cache[key] = snap.data().items
      } else {
        // משתמש חדש — מאתחל עם ברירת מחדל
        cache[key] = [...TABLES[key]]
        if (TABLES[key].length > 0) {
          await setDoc(userDoc(key), { items: TABLES[key] })
        }
      }
    } catch (err) {
      console.error(`שגיאה בטעינת ${key}:`, err)
      cache[key] = [...TABLES[key]]
    }
  })
  await Promise.all(promises)
}

// קריאה מה-cache (סינכרוני)
function load(key) {
  return cache[key] || []
}

// שמירה ל-cache + סנכרון ל-Firestore
function save(key, data) {
  cache[key] = data
  try {
    setDoc(userDoc(key), { items: data }).catch(err =>
      console.error(`שגיאה בשמירת ${key}:`, err)
    )
  } catch (err) {
    console.error(`שגיאה בשמירת ${key}:`, err)
  }
}

// ===== מחירון =====
export function getPriceList() { return load('priceList') }
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
export function getQuotes() { return load('quotes') }
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
export function duplicateQuote(id) {
  const original = getQuote(id)
  if (!original) return null
  const quotes = getQuotes()
  const dup = {
    ...original,
    id: Date.now(),
    number: `Q-2026-${String(quotes.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    clientName: `${original.clientName} (עותק)`,
  }
  quotes.push(dup)
  saveQuotes(quotes)
  return dup
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

  updateQuote(quoteId, { status: 'approved' })

  let totalSell = 0
  quote.items.forEach(qi => { totalSell += qi.clientPrice * qi.quantity })

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

  const milestones = getMilestones()
  quote.milestones.forEach((ms, i) => {
    milestones.push({
      id: Date.now() + i + 1,
      projectId: project.id,
      name: ms.name,
      percentage: ms.percentage,
      amount: Math.round(totalSell * ms.percentage / 100),
      status: 'pending',
      billingStatus: 'גבייה עתידית',
      completionCriteria: ms.completionCriteria || '',
      paidAmount: 0,
      paidDate: null,
    })
  })
  saveMilestones(milestones)

  const tasks = getProjectTasks()
  const purchases = getPurchases()
  const subsList = getSubcontractors()
  const currentPriceList = getPriceList()

  quote.items.forEach((qi, i) => {
    // פריט חופשי או פריט מהמחירון
    const pi = qi._free
      ? { name: qi._name, category: qi._category, type: qi._type, unit: qi._unit, costPrice: qi._costPrice }
      : (currentPriceList.find(p => p.id === qi.priceItemId) || findPriceItem(qi.priceItemId))
    if (!pi) return

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

    if (pi.type === 'material') {
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
        orderedQty: 0, actualUnitCost: 0, actualTotal: 0,
        orderStatus: 'not_ordered',
        orders: [], date: null,
      })
    }

    if (pi.type === 'subcontractor') {
      subsList.push({
        id: Date.now() + 300 + i,
        name: pi.name,
        phone: '',
        specialty: pi.category,
        projectId: project.id,
        contractAmount: qi.clientPrice * qi.quantity,
        paid: 0, pending: 0, hasContract: false,
      })
    }
  })
  saveProjectTasks(tasks)
  savePurchases(purchases)
  saveSubcontractors(subsList)

  return project
}

// ===== פרויקטים =====
export function getProjects() { return load('projects') }
export function saveProjects(p) { save('projects', p) }
export function getProject(id) { return getProjects().find(p => p.id === id) }
export function deleteProject(id) {
  saveProjects(getProjects().filter(p => p.id !== id))
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
export function getMilestones() { return load('milestones') }
export function saveMilestones(ms) { save('milestones', ms) }
export function updateMilestone(id, updates) {
  const ms = getMilestones()
  const idx = ms.findIndex(m => m.id === id)
  if (idx !== -1) { ms[idx] = { ...ms[idx], ...updates }; saveMilestones(ms) }
  return ms[idx]
}

// ===== משימות פרויקט =====
export function getProjectTasks() { return load('projectTasks') }
export function saveProjectTasks(t) { save('projectTasks', t) }
export function updateProjectTask(id, updates) {
  const tasks = getProjectTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...updates }; saveProjectTasks(tasks) }
}

// ===== רכישות =====
export function getPurchases() { return load('purchases') }
export function savePurchases(p) { save('purchases', p) }
export function updatePurchase(id, updates) {
  const ps = getPurchases()
  const idx = ps.findIndex(p => p.id === id)
  if (idx !== -1) { ps[idx] = { ...ps[idx], ...updates }; savePurchases(ps) }
}

// ===== יומני עבודה =====
export function getWorkLogs() { return load('workLogs') }
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
export function getSubcontractors() { return load('subcontractors') }
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
export function getBOQQuotes() { return load('boqQuotes') }
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

  const project = {
    id: Date.now(),
    boqQuoteId: boqId,
    billingType: 'boq',
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

  const tasks = getProjectTasks()
  const purchases = getPurchases()
  const subsList = getSubcontractors()

  boq.items.forEach((item, i) => {
    const task = {
      id: Date.now() + 100 + i,
      projectId: project.id,
      name: item.name,
      category: item.category,
      type: item.itemType === 'procurement' ? 'material' : item.itemType === 'combined' ? 'combined' : item.itemType === 'subcontractor' ? 'subcontractor' : 'labor',
      unit: item.unit,
      budgetQty: item.quantity,
      budgetCost: item.costPrice,
      clientPrice: item.clientPrice,
      clause: item.clause,
      status: 'pending',
    }
    tasks.push(task)

    if (item.itemType === 'procurement' || item.itemType === 'combined') {
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
        orderedQty: 0, actualUnitCost: 0, actualTotal: 0,
        orderStatus: 'not_ordered',
        orders: [], date: null,
      })
    }

    if (item.itemType === 'subcontractor') {
      subsList.push({
        id: Date.now() + 300 + i,
        name: item.name,
        phone: '',
        specialty: item.category,
        projectId: project.id,
        contractAmount: item.clientPrice * item.quantity,
        paid: 0, pending: 0, hasContract: false,
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
  const all = load('partialInvoices')
  return projectId ? all.filter(i => i.projectId === projectId) : all
}
export function savePartialInvoices(invoices) { save('partialInvoices', invoices) }
export function addPartialInvoice(projectId, boqItems) {
  const all = load('partialInvoices')
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
  const all = load('partialInvoices')
  const idx = all.findIndex(i => i.id === id)
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; savePartialInvoices(all) }
}

// ===== מסמכים =====
export function getDocuments(projectId) {
  const all = load('documents')
  return projectId ? all.filter(d => d.projectId === projectId) : all
}
export function saveDocuments(docs) { save('documents', docs) }
export function addDocument(doc2) {
  const all = load('documents')
  doc2.id = Date.now()
  all.push(doc2)
  saveDocuments(all)
  return doc2
}
export function deleteDocument(id) {
  saveDocuments(load('documents').filter(d => d.id !== id))
}

// ===== תוספות ושינויים =====
export function getChangeOrders(projectId) {
  const all = load('changeOrders')
  return projectId ? all.filter(co => co.projectId === projectId) : all
}
export function saveChangeOrders(cos) { save('changeOrders', cos) }
export function getChangeOrder(id) { return load('changeOrders').find(co => co.id === id) }
export function addChangeOrder(data) {
  const all = load('changeOrders')
  const projectOrders = all.filter(co => co.projectId === data.projectId)
  const co = {
    id: Date.now(),
    number: `CO-${String(projectOrders.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    approvedBy: '',
    approvedDate: null,
    ...data,
  }
  all.push(co)
  saveChangeOrders(all)
  return co
}
export function updateChangeOrder(id, updates) {
  const all = load('changeOrders')
  const idx = all.findIndex(co => co.id === id)
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; saveChangeOrders(all) }
  return all[idx]
}
export function deleteChangeOrder(id) {
  saveChangeOrders(load('changeOrders').filter(co => co.id !== id))
}

// אישור תוספת → הכנסה לפרויקט
export function approveChangeOrder(changeId, approvedBy) {
  const co = getChangeOrder(changeId)
  if (!co) return null

  updateChangeOrder(changeId, { status: 'approved', approvedBy, approvedDate: new Date().toISOString().split('T')[0] })

  const project = getProject(co.projectId)
  if (!project) return null

  const tasks = getProjectTasks()
  const purchases = getPurchases()
  const subsList = getSubcontractors()

  ;(co.items || []).forEach((item, i) => {
    const task = {
      id: Date.now() + 500 + i,
      projectId: co.projectId,
      name: `${item.name} (תוספת)`,
      category: item.category,
      type: item.type === 'procurement' ? 'material' : item.type,
      unit: item.unit,
      budgetQty: item.quantity,
      budgetCost: item.costPrice,
      clientPrice: item.clientPrice,
      status: 'pending',
      changeOrderId: changeId,
    }
    tasks.push(task)

    if (item.type === 'material' || item.type === 'procurement' || item.type === 'combined') {
      purchases.push({
        id: Date.now() + 600 + i,
        projectId: co.projectId,
        taskId: task.id,
        name: item.name,
        category: item.category,
        supplier: '',
        budgetQty: item.quantity,
        budgetUnitCost: item.costPrice,
        budgetTotal: item.costPrice * item.quantity,
        orderedQty: 0, actualUnitCost: 0, actualTotal: 0,
        orderStatus: 'not_ordered',
        orders: [], date: null,
      })
    }

    if (item.type === 'subcontractor') {
      subsList.push({
        id: Date.now() + 700 + i,
        name: item.name,
        phone: '',
        specialty: item.category,
        projectId: co.projectId,
        contractAmount: item.clientPrice * item.quantity,
        paid: 0, pending: 0, hasContract: false,
      })
    }
  })

  saveProjectTasks(tasks)
  savePurchases(purchases)
  saveSubcontractors(subsList)

  const totalSell = (co.items || []).reduce((s, i) => s + (i.clientPrice * i.quantity), 0)

  if (project.billingType === 'boq' && project.boqQuoteId) {
    const boq = getBOQQuote(project.boqQuoteId)
    if (boq) {
      const newItems = [...(boq.items || [])]
      co.items.forEach(item => {
        newItems.push({
          clause: `CO-${co.number}`,
          category: item.category,
          name: `${item.name} (תוספת)`,
          unit: item.unit,
          quantity: item.quantity,
          itemType: item.type === 'material' ? 'procurement' : item.type,
          costPrice: item.costPrice,
          clientPrice: item.clientPrice,
        })
      })
      updateBOQQuote(project.boqQuoteId, { items: newItems })
    }
  } else {
    const milestones = getMilestones()
    milestones.push({
      id: Date.now() + 800,
      projectId: co.projectId,
      name: `תוספות ושינויים ${co.number}`,
      percentage: 0,
      amount: totalSell,
      status: 'pending',
      billingStatus: 'ממתין לאישור',
      completionCriteria: co.description || '',
      paidAmount: 0, paidDate: null,
    })
    saveMilestones(milestones)
  }

  return co
}

// ===== הגדרות =====
export function getProjectSettings(projectId) {
  const p = getProject(projectId)
  return { laborCostPerWorker: p?.laborCostPerWorker || 600 }
}

// ===== איפוס =====
export async function resetAllData() {
  for (const key of Object.keys(TABLES)) {
    cache[key] = [...TABLES[key]]
    await setDoc(userDoc(key), { items: TABLES[key] })
  }
}
