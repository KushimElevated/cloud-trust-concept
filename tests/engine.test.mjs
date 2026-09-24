import test from 'node:test';
import assert from 'node:assert/strict';
import {TrustEngine, CONTROLS} from '../dist/engine.mjs';

const start=Date.UTC(2026,8,23,14,0,0);
const setup=()=>new TrustEngine(()=>start);
const input=(engine,patch={})=>({envId:'env-payments',personId:'casey',role:'Workload operator',taskId:engine.tasks.find(t=>t.envId==='env-payments').id,minutes:30,reason:'Deploy the approved release and validate application health.',...patch});

test('the complete connected story provisions, grants, revokes, and recovers without restoring privilege',()=>{
  const engine=setup();
  const env=engine.provision({name:'claims-api-prod',provider:'AWS',tier:'Production',owner:'Claims Platform'});
  assert.equal(engine.trust(env).label,'Trusted');
  const r=engine.requestAccess(input(engine,{envId:env.id,taskId:engine.tasks.find(t=>t.envId===env.id).id}));
  assert.equal(r.status,'Granted');
  const session=engine.sessions[0];
  engine.changeControl(env.id,'image',false);
  assert.equal(session.status,'Revoked');
  assert.equal(session.automatic,true);
  engine.remediate(env.id);
  assert.equal(engine.trust(env).label,'Trusted');
  assert.equal(session.status,'Revoked');
  assert.equal(engine.metrics().active,0);
  assert.equal(engine.metrics().revoked,1);
  const revocation=engine.events.find(e=>e.action==='Access automatically revoked');
  assert.equal(revocation.envId,env.id);
  assert.equal(revocation.requestId,r.id);
  assert.equal(revocation.sessionId,session.id);
  assert.equal(engine.requestAccess(input(engine,{envId:env.id,taskId:engine.tasks.find(t=>t.envId===env.id).id})).status,'Granted');
});

test('every baseline control is enforced and provider choice does not bypass policy',()=>{
  for(const provider of ['AWS','Azure','GCP'])for(const c of CONTROLS){
    const engine=setup(),env=engine.provision({name:'test-environment',provider,tier:'Production',owner:'Platform Team'});
    engine.changeControl(env.id,c.id,false);
    const r=engine.requestAccess(input(engine,{envId:env.id,taskId:engine.tasks.find(t=>t.envId===env.id).id}));
    assert.equal(r.status,'Denied',`${provider}/${c.id}`);
    assert.equal(engine.sessions.length,0);
  }
});

test('identity failure revokes all affected sessions but does not change environment posture',()=>{
  for(const key of ['managed','mfa','employed']){
    const engine=setup();
    engine.requestAccess(input(engine));
    engine.changeIdentity('casey',key,false);
    assert.equal(engine.sessions[0].status,'Revoked');
    assert.equal(engine.trust(engine.env('env-payments')).label,'Trusted');
    assert.equal(engine.requestAccess(input(engine)).status,'Denied');
  }
});

test('inactive and unmanaged identities are denied even with an approved task',()=>{
  const engine=setup();
  assert.equal(engine.requestAccess(input(engine,{personId:'alex'})).status,'Denied');
  assert.equal(engine.requestAccess(input(engine,{personId:'jordan'})).status,'Denied');
  assert.equal(engine.sessions.length,0);
});

test('access requires an approved scoped task, a permitted role, and valid duration',()=>{
  const variants=[{taskId:'CHG-invented'},{taskId:'CHG-2041'},{role:'Unknown role'},{minutes:0},{minutes:61},{minutes:1.5},{minutes:NaN},{reason:'short'}];
  for(const variant of variants){const engine=setup();assert.equal(engine.requestAccess(input(engine,variant)).status,'Denied');assert.equal(engine.sessions.length,0);}
  const engine=setup();engine.tasks[0].people=[];assert.equal(engine.requestAccess(input(engine)).status,'Denied');
});

test('admin review re-evaluates current conditions before granting and cannot override a failure',()=>{
  const engine=setup();
  const request=engine.requestAccess(input(engine,{role:'Platform administrator'}));
  assert.equal(request.status,'Pending review');
  assert.equal(engine.sessions.length,0);
  engine.changeControl('env-payments','logging',false);
  assert.equal(engine.reviewAccess(request.id,true).status,'Denied');
  assert.equal(engine.sessions.length,0);
  engine.remediate('env-payments');
  const second=engine.requestAccess(input(engine,{role:'Platform administrator'}));
  assert.equal(engine.reviewAccess(second.id,true).status,'Granted');
  assert.equal(engine.sessions.length,1);
  assert.throws(()=>engine.reviewAccess(second.id,true),/no longer/);
});

test('clock expiry closes grants once and prevents negative active duration',()=>{
  let clock=start;
  const engine=new TrustEngine(()=>clock);
  engine.requestAccess(input(engine));
  clock+=30*60000;
  assert.equal(engine.sweep(),true);
  assert.equal(engine.sessions[0].status,'Expired');
  assert.equal(engine.sweep(),false);
  assert.equal(engine.events.filter(e=>e.action==='Access expired').length,1);
  assert.equal(engine.metrics().active,0);
});

