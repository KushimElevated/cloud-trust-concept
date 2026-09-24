import test from 'node:test';
import assert from 'node:assert/strict';
import {TrustEngine} from '../dist/engine.mjs';

const setup=()=>new TrustEngine(()=>Date.UTC(2026,8,24,14,0,0));
const access=(e,envId='env-payments',minutes=30)=>e.requestAccess({envId,personId:'casey',role:'Workload operator',taskId:e.tasks.find(t=>t.envId===envId).id,minutes,reason:'Complete the approved workload maintenance and verify application health.'});
const attest=(e,envId='env-payments')=>e.submitAttestation({envId,statement:'The workload owner reviewed all six baseline controls and their supporting evidence.'});
const rationale='Reviewed the current control signals, ownership, and the attached evidence snapshot.';

test('all four pillars connect a finding, revocation, remediation, risk decision, and reviewed attestation',()=>{
  const e=setup(),env=e.provision({name:'claims-api-prod',provider:'AWS',tier:'Production',owner:'Claims Platform'});
  access(e,env.id);
  e.changeControl(env.id,'image',false);
  const finding=e.findings.find(f=>f.envId===env.id);
  assert.equal(finding.severity,'Critical');
  assert.equal(e.sessions[0].status,'Revoked');
  assert.ok(e.events.find(x=>x.action==='Access automatically revoked').findingIds.includes(finding.id));
  e.assignFinding(finding.id,'Claims Platform','Owner will replace the affected image.');
  const risk=e.recordRiskDecision({findingId:finding.id,disposition:'Remediate',rationale:'Production image risk must be remediated and verified immediately.'});
  e.startRemediation(finding.id);
  assert.equal(finding.status,'In progress');
  assert.equal(env.controls.image,false);
  e.advance(12);
  e.completeRemediation(finding.id);
  assert.equal(finding.status,'Resolved');
  assert.equal(risk.status,'Closed');
  assert.equal(e.assuranceMetrics().meanRemediationMinutes,12);
  assert.equal(e.sessions[0].status,'Revoked');
  const a=attest(e,env.id);
  assert.equal(a.status,'Submitted');
  assert.equal(e.governanceMetrics().current,0);
  e.reviewAttestation(a.id,true,rationale);
  assert.equal(e.governanceMetrics().current,1);
  assert.ok(a.evidenceIds.some(id=>e.events.find(x=>x.id===id)?.findingId===finding.id));
  assert.ok(e.exportEvidence().events.some(x=>x.attestationId===a.id&&x.actor==='Taylor Brooks'));
});

test('posture scans observe failures without fixing or duplicating findings',()=>{
  const e=setup(),env=e.env('env-analytics'),finding=e.findings[0];
  const scan=e.runScan();
  e.runScan(env.id);
  assert.equal(scan.environmentIds.length,5);
  assert.equal(env.controls.network,false);
  assert.equal(e.findings.length,1);
  assert.equal(finding.status,'Open');
  assert.throws(()=>e.completeRemediation(finding.id),/Start the remediation/);
  e.startRemediation(finding.id);
  e.completeRemediation(finding.id);
  e.changeControl(env.id,'network',false);
  assert.equal(e.findings.length,2);
  assert.notEqual(e.findings[0].id,finding.id);
  assert.equal(finding.status,'Resolved');
});

test('changed signals invalidate a submitted or approved attestation, and restoration does not revive it',()=>{
  for(const approved of [false,true]){
    const e=setup(),a=attest(e);
    if(approved)e.reviewAttestation(a.id,true,rationale);
    const snapshot=JSON.stringify(a.snapshot),evidenceIds=[...a.evidenceIds];
    e.changeControl('env-payments','image',false);
    assert.equal(a.status,'Stale');
    assert.throws(()=>e.reviewAttestation(a.id,true,rationale),/no longer awaiting review/);
    e.remediate('env-payments');
    assert.equal(a.status,'Stale');
    assert.equal(JSON.stringify(a.snapshot),snapshot);
    assert.deepEqual(a.evidenceIds,evidenceIds);
    assert.equal(attest(e).status,'Submitted');
  }
});

test('temporary risk acceptance is tied to a matching exception and does not close the finding',()=>{
  const e=setup(),finding=e.findings[0];
  const request={findingId:finding.id,disposition:'Accept temporarily',rationale:'Controlled connectivity test with a restricted source and accountable owner.'};
  assert.throws(()=>e.recordRiskDecision(request),/approved exception/);
  const exception=e.requestException({envId:finding.envId,reason:'Run the controlled connectivity test during the planned window.',compensation:'Restrict access to the approved test runner IP address.'});
  e.reviewException(exception.id,true);
  const decision=e.recordRiskDecision(request);
  assert.equal(decision.expiresAt,exception.expiresAt);
  assert.equal(decision.exceptionId,exception.id);
  assert.equal(finding.status,'Open');
  assert.equal(e.env(finding.envId).controls.network,false);
  assert.throws(()=>attest(e,finding.envId),/Restore all six controls/);
  e.changeControl(finding.envId,'image',false);
  const image=e.findings.find(f=>f.control==='image');
  assert.throws(()=>e.recordRiskDecision({...request,findingId:image.id}),/approved exception/);
  e.changeControl(finding.envId,'image',true);
  e.advance(40);access(e,finding.envId,30);e.advance(21);
  assert.equal(decision.status,'Expired');
  assert.equal(finding.status,'Open');
  assert.equal(e.sessions[0].status,'Revoked');
});

