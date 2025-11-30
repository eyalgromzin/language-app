import { useMemo } from 'react';

type ThemeColors = {
  bg: string;
  text: string;
};

export function useInjectedJavascript(themeColors: ThemeColors): string {
  return useMemo(() => {
    const bg = themeColors.bg;
    const text = themeColors.text;
    // This script runs inside the WebView. It attaches click handlers to the
    // EPUB iframes and posts back the tapped word.
    return `(() => {
      // Forward messages from iframes to React Native if needed
      try {
        window.addEventListener('message', function(evt) {
          try {
            const data = evt && evt.data;
            if (data && data.__WORD_TAP__ && data.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: data.word }));
              }
            }
          } catch (e) {}
        }, false);
      } catch (e) {}

      function ensureHighlightStyle(doc) {
        try {
          if (!doc || !doc.head) return;
          if (doc.getElementById('ll-highlight-style')) return;
          const style = doc.createElement('style');
          style.id = 'll-highlight-style';
          style.type = 'text/css';
          style.appendChild(doc.createTextNode('.ll-selected-word { background: rgba(255, 235, 59, 0.9); border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); }'));
          doc.head.appendChild(style);
        } catch (e) {}
      }

      function ensureThemeStyle(doc) {
        try {
          if (!doc || !doc.head) return;
          let style = doc.getElementById('ll-theme-style');
          if (!style) {
            style = doc.createElement('style');
            style.id = 'll-theme-style';
            style.type = 'text/css';
            doc.head.appendChild(style);
          }
          style.textContent = 'html, body { background: ${bg} !important; color: ${text} !important; } body * { color: inherit; }';
        } catch (e) {}
      }

      function clearHighlights(doc) {
        try {
          const nodes = Array.from(doc.querySelectorAll('.ll-selected-word'));
          nodes.forEach((node) => {
            try {
              const parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
            } catch (e) {}
          });
        } catch (e) {}
      }

      function computeSentenceFromText(text, startIndex, endIndex) {
        try {
          var punct = /[\.!?。！？]/;
          var s = startIndex; while (s > 0 && !punct.test(text[s - 1])) s--;
          var e = endIndex; while (e < text.length && !punct.test(text[e])) e++;
          return (text.slice(s, Math.min(e + 1, text.length)) || '').replace(/\s+/g, ' ').trim();
        } catch (e) { return ''; }
      }

      function highlightWordAtPoint(doc, x, y) {
        try {
          const range = (doc.caretRangeFromPoint && doc.caretRangeFromPoint(x, y))
            || (doc.caretPositionFromPoint && (function(){
                  const pos = doc.caretPositionFromPoint(x, y);
                  if (!pos) return null;
                  const r = doc.createRange();
                  r.setStart(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                  r.setEnd(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                  return r;
               })());
          if (!range) return null;
          let node = range.startContainer;
          if (!node) return null;
          if (node.nodeType !== 3) {
            // Find a text node beneath
            (function findTextNode(n){
              if (!n) return null;
              if (n.nodeType === 3) { node = n; return n; }
              for (let i = 0; i < n.childNodes.length; i++) {
                const res = findTextNode(n.childNodes[i]);
                if (res) return res;
              }
              return null;
            })(node);
            if (!node || node.nodeType !== 3) return null;
          }
          const text = node.textContent || '';
          let index = range.startOffset;
          if (index < 0) index = 0;
          if (index > text.length) index = text.length;
          const isWordChar = (ch) => /[A-Za-z0-9_''\-]/.test(ch);
          let start = index;
          while (start > 0 && isWordChar(text[start - 1])) start--;
          let end = index;
          while (end < text.length && isWordChar(text[end])) end++;
          const word = (text.slice(start, end) || '').trim();
          if (!word) return null;
          // Perform highlight
          ensureHighlightStyle(doc);
          clearHighlights(doc);
          const highlightRange = doc.createRange();
          highlightRange.setStart(node, start);
          highlightRange.setEnd(node, end);
          const span = doc.createElement('span');
          span.className = 'll-selected-word';
          try {
            highlightRange.surroundContents(span);
          } catch (e) {
            // Fallback: insert nodes manually
            const frag = highlightRange.extractContents();
            span.appendChild(frag);
            highlightRange.insertNode(span);
          }
          var sentence = computeSentenceFromText(text, start, end);
          if (!sentence) {
            try {
              var el = (span.parentElement || null);
              while (el && el.innerText && el.innerText.trim().length < 1) el = el.parentElement;
              var blockText = el && el.innerText ? el.innerText : text;
              var idx = blockText.toLowerCase().indexOf(word.toLowerCase());
              if (idx >= 0) sentence = computeSentenceFromText(blockText, idx, idx + word.length);
            } catch (e2) { sentence = ''; }
          }
          return { word: word, sentence: sentence };
        } catch (e) { return null; }
      }

      function extractWordAtPoint(doc, x, y) {
        const range = (doc.caretRangeFromPoint && doc.caretRangeFromPoint(x, y))
          || (doc.caretPositionFromPoint && (function(){
                const pos = doc.caretPositionFromPoint(x, y);
                if (!pos) return null;
                const r = doc.createRange();
                r.setStart(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                r.setEnd(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                return r;
             })());
        if (!range) return null;
        let node = range.startContainer;
        if (!node) return null;
        if (node.nodeType !== 3 /* TEXT_NODE */) {
          // If clicked on an element, try to find text node within
          node = (function findTextNode(n){
            if (!n) return null;
            if (n.nodeType === 3) return n;
            for (let i = 0; i < n.childNodes.length; i++) {
              const res = findTextNode(n.childNodes[i]);
              if (res) return res;
            }
            return null;
          })(node);
          if (!node) return null;
        }
        const text = node.textContent || '';
        let index = range.startOffset;
        if (index < 0) index = 0;
        if (index > text.length) index = text.length;
        // Simpler regex for broader WebView compatibility
        const isWordChar = (ch) => /[A-Za-z0-9_''\-]/.test(ch);
        let start = index;
        while (start > 0 && isWordChar(text[start - 1])) start--;
        let end = index;
        while (end < text.length && isWordChar(text[end])) end++;
        const word = text.slice(start, end).trim();
        if (!word) return null;
        var sentence = computeSentenceFromText(text, start, end);
        return { word: word, sentence: sentence };
      }

      function attachToDocument(doc) {
        if (!doc || !doc.body || doc.__wordTapAttached) return;
        doc.__wordTapAttached = true;
        ensureHighlightStyle(doc);
        ensureThemeStyle(doc);
        // Notify React Native on any interaction start to allow keyboard dismissal
        try {
          const sendTouchStart = function(){
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'readerTouchStart' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __READER_TOUCH_START__: true }, '*');
              }
            } catch (e) {}
          };
          doc.body.addEventListener('mousedown', sendTouchStart, true);
          doc.body.addEventListener('touchstart', sendTouchStart, true);
        } catch (e) {}
        const handler = (ev) => {
          try {
            const res = highlightWordAtPoint(doc, ev.clientX, ev.clientY) || extractWordAtPoint(doc, ev.clientX, ev.clientY);
            if (res && res.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word: res.word, sentence: res.sentence || '' }, '*');
              }
            }
          } catch (e) {}
        };
        doc.body.addEventListener('click', handler, true);
        doc.body.addEventListener('touchend', function(e){
          try {
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;
            const res = highlightWordAtPoint(doc, t.clientX, t.clientY) || extractWordAtPoint(doc, t.clientX, t.clientY);
            if (res && res.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word: res.word, sentence: res.sentence || '' }, '*');
              }
            }
          } catch (e) {}
        }, true);
      }

      function scanAndAttach() {
        try {
          // Try epub.js rendition if available
          if (window.rendition && typeof window.rendition.getContents === 'function') {
            const contents = window.rendition.getContents();
            if (Array.isArray(contents)) {
              contents.forEach((c) => {
                try { attachToDocument(c.document); ensureThemeStyle(c.document); } catch (e) {}
              });
            }
          }
          // Fallback: inspect iframes
          const iframes = Array.from(document.querySelectorAll('iframe'));
          iframes.forEach((f) => {
            try { attachToDocument(f.contentDocument); ensureThemeStyle(f.contentDocument); } catch (e) {}
          });
        } catch (e) {}
      }

      // Hook on common rendition events
      try {
        if (window.rendition && typeof window.rendition.on === 'function') {
          window.rendition.on('rendered', scanAndAttach);
          window.rendition.on('relocated', scanAndAttach);
        }
      } catch (e) {}

      // Periodic scan as safety net
      setInterval(scanAndAttach, 1000);
      // Initial attempt
      scanAndAttach();
    })();`;
  }, [themeColors.bg, themeColors.text]);
}
