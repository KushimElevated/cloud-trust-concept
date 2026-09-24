export const CONTROLS = [
  { id: 'image', name: 'Approved image', requirement: 'Approved image with no critical findings in its latest simulated scan.' },
  { id: 'network', name: 'Private networking', requirement: 'Administrative endpoints are private and ingress follows the blueprint.' },
  { id: 'encryption', name: 'Encryption enabled', requirement: 'Storage encryption is enabled with a managed key.' },
  { id: 'logging', name: 'Audit logging', requirement: 'Control-plane audit events are sent to the security log destination.' },
  { id: 'ownership', name: 'Accountable owner', requirement: 'A service owner, cost center, and workload purpose are recorded.' },
  { id: 'freshness', name: 'Current signals', requirement: 'Required posture evidence is current in this simulation.' }
];
export const PEOPLE = [
  { id:'casey', name:'Casey Morgan', initials:'CM', title:'Platform engineer', mfa:true, managed:true, employed:true },
  { id:'jordan', name:'Jordan Lee', initials:'JL', title:'On-call engineer · unmanaged device', mfa:true, managed:false, employed:true },
  { id:'alex', name:'Alex Chen', initials:'AC', title:'Former contractor · inactive identity', mfa:true, managed:true, employed:false }
];
export const ROLES = ['Workload operator', 'Platform administrator'];
export const REVIEWER = 'Taylor Brooks';
export const POLICY = {version:'1.5',maxAccessMinutes:60,exceptionMinutes:60,attestationDays:30,roles:ROLES,requiredControls:CONTROLS.map(c=>c.id),exceptionScope:{tier:'Nonproduction',control:'network'}};
export const FINDING_TYPES = {
  image:{title:'Critical image finding',category:'Vulnerability',severity:'Critical',hours:4,fix:'Replace the affected image with the approved clean image and verify the new scan.'},
  network:{title:'Public administrative ingress',category:'Configuration drift',severity:'High',hours:8,fix:'Restore private administrative endpoints and validate the ingress rules.'},
  encryption:{title:'Storage encryption disabled',category:'Configuration drift',severity:'Critical',hours:4,fix:'Enable managed-key encryption and verify the storage configuration.'},
  logging:{title:'Audit destination disconnected',category:'Configuration drift',severity:'High',hours:8,fix:'Reconnect the audit destination and verify delivery of a sample event.'},
  ownership:{title:'Ownership metadata missing',category:'Ownership',severity:'Medium',hours:24,fix:'Confirm the accountable owner and restore the required workload tags.'},
  freshness:{title:'Posture evidence is stale',category:'Signal health',severity:'High',hours:8,fix:'Refresh the simulated posture observation and re-evaluate the baseline.'}
};
const allControls = () => Object.fromEntries(CONTROLS.map(c => [c.id, true]));
const copy = value => JSON.parse(JSON.stringify(value));