test('workload retirement blocks grants and archives findings without claiming remediation',()=>{
  const e=setup(),a=attest(e);
  e.reviewAttestation(a.id,true,rationale);
  access(e);
  e.changeLifecycle('env-payments','Retiring','The workload is being consolidated into its successor platform.');
  assert.equal(e.sessions[0].status,'Revoked');
  assert.equal(access(e).status,'Denied');
  assert.equal(a.status,'Stale');
  assert.equal(e.metrics().total,4);
  e.changeLifecycle('env-payments','Retired','The synthetic teardown is complete and evidence has been retained.');
  assert.equal(e.env('env-payments').lifecycle,'Retired');
  assert.throws(()=>e.changeControl('env-payments','image',false),/active environment/);
  const finding=e.findings[0];
  e.changeLifecycle(finding.envId,'Retiring','The test sandbox has reached the end of its useful life.');
  e.changeLifecycle(finding.envId,'Retired','The sandbox decommission has completed in the simulator.');
  assert.equal(finding.status,'Retired');
  assert.equal(e.assuranceMetrics().resolved,0);
  assert.ok(e.events.some(x=>x.findingId===finding.id&&x.action==='Finding archived with workload'));
});

test('ownership reviews retain finding assignments and invalidate earlier attestation snapshots',()=>{
  const e=setup(),a=attest(e),finding=e.findings[0];
  e.reviewAttestation(a.id,true,rationale);
  e.updateOwner('env-payments',{owner:'Payment Operations',costCenter:'CC-9090',reviewDays:30});
  assert.equal(a.status,'Stale');
  assert.equal(a.snapshot.owner,'Payments Platform');
  assert.equal(e.env('env-payments').tags.owner,'Payment Operations');
  const previousAssignee=finding.owner;
  e.updateOwner(finding.envId,{owner:'Analytics Operations',costCenter:'CC-9080',reviewDays:7});
  assert.equal(finding.owner,previousAssignee);
  assert.throws(()=>e.updateOwner(finding.envId,{owner:'ab',costCenter:'CC-1',reviewDays:7}),/Enter an owner/);
});

test('rejection, expiry, and duplicate attestation submissions preserve review boundaries',()=>{
  const e=setup(),a=attest(e);
  assert.throws(()=>attest(e),/already has/);
  e.reviewAttestation(a.id,false,'Ownership evidence needs a more complete statement before approval.');
  assert.equal(a.status,'Rejected');
  const replacement=attest(e);e.reviewAttestation(replacement.id,true,rationale);
  e.advance(30*24*60);
  assert.equal(replacement.status,'Expired');
  assert.equal(e.governanceMetrics().current,0);
  assert.equal(e.events.filter(x=>x.attestationId===replacement.id&&x.action==='Attestation expired').length,1);
  e.sweep();
  assert.equal(e.events.filter(x=>x.attestationId===replacement.id&&x.action==='Attestation expired').length,1);
});

test('exports and reset include assurance and governance while protecting retained snapshots from export edits',()=>{
  const e=setup(),finding=e.findings[0];
  e.recordRiskDecision({findingId:finding.id,disposition:'Remediate',rationale:'Restore private administrative ingress and verify the baseline.'});
  const a=attest(e);e.reviewAttestation(a.id,true,rationale);e.runScan();
  const bundle=e.exportEvidence();
  assert.equal(bundle.findings.length,1);assert.equal(bundle.riskDecisions.length,1);assert.equal(bundle.attestations.length,1);assert.equal(bundle.scans.length,1);
  bundle.attestations[0].snapshot.controls.image=false;
  assert.equal(a.snapshot.controls.image,true);
  e.reset();
  assert.equal(e.findings.length,1);assert.equal(e.riskDecisions.length,0);assert.equal(e.attestations.length,0);assert.equal(e.scans.length,0);
});

test('retirement closes pending access reviews instead of leaving them in the queue',()=>{
  const e=setup();
  const request=e.requestAccess({envId:'env-payments',personId:'casey',role:'Platform administrator',taskId:e.tasks.find(t=>t.envId==='env-payments').id,minutes:30,reason:'Rotate the platform credentials during the approved window.'});
  assert.equal(request.status,'Pending review');
  e.changeLifecycle('env-payments','Retiring','The workload is being consolidated into its successor platform.');
  assert.equal(request.status,'Closed');
  assert.throws(()=>e.reviewAccess(request.id,true),/no longer awaiting review/);
  assert.equal(e.sessions.length,0);
});

test('the simulated reviewer cannot approve an attestation or exception for a workload they own',()=>{
  const e=setup();
  e.updateOwner('env-payments',{owner:'Taylor Brooks',costCenter:'CC-4100',reviewDays:30});
  const a=attest(e);
  assert.throws(()=>e.reviewAttestation(a.id,true,rationale),/independent reviewer/);
  assert.equal(a.status,'Submitted');
  e.updateOwner('env-analytics',{owner:'Taylor Brooks',costCenter:'CC-4103',reviewDays:30});
  const exception=e.requestException({envId:'env-analytics',reason:'Run the controlled connectivity test during the planned window.',compensation:'Restrict access to the approved test runner IP address.'});
  assert.throws(()=>e.reviewException(exception.id,true),/workload they own/);
  assert.equal(exception.status,'Pending review');
});

test('evidence records a drift before the finding it causes and does not report no-op restorations',()=>{
  const e=setup();
  e.changeControl('env-payments','image',false);
  const [drift,finding]=[e.events.findIndex(x=>x.action==='Drift detected'),e.events.findIndex(x=>x.action==='Finding detected')];
  assert.ok(drift>finding,'events are newest first, so the cause must have the larger index');
  assert.deepEqual(e.events[drift].findingIds,[e.findings[0].id]);
  const count=e.events.length;
  e.changeControl('env-customer','logging',true);
  assert.equal(e.events.length,count+1);
  assert.equal(e.events[0].action,'Signal re-observed');
  assert.equal(e.events.filter(x=>x.action==='Control restored').length,0);
});
