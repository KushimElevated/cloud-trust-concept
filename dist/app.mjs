import { TrustEngine, CONTROLS, PEOPLE, ROLES, POLICY } from './engine.mjs';
import { createPillarViews } from './pillars.mjs';
import { createImplementationGuide } from './implementation.mjs';

const engine = new TrustEngine();
const routes = ['overview','foundations','access','assurance','governance'];
const titles = {overview:'Trust overview',foundations:'Cloud Foundations',access:'Cloud Access',assurance:'Cloud Assurance',governance:'Cloud Governance',implementation:'Implementation guide'};
const taglines={foundations:'Start Trusted',access:'Access When Trusted',assurance:'Stay Trusted',governance:'Prove Trust'};
const ui = {page:'overview',provider:'All clouds',evidenceDomain:'All activity',evidenceEnv:'All environments',guide:null,modal:null,assuranceTab:'findings',governanceTab:'overview',findingState:'Unresolved',findingSeverity:'All priorities',assuranceEnv:'all'};
const $ = (selector,root=document) => root.querySelector(selector);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  foundations:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  access:'M15 7a4 4 0 1 1-4 4H3v6h4v-3h4 M19 7h.01',
  policies:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z m-5 9 3 3 6-6',
  evidence:'M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4',
  assurance:'M3 12h4l3-7 4 14 3-7h4 M4 4h2 M18 20h2',
  governance:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z M8 11h8 M8 15h5',
  implementation:'M12 5v16 M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 M12 5c3-2 7-2 10-1v15c-3-1-7-1-10 2 M5 8h3 M16 8h3',
  arrow:'M5 12h14 m-5-5 5 5-5 5', check:'m5 12 4 4L19 6',
  play:'m8 5 11 7-11 7z',plus:'M12 5v14 M5 12h14',
  clock:'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  refresh:'M20 7a9 9 0 1 0 1 8 M20 2v6h-6',x:'m6 6 12 12 M6 18 18 6',
  download:'M12 3v12 m-5-5 5 5 5-5 M4 17v4h16v-4',
  alert:'m12 3 10 18H2z M12 9v5 M12 17h.01',
  bolt:'m13 2-9 12h7l-1 8 10-13h-7z',
  lock:'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',
  chevron:'m9 5 7 7-7 7',info:'M12 11v6 M12 7h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
  menu:'M4 6h16 M4 12h16 M4 18h16'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]||icons.info}"/></svg>`;
