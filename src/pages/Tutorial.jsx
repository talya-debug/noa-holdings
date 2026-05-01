import { Link } from 'react-router-dom'
import { useState } from 'react'
import { BookOpen, ArrowLeft, CheckCircle, FileText, FileSpreadsheet, ChevronDown, ChevronLeft } from 'lucide-react'

// דף הדרכה — שני מסלולים: הצעת מחיר / כתב כמויות
export default function Tutorial() {
  const [openTrack, setOpenTrack] = useState(null) // 'quote' | 'boq' | null

  const quoteSteps = [
    {
      title: 'בניית המחירון',
      color: '#D4A843',
      link: '/price-list',
      linkText: 'פתח את המחירון',
      items: [
        'המחירון הוא הבסיס — כל החומרים, העבודות וקבלני המשנה שלך',
        'כל פריט מוגדר עם: שם, יחידה, סוג (חומר / עבודה / קבלן משנה) ומחיר עלות',
        'את המחירון בונים פעם אחת — ואז משתמשים בו לכל ההצעות',
        'אפשר לערוך ולהוסיף בכל עת',
      ],
    },
    {
      title: 'יצירת הצעת מחיר',
      color: '#60a5fa',
      link: '/quotes',
      linkText: 'צור הצעת מחיר',
      items: [
        'פותחים הצעה חדשה — שם לקוח וכתובת',
        'בוחרים פריטים מהמחירון ← קובעים כמות ← קובעים מחיר ללקוח',
        'אפשר גם לייבא כתב כמויות מאקסל ישירות לתוך ההצעה',
        'המערכת מחשבת אוטומטית: עלות, מכירה, רווח ואחוז רווח',
        'אבני דרך לגבייה נוצרות אוטומטית',
        'מפיקים PDF מקצועי ללקוח בלחיצה אחת',
      ],
    },
    {
      title: 'אישור ← פרויקט',
      color: '#4ade80',
      items: [
        'הלקוח אישר? לוחצים "אשר הצעה" ← פרויקט נוצר אוטומטית',
        'כל פריט הופך ל: משימה + פריט רכש (אם חומר) + קבלן משנה (אם קב"מ)',
        'אבני דרך הגבייה מוכנות עם הסכומים',
        'לא צריך להקליד כלום מחדש!',
      ],
    },
    {
      title: 'ניהול שוטף',
      color: '#f59e0b',
      items: [
        'משימות — מעקב התקדמות, שינוי סטטוס',
        'רכש — הזמנות מספקים, מעקב אספקה וכמויות',
        'קבלני משנה — הסכמים, תשלומים ויתרות',
        'יומני עבודה — שולחים לינק למנהל עבודה, הוא ממלא מהטלפון',
        'גבייה — מקדמים אבני דרך ורושמים תשלומים',
      ],
    },
    {
      title: 'תכנון מול ביצוע',
      color: '#f87171',
      items: [
        'סקירה כספית — כמה תכננת לשלם מול כמה שילמת בפועל',
        'לכל קטגוריה בנפרד: חומרים, עבודה, קבלני משנה',
        'חריגת תקציב? תראה אדום מיד',
        'התראות אוטומטיות: חובות, איחורים, חוזים חסרים',
      ],
    },
  ]

  const boqSteps = [
    {
      title: 'העלאת כתב כמויות',
      color: '#D4A843',
      link: '/boq/new',
      linkText: 'העלה כתב כמויות',
      items: [
        'מקבלים כתב כמויות מהמזמין? מעלים את האקסל למערכת',
        'עמודות נדרשות: סעיף, קטגוריה, מהות, יחידה, כמות, סוג',
        'המערכת קוראת את הקובץ ומציגה תצוגה מקדימה',
        'אפשר להוריד תבנית לדוגמה אם צריך',
      ],
    },
    {
      title: 'סיווג ותמחור',
      color: '#60a5fa',
      items: [
        'כל שורה צריכה סיווג: רכש / כוח אדם / קבלן משנה',
        'הסיווג קובע לאן הפריט הולך: מעקב רכש, יומן עבודה, או ניהול קבלנים',
        'ממלאים מחיר עלות ומחיר ללקוח לכל שורה',
        'רואים מיד: עלות כוללת, מכירה, רווח ואחוז רווח',
      ],
    },
    {
      title: 'אישור ← פרויקט',
      color: '#4ade80',
      items: [
        'הכל מסווג ומתומחר? לוחצים "אשר"',
        'נוצר פרויקט מסוג "חשבון חלקי" — לא אבני דרך',
        'כל רכש הופך לפריט מעקב, כל קב"מ נכנס לניהול קבלנים',
        'הגבייה תהיה דרך חשבון חלקי — לפי אחוזי ביצוע',
      ],
    },
    {
      title: 'חשבון חלקי',
      color: '#a78bfa',
      items: [
        'יוצרים חשבון חלקי חדש ← ממלאים כמות שבוצעה לכל סעיף',
        'המערכת מחשבת: ביצוע קודם, ביצוע נוכחי, ביצוע מצטבר',
        'הגדרות: ניכוי ביטוח, עיכבון, מעבדה, הנחה, מע"מ, תנאי תשלום',
        'ייצוא לאקסל — שולחים למזמין חשבון מסודר',
        'רישום תשלום ומעקב גבייה',
      ],
    },
    {
      title: 'ניהול + סקירה כספית',
      color: '#f87171',
      items: [
        'אותו ניהול שוטף: משימות, רכש, קבלנים, יומני עבודה',
        'סקירה כספית מראה תכנון מול ביצוע פר קטגוריה',
        'התראות, לוח זמנים, מסמכים — הכל זמין',
      ],
    },
  ]

  const renderSteps = (steps) => (
    <div style={{ marginTop: '16px' }}>
      {steps.map((step, idx) => (
        <div key={idx} style={{
          padding: '20px 24px', marginBottom: '12px',
          background: 'var(--dark)', borderRadius: '10px',
          borderRight: `3px solid ${step.color}`, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: step.color,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '14px', flexShrink: 0,
            }}>{idx + 1}</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: step.color, margin: 0 }}>{step.title}</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '42px' }}>
            {step.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                <CheckCircle size={14} color={step.color} style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {step.link && (
            <Link to={step.link} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '12px', marginRight: '42px', padding: '6px 14px', borderRadius: '8px',
              background: step.color + '18', color: step.color,
              textDecoration: 'none', fontWeight: 600, fontSize: '12px',
            }}>
              {step.linkText} <ArrowLeft size={12} />
            </Link>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{
        textAlign: 'center', padding: '36px 20px', marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--gold-border)',
      }}>
        <BookOpen size={36} color="var(--gold)" style={{ marginBottom: '10px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>
          איך עובדים עם המערכת?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
          יש שני מסלולים — בחר את זה שמתאים לאופן העבודה שלך
        </p>
      </div>

      {/* שני מסלולים */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* מסלול A: הצעת מחיר */}
        <div className="card" style={{
          cursor: 'pointer', border: openTrack === 'quote' ? '2px solid var(--gold)' : '1px solid var(--dark-border)',
          padding: 0, overflow: 'hidden',
        }}>
          <div onClick={() => setOpenTrack(openTrack === 'quote' ? null : 'quote')}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--gold-bg), rgba(212,168,67,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={26} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
                מסלול א׳ — הצעת מחיר
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                בונים הצעה מהמחירון ← הלקוח מאשר ← פרויקט עם אבני דרך
              </p>
            </div>
            {openTrack === 'quote' ? <ChevronDown size={20} color="var(--gold)" /> : <ChevronLeft size={20} color="var(--text-muted)" />}
          </div>
          {openTrack === 'quote' && (
            <div style={{ padding: '0 24px 24px' }}>
              {renderSteps(quoteSteps)}
            </div>
          )}
        </div>

        {/* מסלול B: כתב כמויות */}
        <div className="card" style={{
          cursor: 'pointer', border: openTrack === 'boq' ? '2px solid #60a5fa' : '1px solid var(--dark-border)',
          padding: 0, overflow: 'hidden',
        }}>
          <div onClick={() => setOpenTrack(openTrack === 'boq' ? null : 'boq')}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'var(--info-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileSpreadsheet size={26} color="var(--info)" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--info)', marginBottom: '4px' }}>
                מסלול ב׳ — כתב כמויות
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                מעלים אקסל ← מסווגים ומתמחרים ← פרויקט עם חשבון חלקי
              </p>
            </div>
            {openTrack === 'boq' ? <ChevronDown size={20} color="var(--info)" /> : <ChevronLeft size={20} color="var(--text-muted)" />}
          </div>
          {openTrack === 'boq' && (
            <div style={{ padding: '0 24px 24px' }}>
              {renderSteps(boqSteps)}
            </div>
          )}
        </div>
      </div>

      {/* טיפים מהירים */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
          טיפים מהירים
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '12px' }}>
          {[
            { title: 'יומן עבודה', desc: 'שלח לינק למנהל העבודה דרך וואטסאפ — הוא ממלא מהטלפון, והנתונים נכנסים אוטומטית', color: 'var(--warning)' },
            { title: 'איפוס דמו', desc: 'כפתור "איפוס דמו" בדשבורד מחזיר את כל הנתונים להתחלה — אפשר לשחק בלי חשש', color: 'var(--info)' },
            { title: 'PDF להצעה', desc: 'בעורך ההצעה יש כפתור "PDF ללקוח" — מפיק מסמך מקצועי עם סיכום, תנאים ומקום לחתימה', color: 'var(--success)' },
            { title: 'התראות', desc: 'המערכת מתריעה אוטומטית: חריגות תקציב, קבלנים בלי חוזה, פרויקטים באיחור', color: 'var(--danger)' },
          ].map((tip, i) => (
            <div key={i} style={{
              padding: '14px', background: 'var(--dark)', borderRadius: '10px',
              borderRight: `3px solid ${tip.color}`,
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: tip.color, marginBottom: '6px' }}>{tip.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* קריאה לפעולה */}
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '15px' }}>
          מוכנים להתחיל?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/price-list" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            למחירון
          </Link>
          <Link to="/quotes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            הצעת מחיר חדשה
          </Link>
          <Link to="/boq/new" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            העלאת כתב כמויות
          </Link>
        </div>
      </div>
    </div>
  )
}
