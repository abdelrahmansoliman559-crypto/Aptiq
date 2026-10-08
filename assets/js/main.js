/* APTIQ — site script: mobile menu, sticky header state, booking form. */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var nav = document.getElementById('site-nav');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');
  var scrim = document.getElementById('scrim');

  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    if (scrim) scrim.classList.toggle('is-open', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && closeBtn) closeBtn.focus();
    if (!open && openBtn) openBtn.focus();
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) setMenu(false);
  });
  if (nav) {
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && nav.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- Booking form ---------- */
  var form = document.getElementById('booking-form');
  if (!form) return;

  var success = document.getElementById('booking-success');
  var summary = document.getElementById('booking-summary');
  var statusEl = document.getElementById('form-status');
  var servicesError = document.getElementById('services-error');

  function fieldError(input, msg) {
    var err = document.getElementById(input.id + '-error');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
  }

  function validate() {
    var ok = true;
    var name = form.elements['name'];
    var phone = form.elements['phone'];
    var email = form.elements['email'];

    if (!name.value.trim()) { fieldError(name, 'اكتب اسمك الكامل.'); ok = false; } else fieldError(name, '');

    var digits = phone.value.replace(/\s+/g, '');
    if (!/^05\d{8}$/.test(digits)) { fieldError(phone, 'اكتب رقم جوال صحيح يبدأ بـ 05 ومكوّن من 10 أرقام.'); ok = false; } else fieldError(phone, '');

    if (email.value.trim() && !email.checkValidity()) { fieldError(email, 'اكتب بريدًا إلكترونيًا صحيحًا.'); ok = false; } else fieldError(email, '');

    var picked = form.querySelectorAll('input[name="services"]:checked');
    if (!picked.length) { servicesError.hidden = false; ok = false; } else servicesError.hidden = true;

    return ok;
  }

  function showSuccess() {
    var picked = Array.prototype.map.call(form.querySelectorAll('input[name="services"]:checked'), function (i) { return i.value; });
    summary.innerHTML = '';
    picked.forEach(function (label) {
      var li = document.createElement('li'); li.textContent = label; summary.appendChild(li);
    });
    var li = document.createElement('li'); li.textContent = 'فرع ' + form.elements['branch'].value; summary.appendChild(li);
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    if (!validate()) {
      var firstBad = form.querySelector('[aria-invalid="true"]') || form.querySelector('input[name="services"]');
      if (firstBad) firstBad.focus();
      return;
    }

    /* Preview inside an embedded frame: show the confirmation without sending. */
    var isPreview = window.self !== window.top || location.protocol === 'file:';
    if (isPreview) { showSuccess(); return; }

    /* Live site: posts to the host's form handler (Netlify Forms works with no setup).
       To use another service, set data-endpoint="https://..." on the form. */
    var endpoint = form.getAttribute('data-endpoint') || '/';
    var body = new URLSearchParams(new FormData(form)).toString();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); showSuccess(); })
      .catch(function () {
        statusEl.textContent = 'تعذّر إرسال الطلب الآن. حاول مرة أخرى أو تواصل معنا عبر الجوال.';
        statusEl.hidden = false;
      })
      .then(function () { btn.disabled = false; });
  });

  var again = document.getElementById('booking-again');
  if (again) again.addEventListener('click', function () {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.elements['name'].focus();
  });
})();
