/* PawRescue frontend demo: browser storage is for prototyping only, not secure authentication. */
(() => {
  'use strict';

  const STORE = { user: 'pawrescueUser', profile: 'pawrescueProfile', requests: 'pawrescueRequests', applications: 'pawrescueApplications' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const readList = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const saveList = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { showToast('Unable to save in this browser. Please check available storage.', 'error'); return false; } };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
  const animals = [
    { id:'buddy', name:'Buddy', type:'Dog', age:'About 3 years', condition:'Recovering', status:'Under Treatment', image:photo('photo-1552053831-71594a27632d'), description:'A gentle, curious friend who is resting after a difficult time. His care team is helping him feel comfortable.', care:'Rest and a veterinary follow-up are part of this example care plan.', health:'Not independently verified', vaccine:'Not verified', shelter:'Willow Lane Care Home' },
    { id:'poppy', name:'Poppy', type:'Cat', age:'About 1 year', condition:'Stable', status:'Recovering', image:photo('photo-1514888286974-6c03e2ca1dba'), description:'A bright-eyed little explorer who is settling in and enjoying a quiet, safe space.', care:'A calm environment, fresh water, and gentle monitoring.', health:'Not independently verified', vaccine:'Not verified', shelter:'Maple Street Shelter' },
    { id:'maple', name:'Maple', type:'Puppy', age:'About 8 months', condition:'Stable', status:'Awaiting Medical Assessment', image:photo('photo-1548199973-03cce0bbc87b'), description:'Playful, people-friendly, and ready to meet a patient family when her care team confirms availability.', care:'Daily feeding, enrichment, and a pending assessment.', health:'Assessment pending', vaccine:'Not verified', shelter:'Willow Lane Care Home' },
    { id:'milo', name:'Milo', type:'Cat', age:'About 2 years', condition:'Needs care', status:'Under Treatment', image:photo('photo-1573865526739-10659fec78a5'), description:'A thoughtful, quiet cat receiving supportive care in a warm temporary shelter.', care:'Quiet rest, meals, and regular observation.', health:'Not independently verified', vaccine:'Not verified', shelter:'Meadow Paws Shelter' },
    { id:'rosie', name:'Rosie', type:'Dog', age:'About 4 years', condition:'Recovering', status:'Recovering', image:photo('photo-1543466835-00a7907e9de1'), description:'A kind-hearted companion building confidence again, one gentle day at a time.', care:'Comfort, consistent meals, and continued monitoring.', health:'Not independently verified', vaccine:'Not verified', shelter:'Maple Street Shelter' },
    { id:'ollie', name:'Ollie', type:'Puppy', age:'About 6 months', condition:'Stable', status:'Treatment Completed', image:photo('photo-1551717743-49959800b1f6'), description:'An energetic young pup who loves a soft blanket and is looking for a patient, loving home.', care:'Routine care information should be confirmed with the shelter.', health:'Not independently verified', vaccine:'Not verified', shelter:'Willow Lane Care Home' }
  ];
  const medicalCases = [
    { animal:'Buddy', type:'Dog · Case PR-M024', status:'Under Treatment', badge:'treatment', image:animals[0].image, detail:'Resting after an initial care visit. Follow-up details are illustrative.' },
    { animal:'Poppy', type:'Cat · Case PR-M019', status:'Recovering', badge:'recovering', image:animals[1].image, detail:'Settling into a quiet recovery space with gentle daily observation.' },
    { animal:'Milo', type:'Cat · Case PR-M031', status:'Awaiting Medical Assessment', badge:'assessment', image:animals[3].image, detail:'A veterinary assessment is needed before any health details can be confirmed.' },
    { animal:'Rosie', type:'Dog · Case PR-M012', status:'Treatment Completed', badge:'completed', image:animals[4].image, detail:'Example case marked completed. Please check with a local shelter for current records.' }
  ];

  const authView = $('#authView'), appView = $('#appView'), authMessage = $('#authMessage');
  const timelineStatuses = ['Request Submitted','Under Review','Rescue Acknowledged','Animal Rescued','Medical Treatment','Case Completed'];
  let toastTimer;
  function showToast(text, kind = '') {
    const toast = $('#toast'); toast.textContent = text; toast.className = `toast visible ${kind}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.className = 'toast', 3200);
  }
  function setAuthMessage(text, kind = '') { authMessage.textContent = text; authMessage.className = `form-message${kind ? ` ${kind}` : ''}`; }
  function setAuthMode(mode) {
    const signup = mode === 'signup';
    $('#signinForm').classList.toggle('hidden', signup); $('#signupForm').classList.toggle('hidden', !signup);
    $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#authSubtitle').textContent = signup ? 'Join a community that cares for every paw.' : 'Sign in to continue making a difference.';
    setAuthMessage('');
  }
  function setSession(user, remember) {
    const safeUser = { name: user.name, email: user.email, phone: user.phone || '' };
    try {
      sessionStorage.removeItem(STORE.user); localStorage.removeItem(STORE.user);
      (remember ? localStorage : sessionStorage).setItem(STORE.user, JSON.stringify(safeUser));
    } catch { /* Session can still be used until this tab closes. */ }
    openApp(safeUser);
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(STORE.user) || sessionStorage.getItem(STORE.user) || 'null'); } catch { return null; }
  }
  function openApp(user) {
    authView.classList.add('hidden'); appView.classList.remove('hidden');
    const name = (user?.name || 'PawRescue friend').trim();
    const firstName = name.split(/\s+/)[0] || 'friend';
    $('#sidebarUserName').textContent = name; $('#topUserName').textContent = firstName;
    $('#welcomeName').textContent = firstName; $('#sidebarAvatar').textContent = firstName[0].toUpperCase(); $('#topAvatar').textContent = firstName[0].toUpperCase();
    $('#rescueName').value = name; $('#rescueEmail').value = user?.email || '';
    $('#rescuePhone').value = user?.phone || '';
    renderRequests(); updateStats(); renderAnimals();
  }
  const existingUser = getSession();
  if (existingUser) openApp(existingUser);

  // Remote photos are optional; show a gentle local fallback when offline.
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.src.startsWith('https://images.unsplash.com/')) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480"><rect width="800" height="480" fill="#fce7f3"/><circle cx="400" cy="195" r="102" fill="#fff8fb"/><text x="400" y="225" text-anchor="middle" font-size="100">🐾</text><text x="400" y="375" text-anchor="middle" fill="#a83d75" font-family="sans-serif" font-size="26">PawRescue friend</text></svg>`;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, true);

  $$('[data-auth-switch]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authSwitch)));
  $$('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword); const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password'; button.textContent = visible ? 'Hide' : 'Show'; button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
  }));
  $('#signinForm').addEventListener('submit', event => {
    event.preventDefault(); const email = $('#signinEmail').value.trim(); const password = $('#signinPassword').value;
    if (!email || !$('#signinEmail').validity.valid || password.length < 6) { setAuthMessage('Enter a valid email address and a password of at least 6 characters.'); return; }
    const account = (() => { try { return JSON.parse(localStorage.getItem('pawrescueAccount') || 'null'); } catch { return null; } })();
    if (account && account.email.toLowerCase() === email.toLowerCase() && account.password !== password) { setAuthMessage('That password does not match this demo account.'); return; }
    if (account && account.email.toLowerCase() !== email.toLowerCase()) { setAuthMessage('No demo account was found for this email. Create an account to get started.'); return; }
    const profile = (() => { try { return JSON.parse(localStorage.getItem(STORE.profile) || 'null'); } catch { return null; } })();
    const savedProfile = profile?.email?.toLowerCase() === email.toLowerCase() ? profile : null;
    setSession({ name: account?.name || savedProfile?.name || email.split('@')[0], email, phone: account?.phone || savedProfile?.phone || '' }, $('#rememberMe').checked);
  });
  $('#signupForm').addEventListener('submit', event => {
    event.preventDefault(); const name = $('#signupName').value.trim(), email = $('#signupEmail').value.trim(), phone = $('#signupMobile').value.trim(), password = $('#signupPassword').value, confirm = $('#signupConfirm').value;
    if (!name || !email || !$('#signupEmail').validity.valid || !phone || !/^[+()\d\s.-]{7,20}$/.test(phone)) { setAuthMessage('Please enter your name, a valid email, and a valid mobile number.'); return; }
    if (password.length < 6) { setAuthMessage('Your password must be at least 6 characters long.'); return; }
    if (password !== confirm) { setAuthMessage('Your passwords do not match.'); return; }
    if (!$('#termsAgree').checked) { setAuthMessage('Please agree to the terms and privacy policy to continue.'); return; }
    try { localStorage.setItem('pawrescueAccount', JSON.stringify({ name, email, phone, password })); } catch { setAuthMessage('Your browser could not save this demo account.'); return; }
    setSession({ name, email, phone }, true); showToast('Welcome to PawRescue, ' + name.split(/\s+/)[0] + '!', 'success');
  });
  $('#forgotPassword').addEventListener('click', () => setAuthMessage('Password recovery is not connected in this demo. Please create a new demo account or sign in with your saved details.'));
  $('#logoutButton').addEventListener('click', () => {
    try { localStorage.removeItem(STORE.user); sessionStorage.removeItem(STORE.user); } catch { /* no-op */ }
    closeModal(); $('#sidebar').classList.remove('open'); $('#mobileOverlay').classList.remove('show'); $('#menuToggle').setAttribute('aria-expanded', 'false');
    appView.classList.add('hidden'); authView.classList.remove('hidden'); $('#signinForm').reset(); setAuthMode('signin'); setToastClose();
  });
  function setToastClose() { showToast('You have signed out.'); }

  function navigate(section) {
    if (!document.getElementById(`section-${section}`)) return;
    $$('.page-section').forEach(page => page.classList.toggle('active', page.id === `section-${section}`));
    $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.section === section));
    const title = $(`#section-${section}`).dataset.title; $('#topSectionName').textContent = title;
    $('#sidebar').classList.remove('open'); $('#mobileOverlay').classList.remove('show'); $('#menuToggle').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.nav-link').forEach(button => button.addEventListener('click', () => navigate(button.dataset.section)));
  document.addEventListener('click', event => { const go = event.target.closest('[data-go]'); if (go) navigate(go.dataset.go); });
  $('#menuToggle').addEventListener('click', () => { const open = $('#sidebar').classList.toggle('open'); $('#mobileOverlay').classList.toggle('show', open); $('#menuToggle').setAttribute('aria-expanded', String(open)); });
  $('#mobileOverlay').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#mobileOverlay').classList.remove('show'); $('#menuToggle').setAttribute('aria-expanded', 'false'); });
  $('#notificationButton').addEventListener('click', event => { event.stopPropagation(); $('#notificationPanel').classList.toggle('hidden'); });
  document.addEventListener('click', event => { if (!event.target.closest('#notificationPanel') && !event.target.closest('#notificationButton')) $('#notificationPanel').classList.add('hidden'); });
  document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearch').focus(); } if (event.key === 'Escape') closeModal(); });

  function renderAnimals() {
    $('#medicalGrid').innerHTML = medicalCases.map(item => `<article class="animal-card"><img class="animal-photo" src="${item.image}" alt="${escapeHTML(item.animal)}, an animal receiving example veterinary care" loading="lazy"><div class="animal-card-body"><div class="animal-topline"><div><h3>${escapeHTML(item.animal)}</h3><div class="animal-type">${escapeHTML(item.type)}</div></div><span class="status-badge badge-${item.badge}">${escapeHTML(item.status)}</span></div><p class="animal-desc">${escapeHTML(item.detail)}</p><button class="text-button" data-medical-info="${escapeHTML(item.animal)}">View care information →</button></div></article>`).join('');
    const shelterAnimals = animals.slice(0, 5);
    $('#shelterGrid').innerHTML = shelterAnimals.map(animal => animalCard(animal, 'shelter')).join('');
    $('#adoptionGrid').innerHTML = animals.filter(animal => ['buddy','maple','ollie','poppy'].includes(animal.id)).map(animal => animalCard(animal, 'adoption')).join('');
  }
  function animalCard(animal, mode) {
    const statusClass = animal.condition === 'Stable' ? 'badge-stable' : animal.condition === 'Recovering' ? 'badge-recovering' : 'badge-assessment';
    const label = mode === 'adoption' ? 'View details & apply' : 'View care details';
    return `<article class="animal-card" data-animal-card="${escapeHTML(animal.id)}"><img class="animal-photo" src="${animal.image}" alt="${escapeHTML(animal.name)}, a ${escapeHTML(animal.type.toLowerCase())} in temporary care" loading="lazy"><div class="animal-card-body"><div class="animal-topline"><div><h3>${escapeHTML(animal.name)}</h3><div class="animal-type">${escapeHTML(animal.type)} · ${escapeHTML(animal.age)}</div></div><span class="status-badge ${statusClass}">${escapeHTML(animal.condition)}</span></div><p class="animal-desc">${escapeHTML(animal.description)}</p><div class="animal-meta"><span>♡ ${escapeHTML(animal.health)}</span><span>Vaccination: ${escapeHTML(animal.vaccine)}</span></div><button class="button button-soft" data-animal-action="${escapeHTML(animal.id)}" data-mode="${mode}">${label} <span>→</span></button></div></article>`;
  }
  function filterAnimals(searchId, typeId, conditionId, gridId, emptyId, mode) {
    const search = $(`#${searchId}`).value.trim().toLowerCase();
    const type = typeId ? $(`#${typeId}`).value : 'all'; const condition = conditionId ? $(`#${conditionId}`).value : 'all';
    $$('.animal-card', $(`#${gridId}`)).forEach(card => {
      const animal = animals.find(entry => entry.id === card.dataset.animalCard);
      const matches = (!search || `${animal.name} ${animal.type} ${animal.condition}`.toLowerCase().includes(search)) && (type === 'all' || animal.type === type) && (condition === 'all' || animal.condition === condition);
      card.classList.toggle('hidden', !matches);
    });
    $(`#${emptyId}`).classList.toggle('hidden', $$('.animal-card:not(.hidden)', $(`#${gridId}`)).length > 0);
  }
  ['shelterSearch','shelterTypeFilter','shelterConditionFilter'].forEach(id => $(`#${id}`).addEventListener(id.includes('Search') ? 'input' : 'change', () => filterAnimals('shelterSearch','shelterTypeFilter','shelterConditionFilter','shelterGrid','shelterEmpty','shelter')));
  ['adoptionSearch','adoptionTypeFilter'].forEach(id => $(`#${id}`).addEventListener(id.includes('Search') ? 'input' : 'change', () => filterAnimals('adoptionSearch','adoptionTypeFilter',null,'adoptionGrid','adoptionEmpty','adoption')));

  const rescueForm = $('#rescueForm'), photoInput = $('#animalPhoto');
  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file), image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        try { resolve(canvas.toDataURL('image/jpeg', 0.78)); } catch (error) { reject(error); }
      };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image could not be processed.')); };
      image.src = objectUrl;
    });
  }
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0], preview = $('#photoPreview');
    if (!file) { preview.classList.add('hidden'); preview.removeAttribute('src'); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { photoInput.value = ''; preview.classList.add('hidden'); showToast('Choose a JPG, PNG, or WEBP image up to 5 MB.', 'error'); return; }
    preview.src = URL.createObjectURL(file); preview.classList.remove('hidden');
  });
  $('#detectLocation').addEventListener('click', () => {
    const help = $('#locationHelp');
    if (!navigator.geolocation) { help.textContent = 'Location detection is not available in this browser. Enter the location manually.'; return; }
    help.textContent = 'Requesting your location permission…';
    navigator.geolocation.getCurrentPosition(position => { $('#animalLocation').value = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`; help.textContent = 'Location filled from your device. Add a nearby landmark if possible.'; }, () => { help.textContent = 'Location could not be accessed. Enter the location manually.'; }, { timeout: 9000 });
  });
  rescueForm.addEventListener('submit', async event => {
    event.preventDefault(); const message = $('#rescueMessage'); message.textContent = ''; message.className = 'form-message';
    const phone = $('#rescuePhone').value.trim();
    if (!rescueForm.reportValidity()) return;
    if (!/^[+()\d\s.-]{7,20}$/.test(phone) || phone.replace(/\D/g, '').length < 7) { message.textContent = 'Please enter a valid mobile number with at least 7 digits.'; $('#rescuePhone').focus(); return; }
    if (!$('#rescueEmail').validity.valid) { message.textContent = 'Please enter a valid email address.'; $('#rescueEmail').focus(); return; }
    const file = photoInput.files[0];
    const button = $('#submitRescue'); button.disabled = true; button.innerHTML = 'Saving your request…';
    await new Promise(resolve => setTimeout(resolve, 650));
    let photoData = '';
    if (file) {
      try { photoData = await compressPhoto(file); }
      catch { showToast('The photo could not be processed. Your request will be saved without it.', 'error'); }
    }
    const requests = readList(STORE.requests);
    let requestId;
    do { requestId = `PR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`; }
    while (requests.some(saved => saved.id === requestId));
    const submittedAt = new Date().toISOString();
    const request = { id: requestId, name: $('#rescueName').value.trim(), phone, email: $('#rescueEmail').value.trim(), animalType: $('#animalType').value.trim(), condition: $('#animalCondition').value, location: $('#animalLocation').value.trim(), urgency: $('input[name="urgency"]:checked')?.value, description: $('#rescueDescription').value.trim(), photo: photoData, submittedAt, status: 'Request Submitted', updates: [{ status: 'Request Submitted', date: submittedAt }] };
    requests.unshift(request);
    if (saveList(STORE.requests, requests)) {
      rescueForm.reset(); $('#rescueName').value = $('#sidebarUserName').textContent; $('#rescueEmail').value = getSession()?.email || ''; $('#photoPreview').classList.add('hidden'); $('#photoPreview').removeAttribute('src');
      message.textContent = `Request ${request.id} was saved. No rescue team has been notified or dispatched.`; message.className = 'form-message success';
      renderRequests(); updateStats(); showToast(`Request ${request.id} saved`, 'success');
    }
    button.disabled = false; button.innerHTML = 'Submit rescue request <span>→</span>';
  });

  $('#requestSearch').addEventListener('input', renderRequests); $('#requestStatusFilter').addEventListener('change', renderRequests);
  function updateStats() {
    const requests = readList(STORE.requests); $('#statRequests').textContent = requests.length;
    const counter = $('#requestNavCount'); counter.textContent = requests.length; counter.classList.toggle('hidden', requests.length === 0);
  }
  function renderRequests() {
    const all = readList(STORE.requests), query = $('#requestSearch').value.trim().toLowerCase(), status = $('#requestStatusFilter').value;
    const list = all.filter(request => (!query || request.id.toLowerCase().includes(query)) && (status === 'all' || request.status === status));
    $('#requestEmpty').classList.toggle('hidden', list.length > 0);
    $('#requestList').innerHTML = list.map(request => {
      const current = Math.max(0, timelineStatuses.indexOf(request.status)); const date = new Date(request.submittedAt).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' });
      return `<article class="request-card"><div class="request-card-header"><div><div class="request-id">${escapeHTML(request.id)}</div><div class="request-date">Submitted ${escapeHTML(date)}</div></div><span class="status-badge ${request.urgency === 'High' ? 'badge-treatment' : 'badge-stable'}">${escapeHTML(request.status)}</span></div><div class="request-summary"><div><span>Animal</span><strong>${escapeHTML(request.animalType)}</strong></div><div><span>Condition</span><strong>${escapeHTML(request.condition)}</strong></div><div><span>Location</span><strong>${escapeHTML(request.location)}</strong></div><div><span>Urgency</span><strong><span class="urgency-chip ${request.urgency === 'High' ? 'high' : ''}">${escapeHTML(request.urgency)}</span></strong></div></div><div class="timeline" aria-label="Request tracking timeline">${timelineStatuses.map((step,index) => `<div class="timeline-step ${index < current ? 'done' : ''} ${index === current ? 'current done' : ''}">${step}</div>`).join('')}</div>${request.urgency === 'High' ? '<div class="high-warning">⚠ High urgency reported. This request is not confirmed as acknowledged; please contact local emergency animal services directly.</div>' : ''}<button class="text-button request-details-button" data-request-detail="${escapeHTML(request.id)}">View request details →</button></article>`;
    }).join('');
    updateStats();
  }

  const modal = $('#detailModal'), modalContent = $('#modalContent');
  function openModal(content) { modalContent.innerHTML = content; modal.classList.remove('hidden'); $('.modal-close').focus(); }
  function closeModal() { modal.classList.add('hidden'); modalContent.innerHTML = ''; }
  $('.modal-close').addEventListener('click', closeModal); modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  function showProfile() {
    const user = getSession();
    if (!user) return;
    openModal(`<h2>My profile</h2><p>Review and update your community contact details.</p><form id="profileForm"><div class="field"><label for="profileName">Full name</label><input id="profileName" name="name" autocomplete="name" required value="${escapeHTML(user.name || '')}"></div><div class="field"><label for="profileEmail">Email address</label><input id="profileEmail" name="email" type="email" autocomplete="email" required value="${escapeHTML(user.email || '')}"></div><div class="field"><label for="profilePhone">Mobile number</label><input id="profilePhone" name="phone" type="tel" autocomplete="tel" placeholder="e.g. +91 98765 43210" value="${escapeHTML(user.phone || '')}"></div><p class="profile-storage-note">Profile details are stored only in this browser demo.</p><div id="profileMessage" class="form-message" role="status" aria-live="polite"></div><button class="button button-primary" type="submit">Save profile</button></form>`);
    $('#profileForm').addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#profileName').value.trim(), email = $('#profileEmail').value.trim(), phone = $('#profilePhone').value.trim();
      const message = $('#profileMessage');
      if (!event.currentTarget.reportValidity()) return;
      if (phone && (!/^[+()\d\s.-]{7,20}$/.test(phone) || phone.replace(/\D/g, '').length < 7)) {
        message.textContent = 'Please enter a valid mobile number with at least 7 digits.';
        $('#profilePhone').focus();
        return;
      }
      const updatedProfile = { name, email, phone };
      try {
        const account = JSON.parse(localStorage.getItem('pawrescueAccount') || 'null');
        localStorage.setItem(STORE.profile, JSON.stringify(updatedProfile));
        if (account) localStorage.setItem('pawrescueAccount', JSON.stringify({ ...account, ...updatedProfile }));
        const remember = localStorage.getItem(STORE.user) !== null;
        setSession(updatedProfile, remember);
        closeModal();
        showToast('Your profile has been updated.', 'success');
      } catch {
        message.textContent = 'Your browser could not save these changes. Check available storage and try again.';
      }
    });
  }
  $('#profileButton').addEventListener('click', showProfile);
  $('#sidebarProfileButton').addEventListener('click', showProfile);
  document.addEventListener('click', event => {
    const animalButton = event.target.closest('[data-animal-action]');
    if (animalButton) { const animal = animals.find(item => item.id === animalButton.dataset.animalAction); if (animal) animalButton.dataset.mode === 'adoption' ? showAdoption(animal) : showAnimal(animal); }
    const detailButton = event.target.closest('[data-request-detail]');
    if (detailButton) showRequest(detailButton.dataset.requestDetail);
    const medicalButton = event.target.closest('[data-medical-info]');
    if (medicalButton) { const item = medicalCases.find(entry => entry.animal === medicalButton.dataset.medicalInfo); if(item) openModal(`<h2>${escapeHTML(item.animal)}'s care information</h2><p>${escapeHTML(item.type)}</p><img class="modal-animal-photo" src="${item.image}" alt="${escapeHTML(item.animal)}"><div class="modal-detail-grid"><div class="modal-detail"><small>Example status</small><strong>${escapeHTML(item.status)}</strong></div><div class="modal-detail"><small>Case</small><strong>${escapeHTML(item.type.split('·')[1].trim())}</strong></div></div><p>${escapeHTML(item.detail)} Medical records and treatment details must be confirmed with a veterinary professional.</p>`); }
  });
  function showAnimal(animal) { openModal(`<h2>${escapeHTML(animal.name)}</h2><p>${escapeHTML(animal.type)} · ${escapeHTML(animal.age)} · ${escapeHTML(animal.shelter)}</p><img class="modal-animal-photo" src="${animal.image}" alt="${escapeHTML(animal.name)}"><div class="modal-detail-grid"><div class="modal-detail"><small>Current condition</small><strong>${escapeHTML(animal.condition)}</strong></div><div class="modal-detail"><small>Health</small><strong>${escapeHTML(animal.health)}</strong></div><div class="modal-detail"><small>Care</small><strong>${escapeHTML(animal.care)}</strong></div><div class="modal-detail"><small>Vaccination</small><strong>${escapeHTML(animal.vaccine)}</strong></div></div><p>${escapeHTML(animal.description)} All shelter information is illustrative and should be confirmed with the local care team.</p>`); }
  function showAdoption(animal) {
    openModal(`<h2>Meet ${escapeHTML(animal.name)}</h2><p>Interested in learning whether your home could be a good fit?</p><img class="modal-animal-photo" src="${animal.image}" alt="${escapeHTML(animal.name)}"><div class="modal-detail-grid"><div class="modal-detail"><small>Animal</small><strong>${escapeHTML(animal.type)} · ${escapeHTML(animal.age)}</strong></div><div class="modal-detail"><small>Health information</small><strong>${escapeHTML(animal.health)}</strong></div></div><p>Adoption availability and health details are not confirmed in this demo. A local shelter will need to confirm suitability, availability, and next steps.</p><form id="adoptionForm"><div class="field"><label for="adopterName">Your name</label><input id="adopterName" name="name" required value="${escapeHTML($('#sidebarUserName').textContent)}" /></div><div class="field"><label for="adopterEmail">Email address</label><input id="adopterEmail" name="email" type="email" required value="${escapeHTML(getSession()?.email || '')}" /></div><div class="field"><label for="adopterNote">A note to the shelter</label><textarea id="adopterNote" rows="3" placeholder="Tell us a little about your home and interest..."></textarea></div><button class="button button-primary" type="submit">Send interest <span>→</span></button></form>`);
    $('#adoptionForm').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const apps = readList(STORE.applications); apps.unshift({ id: animal.id, animal: animal.name, name: $('#adopterName').value.trim(), email: $('#adopterEmail').value.trim(), note: $('#adopterNote').value.trim(), date: new Date().toISOString() }); if (saveList(STORE.applications, apps)) { openModal(`<div class="success-modal"><span class="stat-icon icon-mint">♡</span><h2>Interest noted — thank you!</h2><p>Your adoption interest for ${escapeHTML(animal.name)} has been saved in this browser demo. No shelter has been contacted; please confirm availability directly with a local shelter.</p><button class="button button-primary" type="button" id="doneModal">Done</button></div>`); $('#doneModal').addEventListener('click', closeModal); } });
  }
  function showRequest(id) {
    const request = readList(STORE.requests).find(item => item.id === id); if (!request) return;
    openModal(`<h2>Rescue request details</h2><p class="request-id">${escapeHTML(request.id)}</p>${request.urgency === 'High' ? '<div class="high-warning">⚠ High urgency was reported. No rescue response is confirmed. Contact local emergency services directly.</div>' : ''}<div class="modal-detail-grid"><div class="modal-detail"><small>Animal type</small><strong>${escapeHTML(request.animalType)}</strong></div><div class="modal-detail"><small>Condition</small><strong>${escapeHTML(request.condition)}</strong></div><div class="modal-detail"><small>Location</small><strong>${escapeHTML(request.location)}</strong></div><div class="modal-detail"><small>Urgency</small><strong>${escapeHTML(request.urgency)}</strong></div><div class="modal-detail"><small>Status</small><strong>${escapeHTML(request.status)}</strong></div><div class="modal-detail"><small>Submitted</small><strong>${escapeHTML(new Date(request.submittedAt).toLocaleString())}</strong></div></div>${request.photo ? `<img class="modal-animal-photo" src="${request.photo}" alt="Photo submitted with rescue request">` : ''}<p><strong>Additional details:</strong> ${escapeHTML(request.description)}</p><p><strong>Contact:</strong> ${escapeHTML(request.name)} · ${escapeHTML(request.phone)} · ${escapeHTML(request.email)}</p><p>Only recorded updates are shown. Submission does not mean a rescue team has acknowledged or been dispatched.</p>`);
  }

  $('#globalSearch').addEventListener('keydown', event => {
    if (event.key !== 'Enter') return; const query = event.currentTarget.value.trim(); if (!query) return;
    const animal = animals.find(item => `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase()));
    const request = readList(STORE.requests).find(item => item.id.toLowerCase() === query.toLowerCase());
    if (request) { navigate('requests'); $('#requestSearch').value = request.id; renderRequests(); showRequest(request.id); }
    else if (animal) { const section = ['buddy','maple','ollie','poppy'].includes(animal.id) ? 'adoption' : 'shelter'; navigate(section); if(section === 'adoption') { $('#adoptionSearch').value = query; filterAnimals('adoptionSearch','adoptionTypeFilter',null,'adoptionGrid','adoptionEmpty','adoption'); } else { $('#shelterSearch').value = query; filterAnimals('shelterSearch','shelterTypeFilter','shelterConditionFilter','shelterGrid','shelterEmpty','shelter'); } }
    else { navigate('requests'); $('#requestSearch').value = query; renderRequests(); showToast('No exact animal or request ID found. Try another search.'); }
    event.currentTarget.blur();
  });
})();
