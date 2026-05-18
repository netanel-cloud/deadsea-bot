/**
 * Dead Sea Rider — Floating Chat Widget
 * תיירות ים המלח — וידג'ט צ'אט צף
 *
 * שימוש (באתר שלכם):
 *   <script src="https://your-domain.com/deadsea-bot.js" defer></script>
 *
 * הגדרות (אופציונלי, לפני טעינת הסקריפט):
 *   <script>
 *     window.DEADSEA_BOT_CONFIG = {
 *       apiUrl: 'https://your-bot-server.com/chat',  // ה-API endpoint של השרת
 *       position: 'left',   // 'left' או 'right' (ברירת מחדל: left ל-RTL)
 *       primaryColor: '#0D7A8E',
 *       waNumber: '972543316613'
 *     };
 *   </script>
 */
(function() {
  'use strict';

  // ── הגדרות ברירת מחדל ──
  const config = Object.assign({
    apiUrl:       '/api/chat',
    position:     'left',
    primaryColor: '#0D7A8E',
    accentColor:  '#D4631A',
    waNumber:     '972543316613',
    botName:      'עוזר תיירות ים המלח',
    welcomeMsg:   'שלום! 👋 אני העוזר החכם של תיירות ים המלח.<br>אני יכול לספר על ריידרים, עוגות מלח, אסאדו, לינה ועוד. שאלו אותי כל דבר!',
    quickReplies: [
      { text: 'ריידרים 🏍️',     msg: 'מה כולל טיול ריידרים?' },
      { text: 'עוגות מלח 🧂',  msg: 'ספר לי על עוגות המלח' },
      { text: 'אסאדו 🥩',      msg: 'מה יש לאכול אצלכם?' },
      { text: 'לינה 🌙',        msg: 'יש לינה לזוגות?' },
      { text: 'גיבוש 💪',       msg: 'אני רוצה לארגן יום גיבוש' },
      { text: 'משפחות 👨‍👩‍👧', msg: 'מה מתאים למשפחה עם ילדים?' },
    ],
  }, window.DEADSEA_BOT_CONFIG || {});

  // ── מניעת טעינה כפולה ──
  if (window.__deadseaBotLoaded) return;
  window.__deadseaBotLoaded = true;

  // ── CSS ──
  const css = `
    #ds-bot-launcher {
      position: fixed; bottom: 24px; ${config.position}: 24px;
      width: 64px; height: 64px; border-radius: 50%;
      background: ${config.primaryColor};
      color: #fff; border: none; cursor: pointer;
      box-shadow: 0 6px 24px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      z-index: 999998; transition: all 0.2s; font-family: 'Heebo', Arial, sans-serif;
    }
    #ds-bot-launcher:hover { transform: scale(1.05); box-shadow: 0 8px 32px rgba(0,0,0,0.24); }
    #ds-bot-launcher svg { width: 30px; height: 30px; }
    #ds-bot-launcher.open { transform: rotate(180deg); }
    #ds-bot-pulse {
      position: absolute; inset: -4px; border-radius: 50%;
      border: 2px solid ${config.primaryColor};
      animation: dsBotPulse 2s ease-out infinite; pointer-events: none;
    }
    @keyframes dsBotPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
    #ds-bot-badge {
      position: absolute; top: 0; right: 0;
      background: ${config.accentColor}; color: #fff;
      width: 18px; height: 18px; border-radius: 50%;
      font-size: 11px; font-weight: 700; display: flex;
      align-items: center; justify-content: center;
      border: 2px solid #fff;
    }

    #ds-bot-panel {
      position: fixed; bottom: 104px; ${config.position}: 24px;
      width: 380px; max-width: calc(100vw - 32px);
      height: 580px; max-height: calc(100vh - 140px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.20);
      display: none; flex-direction: column;
      overflow: hidden; z-index: 999999;
      font-family: 'Heebo', Arial, sans-serif;
      direction: rtl;
      animation: dsBotSlideUp 0.25s ease-out;
    }
    #ds-bot-panel.open { display: flex; }
    @keyframes dsBotSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

    #ds-bot-panel * { box-sizing: border-box; }
    #ds-bot-panel .ds-header {
      background: linear-gradient(135deg, #095E6E, ${config.primaryColor});
      padding: 16px 18px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #ds-bot-panel .ds-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    #ds-bot-panel .ds-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
    #ds-bot-panel .ds-status { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 2px; }
    #ds-bot-panel .ds-status::before { content: '●'; color: #4ade80; margin-left: 4px; font-size: 9px; vertical-align: middle; }
    #ds-bot-panel .ds-close {
      margin-right: auto; background: rgba(255,255,255,0.15); color: #fff;
      border: none; width: 30px; height: 30px; border-radius: 50%;
      cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; line-height: 1;
    }
    #ds-bot-panel .ds-close:hover { background: rgba(255,255,255,0.25); }

    #ds-bot-panel .ds-msgs {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      display: flex; flex-direction: column; gap: 12px;
      background: #f5f0e8;
    }
    #ds-bot-panel .ds-msgs::-webkit-scrollbar { width: 4px; }
    #ds-bot-panel .ds-msgs::-webkit-scrollbar-thumb { background: #C4A47A; border-radius: 2px; }

    #ds-bot-panel .ds-row { display: flex; gap: 8px; }
    #ds-bot-panel .ds-row.user { flex-direction: row-reverse; }
    #ds-bot-panel .ds-icon {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; margin-top: 2px;
    }
    #ds-bot-panel .ds-icon.bot  { background: ${config.primaryColor}; }
    #ds-bot-panel .ds-icon.user { background: ${config.accentColor}; }
    #ds-bot-panel .ds-bubble {
      max-width: 78%; padding: 10px 14px; border-radius: 14px;
      font-size: 14px; line-height: 1.6; word-wrap: break-word;
      text-align: right; direction: rtl; unicode-bidi: plaintext;
    }
    #ds-bot-panel .ds-bubble.bot  { background: #fff; color: #2C1E14; border-radius: 14px 14px 14px 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    #ds-bot-panel .ds-bubble.user { background: ${config.primaryColor}; color: #fff; border-radius: 14px 14px 3px 14px; }
    #ds-bot-panel .ds-bubble a { color: ${config.accentColor}; font-weight: 600; text-decoration: underline; }
    #ds-bot-panel .ds-book-cta {
      display: inline-flex; align-items: center; gap: 6px;
      background: ${config.accentColor}; color: #fff !important;
      text-decoration: none !important; font-weight: 700 !important;
      padding: 8px 16px; border-radius: 8px; margin-top: 8px; font-size: 13px;
    }
    #ds-bot-panel .ds-wa-cta {
      display: inline-flex; align-items: center; gap: 6px;
      background: #25D366; color: #fff !important;
      text-decoration: none !important; font-weight: 700 !important;
      padding: 6px 12px; border-radius: 6px; font-size: 13px;
    }

    #ds-bot-panel .ds-typing {
      background: #fff; border-radius: 14px 14px 14px 3px;
      padding: 12px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      display: flex; gap: 5px; align-items: center; width: fit-content;
    }
    #ds-bot-panel .ds-typing span {
      width: 7px; height: 7px; background: #A8845A; border-radius: 50%;
      animation: dsTypingBounce 1.2s infinite;
    }
    #ds-bot-panel .ds-typing span:nth-child(2) { animation-delay: 0.2s; }
    #ds-bot-panel .ds-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes dsTypingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    #ds-bot-panel .ds-quick {
      padding: 10px 14px 6px; display: flex; gap: 6px; flex-wrap: wrap;
      background: #f5f0e8; flex-shrink: 0;
    }
    #ds-bot-panel .ds-qbtn {
      background: #fff; border: 1.5px solid ${config.primaryColor};
      color: ${config.primaryColor}; font-family: inherit;
      font-size: 12px; font-weight: 600; padding: 6px 12px;
      border-radius: 20px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    #ds-bot-panel .ds-qbtn:hover { background: ${config.primaryColor}; color: #fff; }

    #ds-bot-panel .ds-input-bar {
      padding: 12px 14px; background: #fff;
      border-top: 1px solid #EDE4D4;
      display: flex; gap: 8px; flex-shrink: 0;
    }
    #ds-bot-panel .ds-input {
      flex: 1; font-family: inherit; font-size: 14px;
      border: 1.5px solid #DCCBB0; border-radius: 22px;
      padding: 9px 16px; outline: none; color: #2C1E14; background: #FAF7F3;
    }
    #ds-bot-panel .ds-input:focus { border-color: ${config.primaryColor}; }
    #ds-bot-panel .ds-input:disabled { opacity: 0.5; }
    #ds-bot-panel .ds-send {
      background: ${config.primaryColor}; color: #fff; border: none;
      border-radius: 50%; width: 40px; height: 40px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #ds-bot-panel .ds-send:hover { background: #1FA5BD; }
    #ds-bot-panel .ds-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #ds-bot-panel .ds-note {
      background: #FAF7F3; padding: 6px 14px;
      font-size: 11px; color: #A8845A; text-align: center; flex-shrink: 0;
      border-top: 1px solid #EDE4D4;
    }

    @media (max-width: 480px) {
      #ds-bot-panel {
        bottom: 0; ${config.position}: 0; right: 0; left: 0;
        width: 100%; max-width: 100%; height: 100vh; max-height: 100vh;
        border-radius: 0;
      }
      #ds-bot-launcher { bottom: 16px; ${config.position}: 16px; width: 56px; height: 56px; }
    }
  `;

  // ── HTML של ה-widget ──
  const html = `
    <button id="ds-bot-launcher" aria-label="פתח צ'אט">
      <span id="ds-bot-pulse"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <div id="ds-bot-panel" role="dialog" aria-label="צ'אט תיירות ים המלח">
      <div class="ds-header">
        <div class="ds-avatar">🌊</div>
        <div>
          <div class="ds-name">${escapeHtml(config.botName)}</div>
          <div class="ds-status">מחובר עכשיו</div>
        </div>
        <button class="ds-close" aria-label="סגור">×</button>
      </div>
      <div class="ds-msgs" id="ds-msgs"></div>
      <div class="ds-quick" id="ds-quick">
        ${config.quickReplies.map(q => `<button class="ds-qbtn" data-msg="${escapeHtml(q.msg)}">${escapeHtml(q.text)}</button>`).join('')}
      </div>
      <div class="ds-input-bar">
        <input class="ds-input" id="ds-inp" placeholder="שאל אותי כל דבר..." dir="rtl">
        <button class="ds-send" id="ds-send" aria-label="שלח">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
      </div>
      <div class="ds-note">תיירות ים המלח · הזמנות דרך deadsea.fun</div>
    </div>
  `;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ── הוספת ה-CSS וה-HTML ל-DOM ──
  function init() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap';
    document.head.appendChild(fontLink);

    const container = document.createElement('div');
    container.id = 'ds-bot-container';
    container.innerHTML = html;
    document.body.appendChild(container);

    setupHandlers();
  }

  // ── לוגיקה ──
  const history = [];
  let panelOpened = false;

  function setupHandlers() {
    const launcher = document.getElementById('ds-bot-launcher');
    const panel    = document.getElementById('ds-bot-panel');
    const closeBtn = panel.querySelector('.ds-close');
    const sendBtn  = document.getElementById('ds-send');
    const input    = document.getElementById('ds-inp');
    const quickBox = document.getElementById('ds-quick');

    launcher.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', closePanel);
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    quickBox.addEventListener('click', e => {
      const btn = e.target.closest('.ds-qbtn');
      if (!btn) return;
      const msg = btn.getAttribute('data-msg');
      quickBox.style.display = 'none';
      sendMessageText(msg);
    });
  }

  function togglePanel() {
    const panel    = document.getElementById('ds-bot-panel');
    const launcher = document.getElementById('ds-bot-launcher');
    const isOpen   = panel.classList.toggle('open');
    launcher.classList.toggle('open', isOpen);
    launcher.setAttribute('aria-expanded', isOpen);

    if (isOpen && !panelOpened) {
      panelOpened = true;
      addBotMsg(config.welcomeMsg);
      // Remove the pulse animation once opened
      const pulse = document.getElementById('ds-bot-pulse');
      if (pulse) pulse.remove();
    }
    if (isOpen) {
      setTimeout(() => document.getElementById('ds-inp').focus(), 100);
    }
  }

  function closePanel() {
    document.getElementById('ds-bot-panel').classList.remove('open');
    document.getElementById('ds-bot-launcher').classList.remove('open');
  }

  function addBotMsg(html) {
    const msgs = document.getElementById('ds-msgs');
    const row = document.createElement('div');
    row.className = 'ds-row';
    row.innerHTML = `<div class="ds-icon bot">🌊</div><div class="ds-bubble bot">${html}</div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMsg(text) {
    const msgs = document.getElementById('ds-msgs');
    const row = document.createElement('div');
    row.className = 'ds-row user';
    row.innerHTML = `<div class="ds-icon user">👤</div><div class="ds-bubble user">${escapeHtml(text)}</div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('ds-msgs');
    const row = document.createElement('div');
    row.className = 'ds-row'; row.id = 'ds-typing';
    row.innerHTML = `<div class="ds-icon bot">🌊</div><div class="ds-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('ds-typing');
    if (t) t.remove();
  }

  function formatResponse(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/https:\/\/deadsea\.fun\/?/g,
      `<br><a class="ds-book-cta" href="https://deadsea.fun/" target="_blank">📅 הזמינו ב-deadsea.fun</a>`);
    text = text.replace(/054-?331-?6613/g,
      `<a class="ds-wa-cta" href="https://wa.me/${config.waNumber}" target="_blank">💬 054-331-6613</a>`);
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  async function sendMessage() {
    const input = document.getElementById('ds-inp');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    await sendMessageText(text);
  }

  async function sendMessageText(text) {
    addUserMsg(text);
    history.push({ role: 'user', content: text });

    const input   = document.getElementById('ds-inp');
    const sendBtn = document.getElementById('ds-send');
    input.disabled = true; sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error('Server error: ' + res.status);
      const data = await res.json();
      const reply = data.reply || data.text || 'מצטער, התשובה ריקה.';

      removeTyping();
      history.push({ role: 'assistant', content: reply });
      addBotMsg(formatResponse(reply));

    } catch (err) {
      console.error('[Dead Sea Bot] error:', err);
      removeTyping();
      addBotMsg(`מצטער, הייתה בעיה טכנית רגעית 😔<br><br>אפשר לפנות אלינו ישירות:<br><a class="ds-wa-cta" href="https://wa.me/${config.waNumber}" target="_blank">💬 054-331-6613 בווטסאפ</a>`);
    } finally {
      input.disabled = false; sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── הפעלה ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
