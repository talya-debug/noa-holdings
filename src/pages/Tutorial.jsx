import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react'

// דף הדרכה - פשוט, יפה, ברור
export default function Tutorial() {
  const steps = [
    {
      number: '1',
      title: 'מחירון',
      subtitle: 'עץ המבנה של החברה',
      color: '#D4A843',
      link: '/price-list',
      linkText: 'פתח את המחירון',
      items: [
        'המחירון הוא הבסיס של הכל - כל הקטגוריות, החומרים, העבודות וקבלני המשנה שלך',
        'כל פריט מוגדר עם: שם, יחידת מידה, סוג (חומר / עבודה / קבלן משנה) ומחיר עלות',
        'הקטגוריות מייצגות את תחומי העבודה שלך: שלד, חשמל, אינסטלציה, ריצוף וכו\'',
        'אפשר להוסיף, לערוך ולמחוק פריטים בכל עת',
      ],
    },
    {
      number: '2',
      title: 'הצעת מחיר',
      subtitle: 'מה מציעים ללקוח',
      color: '#60a5fa',
      link: '/quotes',
      linkText: 'צור הצעת מחיר',
      items: [
        'פותחים הצעת מחיר חדשה - שם לקוח, כתובת ותאריך',
        'בוחרים פריטים מתוך המחירון ומגדירים כמות + מחיר ללקוח',
        'המערכת מחשבת אוטומטית: עלות, מכירה, רווח ואחוז רווח',
        'אבני דרך לתשלום נוצרות אוטומטית לפי הקטגוריות שנבחרו',
        'מפיקים PDF מקצועי ללקוח - עם פתיח, סיכום קטגורי, תנאים ודיסקליימרים',
      ],
    },
    {
      number: '3',
      title: 'אישור → פרויקט',
      subtitle: 'הלקוח אישר? הפרויקט נפתח אוטומטית',
      color: '#4ade80',
      items: [
        'לוחצים "אשר הצעה" → נוצר פרויקט חדש עם כל הנתונים',
        'כל פריט מההצעה הופך למשימה בפרויקט',
        'כל פריט חומר הופך לרכש שצריך להזמין',
        'אבני דרך הגבייה נוצרות עם הסכומים',
        'הכל אוטומטי - לא צריך להקליד כלום מחדש!',
      ],
    },
    {
      number: '4',
      title: 'ניהול הפרויקט',
      subtitle: 'כל הכלים במקום אחד',
      color: '#f59e0b',
      items: [
        'משימות - מעקב התקדמות לכל סוגי העבודה, שינוי סטטוסים',
        'רכש - מעקב הזמנות מספקים, כמויות ומחירים בפועל',
        'יומני עבודה - מנהל העבודה ממלא מהטלפון. עלות יומית לפי קטגוריה',
        'גבייה - מעקב אבני דרך, סטטוס תשלומים, התראות',
      ],
    },
    {
      number: '5',
      title: 'תכנון מול ביצוע',
      subtitle: 'הכסף הגדול - לדעת בזמן אמת אם אתה מרוויח',
      color: '#f87171',
      items: [
        'סקירה כספית מראה לכל קטגוריה: כמה תכננת לשלם ← כמה שילמת בפועל',
        'חומרים: תקציב מההצעה מול הזמנות בפועל',
        'עבודה: ימי עבודה מתוכננים מול דיווחים ביומנים',
        'קבלני משנה: סכום הסכם מול תשלומים בפועל',
        'אם עברת תקציב בקטגוריה כלשהי - תראה אדום מיד!',
      ],
    },
  ]

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{
        textAlign: 'center', padding: '40px 20px', marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--gold-border)',
      }}>
        <BookOpen size={40} color="var(--gold)" style={{ marginBottom: '12px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>
          איך עובדים עם המערכת?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
          5 שלבים פשוטים - מהמחירון ועד מעקב רווח בזמן אמת
        </p>
      </div>

      {/* שלבים */}
      {steps.map((step, idx) => (
        <div key={idx} className="card" style={{
          marginBottom: '16px', position: 'relative', overflow: 'hidden',
          borderRight: `4px solid ${step.color}`,
        }}>
          {/* מספר שלב */}
          <div style={{
            position: 'absolute', top: '16px', left: '16px', width: '36px', height: '36px',
            borderRadius: '50%', background: step.color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '16px',
          }}>
            {step.number}
          </div>

          <div style={{ paddingLeft: '60px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px', color: step.color }}>
              {step.title}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {step.subtitle}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {step.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle size={16} color={step.color} style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>

            {step.link && (
              <Link to={step.link} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '16px', padding: '8px 16px', borderRadius: '8px',
                background: step.color + '18', color: step.color,
                textDecoration: 'none', fontWeight: 600, fontSize: '13px',
              }}>
                {step.linkText} <ArrowLeft size={14} />
              </Link>
            )}
          </div>

          {/* חץ מחבר */}
          {idx < steps.length - 1 && (
            <div style={{
              position: 'absolute', bottom: '-16px', right: '50%', transform: 'translateX(50%)',
              width: '2px', height: '16px', background: 'var(--dark-border)', zIndex: 1,
            }} />
          )}
        </div>
      ))}

      {/* קריאה לפעולה */}
      <div style={{
        textAlign: 'center', padding: '32px', marginTop: '8px',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '15px' }}>
          מוכנים? מתחילים מהמחירון ובונים את הצעת המחיר הראשונה
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/price-list" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            למחירון
          </Link>
          <Link to="/quotes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            להצעות מחיר
          </Link>
        </div>
      </div>
    </div>
  )
}
