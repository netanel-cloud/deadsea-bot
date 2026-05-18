# Dead Sea Rider — Floating Chat Widget

וידג'ט צ'אט צף להטמעה באתר deadsearider.com.

## איך מטמיעים? (2 שורות)

הוסיפו את שתי השורות הבאות לפני `</body>` בכל דף באתר:

```html
<script>
  window.DEADSEA_BOT_CONFIG = {
    apiUrl: 'https://your-bot-server.railway.app/api/chat'
  };
</script>
<script src="https://your-domain.com/deadsea-bot.js" defer></script>
```

זהו! הצ'אט יופיע ככפתור עגול בפינה השמאלית התחתונה.

## אופציות מתקדמות

```html
<script>
  window.DEADSEA_BOT_CONFIG = {
    apiUrl:       'https://your-bot-server.com/api/chat',  // חובה
    position:     'left',          // 'left' או 'right'
    primaryColor: '#0D7A8E',       // צבע ראשי
    accentColor:  '#D4631A',       // צבע ה-CTA
    waNumber:     '972543316613',  // ווטסאפ לפניות ישירות
    botName:      'עוזר תיירות ים המלח',
    welcomeMsg:   'שלום! במה אפשר לעזור?',
    quickReplies: [
      { text: 'ריידרים 🏍️', msg: 'מה כולל טיול ריידרים?' },
      // ...
    ]
  };
</script>
<script src="https://your-domain.com/deadsea-bot.js" defer></script>
```

## איך זה עובד טכנית?

```
לקוח באתר → לוחץ על הצ'אט → שולח הודעה
                    ↓
       deadsea-bot.js שולח POST ל-/api/chat
                    ↓
       השרת שלכם (Railway) → Claude AI
                    ↓
       תשובה חוזרת ומופיעה בצ'אט
```

## חיבור לשרת הקיים

ב-`server.js` הקיים, הוסיפו את התוכן של `SERVER_ENDPOINT.js`.

זה מוסיף endpoint חדש: `POST /api/chat`
שמשתמש באותו System Prompt שכבר יש לכם — אז הוא יודע את אותם דברים בדיוק.

## איפה לעלות את ה-JS?

3 אפשרויות:

1. **על השרת שלכם** — תיקיית `/public` או `/static`
2. **CDN ציבורי** (Cloudflare R2, Vercel Static, GitHub Pages) — חינם
3. **על הוורדפרס** — Upload ל-Media Library

## תאימות

✅ כל הדפדפנים המודרניים
✅ Mobile (מסכים קטנים → fullscreen)
✅ RTL מובנה
✅ נטען רק כשצריך (defer)
✅ לא מתערב ב-jQuery / CSS / אחר באתר
✅ פונט Heebo נטען אוטומטית