export class TrustEngine {
  constructor(clock = () => Date.now()) { this.clock = clock; this.reset(); }
  reset() {
    this.offset = 0;
    this.sequence = 0;
    this.people = copy(PEOPLE);
    this.environments = [
      {id:'env-payments', name:'payments-prod', provider:'AWS', tier:'Production', owner:'Payments Platform', region:'us-east-1'},
      {id:'env-customer', name:'customer-portal', provider:'Azure', tier:'Production', owner:'Digital Experience', region:'East US'},
      {id:'env-risk', name:'risk-insights', provider:'GCP', tier:'Production', owner:'Risk Engineering', region:'us-central1'},
      {id:'env-analytics', name:'analytics-sandbox', provider:'Azure', tier:'Nonproduction', owner:'Data Platform', region:'East US'},
      {id:'env-events', name:'event-processing', provider:'GCP', tier:'Nonproduction', owner:'Integration Services', region:'us-central1'}
    ].map((e,i) => ({...e, controls:allControls(), createdAt:this.now(), blueprint:'Managed workload / v1.5',lifecycle:'Active',lastScanAt:this.now(),reviewAt:this.now()+7*86400000,tags:{owner:e.owner,costCenter:`CC-${4100+i}`,workload:e.name}}));
    this.environments.find(e=>e.id==='env-analytics').controls.network = false;
    this.sessions = [];
    this.requests = [];
    this.exceptions = [];
    this.events = [];
    this.findings = [];
    this.riskDecisions = [];
    this.attestations = [];
    this.scans = [];
    this.tasks = this.environments.map((e,i)=>({id:`CHG-${2040+i}`, envId:e.id, status:'Approved', title:`Maintain ${e.name}`, people:['casey','jordan','alex']}));
    this.environments.forEach(e => this.record('foundation', 'Baseline evaluated', e.id, e.name, this.trust(e).label, 'Six blueprint controls evaluated using synthetic signals.'));
    this.record('foundation','Drift detected','env-analytics','analytics-sandbox','Needs attention','Public administrative ingress fails the private-networking control.');
    this.syncFindings(this.env('env-analytics'));
  }
  now() { return this.clock() + this.offset; }
  id(prefix) { return `${prefix}-${++this.sequence}`; }
  env(id) { const env = this.environments.find(e=>e.id===id); if(!env) throw new Error('Choose an existing environment.'); return env; }
  person(id) { const p = this.people.find(p=>p.id===id); if(!p) throw new Error('Choose an existing identity.'); return p; }
  record(domain, action, envId, subject, outcome, detail, extra={}) {
    const event = {id:this.id('EV'), at:this.now(), domain, action, envId, subject, outcome, detail, policyVersion:POLICY.version,actor:'Trust simulator', ...extra};
    this.events.unshift(event);
    return event;
  }
  trust(env) {
    const failed = CONTROLS.filter(c=>!env.controls[c.id]);
    const exceptions = this.exceptions.filter(x=>x.envId===env.id && x.status==='Approved' && x.expiresAt>this.now());
    const blocking = failed.filter(c=>!exceptions.some(x=>x.control===c.id));
    const lifecycleBlocked=env.lifecycle!=='Active';
    return {allowed:!lifecycleBlocked&&blocking.length===0, failed, blocking, passed:CONTROLS.length-failed.length, exception:!lifecycleBlocked&&failed.length>0 && !blocking.length, label:lifecycleBlocked?env.lifecycle:blocking.length?'Needs attention':failed.length?'Exception active':'Trusted'};
  }
  provision({name, provider, tier, owner}) {
    name = String(name||'').trim(); owner=String(owner||'').trim();
    if(!/^[a-z][a-z0-9-]{2,39}$/.test(name)) throw new Error('Use 3–40 lowercase letters, numbers, or hyphens for the environment name.');
    if(this.environments.some(e=>e.name===name)) throw new Error('That environment name is already in use.');
    if(!['AWS','Azure','GCP'].includes(provider) || !['Production','Nonproduction'].includes(tier)) throw new Error('Choose a supported cloud and environment type.');
    if(owner.length<3 || owner.length>80) throw new Error('Enter a service owner between 3 and 80 characters.');
    const env={id:this.id('ENV'),name,provider,tier,owner,region:{AWS:'us-east-1',Azure:'East US',GCP:'us-central1'}[provider],controls:allControls(),createdAt:this.now(),blueprint:'Managed workload / v1.5',lifecycle:'Active',lastScanAt:this.now(),reviewAt:this.now()+7*86400000,tags:{owner,costCenter:'CC-4200',workload:name}};
    this.environments.unshift(env);
    this.record('foundation','Environment provisioned',env.id,env.name,'Trusted',`${provider} ${tier.toLowerCase()} environment created from ${env.blueprint}. All six simulated baseline controls passed.`);
    this.tasks.unshift({id:`CHG-${2040+this.tasks.length}`,envId:env.id,status:'Approved',title:`Deploy ${env.name}`,people:['casey','jordan','alex']});
    this.record('policy','Demo change prepared',env.id,env.name,'Approved','The scenario includes a synthetic approved change assigned to the sample identities; a real change system is not connected.');
    return env;
  }
  checks(input) {
    const env=this.env(input.envId), person=this.person(input.personId), trust=this.trust(env);
    const task=this.tasks.find(t=>t.id===input.taskId);
    return [
      {id:'posture',name:'Environment trust',ok:trust.allowed,detail:env.lifecycle!=='Active'?'This environment is '+env.lifecycle.toLowerCase()+'. New and existing access is blocked.':trust.allowed?(trust.exception?'A scoped, time-limited exception covers the failed control.':'All six foundation controls pass.'):trust.blocking.map(c=>c.name).join(', ')+' must be restored.'},
      {id:'employment',name:'Active identity',ok:person.employed,detail:person.employed?'Employment signal is active.':'Identity is inactive.'},
      {id:'mfa',name:'Strong authentication',ok:person.mfa,detail:person.mfa?'MFA requirement satisfied.':'MFA requirement is not satisfied.'},
      {id:'device',name:'Managed device',ok:person.managed,detail:person.managed?'Device meets the demo policy.':'An unmanaged device cannot receive privileged access.'},
      {id:'task',name:'Approved work & scope',ok:!!task && task.status==='Approved' && task.envId===env.id && task.people.includes(person.id),detail:task && task.status==='Approved' && task.envId===env.id && task.people.includes(person.id)?`${task.id} is approved for this environment and identity.`:'An approved task scoped to this environment and identity is required.'},
      {id:'role',name:'Permitted role',ok:POLICY.roles.includes(input.role),detail:'Operator access is automatic after checks. Administrator access requires a reviewer.'},
      {id:'duration',name:'Time limit',ok:Number.isInteger(input.minutes) && input.minutes>=1 && input.minutes<=POLICY.maxAccessMinutes,detail:'Temporary grants must be between 1 and 60 whole minutes.'},
      {id:'reason',name:'Business justification',ok:typeof input.reason==='string' && input.reason.trim().length>=10 && input.reason.length<=500,detail:'A justification of 10–500 characters is required.'}
    ];
  }
  requestAccess(input) {
    this.sweep();
    const checks=this.checks(input), env=this.env(input.envId), person=this.person(input.personId);
    const blocked=checks.filter(c=>!c.ok);
    const duplicate=this.sessions.find(s=>s.envId===env.id && s.personId===person.id && s.role===input.role && s.status==='Active');
    if(duplicate) throw new Error('An active session already exists for this identity, environment, and role.');
    const request={...copy(input),reason:String(input.reason||'').trim(),id:this.id('REQ'),createdAt:this.now(),status:blocked.length?'Denied':input.role==='Platform administrator'?'Pending review':'Granted',checks};
    this.requests.unshift(request);
    this.record('access','Access evaluated',env.id,person.name,request.status,blocked.length?blocked.map(c=>c.detail).join(' '):request.status==='Pending review'?'All checks passed. Administrator role requires an independent simulated reviewer.':'All checks passed. Temporary operator access justified by an approved change.',{requestId:request.id});
    if(request.status==='Granted') this.grant(request);
    return request;
  }
  grant(request,reviewer) {
    const duplicate=this.sessions.find(s=>s.envId===request.envId && s.personId===request.personId && s.role===request.role && s.status==='Active');
    if(duplicate) throw new Error('A matching active session already exists.');
    const env=this.env(request.envId), person=this.person(request.personId);
    const session={id:this.id('SES'),requestId:request.id,envId:request.envId,personId:request.personId,role:request.role,taskId:request.taskId,reason:request.reason,minutes:request.minutes,startedAt:this.now(),expiresAt:this.now()+request.minutes*60000,status:'Active'};
    this.sessions.unshift(session);
    this.record('access','Temporary access granted',env.id,person.name,'Granted',`${request.role} for ${request.minutes} minutes on ${env.name}.${reviewer?' Reviewed by '+reviewer+'.':''}`,{requestId:request.id,sessionId:session.id});
    return session;
  }
  reviewAccess(id,approve) {
    this.sweep();
    const request=this.requests.find(r=>r.id===id);
    if(!request || request.status!=='Pending review') throw new Error('This request is no longer awaiting review.');
    const env=this.env(request.envId), person=this.person(request.personId);
    request.checks=this.checks(request);
    const blocking=request.checks.filter(c=>!c.ok);
    if(approve && !blocking.length && this.sessions.some(s=>s.status==='Active' && s.envId===request.envId && s.personId===request.personId && s.role===request.role)) throw new Error('A matching active session already exists.');
    request.status=approve && !blocking.length?'Granted':'Denied';
    this.record('policy','Access review completed',env.id,person.name,request.status,approve&&blocking.length?'Current signals failed: '+blocking.map(c=>c.detail).join(' '):`${approve?'Approved':'Rejected'} by ${REVIEWER}, the simulated access reviewer.`,{requestId:request.id});
    if(request.status==='Granted') this.grant(request,REVIEWER);
    return request;
  }
  changeControl(envId,control,healthy) {
    if(!CONTROLS.some(c=>c.id===control)) throw new Error('Unknown foundation control.');
    const env=this.env(envId);
    if(env.lifecycle!=='Active') throw new Error('Only an active environment can receive a simulated posture change.');
    const changed=env.controls[control]!==!!healthy,name=CONTROLS.find(c=>c.id===control).name;
    env.controls[control]=!!healthy;
    env.lastScanAt=this.now();
    const event=changed
      ?this.record('assurance',healthy?'Control restored':'Drift detected',env.id,env.name,healthy?'Restored':'Needs attention',`${name}: ${healthy?'the required condition is restored.':'the required condition no longer holds.'}`)
      :this.record('assurance','Signal re-observed',env.id,env.name,healthy?'Passing':'Needs attention',`${name}: the ${healthy?'passing':'failing'} condition was observed again; no change.`);
    this.syncFindings(env);
    event.findingIds=this.findings.filter(f=>f.envId===env.id&&f.control===control&&f.status!=='Retired').map(f=>f.id);
    this.sweep();
  }
  remediate(envId) {
    const env=this.env(envId);
    if(env.lifecycle!=='Active') throw new Error('Restore controls only on an active environment.');
    env.controls=allControls();
    env.lastScanAt=this.now();
    this.record('assurance','Baseline restored',env.id,env.name,'Trusted','All six baseline controls now pass. Previously revoked sessions remain closed; a new justified request is required.');
    this.syncFindings(env);
    this.sweep();
  }
  changeIdentity(personId,property,value) {
    if(!['mfa','managed','employed'].includes(property)) throw new Error('Unknown identity signal.');
    const person=this.person(personId);
    person[property]=!!value;
    this.record('identity','Identity signal changed',null,person.name,value?'Restored':'Needs attention',`${{mfa:'MFA',managed:'Managed device',employed:'Employment'}[property]} signal ${value?'restored':'withdrawn'}.`);
    this.sweep();
  }
  revoke(id,reason='Ended by the demo operator.',automatic=false,failedChecks=[]) {
    const session=this.sessions.find(s=>s.id===id);
    if(!session || session.status!=='Active') return;
    session.status='Revoked'; session.endedAt=this.now(); session.endReason=reason; session.automatic=automatic;
    // Only a failed environment-trust check is caused by the workload's open findings.
    const findingIds=failedChecks.includes('posture')?this.findings.filter(f=>f.envId===session.envId&&['Open','In progress'].includes(f.status)).map(f=>f.id):[];
    this.record('access',automatic?'Access automatically revoked':'Access ended',session.envId,this.person(session.personId).name,'Revoked',reason,{requestId:session.requestId,sessionId:session.id,findingIds,...(failedChecks.length?{failedChecks}:{})});
  }
  requestException({envId,reason,compensation}) {
    this.sweep();
    const env=this.env(envId);
    if(env.lifecycle!=='Active'||env.tier!==POLICY.exceptionScope.tier || env.controls[POLICY.exceptionScope.control]) throw new Error('This demo only permits private-networking exceptions for an active, failing nonproduction environment.');
    if(String(reason||'').trim().length<10 || String(reason).length>500 || String(compensation||'').trim().length<10 || String(compensation).length>500) throw new Error('Add a justification and compensating control, each 10–500 characters.');
    if(this.exceptions.some(x=>x.envId===envId && ['Pending review','Approved'].includes(x.status))) throw new Error('An exception is already open for this environment.');
    const exception={id:this.id('EX'),envId,control:'network',status:'Pending review',reason:String(reason).trim(),compensation:String(compensation).trim(),requestedAt:this.now(),expiresAt:null,owner:env.owner,findingId:this.findings.find(f=>f.envId===envId&&f.control==='network'&&f.status!=='Resolved'&&f.status!=='Retired')?.id||null};
    this.exceptions.unshift(exception);
    this.record('policy','Exception requested',envId,env.name,'Pending review',`${exception.reason} Compensating control: ${exception.compensation}. Approval is required; no policy bypass has been applied.`,{exceptionId:exception.id});
    return exception;
  }
  reviewException(id,approve) {
    this.sweep();
    const exception=this.exceptions.find(x=>x.id===id);
    if(!exception || exception.status!=='Pending review') throw new Error('This exception is no longer awaiting review.');
    const env=this.env(exception.envId);
    if(exception.owner===REVIEWER) throw new Error('The reviewer cannot decide an exception for a workload they own.');
    if(approve && (env.lifecycle!=='Active'||env.tier!=='Nonproduction'||env.controls.network)) throw new Error('This environment no longer qualifies for the requested exception.');
    exception.status=approve?'Approved':'Rejected';
    exception.expiresAt=approve?this.now()+POLICY.exceptionMinutes*60000:null;
    exception.reviewer=REVIEWER;
    this.record('policy','Exception reviewed',env.id,env.name,exception.status,approve?`${REVIEWER} approved a 60-minute exception for private networking only. Other controls remain mandatory. Compensating control: ${exception.compensation}`:`${REVIEWER} rejected the exception.`,{exceptionId:exception.id});
    this.sweep();
  }
  finding(id) {const finding=this.findings.find(f=>f.id===id);if(!finding)throw new Error('Choose an existing finding.');return finding;}
  syncFindings(env) {
    if(env.lifecycle!=='Active')return;
    for(const control of CONTROLS){
      let finding=this.findings.find(f=>f.envId===env.id&&f.control===control.id&&['Open','In progress'].includes(f.status));
      if(!env.controls[control.id]){
        if(!finding){
          const type=FINDING_TYPES[control.id];
          finding={id:this.id('FND'),envId:env.id,control:control.id,...copy(type),status:'Open',owner:env.owner,detectedAt:this.now(),lastObservedAt:this.now(),dueAt:this.now()+type.hours*3600000,source:'Synthetic posture feed',notes:[],resolvedAt:null};
          this.findings.unshift(finding);
          this.record('assurance','Finding detected',env.id,env.name,type.severity,type.title+'. Routed to '+env.owner+'.',{findingId:finding.id,actor:'Posture evaluator'});
        }else finding.lastObservedAt=this.now();
      }else if(finding){
        finding.status='Resolved';finding.resolvedAt=this.now();finding.lastObservedAt=this.now();
        this.record('assurance','Remediation verified',env.id,env.name,'Resolved',control.name+' now passes the simulated verification. Closed by observed control health, not by a risk decision.',{findingId:finding.id,actor:'Posture evaluator'});
        for(const decision of this.riskDecisions.filter(d=>d.findingId===finding.id&&d.status==='Active')){
          decision.status='Closed';decision.closedAt=this.now();
          this.record('governance','Risk decision closed',env.id,env.name,'Closed','The underlying finding was resolved and verified.',{findingId:finding.id,riskDecisionId:decision.id});
        }
      }
      // An exception covers one failure. Once the control passes, a recurrence needs a new review.
      if(env.controls[control.id])for(const exception of this.exceptions.filter(x=>x.envId===env.id&&x.control===control.id&&['Pending review','Approved'].includes(x.status))){
        exception.status='Closed';exception.closedAt=this.now();
        this.record('governance','Exception closed',env.id,env.name,'Closed',`${control.name} passes again. A recurrence requires a new, reviewed exception.`,{exceptionId:exception.id,findingId:exception.findingId});
      }
    }
  }
  runScan(envId=null) {
    const selected=(envId?[this.env(envId)]:this.environments).filter(e=>e.lifecycle==='Active');
    if(!selected.length)throw new Error('There are no active environments to observe.');
    const scan={id:this.id('SCAN'),at:this.now(),environmentIds:selected.map(e=>e.id),source:'Synthetic posture feed'};
    this.scans.unshift(scan);
    for(const env of selected){
      env.lastScanAt=this.now();
      this.syncFindings(env);
      this.record('assurance','Posture scan completed',env.id,env.name,this.trust(env).label,`${this.trust(env).passed}/6 controls pass. A scan observes the current simulated signals; it does not repair failures.`,{scanId:scan.id,actor:'Posture evaluator'});
    }
    this.sweep();return scan;
  }
  assignFinding(id,owner,note='') {
    const finding=this.finding(id);
    if(!['Open','In progress'].includes(finding.status))throw new Error('Only an open finding can be assigned.');
    if(typeof owner!=='string'||owner.trim().length<3||owner.length>80||String(note).length>500)throw new Error('Enter an owner of 3–80 characters and a note of at most 500 characters.');
    note=String(note??'').trim();
    finding.owner=owner.trim();finding.notes.push({at:this.now(),actor:'Demo operator',text:note||'Ownership assigned.'});
    this.record('assurance','Finding assigned',finding.envId,this.env(finding.envId).name,'Assigned',`Assigned to ${finding.owner}.${note?' '+note:''}`,{findingId:id,actor:'Demo operator'});
  }
  startRemediation(id) {
    const finding=this.finding(id);
    if(finding.status!=='Open'||this.env(finding.envId).lifecycle!=='Active')throw new Error('Start remediation on an open finding in an active environment.');
    finding.status='In progress';finding.startedAt=this.now();
    this.record('assurance','Remediation started',finding.envId,this.env(finding.envId).name,'In progress',finding.fix,{findingId:id,actor:finding.owner});
  }
  completeRemediation(id) {
    const finding=this.finding(id);
    if(finding.status!=='In progress')throw new Error('Start the remediation before applying and verifying the fix.');
    this.changeControl(finding.envId,finding.control,true);
    return finding;
  }
  updateOwner(envId,{owner,costCenter,reviewDays}) {
    const env=this.env(envId);
    if(env.lifecycle!=='Active')throw new Error('Only active workload ownership can be updated.');
    if(typeof owner!=='string'||owner.trim().length<3||owner.length>80||typeof costCenter!=='string'||!costCenter.trim()||costCenter.length>40||!Number.isInteger(reviewDays)||reviewDays<1||reviewDays>90)throw new Error('Enter an owner, a cost center, and a review interval of 1–90 whole days.');
    env.owner=owner.trim();env.tags.owner=env.owner;env.tags.costCenter=costCenter.trim();env.reviewAt=this.now()+reviewDays*86400000;
    env.controls.ownership=true;
    this.syncFindings(env);
    this.record('assurance','Ownership review completed',env.id,env.name,'Reviewed',`${env.owner} owns this workload; cost center ${env.tags.costCenter}. Next review in ${reviewDays} days. Finding assignees remain accountable for their existing work.`,{actor:'Demo operator'});
    this.sweep();
  }
  changeLifecycle(envId,target,reason) {
    const env=this.env(envId);
    if(!((env.lifecycle==='Active'&&target==='Retiring')||(env.lifecycle==='Retiring'&&target==='Retired')))throw new Error('Lifecycle transitions are Active → Retiring → Retired.');
    if(typeof reason!=='string'||reason.trim().length<10||reason.length>500)throw new Error('Record a lifecycle reason of 10–500 characters.');
    env.lifecycle=target;
    for(const request of this.requests.filter(r=>r.envId===envId&&r.status==='Pending review')){
      request.status='Closed';request.closedAt=this.now();
      this.record('access','Access request closed',envId,this.person(request.personId).name,'Closed','The workload entered retirement before review. A new request is required if access is still needed.',{requestId:request.id});
    }
    if(target==='Retired'){
      env.retiredAt=this.now();
      for(const finding of this.findings.filter(f=>f.envId===envId&&['Open','In progress'].includes(f.status))){
        finding.status='Retired';finding.closedAt=this.now();
        this.record('assurance','Finding archived with workload',envId,env.name,'Retired','The workload was retired in the simulator. This finding is not counted as a verified remediation.',{findingId:finding.id});
      }
    }
    for(const exception of this.exceptions.filter(e=>e.envId===envId&&['Approved','Pending review'].includes(e.status))){exception.status='Closed';this.record('governance','Exception closed',envId,env.name,'Closed','The workload entered retirement.',{exceptionId:exception.id});}
    this.record('assurance','Workload lifecycle changed',envId,env.name,target,reason.trim()+' '+(target==='Retiring'?'Active sessions are revoked and new access is blocked.':'Synthetic decommission completed; historical evidence is retained.'),{actor:'Demo operator'});
    this.sweep();
  }
  recordRiskDecision({findingId,disposition,rationale}) {
    this.sweep();
    const finding=this.finding(findingId),env=this.env(finding.envId);
    if(!['Open','In progress'].includes(finding.status)||env.lifecycle!=='Active')throw new Error('Make a risk decision for an unresolved finding in an active environment.');
    if(!['Remediate','Accept temporarily'].includes(disposition)||typeof rationale!=='string'||rationale.trim().length<10||rationale.length>500)throw new Error('Choose a disposition and provide a rationale of 10–500 characters.');
    const exception=this.exceptions.find(e=>e.envId===env.id&&e.control===finding.control&&e.status==='Approved'&&e.expiresAt>this.now());
    if(disposition==='Accept temporarily'&&!exception)throw new Error('Temporary acceptance requires an approved exception for this exact control and environment.');
    for(const old of this.riskDecisions.filter(d=>d.findingId===findingId&&d.status==='Active'))old.status='Superseded';
    const decision={id:this.id('RISK'),findingId,envId:env.id,disposition,rationale:rationale.trim(),owner:env.owner,reviewer:REVIEWER,createdAt:this.now(),status:'Active',expiresAt:disposition==='Accept temporarily'?exception.expiresAt:null,exceptionId:disposition==='Accept temporarily'?exception.id:null};
    this.riskDecisions.unshift(decision);
    this.record('governance','Risk decision recorded',env.id,env.name,disposition,decision.rationale+' The finding remains open until its control passes verification.',{findingId,riskDecisionId:decision.id,exceptionId:decision.exceptionId,actor:decision.reviewer});
    return decision;
  }
  snapshotKey(env) {return JSON.stringify([env.lifecycle,env.owner,env.tags,CONTROLS.map(c=>env.controls[c.id])]);}
  submitAttestation({envId,statement}) {
    this.sweep();
    const env=this.env(envId);
    if(env.lifecycle!=='Active'||this.trust(env).passed!==CONTROLS.length)throw new Error('Restore all six controls on an active environment before attesting its baseline. An exception does not count as a passing control.');
    if(typeof statement!=='string'||statement.trim().length<10||statement.length>1000)throw new Error('Provide an attestation statement of 10–1,000 characters.');
    if(this.attestations.some(a=>a.envId===envId&&['Submitted','Current'].includes(a.status)))throw new Error('This environment already has a submitted or current attestation.');
    const attestation={id:this.id('ATT'),envId,statement:statement.trim(),attester:env.owner,status:'Submitted',submittedAt:this.now(),snapshotKey:this.snapshotKey(env),snapshot:{controls:copy(env.controls),owner:env.owner,tags:copy(env.tags),lastScanAt:env.lastScanAt,lifecycle:env.lifecycle},evidenceIds:this.events.filter(e=>e.envId===envId).map(e=>e.id),policyVersion:POLICY.version,validUntil:null};
    this.attestations.unshift(attestation);
    this.record('governance','Control attestation submitted',envId,env.name,'Submitted','The owner reviewed all six controls and attached a snapshot of the supporting evidence.',{attestationId:attestation.id,actor:attestation.attester});
    return attestation;
  }
  reviewAttestation(id,approve,rationale) {
    this.sweep();
    const a=this.attestations.find(a=>a.id===id);
    if(!a||a.status!=='Submitted')throw new Error('This attestation is no longer awaiting review. Changed evidence requires a new submission.');
    if(a.attester===REVIEWER)throw new Error('The reviewer cannot decide an attestation they submitted. An independent reviewer is required.');
    if(typeof rationale!=='string'||rationale.trim().length<10||rationale.length>500)throw new Error('Provide a review rationale of 10–500 characters.');
    a.status=approve?'Current':'Rejected';a.reviewer=REVIEWER;a.reviewedAt=this.now();a.reviewRationale=rationale.trim();a.validUntil=approve?this.now()+POLICY.attestationDays*86400000:null;
    this.record('governance','Control attestation reviewed',a.envId,this.env(a.envId).name,a.status,a.reviewRationale+(approve?' Valid for 30 days unless the environment or ownership changes.':''),{attestationId:a.id,actor:a.reviewer});
    return a;
  }
  assuranceMetrics() {
    const open=this.findings.filter(f=>['Open','In progress'].includes(f.status)),resolved=this.findings.filter(f=>f.status==='Resolved');
    const active=this.environments.filter(e=>e.lifecycle==='Active');
    return {open:open.length,critical:open.filter(f=>f.severity==='Critical').length,inProgress:open.filter(f=>f.status==='In progress').length,overdue:open.filter(f=>f.dueAt<this.now()).length,resolved:resolved.length,meanRemediationMinutes:resolved.length?resolved.reduce((n,f)=>n+(f.resolvedAt-f.detectedAt)/60000,0)/resolved.length:null,owned:active.filter(e=>e.controls.ownership&&e.owner).length,reviewDue:active.filter(e=>e.reviewAt<=this.now()).length,active:active.length,retired:this.environments.filter(e=>e.lifecycle==='Retired').length};
  }
  governanceMetrics() {
    const active=this.environments.filter(e=>e.lifecycle==='Active');
    return {current:this.attestations.filter(a=>a.status==='Current').length,coverageDenominator:active.length,reviewPending:this.attestations.filter(a=>a.status==='Submitted').length,stale:this.attestations.filter(a=>['Stale','Expired'].includes(a.status)).length,exceptions:this.exceptions.filter(e=>e.status==='Approved').length,riskAccepted:this.riskDecisions.filter(d=>d.status==='Active'&&d.disposition==='Accept temporarily').length,unreviewed:this.findings.filter(f=>['Open','In progress'].includes(f.status)&&!this.riskDecisions.some(d=>d.findingId===f.id&&d.status==='Active')).length,evidence:this.events.length};
  }
  policyDefinition(){return {...copy(POLICY),baseline:copy(CONTROLS),remediationTargetsHours:Object.fromEntries(Object.entries(FINDING_TYPES).map(([k,v])=>[k,v.hours])),enforcement:'Simulation only',lifecycle:'Only Active environments are eligible for access.',attestation:'All controls must pass. Independent simulated review. Invalidated by changes or expiry.'};}
  sweep() {
    const count=this.events.length;
    for(const exception of this.exceptions) if(exception.status==='Approved' && exception.expiresAt<=this.now()) {
      exception.status='Expired';
      this.record('policy','Exception expired',exception.envId,this.env(exception.envId).name,'Expired','The time-limited networking exception ended. Access is re-evaluated against the current baseline.',{exceptionId:exception.id});
    }
    for(const d of this.riskDecisions.filter(d=>d.status==='Active')){
      const expired=d.expiresAt!==null&&d.expiresAt<=this.now();
      const closed=this.env(d.envId).lifecycle!=='Active'||(d.exceptionId&&!this.exceptions.some(e=>e.id===d.exceptionId&&e.status==='Approved'));
      if(expired||closed){d.status=expired?'Expired':'Closed';this.record('governance','Risk decision '+d.status.toLowerCase(),d.envId,this.env(d.envId).name,d.status,expired?'The accepted-risk window ended. The underlying finding remains visible.':'The workload or supporting exception is no longer active.',{findingId:d.findingId,riskDecisionId:d.id});}
    }
    for(const a of this.attestations.filter(a=>['Submitted','Current'].includes(a.status))){
      const expired=a.validUntil!==null&&a.validUntil<=this.now(),changed=a.snapshotKey!==this.snapshotKey(this.env(a.envId));
      if(expired||changed){a.status=changed?'Stale':'Expired';this.record('governance','Attestation '+a.status.toLowerCase(),a.envId,this.env(a.envId).name,a.status,changed?'The environment, baseline, or ownership changed. The historical snapshot is retained; a new attestation is required.':'The 30-day attestation window ended.',{attestationId:a.id});}
    }
    for(const session of this.sessions) if(session.status==='Active') {
      if(session.expiresAt<=this.now()) {
        session.status='Expired'; session.endedAt=this.now(); session.endReason='The approved access window ended.';
        this.record('access','Access expired',session.envId,this.person(session.personId).name,'Expired',session.endReason,{requestId:session.requestId,sessionId:session.id});
      } else {
        const failed=this.checks(session).filter(c=>!c.ok);
        if(failed.length) this.revoke(session.id,failed.map(c=>c.detail).join(' '),true,failed.map(c=>c.id));
      }
    }
    return count!==this.events.length;
  }
  advance(minutes) { if(!Number.isFinite(minutes)||minutes<0) throw new Error('Advance time by a positive number.'); this.offset+=minutes*60000; this.sweep(); }
  metrics() {
    this.sweep();
    const active=this.environments.filter(e=>e.lifecycle==='Active');
    return {total:active.length,trusted:active.filter(e=>this.trust(e).label==='Trusted').length,conditional:active.filter(e=>this.trust(e).exception).length,active:this.sessions.filter(s=>s.status==='Active').length,passed:active.reduce((n,e)=>n+this.trust(e).passed,0),controls:active.length*CONTROLS.length,revoked:this.sessions.filter(s=>s.status==='Revoked'&&s.automatic).length,retired:this.environments.filter(e=>e.lifecycle!=='Active').length};
  }
  exportEvidence() { this.sweep(); return {product:'Cloud Trust',kind:'Synthetic demonstration evidence',generatedAt:new Date(this.now()).toISOString(),policyVersion:POLICY.version,policy:this.policyDefinition(),limitations:'No real cloud accounts, sessions, enforcement, scanners, attestation identities, or immutable audit store are connected. All identities and records are synthetic.',metrics:{trust:this.metrics(),assurance:this.assuranceMetrics(),governance:this.governanceMetrics()},environments:copy(this.environments),people:copy(this.people),tasks:copy(this.tasks),requests:copy(this.requests),sessions:copy(this.sessions),findings:copy(this.findings),scans:copy(this.scans),riskDecisions:copy(this.riskDecisions),attestations:copy(this.attestations),exceptions:copy(this.exceptions),events:copy(this.events)}; }
}
