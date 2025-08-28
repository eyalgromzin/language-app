export const baseInjection = `
  (function() {
    if (window.__wordClickInstalled_v8) return;
    window.__wordClickInstalled_v8 = true;
    var lastTouch = { x: 0, y: 0 };
    var lastPostedWord = '';
    var lastPostedAt = 0;
    var LONG_PRESS_MS = 450;
    var pressTimer = null;
    var pressing = false;
    var pressAnchor = null;
    var suppressNextClick = false;

    function notifyPointerDown() {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pointerdown' }));
        }
      } catch (e) {}
    }

    function getRangeFromPoint(x, y) {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
      if (document.caretPositionFromPoint) {
        var pos = document.caretPositionFromPoint(x, y);
        if (!pos) return null;
        var r = document.createRange();
        try { r.setStart(pos.offsetNode, pos.offset); r.collapse(true); } catch (e) {}
        return r;
      }
      return null;
    }
    function isWordChar(ch) { return /[\\p{L}\\p{N}\\u00C0-\\u024F'\-]/u.test(ch); }
    function selectWordAtPoint(x, y) {
      var range = getRangeFromPoint(x, y);
      if (!range || !range.startContainer) return null;
      var node = range.startContainer;
      if (!node || node.nodeType !== Node.TEXT_NODE) return null;
      var text = node.textContent || '';
      var offset = Math.min(range.startOffset || 0, text.length);
      var s = offset; while (s > 0 && isWordChar(text[s - 1])) s--;
      var e = offset; while (e < text.length && isWordChar(text[e])) e++;
      var word = (text.slice(s, e) || '').trim();
      if (!word) return null;
      try {
        var sel = window.getSelection && window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          var wordRange = document.createRange();
          wordRange.setStart(node, s);
          wordRange.setEnd(node, e);
          sel.addRange(wordRange);
        }
      } catch (err) {}
      // Try to build a sentence around the word within the same text node
      var sentence = '';
      try {
        var punct = /[\.!?。！？]/;
        var ss = s; while (ss > 0 && !punct.test(text[ss - 1])) ss--;
        var ee = e; while (ee < text.length && !punct.test(text[ee])) ee++;
        sentence = (text.slice(ss, Math.min(ee + 1, text.length)) || '').replace(/\s+/g, ' ').trim();
      } catch (e2) { sentence = ''; }
      if (!sentence) {
        try {
          // Fallback: use nearest block's innerText
          var el = (node.parentElement || null);
          while (el && el.innerText && el.innerText.trim().length < 1) el = el.parentElement;
          var blockText = el && el.innerText ? el.innerText : text;
          // Find a sentence containing the word (first occurrence)
          var idx = blockText.toLowerCase().indexOf(word.toLowerCase());
          if (idx >= 0) {
            var start = idx; while (start > 0 && !punct.test(blockText[start - 1])) start--;
            var end = idx + word.length; while (end < blockText.length && !punct.test(blockText[end])) end++;
            sentence = (blockText.slice(start, Math.min(end + 1, blockText.length)) || '').replace(/\s+/g, ' ').trim();
          }
        } catch (e3) { sentence = ''; }
      }
      return { word: word, sentence: sentence };
    }
    function postWord(payload, source) {
      try {
        if (!payload || !payload.word) return;
        var now = Date.now();
        if (payload.word === lastPostedWord && (now - lastPostedAt) < 250) return;
        lastPostedWord = payload.word; lastPostedAt = now;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: source, word: payload.word, sentence: payload.sentence || '' }));
        }
      } catch (e) {}
    }

    function onTouchStart(e) {
      try {
        notifyPointerDown();
        pressing = true;
        var t = e.touches && e.touches[0];
        if (t) { lastTouch.x = t.clientX; lastTouch.y = t.clientY; }
        pressAnchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        suppressNextClick = false;
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(function() {
          if (!pressing) return;
          if (pressAnchor) {
            var res = selectWordAtPoint(lastTouch.x, lastTouch.y);
            if (!res) {
              var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
              if (selTxt && selTxt.split(/\s+/).length === 1) res = { word: selTxt, sentence: '' };
            }
            if (res && res.word) {
              suppressNextClick = true; // prevent navigation after long-press
              postWord(res, 'longpress');
            }
          }
        }, LONG_PRESS_MS);
      } catch (err) {}
    }

    function onTouchEnd() {
      try {
        pressing = false;
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      } catch (err) {}
    }

    function onMouseDown(e) {
      try { notifyPointerDown(); } catch (err) {}
    }

    function onClick(e) {
      try {
        if (suppressNextClick) {
          e.preventDefault();
          e.stopPropagation();
          suppressNextClick = false;
          return;
        }
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) {
          var res = selectWordAtPoint(e.clientX || lastTouch.x, e.clientY || lastTouch.y);
          if (!res) {
            var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
            if (selTxt && selTxt.split(/\\s+/).length === 1) res = { word: selTxt, sentence: '' };
          }
          if (res && res.word) {
            e.preventDefault();
            e.stopPropagation();
            postWord(res, 'wordClick');
            return;
          }
        }
        // Notify RN that a link was clicked so it can hint long-press UX
        if (a && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'linkClick', href: a.href || '' }));
          } catch (err) {}
        }
        // Otherwise, allow default behavior so links open normally
      } catch (err) {}
    }

    document.addEventListener('touchstart', onTouchStart, true);
    document.addEventListener('touchend', onTouchEnd, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
  })();
  true;
`;

export const imageScrapeInjection = `
  (function() {
    var MAX_TIME = 12000;
    var INTERVAL_MS = 250;
    var start = Date.now();
    var pollTimer = null;
    var scrollTimer = null;

    function normalizeUrl(u) {
      if (!u) return null;
      var url = ('' + u).trim();
      if (!url) return null;
      if (url.indexOf('//') === 0) return 'https:' + url;
      return url;
    }

    function collectUrls() {
      var urls = [];
      try {
        var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
        for (var i = 0; i < imgs.length; i++) {
          var img = imgs[i];
          try {
            var candidate = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
            var n = normalizeUrl(candidate);
            if (n && urls.indexOf(n) === -1) urls.push(n);
          } catch (e) {}
        }
      } catch (e) {}
      return urls;
    }

    function done() {
      try {
        var urls = collectUrls().slice(0, 12);
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'imageScrapeUrls', urls: urls })
        );
      } catch(e) {}
      if (pollTimer) clearInterval(pollTimer);
      if (scrollTimer) clearInterval(scrollTimer);
    }

    function step() {
      if (collectUrls().length >= 6) return done();
      if (Date.now() - start > MAX_TIME) return done();
    }

    var y = 0;
    scrollTimer = setInterval(function(){
      try {
        y += 800;
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
      } catch(e) {}
    }, 200);

    pollTimer = setInterval(step, INTERVAL_MS);
    step();
  })();
  true;
`;