const logo = `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M29 10a14 14 0 1 0 0 20" stroke="currentColor" stroke-width="3.4"/><path d="m17 20 5 5L33 13" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const badge = (label,cls='') => `<span class="badge ${cls||({'Trusted':'green','Granted':'green','Active':'green','Approved':'green','Restored':'green','Resolved':'green','Current':'green','Needs attention':'amber','Pending review':'amber','Exception active':'amber','In progress':'blue','Submitted':'blue','Stale':'amber','Open':'amber','Critical':'red','High':'amber','Denied':'red','Revoked':'red','Expired':'gray','Rejected':'red'}[label]||'gray')}">${esc(label)}</span>`;
const provider = name => `<span class="cloud-mark ${name.toLowerCase()}">${name==='AWS'?'aws':name==='Azure'?'A':'G'}</span>`;
const time = ts => new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'UTC'}).format(ts);
const date = ts => new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(ts);
const button = (label,action,kind='secondary',ico='',attrs='') => `<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${ico?icon(ico):''}${label}</button>`;
const empty = (ico,title,body,action='') => `<div class="empty-state"><span class="empty-icon">${icon(ico)}</span><h3>${title}</h3><p>${body}</p>${action}</div>`;

function focusKey(el) {
  if(!el||!$('#app').contains(el))return null;
  if(el.id)return '#'+CSS.escape(el.id);
  const d=el.dataset;
  if(d.action)return `[data-action="${CSS.escape(d.action)}"]`+['id','page','signal','approve'].filter(k=>d[k]!==undefined).map(k=>`[data-${k}="${CSS.escape(d[k])}"]`).join('');
  if(el.matches('a[href]'))return `a[href="${CSS.escape(el.getAttribute('href'))}"]`;
  return null;
}
function render() {
  const m=engine.metrics(),focused=focusKey(document.activeElement);
  document.title=`${titles[ui.page]} | Cloud Trust`;
  $('#app').innerHTML=`<div class="workspace">
    <aside class="sidebar" aria-label="Primary navigation">
      <a class="brand" href="#overview">${logo}<span>Cloud Trust<span class="brand-sub">THE TRUST LIFECYCLE</span></span></a>
      <div class="workspace-switch">${icon('globe')}<div>Enterprise workspace<span>Multi-cloud security</span></div><span class="workspace-initials">CT</span></div>
      <p class="nav-label">WORKSPACE</p>
      <nav>${routes.map(r=>`<a class="nav-link ${ui.page===r?'selected':''}" href="#${r}" ${ui.page===r?'aria-current="page"':''}>${icon(r)}<span>${titles[r]}${taglines[r]?`<small>${taglines[r]}</small>`:''}</span>${r==='governance'&&pendingCount()?`<span class="nav-count">${pendingCount()}</span>`:''}</a>`).join('')}</nav>
      <nav class="implementation-nav" aria-label="Build and operate"><a class="nav-link ${ui.page==='implementation'?'selected':''}" href="#implementation/strategy" ${ui.page==='implementation'?'aria-current="page"':''}>${icon('implementation')}<span>Implementation guide<small>Strategy, tools & how-to</small></span></a></nav>
      <div class="sidebar-story"><span class="eyebrow">TRUST IS A CONTINUOUS DECISION</span><p>Start trusted.<br>Stay trusted.<br>Prove trust.</p><span class="sidebar-line"></span><div>One product.<br>Four connected pillars.</div></div>
      <div class="sidebar-bottom"><div class="provider-list">${provider('AWS')}${provider('Azure')}${provider('GCP')}<span>Every cloud.</span></div><span class="sandbox-label">${icon('lock')} Simulation workspace</span></div>
    </aside>
    <div class="content-shell">
      <header class="topbar"><div class="breadcrumb"><span>Workspace</span>${icon('chevron')}<strong>${titles[ui.page]}</strong></div><div class="topbar-right"><span class="demo-badge">SYNTHETIC DEMO</span><span class="topbar-date">${date(engine.now())}</span><span class="avatar avatar-small" title="Demo operator">PM</span></div></header>
      <main id="main" tabindex="-1">${({overview:overview,foundations:foundations,access:access,assurance:pillars.assurance,governance:pillars.governance,implementation:implementation.view}[ui.page])(m)}</main>
      <footer class="page-footer"><span>${icon('info')} Simulated signals, workflows, and enforcement. No cloud accounts connected.</span><span>Cloud Trust <span class="footer-divider">/</span> Product concept v2.1</span></footer>
    </div>
  </div>`;
  updateCountdowns();
  if(focused&&!$('dialog[open]'))$(focused)?.focus({preventScroll:true});
}
function pendingCount() {return engine.requests.filter(r=>r.status==='Pending review').length+engine.exceptions.filter(e=>e.status==='Pending review').length+engine.attestations.filter(a=>a.status==='Submitted').length;}
function pageHeader(eyebrow,title,description,actions='') {
  if(eyebrow.startsWith('PILLAR')&&taglines[ui.page])actions=`<a class="btn ghost" href="#implementation/playbooks/${ui.page}">${icon('implementation')}How to implement</a>`+actions;
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1 tabindex="-1">${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function overview(m) {
  const assurance=engine.assuranceMetrics(),governance=engine.governanceMetrics();
  return `${pageHeader('CLOUD TRUST / WORKSPACE','Trust overview','Start Trusted. Access When Trusted. Stay Trusted. Prove Trust.',button('Reset demo','reset','ghost','refresh')+button(ui.guide?'Continue walkthrough':'Run guided demo','guide','primary','play'))}
    <section class="metrics" aria-label="Live simulation metrics">
      <article class="metric-card"><div class="metric-label">Trusted environments ${icon('foundations')}</div><div class="metric-value">${m.trusted}<span>/ ${m.total}</span></div><div class="metric-note"><span class="${m.total-m.trusted-m.conditional?'small-amber':'small-green'}">${m.total-m.trusted-m.conditional} need attention</span>${m.conditional?` · ${m.conditional} with an exception`:' · Across three clouds'}</div></article>
      <article class="metric-card"><div class="metric-label">Active privileged sessions ${icon('access')}</div><div class="metric-value">${m.active}<span class="metric-word">temporary</span></div><div class="metric-note">No standing grants in this simulation</div></article>
      <article class="metric-card"><div class="metric-label">Unresolved assurance findings ${icon('assurance')}</div><div class="metric-value">${assurance.open}<span class="metric-word">findings</span></div><div class="metric-note">${assurance.critical} critical · ${assurance.inProgress} in progress</div></article>
      <article class="metric-card"><div class="metric-label">Current control attestations ${icon('governance')}</div><div class="metric-value">${governance.current}<span>/ ${governance.coverageDenominator}</span></div><div class="metric-note">${governance.reviewPending} awaiting review · ${governance.exceptions} active exceptions</div></article>
    </section>
    <section class="trust-bridge" aria-labelledby="bridge-title"><div class="bridge-heading"><div><span class="eyebrow">THE CLOUD TRUST LIFECYCLE</span><h2 id="bridge-title">Four pillars. One continuous trust story.</h2></div><span class="bridge-tag">Shared policy & evidence ${icon('refresh')}</span></div>
      <div class="trust-pillars">${[['foundations','Secure provisioning and baseline controls'],['access','Justified, temporary privileged access'],['assurance','Detect, remediate, and verify change'],['governance','Accountable decisions and proof']].map(([key,description],i)=>`<button class="trust-pillar" data-action="navigate" data-page="${key}"><span class="pillar-number">0${i+1} ${icon(key)}</span><b>${titles[key]}</b><strong>${taglines[key]}</strong><small>${description}</small><span class="pillar-open">Explore ${icon('arrow')}</span></button>`).join('')}</div>
      <div class="bridge-bottom"><span>${icon('check')} A common workload identity</span><span>${icon('check')} Decisions respond to changing signals</span><span>${icon('check')} Evidence across the full lifecycle</span></div>
    </section>
    <div class="overview-grid"><section class="panel environment-panel"><div class="panel-heading"><div><h2>Environment portfolio <span class="count">${engine.environments.length}</span></h2><p>${m.total} active workloads across AWS, Azure, and GCP</p></div><button class="text-button" data-action="navigate" data-page="foundations">View all ${icon('arrow')}</button></div>${environmentTable(engine.environments.slice(0,6),false)}</section>
    <section class="demo-card"><div class="demo-card-top"><span class="eyebrow">ONE CONNECTED PRODUCT STORY</span><span class="play-symbol">${icon('play')}</span></div><h2>From first deploy<br>to verified trust.</h2><p>Follow one workload through all four pillars.</p><ol class="demo-story"><li><span>01</span>Establish the foundation</li><li><span>02</span>Justify temporary access</li><li><span>03</span>Detect, remediate, and verify</li><li><span>04</span>Attest and prove trust</li></ol>${button(ui.guide?'Continue walkthrough':'Start the walkthrough','guide','demo-start','arrow')}<span class="demo-card-note">Guided scenario · presenter notes included</span></section></div>
    <section class="panel activity-panel"><div class="panel-heading"><div><h2>Latest trust decisions</h2><p>All four pillars, in the same timeline</p></div><button class="text-button" data-action="navigate" data-page="evidence">All evidence ${icon('arrow')}</button></div><div class="compact-events">${engine.events.slice(0,4).map(event=>`<div class="compact-event"><span class="event-icon ${event.outcome==='Revoked'?'red':''}">${icon(eventIcon(event.domain))}</span><div><b>${esc(event.action)}</b><span>${esc(event.subject)}</span></div>${badge(event.outcome)}<time>${time(event.at)}</time></div>`).join('')}</div></section>`;
}
function environmentTable(environments,full=true) {
  return `<div class="table-wrap"><table><thead><tr><th>Environment</th>${full?'<th>Owner</th>':''}<th>Trust status</th><th>Controls</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>${environments.map(env=>{const trust=engine.trust(env);return `<tr><td><button class="env-link" data-action="environment" data-id="${esc(env.id)}">${provider(env.provider)}<span><b>${esc(env.name)}</b><small>${esc(env.provider)} <span>·</span> ${esc(env.tier)}</small></span></button></td>${full?`<td class="owner-cell">${esc(env.owner)}</td>`:''}<td>${badge(trust.label)}</td><td><span class="control-score">${trust.passed}<span> / 6</span></span><span class="tiny-progress"><i style="width:${trust.passed/6*100}%"></i></span></td><td><button class="icon-button" aria-label="Inspect ${esc(env.name)}" data-action="environment" data-id="${esc(env.id)}">${icon('chevron')}</button></td></tr>`}).join('')}</tbody></table></div>`;
}
function foundations(m) {
  const filtered=engine.environments.filter(e=>ui.provider==='All clouds'||e.provider===ui.provider);
  return `${pageHeader('PILLAR 01 / START TRUSTED','Cloud Foundations','Establish secure configurations, ownership, and an approved baseline.',button('View baseline policy','policy-code','secondary','policies')+button('Provision environment','provision','primary','plus'))}
    <div class="capability-banner"><span class="capability-symbol">${icon('foundations')}</span><div><h2>Secure defaults. Continuous assurance.</h2><p>A common blueprint establishes six controls. Posture changes feed directly into access decisions.</p></div><span class="badge green">Blueprint v1.5</span></div>
    <section class="panel"><div class="panel-heading"><div><h2>Environments <span class="count">${engine.environments.length}</span></h2><p>${m.trusted} trusted · ${m.conditional} with exceptions · ${m.total-m.trusted-m.conditional} need attention · ${m.retired} retiring or retired</p></div><label class="filter-label"><span class="sr-only">Filter environments by cloud</span><select id="provider-filter">${['All clouds','AWS','Azure','GCP'].map(p=>`<option ${p===ui.provider?'selected':''}>${p}</option>`).join('')}</select></label></div>${environmentTable(filtered)}</section>
    <div class="section-title"><h2>The trusted baseline</h2><span>Shared across all three clouds</span></div><section class="control-catalog">${CONTROLS.map((c,i)=>`<article><span class="control-number">0${i+1}</span><h3>${c.name}</h3><p>${c.requirement}</p><span class="control-footer">${icon('check')} Required by blueprint</span></article>`).join('')}</section>`;
}
function access(m) {
  return `${pageHeader('PILLAR 02 / ACCESS WHEN TRUSTED','Cloud Access','Privilege when justified. Gone when it isn’t.',button('Request access','request','primary','plus'))}
    <div class="access-summary"><div><span class="summary-icon">${icon('lock')}</span><span><strong>${m.active}</strong> active privileged session${m.active===1?'':'s'}</span></div><div class="access-summary-detail"><span>Standing grants <b>0</b></span><span>Maximum duration <b>60 min</b></span><span>Policy <b>v${POLICY.version}</b></span></div></div>
    <section class="panel"><div class="panel-heading"><div><h2>Temporary sessions</h2><p>Evaluated against environment, identity, task, and time</p></div>${button('Advance 31 min','advance','secondary','clock','data-minutes="31"')}</div>${engine.sessions.length?`<div class="table-wrap"><table><thead><tr><th>Identity & scope</th><th>Environment</th><th>Status</th><th>Time remaining</th><th>Action</th></tr></thead><tbody>${engine.sessions.map(session=>`<tr><td><div class="identity-cell"><span class="avatar">${esc(engine.person(session.personId).initials)}</span><span><b>${esc(engine.person(session.personId).name)}</b><small>${esc(session.role)}</small></span></div></td><td><button class="text-button dark" data-action="environment" data-id="${session.envId}">${esc(engine.env(session.envId).name)}</button><small class="cell-sub">${esc(session.taskId)}</small></td><td>${badge(session.status)}</td><td><span data-countdown="${session.id}" class="countdown"></span></td><td>${session.status==='Active'?button('End session','revoke','secondary','','data-id="'+session.id+'"'):`<button class="text-button" data-action="session-evidence" data-id="${session.envId}">Evidence ${icon('arrow')}</button>`}</td></tr>`).join('')}</tbody></table></div>`:empty('access','No active privileges','Request temporary access to a trusted environment, or start the guided scenario.',button('Request access','request','secondary','plus'))}<div class="panel-footnote">${icon('clock')} Demo clock: <span data-clock>${time(engine.now())} UTC</span>. Advance time to demonstrate expiration.</div></section>
    <div class="two-column"><section class="panel"><div class="panel-heading"><div><h2>Identity signals</h2><p>Change Casey’s context to test continuous evaluation</p></div><span class="badge gray">Simulator</span></div><div class="signal-person"><span class="avatar">CM</span><div><b>Casey Morgan</b><span>Platform engineer</span></div></div><div class="signal-list">${[{id:'employed',name:'Employment active',description:'Identity is active and eligible'},{id:'mfa',name:'Strong authentication',description:'MFA requirement satisfied'},{id:'managed',name:'Managed device',description:'Device meets the access policy'}].map(p=>`<div class="signal-row"><div><b>${p.name}</b><span>${p.description}</span></div><button class="switch ${engine.person('casey')[p.id]?'on':''}" role="switch" aria-checked="${engine.person('casey')[p.id]}" aria-label="${p.name}" data-action="identity-signal" data-signal="${p.id}"><span></span></button></div>`).join('')}</div></section>
    <section class="panel"><div class="panel-heading"><div><h2>Access decisions</h2><p>Every request includes a reason</p></div></div>${engine.requests.length?`<div class="request-list">${engine.requests.slice(0,5).map(r=>`<button class="request-row" data-action="decision" data-id="${r.id}"><span><b>${esc(engine.person(r.personId).name)}</b><small>${esc(engine.env(r.envId).name)} · ${r.minutes} min</small></span>${badge(r.status)}${icon('chevron')}</button>`).join('')}</div>`:empty('policies','Ready to evaluate','Try a managed identity, an unmanaged device, or a role requiring review.')}</section></div>`;
}
function policies(embedded=false) {
  const pending=engine.requests.filter(r=>r.status==='Pending review');
  return `${embedded?'':pageHeader('SHARED CONTROL PLANE','Policies & exceptions','One set of trust conditions connects all four pillars.',badge('Policy v'+POLICY.version,'green'))}
    <div class="policy-layout"><section class="panel policy-main"><div class="panel-heading"><div><h2>Privileged access policy</h2><p>All required conditions must be satisfied</p></div><span class="policy-state">${icon('check')} Evaluating</span></div><ol class="policy-rules">${[
      ['Foundation posture','All six controls pass, or a narrowly scoped approved exception covers the failed networking control.'],
      ['Identity assurance','Active identity, strong authentication, and a managed device. A reviewer cannot override these checks.'],
      ['Justified work','An approved task assigned to the identity and scoped to the selected environment, plus a business reason.'],
      ['Least-duration access','Up to 60 minutes. Operator requests can pass automatically. Administrator requests require a reviewer.'],
      ['Continuous evaluation','Re-evaluate active grants when trust changes. Revoke on failed conditions; expire when the window ends.']
    ].map((r,i)=>`<li><span>${i+1}</span><div><h3>${r[0]}</h3><p>${r[1]}</p></div></li>`).join('')}</ol></section>
    <aside class="policy-explanation"><span class="eyebrow">DESIGNED TO WORK TOGETHER</span><h2>The environment is part of the access decision.</h2><p>An identity can satisfy every identity check and still be denied access to an environment that fails its foundation policy.</p><div class="policy-equation"><span>Environment trust</span><b>+</b><span>Identity & task context</span><b>+</b><span>Time-bound privilege</span><i></i><strong>Justified access</strong></div></aside></div>
    <section class="panel"><div class="panel-heading"><div><h2>Access review queue <span class="count">${pending.length}</span></h2><p>Acting as Taylor Brooks · simulated independent reviewer</p></div><span class="badge gray">Demo review role</span></div>${pending.length?`<div class="review-list">${pending.map(r=>`<article class="review-item"><div><h3>${esc(engine.person(r.personId).name)} requests ${esc(r.role)}</h3><p>${esc(engine.env(r.envId).name)} · ${r.minutes} minutes · ${esc(r.taskId)}</p><p class="quote">${esc(r.reason)}</p></div><div class="review-actions">${button('Reject','review-access','secondary','','data-id="'+r.id+'" data-approve="false"')}${button('Approve','review-access','primary','','data-id="'+r.id+'" data-approve="true"')}</div></article>`).join('')}</div>`:empty('check','No requests awaiting review','Request Platform administrator access to demonstrate this path.')}</section>
    <section class="panel"><div class="panel-heading"><div><h2>Time-bound exceptions <span class="count">${engine.exceptions.length}</span></h2><p>Nonproduction networking only · accountable owner · 60-minute limit</p></div>${button('Request exception','exception','secondary','plus')}</div>${engine.exceptions.length?`<div class="review-list">${engine.exceptions.map(e=>`<article class="review-item"><div><h3>${esc(engine.env(e.envId).name)} ${badge(e.status)}</h3><p>${esc(e.owner)} · Private networking${e.expiresAt?' · Expires '+time(e.expiresAt)+' UTC':''}</p><p class="quote">${esc(e.reason)}</p><p><b>Compensating control:</b> ${esc(e.compensation)}</p></div><div class="review-actions">${e.status==='Pending review'?button('Reject','review-exception','secondary','','data-id="'+e.id+'" data-approve="false"')+button('Approve 60 min','review-exception','primary','','data-id="'+e.id+'" data-approve="true"'):button('Evidence','session-evidence','secondary','arrow','data-id="'+e.envId+'"')}</div></article>`).join('')}</div>`:empty('clock','Exceptions have boundaries','A request does not bypass a control. A reviewer must approve the scope, owner, and compensating control.')}<div class="panel-footnote">Production posture failures and identity failures cannot be waived in this demo. Expiry triggers re-evaluation.</div></section>`;
}
function evidence(embedded=false) {
  const events=engine.events.filter(e=>(ui.evidenceDomain==='All activity'||e.domain===ui.evidenceDomain)&&(ui.evidenceEnv==='All environments'||e.envId===ui.evidenceEnv));
  return `${embedded?'':pageHeader('SHARED EVIDENCE','A continuous trust record','Every decision has an owner, a reason, and supporting context.',button('Export evidence','export','primary','download'))}
    <div class="evidence-summary"><span class="evidence-summary-icon">${icon('evidence')}</span><div><h2>${engine.events.length} recorded events</h2><p>Policy v${POLICY.version} · ${engine.environments.length} environments · ${engine.requests.length} access requests</p></div><span class="badge gray">Synthetic evidence</span></div>
    <section class="panel"><div class="panel-heading"><div><h2>Decision timeline</h2><p>Newest first · ${events.length} matching event${events.length===1?'':'s'} · UTC</p></div><div class="filter-row"><label><span class="sr-only">Filter evidence by domain</span><select id="evidence-domain">${[['All activity','All activity'],['foundation','Foundations'],['access','Access'],['identity','Identity'],['assurance','Assurance'],['governance','Governance'],['policy','Policy']].map(([v,t])=>`<option value="${v}" ${ui.evidenceDomain===v?'selected':''}>${t}</option>`).join('')}</select></label><label><span class="sr-only">Filter evidence by environment</span><select id="evidence-env"><option>All environments</option>${engine.environments.map(e=>`<option value="${e.id}" ${ui.evidenceEnv===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></label></div></div>
    ${events.length?`<ol class="timeline">${events.map(event=>`<li><div class="timeline-time"><b>${time(event.at)}</b><span>${date(event.at)}</span></div><div class="timeline-marker ${['Revoked','Denied'].includes(event.outcome)?'negative':''}">${icon(eventIcon(event.domain))}</div><article class="timeline-content"><div><h3>${esc(event.action)}</h3>${badge(event.outcome)}</div><p class="timeline-subject">${esc(event.subject)} ${event.envId?`<span>· ${esc(engine.env(event.envId).name)}</span>`:''}</p><p>${esc(event.detail)}</p><div class="event-metadata"><span>${esc(event.id)}</span><span>${esc(event.domain)}</span><span>Policy ${event.policyVersion}</span><span>${esc(event.actor)}</span>${event.findingId?`<span>${esc(event.findingId)}</span>`:''}${(event.findingIds||[]).map(id=>`<span>${esc(id)}</span>`).join('')}${event.attestationId?`<span>${esc(event.attestationId)}</span>`:''}${event.riskDecisionId?`<span>${esc(event.riskDecisionId)}</span>`:''}${event.scanId?`<span>${esc(event.scanId)}</span>`:''}${event.requestId?`<span>${esc(event.requestId)}</span>`:''}${event.sessionId?`<span>${esc(event.sessionId)}</span>`:''}${event.exceptionId?`<span>${esc(event.exceptionId)}</span>`:''}</div></article></li>`).join('')}</ol>`:empty('evidence','No matching events','Try another domain or environment filter.')}
    </section><p class="evidence-note">This demonstration shows evidence relationships. Production would require authenticated actors, durable event storage, provider confirmations, and retention controls.</p>`;
}

function openDialog(title,body,footer='',type='') {
  const root=$('#dialog-root');
  ui.modal=null;
  if($('dialog',root)) $('dialog',root).close();
  root.innerHTML=`<dialog class="modal ${type}" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" aria-label="Close dialog" data-action="close">${icon('x')}</button></div><div class="modal-body">${body}</div><div class="modal-feedback" role="status" aria-live="polite"></div>${footer?`<div class="modal-footer">${footer}</div>`:''}</dialog>`;
  const dialog=$('dialog',root); dialog.showModal();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  dialog.addEventListener('close',()=>{if(dialog===$('dialog'))ui.modal=null;if(!$('dialog[open]')&&(!document.activeElement||document.activeElement===document.body))$('#main')?.focus({preventScroll:true});});
}
function dialogHasUserInput() {
  const dialog=$('dialog[open]');if(!dialog)return false;
  return [...dialog.querySelectorAll('input:not([type=hidden]),textarea,select')].some(el=>el.tagName==='SELECT'?[...el.options].some(o=>o.selected!==o.defaultSelected):el.value!==el.defaultValue);
}
function closeDialog() { const dialog=$('dialog'); if(dialog)dialog.close(); ui.modal=null; }
function toast(message) {const t=$('#toast');t.textContent=message;t.classList.add('show');const feedback=$('dialog[open] .modal-feedback');if(feedback)feedback.textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),4500);}
function applyRoute(route) {const aliases={policies:'governance/decisions',evidence:'governance/evidence'};const [page,tab,pillar]=(aliases[route]||route).split('/');ui.page=routes.includes(page)||page==='implementation'?page:'overview';if(ui.page==='assurance')ui.assuranceTab=['findings','posture','lifecycle'].includes(tab)?tab:'findings';if(ui.page==='governance')ui.governanceTab=['overview','decisions','attestations','evidence'].includes(tab)?tab:'overview';if(ui.page==='implementation')implementation.applyRoute(tab,pillar);}
function navigate(page) {applyRoute(page);if(location.hash==='#'+page)render();else location.hash=page;}
function resetUiState() {Object.assign(ui,{guide:null,provider:'All clouds',evidenceEnv:'All environments',evidenceDomain:'All activity',assuranceEnv:'all',findingState:'Unresolved',findingSeverity:'All priorities',assuranceTab:'findings',governanceTab:'overview'});}
function eventIcon(domain){return ({foundation:'foundations',access:'access',identity:'lock',assurance:'assurance',governance:'governance',policy:'policies'})[domain]||'evidence';}
function formError(form,error) {$('[data-form-error]',form).textContent=error.message;}
function showProvision() {
  openDialog('Provision a trusted environment',`<p class="modal-intro">Start with the same secure baseline in AWS, Azure, or GCP.</p><form id="provision-form"><div class="form-grid"><label class="field full">Environment name<input name="name" placeholder="claims-api-prod" pattern="[a-z][a-z0-9-]{2,39}" maxlength="40" required autocomplete="off"><small>3–40 lowercase letters, numbers, or hyphens.</small></label><label class="field">Cloud provider<select name="provider"><option>AWS</option><option>Azure</option><option>GCP</option></select></label><label class="field">Environment type<select name="tier"><option>Production</option><option>Nonproduction</option></select></label><label class="field full">Service owner<input name="owner" placeholder="Claims Platform" minlength="3" maxlength="80" required></label></div><div class="blueprint-preview"><div>${icon('foundations')}<span><b>Managed workload</b><small>Blueprint v1.5 · six mandatory controls</small></span>${badge('Secure defaults','green')}</div><p>Approved image · private networking · encryption · audit logging · ownership · current signals</p></div><p class="form-note">Simulation only. Creates a synthetic environment and a sample approved change for the demo.</p><div data-form-error role="alert" class="form-error"></div><div class="form-actions">${button('Cancel','close')}<button class="btn primary" type="submit">${icon('plus')}Provision environment</button></div></form>`);
}
function showEnvironment(id) {
  const env=engine.env(id),trust=engine.trust(env);
  const findingCount=engine.findings.filter(f=>f.envId===id&&['Open','In progress'].includes(f.status)).length;
  openDialog(esc(env.name),`<div class="environment-detail-summary"><div>${provider(env.provider)}<span><b>${esc(env.provider)} · ${esc(env.tier)}</b><small>${esc(env.region)} · ${esc(env.owner)}</small></span></div>${badge(trust.label)}</div>
    <div class="environment-tags"><span>Owner: ${esc(env.tags.owner)}</span><span>Cost center: ${esc(env.tags.costCenter)}</span><span>Lifecycle: ${env.lifecycle}</span><span>${findingCount} unresolved findings</span></div>
    <div class="detail-section-title"><h3>${env.lifecycle==='Active'?'Foundation baseline':'Last observed baseline'}</h3><span>${trust.passed}/6 controls passing</span></div>
    <ul class="control-details">${CONTROLS.map(c=>`<li><span class="control-result ${env.controls[c.id]?'pass':'fail'}">${icon(env.controls[c.id]?'check':'alert')}</span><div><b>${c.name}</b><p>${c.requirement}</p></div>${badge(env.controls[c.id]?'Pass':trust.blocking.some(b=>b.id===c.id)?'Fail':'Exception',env.controls[c.id]?'green':trust.blocking.some(b=>b.id===c.id)?'red':'amber')}</li>`).join('')}</ul>
    ${env.lifecycle==='Active'?`<div class="simulation-box"><div class="detail-section-title"><h3>Simulate a trust change</h3><span>Demo controls</span></div><div class="simulation-actions"><select id="drift-control" aria-label="Control to change">${CONTROLS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>${button('Trigger drift','drift','danger-outline','bolt','data-id="'+env.id+'"')}</div><p>Assurance creates a finding and re-evaluates access. Changed baseline evidence makes earlier attestations stale.</p></div>`:`<div class="callout">${icon('lock')}This workload is ${env.lifecycle.toLowerCase()}. New access is blocked; the historical baseline and evidence remain available.</div>`}`,
    `${button('Evidence','session-evidence','secondary','evidence','data-id="'+env.id+'"')}${button('View findings','environment-findings','secondary','assurance','data-id="'+env.id+'"')}${trust.failed.length&&env.lifecycle==='Active'?button('Restore baseline','remediate','secondary','refresh','data-id="'+env.id+'"'):''}${env.lifecycle==='Active'?button('Request access','request','primary','access','data-id="'+env.id+'"'):''}`,'wide');
  ui.modal={type:'environment',id};
}
function requestInput(form) {const f=new FormData(form);return {envId:f.get('envId'),personId:f.get('personId'),role:f.get('role'),taskId:f.get('taskId'),minutes:Number(f.get('minutes')),reason:f.get('reason')};}
function showRequest(envId) {
  const selected=envId||engine.environments[0].id;
  openDialog('Request temporary access',`<p class="modal-intro">Justify the work. Check the context. Grant only the time required.</p><form id="request-form"><div class="form-grid"><label class="field full">Environment<select name="envId">${engine.environments.map(e=>`<option value="${e.id}" ${e.id===selected?'selected':''}>${esc(e.name)} · ${esc(e.provider)}</option>`).join('')}</select></label><label class="field full">Identity<select name="personId">${engine.people.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.title)}</option>`).join('')}</select></label><label class="field">Role<select name="role">${ROLES.map(r=>`<option>${r}</option>`).join('')}</select></label><label class="field">Duration<select name="minutes"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="60">60 minutes</option></select></label><label class="field full">Approved work item<select name="taskId">${taskOptions(selected)}</select></label><label class="field full">Business justification<textarea name="reason" minlength="10" maxlength="500" required placeholder="Deploy the approved release and validate application health." rows="2"></textarea></label></div><div id="request-checks" class="request-checks"></div><div data-form-error role="alert" class="form-error"></div><div class="form-actions">${button('Cancel','close')}<button type="submit" class="btn primary">${icon('policies')}Evaluate request</button></div></form>`,'','wide');
  updateRequestChecks();
}
function taskOptions(envId) {return engine.tasks.filter(t=>t.envId===envId).map(t=>`<option value="${t.id}">${esc(t.id)} · ${esc(t.title)} (sample)</option>`).join('');}
function updateRequestChecks() {
  const form=$('#request-form');if(!form)return;
  const checks=engine.checks(requestInput(form)).filter(c=>!['reason','duration','role'].includes(c.id));
  $('#request-checks').innerHTML=`<div class="eyebrow">CURRENT TRUST SIGNALS</div>${checks.map(c=>`<div class="inline-check ${c.ok?'pass':'fail'}">${icon(c.ok?'check':'x')}<span>${c.name}</span><b>${c.ok?'Pass':'Fail'}</b></div>`).join('')}<p>${$('[name=role]',form).value==='Platform administrator'?'This role requires independent review after all required checks pass.':'A justified operator request can be granted automatically when all checks pass.'}</p>`;
}
function showDecision(id) {
  const r=engine.requests.find(r=>r.id===id);if(!r)return;
  openDialog('Access decision',`<div class="decision-result ${r.status==='Granted'?'success':r.status==='Denied'?'denied':'pending'}">${icon(r.status==='Granted'?'check':r.status==='Denied'?'lock':'clock')}<div><h3>${r.status==='Granted'?'Temporary access granted':r.status==='Denied'?'Access denied':'Independent review required'}</h3><p>${esc(engine.person(r.personId).name)} · ${esc(engine.env(r.envId).name)}</p></div></div><p class="modal-intro">${esc(r.role)} · ${r.minutes} minutes · ${esc(r.taskId)}</p><ul class="decision-checks">${r.checks.map(c=>`<li><span class="control-result ${c.ok?'pass':'fail'}">${icon(c.ok?'check':'x')}</span><div><b>${c.name}</b><p>${esc(c.detail)}</p></div></li>`).join('')}</ul><p class="form-note">Recorded at ${time(r.createdAt)} UTC. This is the request decision; session status may change as signals or time change.</p>`,`${button('Close','close')}${button(r.status==='Pending review'?'Open review queue':'View sessions','decision-next','primary','arrow','data-page="'+(r.status==='Pending review'?'policies':'access')+'"')}`);
}
function showException() {
  const eligible=engine.environments.filter(e=>e.lifecycle==='Active'&&e.tier==='Nonproduction'&&!e.controls.network);
  openDialog('Request a scoped exception',eligible.length?`<p class="modal-intro">A human review is required. This exception can cover only nonproduction private networking, for 60 minutes.</p><form id="exception-form"><div class="form-grid"><label class="field full">Environment<select name="envId">${eligible.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label><label class="field full">Business justification<textarea name="reason" minlength="10" maxlength="500" rows="2" required placeholder="Why is a short exception necessary?"></textarea></label><label class="field full">Compensating control<textarea name="compensation" minlength="10" maxlength="500" rows="2" required placeholder="For example, restrict ingress to an approved test runner IP range."></textarea></label></div><div class="callout">${icon('info')}The environment owner remains accountable. Other baseline and identity requirements still apply.</div><div data-form-error role="alert" class="form-error"></div><div class="form-actions">${button('Cancel','close')}<button type="submit" class="btn primary">Submit for review</button></div></form>`:empty('check','No eligible environments','Trigger private-networking drift on a nonproduction environment to explore the exception path.'),eligible.length?'':button('Close','close'));
}

const guideSteps=[
  {pillar:0,name:'Establish the foundation',capability:'CLOUD FOUNDATIONS / START TRUSTED',title:'Start with a trusted baseline.',body:'Launch claims-api-prod in AWS with six secure baseline controls, an accountable owner, and workload tags.',say:'“We establish trust before the first workload is deployed. The baseline becomes the reference for every later decision.”',action:'Provision trusted environment'},
  {pillar:1,name:'Justify temporary access',capability:'CLOUD ACCESS / ACCESS WHEN TRUSTED',title:'Privilege, with a purpose.',body:'Casey has a managed device, MFA, and an approved deployment task. Request Workload operator access to the same environment for 30 minutes.',say:'“Privilege depends on the environment, the identity, and the work. The grant is temporary and continuously re-evaluated.”',action:'Grant 30-minute access'},
  {pillar:2,name:'Detect a trust change',capability:'CLOUD ASSURANCE / STAY TRUSTED',title:'Detect drift. Remove exposure.',body:'A critical image finding breaks the baseline. Assurance creates a finding, routes it to the owner, and causes Casey’s active session to be revoked.',say:'“A finding is more than a dashboard alert: it changes the access decision and becomes accountable remediation work.”',action:'Inject finding & revoke access'},
  {pillar:2,name:'Own the remediation',capability:'ASSURANCE + GOVERNANCE',title:'Turn the finding into a decision.',body:'Assign the finding to Claims Platform, record a Remediate risk decision, and start the clean-image remediation plan.',say:'“The owner, the chosen action, and the rationale are now part of the same record. The finding remains unresolved until verification.”',action:'Assign, decide & start remediation'},
  {pillar:2,name:'Verify the recovery',capability:'CLOUD ASSURANCE / STAY TRUSTED',title:'A fix is complete when verified.',body:'Apply the approved clean image and verify that the control passes. The finding closes. Casey’s old session remains revoked.',say:'“We measure verified outcomes. Restoring the environment does not quietly restore old privileges.”',action:'Apply fix & verify recovery'},
  {pillar:3,name:'Attest the controls',capability:'CLOUD GOVERNANCE / PROVE TRUST',title:'Capture the owner’s statement.',body:'The workload owner attests to the six restored baseline controls. Capture the evidence snapshot and submit it to an independent demo reviewer.',say:'“The attestation captures what was reviewed, who owns it, and which evidence supported it. Submission still needs approval.”',action:'Submit baseline attestation'},
  {pillar:3,name:'Prove the complete story',capability:'CLOUD GOVERNANCE / PROVE TRUST',title:'Review it. Prove trust.',body:'Approve the current evidence as Taylor Brooks, then review the full timeline: provisioning, access, finding, revocation, risk decision, remediation, and attestation.',say:'“All four pillars share one traceable trust story. A later posture or ownership change will make this attestation stale.”',action:'Approve & open the evidence trail'}
];
function showGuide() {
  if(!ui.guide && engine.environments.some(e=>e.name==='claims-api-prod')){
    openDialog('Start a fresh walkthrough?',`<p class="modal-intro">The claims-api-prod scenario has already been provisioned. Reset the simulated workspace to run the complete story again.</p><p>Current demo changes and events will be cleared. Export evidence first if you want to keep them.</p>`,button('Keep exploring','close')+button('Reset & start walkthrough','restart-guide','primary','play'));
    return;
  }
  if(!ui.guide)ui.guide={step:0,envId:null};
  const step=guideSteps[ui.guide.step],env=ui.guide.envId?engine.env(ui.guide.envId):null;
  const sessions=env?engine.sessions.filter(s=>s.envId===env.id):[];
  openDialog('The Cloud Trust walkthrough',`<div class="guide-progress">${routes.slice(1).map((key,i)=>`<div class="${i<step.pillar?'done':i===step.pillar?'current':''}"><span>${i<step.pillar?icon('check'):i+1}</span><b>${titles[key]}</b></div>`).join('')}</div><div class="guide-content"><div class="guide-step-counter">STEP ${ui.guide.step+1} OF ${guideSteps.length} · ${step.name}</div><span class="eyebrow">${step.capability}</span><h3>${step.title}</h3><p>${step.body}</p><div class="guide-live"><span class="eyebrow">LIVE SCENARIO STATE</span><div><span>claims-api-prod</span>${env?badge(engine.trust(env).label):badge('Not provisioned')}</div><div><span>Casey’s privileged access</span>${sessions.length?badge(sessions[0].status):badge('No access')}</div><div><span>Assurance finding</span>${env&&engine.findings.some(f=>f.envId===env.id)?badge(engine.findings.find(f=>f.envId===env.id).status):badge('No findings')}</div><div><span>Control attestation</span>${env&&engine.attestations.some(a=>a.envId===env.id)?badge(engine.attestations.find(a=>a.envId===env.id).status):badge('Not submitted')}</div><div><span>Recorded workload events</span><b>${env?engine.events.filter(e=>e.envId===env.id).length:0}</b></div></div><div class="presenter-note"><span>YOUR TALK TRACK</span><p>${step.say}</p></div><p class="form-note">Synthetic scenario. Actions update the same Foundations, Access, Assurance, and Governance records.</p></div>`,`${button('Explore workspace','close','secondary')}${button(step.action,'guide-next','primary',ui.guide.step===2?'bolt':'arrow')}`,'guide-modal');
}
function advanceGuide() {
  if(!ui.guide)return;
  const g=ui.guide;let route='overview';
  if(g.step===0){
    if(engine.environments.some(e=>e.name==='claims-api-prod'))throw new Error('Reset the demo to start this scenario from its beginning.');
    const env=engine.provision({name:'claims-api-prod',provider:'AWS',tier:'Production',owner:'Claims Platform'});g.envId=env.id;g.step=1;route='foundations';
  }else if(g.step===1){
    const task=engine.tasks.find(t=>t.envId===g.envId);
    const request=engine.requestAccess({envId:g.envId,personId:'casey',role:'Workload operator',taskId:task.id,minutes:30,reason:'Deploy the approved claims API release and validate application health.'});
    if(request.status!=='Granted'){render();showDecision(request.id);toast('Restore the failing signals before continuing the walkthrough.');return;}
    g.step=2;route='access';
  }else if(g.step===2){
    if(!engine.sessions.some(s=>s.envId===g.envId&&s.personId==='casey'&&s.status==='Active'))throw new Error('Casey needs an active operator session on claims-api-prod for this revocation step.');
    engine.changeControl(g.envId,'image',false);g.findingId=engine.findings.find(f=>f.envId===g.envId&&f.control==='image'&&f.status==='Open').id;g.step=3;ui.assuranceEnv=g.envId;ui.findingState='All states';route='assurance/findings';
  }else if(g.step===3){
    if(engine.finding(g.findingId).status!=='Open')throw new Error('The walkthrough finding is no longer open. Reset the demo to replay this step.');
    engine.assignFinding(g.findingId,'Claims Platform','The workload owner will replace the image and verify its scan.');
    engine.recordRiskDecision({findingId:g.findingId,disposition:'Remediate',rationale:'Replace the affected production image immediately; no production exception is allowed.'});
    engine.startRemediation(g.findingId);g.step=4;route='assurance/findings';
  }else if(g.step===4){
    engine.completeRemediation(g.findingId);g.step=5;route='assurance/posture';
  }else if(g.step===5){
    const attestation=engine.submitAttestation({envId:g.envId,statement:'Claims Platform reviewed the six restored baseline controls, verified the clean-image remediation, and confirmed ownership and supporting evidence.'});g.attestationId=attestation.id;g.step=6;route='governance/attestations';
  }else{
    engine.reviewAttestation(g.attestationId,true,'Reviewed the current baseline, the verified remediation, accountable ownership, and the linked evidence.');
    ui.evidenceEnv=g.envId;ui.evidenceDomain='All activity';ui.guide=null;closeDialog();navigate('governance/evidence');render();toast('All four pillars are connected in this evidence trail.');return;
  }
  applyRoute(route);history.replaceState(null,'','#'+route);render();showGuide();
}

document.addEventListener('click',e=>{
  const target=e.target.closest('[data-action]');if(!target)return;
  const a=target.dataset.action,id=target.dataset.id;
  try {
    if(implementation.action(a,id))return;
    if(pillars.action(a,id))return;
    if(a==='close')closeDialog();
    else if(a==='navigate')navigate(target.dataset.page);
    else if(a==='provision')showProvision();
    else if(a==='environment')showEnvironment(id);
    else if(a==='environment-findings'){ui.assuranceEnv=id;ui.findingState='All states';ui.findingSeverity='All priorities';closeDialog();navigate('assurance/findings');}
    else if(a==='request')showRequest(id);
    else if(a==='decision')showDecision(id);
    else if(a==='decision-next'){closeDialog();navigate(target.dataset.page);}
    else if(a==='drift'){engine.changeControl(id,$('#drift-control').value,false);render();showEnvironment(id);toast('Trust changed. Active access was re-evaluated.');}
    else if(a==='remediate'){engine.remediate(id);render();showEnvironment(id);toast('Baseline restored. Old sessions remain closed.');}
    else if(a==='identity-signal'){const key=target.dataset.signal;engine.changeIdentity('casey',key,!engine.person('casey')[key]);render();$(`[data-signal="${key}"]`)?.focus();toast('Identity signal updated. Active access was re-evaluated.');}
    else if(a==='advance'){const minutes=Number(target.dataset.minutes);engine.advance(minutes);render();toast(`Demo clock advanced by ${minutes>=120?minutes/60+' hours':minutes+' minutes'}.`);}
    else if(a==='revoke'){engine.revoke(id);render();toast('Temporary session ended.');}
    else if(a==='exception')showException();
    else if(a==='review-access'){const r=engine.reviewAccess(id,target.dataset.approve==='true');render();showDecision(r.id);}
    else if(a==='review-exception'){engine.reviewException(id,target.dataset.approve==='true');render();toast('Exception review recorded.');}
    else if(a==='session-evidence'){ui.evidenceEnv=id;ui.evidenceDomain='All activity';closeDialog();navigate('evidence');}
    else if(a==='guide')showGuide();
    else if(a==='restart-guide'){engine.reset();resetUiState();ui.page='overview';history.replaceState(null,'','#overview');render();showGuide();}
    else if(a==='guide-next')advanceGuide();
    else if(a==='reset')openDialog('Reset the demo?',`<p class="modal-intro">Clear the current simulated environments, access requests, sessions, and events, then return to the original sample portfolio.</p><p>Export evidence first if you want to keep the current walkthrough.</p>`,button('Keep exploring','close')+button('Reset demo','confirm-reset','primary','refresh'));
    else if(a==='confirm-reset'){engine.reset();resetUiState();closeDialog();navigate('overview');render();toast('Demo reset. Ready for a fresh walkthrough.');}
    else if(a==='export'){
      const blob=new Blob([JSON.stringify(engine.exportEvidence(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='cloud-trust-demo-evidence.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Complete synthetic evidence bundle exported.');
    }
  }catch(error){toast(error.message);}
});
document.addEventListener('change',e=>{
  if(implementation.change(e.target))return;
  if(pillars.change(e.target))return;
  if(e.target.id==='provider-filter'){ui.provider=e.target.value;render();$('#provider-filter').focus();}
  if(e.target.id==='evidence-domain'){ui.evidenceDomain=e.target.value;render();$('#evidence-domain').focus();}
  if(e.target.id==='evidence-env'){ui.evidenceEnv=e.target.value;render();$('#evidence-env').focus();}
  if(e.target.closest('#request-form')){if(e.target.name==='envId')$('[name=taskId]',$('#request-form')).innerHTML=taskOptions(e.target.value);updateRequestChecks();}
});
document.addEventListener('submit',e=>{
  if(implementation.submit(e))return;
  if(pillars.submit(e))return;
  if(!['provision-form','request-form','exception-form'].includes(e.target.id))return;
  e.preventDefault();const form=e.target;
  try{
    if(form.id==='provision-form'){const env=engine.provision(Object.fromEntries(new FormData(form)));closeDialog();ui.page='foundations';history.replaceState(null,'','#foundations');render();showEnvironment(env.id);toast('Trusted environment provisioned in the simulator.');}
    if(form.id==='request-form'){const request=engine.requestAccess(requestInput(form));closeDialog();ui.page='access';history.replaceState(null,'','#access');render();showDecision(request.id);}
    if(form.id==='exception-form'){engine.requestException(Object.fromEntries(new FormData(form)));closeDialog();applyRoute('governance/decisions');history.replaceState(null,'','#governance/decisions');render();toast('Exception submitted. No policy bypass is active until approval.');}
  }catch(error){formError(form,error);}
});
function updateCountdowns(){document.querySelectorAll('[data-countdown]').forEach(el=>{const s=engine.sessions.find(s=>s.id===el.dataset.countdown);if(!s)return;const seconds=Math.max(0,Math.ceil((s.expiresAt-engine.now())/1000));el.textContent=s.status==='Active'?`${Math.floor(seconds/60)}m ${String(seconds%60).padStart(2,'0')}s`:'Closed';});document.querySelectorAll('[data-clock]').forEach(el=>el.textContent=time(engine.now())+' UTC');}
window.addEventListener('hashchange',()=>{applyRoute(location.hash.slice(1));render();window.scrollTo({top:0,behavior:'instant'});if(!$('dialog[open]'))$('main h1')?.focus({preventScroll:true});});
const implementation=createImplementationGuide({ui,esc,icon,badge,button,pageHeader,openDialog,toast,render});
const pillars=createPillarViews({engine,ui,esc,icon,badge,provider,time,date,button,empty,pageHeader,openDialog,closeDialog,navigate,toast,render,policies,evidence});
setInterval(()=>{if(engine.sweep()){render();if(!dialogHasUserInput()){if(ui.modal?.type==='environment')showEnvironment(ui.modal.id);pillars.refreshModal();}updateRequestChecks();}updateCountdowns();},1000);
applyRoute(location.hash.slice(1));
render();
