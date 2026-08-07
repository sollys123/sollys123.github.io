(() => {
  const AUDIO_FILES = {
    'あ':'Ja-A.oga','い':'Japanese I.ogg','う':'Japanese U.ogg','え':'Ja-E.oga','お':'Japanese O.ogg',
    'か':'Ja-Ka.oga','き':'Japanese ki.ogg','く':'Japanese ku.ogg','け':'Japanese ke.ogg','こ':'Japanese ko.ogg',
    'さ':'Japanese sa.ogg','し':'Japanese shi.ogg','す':'Japanese su.ogg','せ':'Japanese se.ogg','そ':'Ja-So.oga',
    'た':'Japanese ta.ogg','ち':'Japanese ti.ogg','つ':'Japanese tsu.ogg','て':'Japanese te.ogg','と':'Japanese to.ogg',
    'な':'Japanese na.ogg','に':'Japanese ni.ogg','ぬ':'Japanese nu.ogg','ね':'Japanese ne.ogg','の':'Japanese no.ogg',
    'は':'Japanese ha.ogg','ひ':'Japanese hi.ogg','ふ':'Japanese hu.ogg','へ':'Japanese he.ogg','ほ':'Japanese ho.ogg',
    'ま':'Japanese ma.ogg','み':'Japanese mi.ogg','む':'Japanese mu.ogg','め':'Japanese me.ogg','も':'Japanese mo.ogg',
    'や':'Japanese ya.ogg','ゆ':'Japanese yu.ogg','よ':'Japanese yo.ogg',
    'ら':'Japanese ra.ogg','り':'Japanese ri.ogg','る':'Japanese ru.ogg','れ':'Japanese re.ogg','ろ':'Japanese ro.ogg',
    'わ':'Japanese wa.ogg','を':'Japanese wo.ogg','ん':'Japanese N.ogg',
    'が':'Japanese ga.ogg','ぎ':'Japanese gi.ogg','ぐ':'Japanese gu.ogg','げ':'Japanese ge.ogg','ご':'Japanese go.ogg',
    'ざ':'Japanese za.ogg','じ':'Japanese zi.ogg','ず':'Japanese zu.ogg','ぜ':'Japanese ze.ogg','ぞ':'Japanese zo.ogg',
    'だ':'Japanese da.ogg','ぢ':'Japanese di.ogg','づ':'Japanese du.ogg','で':'Japanese de.ogg','ど':'Japanese do.ogg',
    'ば':'Japanese ba.ogg','び':'Japanese bi.ogg','ぶ':'Japanese bu.ogg','べ':'Japanese be.ogg','ぼ':'Japanese bo.ogg',
    'ぱ':'Japanese pa.ogg','ぴ':'Japanese pi.ogg','ぷ':'Japanese pu.ogg','ぺ':'Japanese pe.ogg','ぽ':'Japanese po.ogg'
  };

  let activeAudio = null;
  let playSerial = 0;

  function line(text, cls='answerline') {
    const el = document.getElementById('answerLine');
    if (!el) return;
    el.textContent = text;
    el.className = cls;
  }

  function setButtonPlaying(on) {
    const btn = document.getElementById('playBtn');
    if (btn) btn.classList.toggle('playing', !!on);
  }

  function commonsUrl(filename) {
    return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + encodeURIComponent(filename);
  }

  function systemTTS(text, serial) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window) || serial !== playSerial) return reject(new Error('tts unavailable'));
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        u.rate = 0.72;
        u.pitch = 1;
        const voices = speechSynthesis.getVoices();
        const ja = voices.find(v => /^ja(-|_)/i.test(v.lang)) || voices.find(v => /^ja/i.test(v.lang));
        if (ja) u.voice = ja;
        let done = false;
        const finish = ok => {
          if (done) return;
          done = true;
          ok ? resolve() : reject(new Error('tts failed'));
        };
        u.onstart = () => { if (serial === playSerial) line(''); };
        u.onend = () => finish(true);
        u.onerror = () => finish(false);
        speechSynthesis.speak(u);
        setTimeout(() => finish(false), 4500);
      } catch (e) { reject(e); }
    });
  }

  async function playFixedKana(text, serial) {
    const filename = AUDIO_FILES[text];
    if (!filename) throw new Error('no fixed recording');

    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.src = ''; } catch (_) {}
      activeAudio = null;
    }

    const a = new Audio();
    activeAudio = a;
    a.preload = 'auto';
    a.src = commonsUrl(filename);

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = err => {
        if (settled) return;
        settled = true;
        reject(err || new Error('audio failed'));
      };
      a.onerror = () => fail(new Error('recording unavailable'));
      a.onended = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      a.onplaying = () => {
        if (serial === playSerial) line('');
      };
      try {
        const p = a.play();
        if (p && typeof p.catch === 'function') p.catch(fail);
      } catch (e) { fail(e); }
      setTimeout(() => fail(new Error('audio timeout')), 8000);
    });
  }

  window.speak = async function(text) {
    const serial = ++playSerial;
    setButtonPlaying(true);
    line('正在播放…');

    try {
      await playFixedKana(text, serial);
      if (serial === playSerial) {
        setButtonPlaying(false);
        line('');
      }
      return;
    } catch (err) {
      if (serial !== playSerial) return;
      // Autoplay is commonly blocked on mobile. Do not turn that into a fake audio error.
      if (err && (err.name === 'NotAllowedError' || /notallowed|user gesture|interact/i.test(String(err.message)))) {
        setButtonPlaying(false);
        line('点一下播放按钮即可听音');
        return;
      }
    }

    try {
      await systemTTS(text, serial);
      if (serial === playSerial) {
        setButtonPlaying(false);
        line('');
      }
    } catch (_) {
      if (serial === playSerial) {
        setButtonPlaying(false);
        line('这次音频没有加载成功，请再点一次播放', 'answerline bad');
      }
    }
  };
})();