test('approved exceptions are narrow, time-bound, and expiry revokes dependent access',()=>{
  const engine=setup(),envId='env-analytics';
  const request={envId,reason:'Allow a controlled connectivity test for the data team.',compensation:'Restrict administrative ingress to the approved test runner.'};
  const exception=engine.requestException(request);
  assert.equal(engine.trust(engine.env(envId)).allowed,false);
  engine.reviewException(exception.id,true);
  assert.equal(engine.trust(engine.env(envId)).label,'Exception active');
  engine.advance(40);
  const access=engine.requestAccess(input(engine,{envId,taskId:engine.tasks.find(t=>t.envId===envId).id,minutes:30}));
  assert.equal(access.status,'Granted');
  engine.advance(21);
  assert.equal(exception.status,'Expired');
  assert.equal(engine.sessions[0].status,'Revoked');
  assert.equal(engine.trust(engine.env(envId)).allowed,false);
});

test('networking exceptions do not waive image, identity, or production failures',()=>{
  const engine=setup(),envId='env-analytics';
  assert.throws(()=>engine.requestException({envId:'env-payments',reason:'A production test request.',compensation:'Restrict the ingress source.'}),/only permits/);
  const e=engine.requestException({envId,reason:'A connectivity test request.',compensation:'Restrict the ingress source.'});
  engine.reviewException(e.id,true);
  engine.changeControl(envId,'image',false);
  const r=engine.requestAccess(input(engine,{envId,taskId:engine.tasks.find(t=>t.envId===envId).id}));
  assert.equal(r.status,'Denied');
  engine.changeControl(envId,'image',true);
  assert.equal(engine.requestAccess(input(engine,{envId,personId:'jordan',taskId:engine.tasks.find(t=>t.envId===envId).id})).status,'Denied');
});

test('repeat requests and reviews cannot create duplicate active privilege',()=>{
  const engine=setup();engine.requestAccess(input(engine));
  assert.throws(()=>engine.requestAccess(input(engine)),/already exists/);
  assert.equal(engine.sessions.length,1);
  const a=engine.requestAccess(input(engine,{role:'Platform administrator'}));
  const b=engine.requestAccess(input(engine,{role:'Platform administrator'}));
  engine.reviewAccess(a.id,true);
  assert.throws(()=>engine.reviewAccess(b.id,true),/already exists/);
  assert.equal(b.status,'Pending review');
});

test('reset clears scenario records and evidence exports preserve cross-capability correlations',()=>{
  const engine=setup();engine.requestAccess(input(engine));
  engine.changeControl('env-payments','image',false);
  const exported=engine.exportEvidence();
  assert.match(exported.limitations,/synthetic/);
  assert.equal(exported.sessions[0].status,'Revoked');
  assert.ok(exported.events.some(e=>e.sessionId===exported.sessions[0].id));
  exported.environments[0].name='changed';
  assert.notEqual(engine.environments[0].name,'changed');
  engine.reset();
  assert.equal(engine.environments.length,5);
  assert.equal(engine.sessions.length,0);
  assert.equal(engine.requests.length,0);
  assert.equal(engine.exceptions.length,0);
  assert.equal(engine.metrics().trusted,4);
});

test('an exception closes when its control passes and cannot waive a later recurrence',()=>{
  const engine=setup(),envId='env-analytics',env=engine.env(envId);
  const exception=engine.requestException({envId,reason:'Allow a controlled connectivity test for the data team.',compensation:'Restrict administrative ingress to the approved test runner.'});
  engine.reviewException(exception.id,true);
  engine.changeControl(envId,'network',true);
  assert.equal(exception.status,'Closed');
  assert.ok(engine.events.some(e=>e.action==='Exception closed'&&e.exceptionId===exception.id));
  engine.changeControl(envId,'network',false);
  assert.equal(engine.trust(env).label,'Needs attention');
  assert.equal(engine.trust(env).allowed,false);
  assert.equal(engine.requestAccess(input(engine,{envId,taskId:engine.tasks.find(t=>t.envId===envId).id})).status,'Denied');
});

test('provisioned task identifiers never collide with the seeded approved changes',()=>{
  for(let sequence=2030;sequence<=2046;sequence++){
    const engine=setup();
    while(engine.sequence<sequence)engine.id('TEST');
    const env=engine.provision({name:'collision-check',provider:'AWS',tier:'Production',owner:'Platform Team'});
    const ids=engine.tasks.map(t=>t.id);
    assert.equal(new Set(ids).size,ids.length,`sequence ${sequence}`);
    for(const seeded of engine.tasks.filter(t=>t.envId!==env.id&&t.envId!=='env-analytics'))assert.equal(engine.requestAccess(input(engine,{envId:seeded.envId,taskId:seeded.id})).status,'Granted',`${seeded.id} at sequence ${sequence}`);
  }
});

test('identity revocations record the failed checks without linking unrelated workload findings',()=>{
  const engine=setup(),envId='env-analytics';
  const exception=engine.requestException({envId,reason:'Allow a controlled connectivity test for the data team.',compensation:'Restrict administrative ingress to the approved test runner.'});
  engine.reviewException(exception.id,true);
  engine.requestAccess(input(engine,{envId,taskId:engine.tasks.find(t=>t.envId===envId).id}));
  engine.changeIdentity('casey','mfa',false);
  const revocation=engine.events.find(e=>e.action==='Access automatically revoked');
  assert.deepEqual(revocation.findingIds,[]);
  assert.deepEqual(revocation.failedChecks,['mfa']);
});
