# Cloud Trust — implementation guide

Version 2.1 · Official references reviewed 2026-09-24

Proposed implementation, aligned to the supplied Cloud & Kubernetes strategy. The product is a working simulation. Every tool below is an example integration candidate; none is connected, purchased, or confirmed as an enterprise standard.

## Strategy and ownership

Cloud Trust offers one customer experience across Foundations, Access, Assurance, and Governance. It joins workload identity, policy decisions, workflow, and evidence across application, platform, and infrastructure layers. Delivery ownership remains with the specialist teams. The mapping below is a proposed implementation interpretation of the supplied strategy, not an approved reorganization.

| Layer | Audience | Components | Responsibility | Shared contract |
| --- | --- | --- | --- | --- |
| Application | Application and service teams | Applications · service entry point | A single place to provision a workload, request access, resolve findings, and show control evidence. | Service ID, accountable owner, approved work, data classification, and business criticality. |
| Platform | Kubernetes and API platform teams | Kubernetes · API gateway | Offer reusable hosting capabilities and enforce platform-specific controls through approved interfaces. | Cluster and namespace identity, admission results, deployment health, scoped access, and runtime signals. |
| Infrastructure | Cloud and infrastructure teams | Cloud services · on-premises VMs | Expose secure infrastructure products that the platform can consume and scale automatically. | Approved blueprints and images, network boundaries, resource IDs, configuration state, and lifecycle events. |

| Delivery domain | Primary pillar | Contributes to | Owns | Handoff |
| --- | --- | --- | --- | --- |
| Cloud Provisioning | Foundations | Assurance · Governance | Versioned blueprints, approved images, secure defaults, tagging, and provisioning controls. | Publish resource identity, baseline version, owner, and deployment evidence. |
| Cloud Monitoring / Detection | Assurance | Access · Governance | Discover and classify assets; observe vulnerabilities, identity exposure, configuration drift, and data risk. | Send timestamped findings and source coverage; distinguish missing signals from passing controls. |
| Cloud Runtime | Assurance | Foundations · Access | Maintain approved software and configurations; enforce runtime baselines and operate patch and lifecycle controls. | Provide runtime signals, change receipts, and verification results to the shared workflow. |
| Cloud Triage / Remediation | Assurance | Governance · Access | Prioritize findings, route accountable work, coordinate fixes, and request governed exceptions. | Keep findings linked to tasks, risk decisions, due dates, and verified closure evidence. |
| Kubernetes | All four pillars | A distinct platform delivery domain | Container and cluster guardrails, admission policy, namespace access, workload runtime protection, and platform lifecycle. | Implement the shared contracts for Kubernetes while retaining its specialist engineering ownership. |

IAM, product orchestration, and risk/control review are proposed cross-cutting responsibilities needed to connect these five delivery domains. Kubernetes retains a distinct platform mandate. All four pillars also apply to platform workloads.

## Build playbooks

### 01. Cloud Foundations — Start Trusted

A workload starts with a known owner, an approved baseline, and traceable provisioning evidence.

**Accountable delivery:** Cloud Provisioning; Kubernetes owns platform blueprints. Security defines control intent.

**Prerequisites**

- A pilot account, subscription, or project with a bounded deployment identity.
- An approved image or container digest, network pattern, tagging dictionary, and service-owner directory.
- A versioned infrastructure repository, protected delivery workflow, state backend, and agreed policy checks.

**Example tools:** Terraform, Packer / HCP Packer, Open Policy Agent, Kyverno

1. **Define the product contract.** Choose one workload pattern. Require service ID, owner group, environment, cost center, data classification, lifecycle, and target scope. Resolve the owner against the service directory before a request can proceed. Output: A versioned blueprint and required metadata schema.

2. **Publish approved artifacts.** Build and scan the VM image or container through the existing artifact pipeline. Promote only approved versions; pin the deployment to an immutable image identifier or digest and record its provenance. Output: An approved image reference and its scan / build evidence.

3. **Validate before deployment.** Create the Terraform plan, normalize the relevant fields, and evaluate ownership, encryption, logging, network exposure, and image rules. On Kubernetes, apply equivalent admission controls. Start new rules in observation mode before enforcing them in the pilot. Output: Policy results tied to the exact plan, commit, and rule version.

4. **Execute the approved plan.** Use a scoped automation identity to apply the reviewed plan. Keep credentials and cloud permission checks on the server. Record external job IDs; retries must not create a second workload. Output: A provisioning receipt with the provider resource IDs.

5. **Verify the live baseline.** Read back resource configuration and register it with the posture source. Report Provisioning until required checks return current results. Failed or missing checks route to an owner and prevent the workload from being marked trusted. Output: A verified baseline snapshot with observation time and coverage.

6. **Hand over the lifecycle.** Publish the common workload ID to Access, Assurance, and Governance. Set a review owner and retirement process that removes access before decommissioning, while preserving the evidence history. Output: One workload record that all four pillars can reference.

**Example workload blueprint request**

Proposed Cloud Trust contract, not a Terraform or cloud-provider API. The adapter translates this intent into an approved provider-specific blueprint.

```json
{
  "schemaVersion": "1.0",
  "requestId": "provision-demo-001",
  "workloadId": "claims-api-prod",
  "blueprintRef": "managed-workload@1.0",
  "target": {
    "provider": "AWS",
    "scopeRef": "pilot-account",
    "region": "approved-region"
  },
  "ownerGroup": "claims-platform",
  "tags": {
    "serviceId": "claims-api",
    "costCenter": "CC-1042",
    "environment": "production",
    "dataClassification": "internal"
  },
  "baseline": {
    "imageRef": "approved-image-catalog-entry",
    "networkProfile": "private",
    "encryptionRequired": true,
    "auditLoggingRequired": true
  },
  "policyVersion": "baseline-1.0"
}
```

**Acceptance checks**

- A missing owner, unapproved image, or disallowed public ingress blocks the plan.
- Replaying the same request returns the existing job instead of creating another resource.
- A deployment succeeds only after live checks pass; the recorded snapshot links to the plan and resource IDs.

**Try the demo:** Open Cloud Foundations, provision an environment, and inspect its six controls. Change a control to see how the same workload affects access and assurance.

### 02. Cloud Access — Access When Trusted

An eligible person receives only the privilege, scope, and time required for approved work.

**Accountable delivery:** IAM / privileged-access engineering with the cloud and Kubernetes enforcement owners.

**Prerequisites**

- An authenticated workforce identity and authoritative eligibility, MFA, and device signals.
- A task system and role-to-resource entitlement map with authenticated independent approvers.
- A tested grant and removal adapter for the selected cloud, including its token and propagation behavior.

**Example tools:** SGNL, Microsoft Entra PIM, AWS IAM / STS, Google Cloud PAM, Open Policy Agent

1. **Model eligible access.** Inventory standing privileges and select one operator role for the pilot. Separate eligibility from active privilege, and map the role to the smallest resource scope. Track emergency access as a separately reviewed path. Output: A role, entitlement, and scope catalog with an accountable owner.

2. **Join authoritative context.** Resolve the requester, device state, approved task, workload baseline, and signal timestamps on the server. Reject unknown or stale required context; never accept a browser-supplied trusted flag as proof. Output: A complete, timestamped decision context.

3. **Evaluate and approve.** Apply the scoped policy and duration limit. Route privileged roles to the designated approver; prohibit self-approval. Re-evaluate current context after approval and immediately before issuing privilege. Output: A decision record containing policy version, reasons, and reviewer identity.

4. **Grant and confirm.** Call the provider adapter, retain its request and grant IDs, and read back the result. Display Grant pending until activation is confirmed. Store the effective permissions and actual expiry, including any provider duration limits. Output: An Active confirmed record linked to its provider grant.

5. **Re-evaluate and remove.** React to expiry, identity changes, material posture changes, or task closure. Stop new grants and request removal of existing privilege. Distinguish a removal request from confirmed enforcement; alert and retry if confirmation fails. Output: A removal receipt and measured exposure interval.

6. **Verify provider behavior.** Exercise expiry, explicit revoke, cached credentials, role chaining where applicable, and connector outages. Verify denial against the protected operation before describing access as removed. Recovering trust must require a new access request. Output: Provider-specific evidence that both new and existing access behave as intended.

**Example OPA decision rule**

Original illustrative Rego v1 policy for normalized, server-verified inputs. It evaluates one operator path; it does not issue credentials, implement approval workflows, or enforce revocation. Validate types and timestamps before evaluation.

```rego
package cloudtrust.access
import rego.v1

default allow := false

allow if {
  input.entitlement.eligible == true
  input.task.approved == true
  input.identity.mfa == true
  input.identity.managed_device == true
  input.workload.posture_fresh == true
  input.workload.baseline_pass == true
  input.request.minutes > 0
  input.request.minutes <= input.entitlement.max_minutes
}
```

**Acceptance checks**

- An unmanaged device, expired task, stale posture signal, or missing entitlement is denied.
- Changing trust between approval and grant prevents activation. Replayed requests cannot duplicate privilege.
- Expiry and explicit removal are tested using the original credentials. Failed removal remains visible and escalates.

**Try the demo:** Open Cloud Access, request a 30-minute session, then change an identity signal or advance the clock. The simulator revokes or expires the session and records why.

### 03. Cloud Assurance — Stay Trusted

A change in posture becomes prioritized, owned work with a verified recovery path.

**Accountable delivery:** Cloud Monitoring / Detection, Cloud Runtime, Cloud Triage / Remediation, and Kubernetes within their respective scopes.

**Prerequisites**

- A read-only posture or vulnerability feed plus runtime coverage for the pilot workloads.
- A stable mapping from provider resource ID to workload, owner, and business criticality.
- An approved remediation catalog with bounded execution identities, change windows, and rollback procedures.

**Example tools:** Wiz, Falco, ServiceNow Vulnerability Response, AWS Systems Manager, Argo CD, Kyverno

1. **Onboard and measure coverage.** Import the resource inventory and source findings. Add runtime and Kubernetes signals separately where needed. Record which resources are observed, when they were last checked, and which controls the source can actually assess. Output: A coverage register that exposes unmonitored and stale resources.

2. **Normalize and correlate.** Map source IDs, resource IDs, severity, first and last observation, and control IDs to the shared workload. Deduplicate repeated observations using source + finding + resource. Preserve native evidence and the original source link. Output: An owned finding with a stable external correlation key.

3. **Prioritize and route.** Combine severity with exposure, exploitability, workload criticality, and active privilege. Assign the accountable remediation owner and a policy-based due date. Trigger an access re-evaluation only for policy-relevant changes. Output: A prioritized work item and a recorded trust decision.

4. **Choose the treatment.** Record remediate, mitigate, or request a time-bound exception. Approved risk acceptance leaves the underlying finding visible. Use the authorized change process for runtime fixes, image replacement, patches, and Kubernetes rollouts. Output: A linked decision, approved change, and remediation plan.

5. **Execute with bounded automation.** Run a vetted playbook or merge a reviewed infrastructure / workload change. Use a canary or maintenance window where appropriate, verify service health, and roll back if recovery checks fail. Capture job receipts and affected resources. Output: An execution record; the finding remains open pending verification.

6. **Rescan and close.** Collect a fresh observation from the relevant control source after the change. Close only when the condition is verified resolved. Reopen on recurrence, update access context, and invalidate affected attestations when their subject changes. Output: Before-and-after evidence with verified closure and elapsed remediation time.

**Example normalized finding event**

Proposed Cloud Trust event, not a Wiz or Falco payload. An adapter must map and validate the selected source schema. All identifiers and timestamps are illustrative.

```json
{
  "schemaVersion": "1.0",
  "eventId": "evt-demo-041",
  "type": "finding.observed",
  "observedAt": "2026-09-24T10:00:00Z",
  "ingestedAt": "2026-09-24T10:00:08Z",
  "workloadId": "claims-api-prod",
  "resourceRef": "pilot-resource-001",
  "source": {
    "system": "posture-adapter",
    "findingId": "source-finding-841"
  },
  "controlId": "approved-image",
  "severity": "critical",
  "state": "open",
  "ownerGroup": "claims-platform",
  "evidenceRefs": [
    "evidence://demo/scan-041"
  ],
  "correlationId": "trust-demo-001"
}
```

**Acceptance checks**

- Repeated delivery updates one unresolved finding; late events cannot overwrite newer state.
- Unmapped ownership enters a visible triage queue. Loss of source coverage is never reported as healthy.
- A successful automation job alone cannot close a finding; a fresh scan and service-health check are required.

**Try the demo:** Open Cloud Assurance, simulate a finding, assign its owner, start remediation, and apply and verify the fix. Inspect how the access and governance records change.

### 04. Cloud Governance — Prove Trust

Every exception, risk decision, and control statement has an accountable owner and a traceable evidence history.

**Accountable delivery:** Risk and control owners with Cloud Triage / Remediation; independent reviewers approve attestations and exceptions.

**Prerequisites**

- An agreed control library, scope hierarchy, risk authority, and exception-expiry policy.
- Authenticated requester, owner, and reviewer roles with separation of duties enforced on the server.
- A durable evidence store with defined retention, access control, integrity checks, and source-of-record rules.

**Example tools:** Archer, ServiceNow Vulnerability Response

1. **Define the control and decision model.** Map each technical control to its owner and assessment scope. Define who may accept which risks, what compensating controls are required, and when review or expiry is mandatory. Separate technical health from approved risk treatment. Output: A control catalog and explicit decision authority matrix.

2. **Assign systems of record.** Choose where risk decisions, tasks, and raw evidence are authoritative. For example, Archer can own approved risk records while ServiceNow owns remediation tasks. Use stable references in Cloud Trust and document conflict handling. Output: A field-level data ownership and synchronization contract.

3. **Implement scoped exceptions.** Require workload, control, reason, compensating measures, approver, and expiry. Approval must be authenticated and policy-scoped. Expiry or changed conditions trigger re-evaluation; a ticket status must never silently create an access bypass. Output: A versioned exception record linked to the affected finding and policy.

4. **Collect durable evidence.** Record authenticated actors, decision inputs, policy versions, source observations, provider receipts, and correlation IDs. Store protected snapshots and integrity metadata separately from editable workflow records. Apply the agreed retention and export controls. Output: A retrievable evidence bundle with lineage from source to decision.

5. **Attest and review.** Let the accountable owner attest to a specific control snapshot. Require an independent reviewer; mark attestations stale when scoped conditions change and expired when their review period ends. Keep the historical record. Output: A reviewed, time-bounded statement tied to its evidence snapshot.

6. **Prove the outcome.** Export the connected history for a selected workload or control. Reconcile external record IDs, surface failed synchronizations, and report coverage, privilege exposure, removal latency, verified remediation, and overdue decisions with explicit denominators. Output: A reproducible review packet and measurable control outcomes.

**Example exception request**

Proposed Cloud Trust request. Approval and enforcement are separate server-side actions; this example grants no exception by itself.

```json
{
  "schemaVersion": "1.0",
  "requestId": "exception-demo-001",
  "workloadId": "analytics-sandbox",
  "controlId": "private-networking",
  "findingId": "finding-demo-019",
  "requestedBy": "requester-from-authenticated-session",
  "reason": "Short validation window for a restricted test endpoint.",
  "compensatingControls": [
    "Source IP allowlist",
    "Additional request monitoring"
  ],
  "requestedDurationMinutes": 60,
  "reviewerGroup": "network-risk-reviewers",
  "evidenceRefs": [
    "evidence://demo/change-019"
  ],
  "status": "pending-review"
}
```

**Acceptance checks**

- A requester cannot approve their own exception or attestation. Approval is recorded with authenticated identity.
- Expired exceptions stop affecting decisions. A stale snapshot cannot be approved as a current control statement.
- An auditor can reconstruct a grant, posture change, removal, fix, and review from retained evidence without relying on the live UI.

**Try the demo:** Open Cloud Governance to review risk decisions, request an exception, submit and review an attestation, then export the connected evidence bundle.

## Example integration catalog

Every entry is a candidate, not a connected or committed tool. Reuse approved enterprise tools where possible. Confirm edition, tenant configuration, support, API permissions, data handling, and fit before selection. Vendor capability summaries link to official sources; setup steps are proposed Cloud Trust designs.

### Terraform

Provision approved infrastructure from versioned modules.

**Category:** Provisioning · **Layer:** Infrastructure · **Owner:** Cloud Provisioning

In: blueprint intent and reviewed plan. Out: job status, resource IDs, and outputs.

1. Define a pilot module and state boundary; configure a narrowly scoped runner identity.
2. Run plan and policy checks, require the approved workflow, and apply the exact reviewed plan.
3. Map outputs and execution receipts to the common workload ID, then perform live verification.

**Implementation consideration:** Cloud-specific modules, permissions, state protection, and policy enforcement must be designed and tested.

- [Terraform policy enforcement](https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement/define-policies)

### Packer / HCP Packer

Build VM images and publish approved image references for provisioning.

**Category:** Approved images · **Layer:** Infrastructure · **Owner:** Cloud Provisioning + Runtime

In: approved build definition. Out: immutable image ID, build evidence, and promotion status.

1. Build a candidate image in the isolated image pipeline and run the organization’s security checks.
2. Promote the approved version in the image catalog with provenance and lifecycle metadata.
3. Resolve the approved image in the provisioning module and reject retired or unapproved versions.

**Implementation consideration:** Packer builds images; approval, vulnerability scanning, and retirement criteria need their own workflow.

- [Packer overview](https://developer.hashicorp.com/packer)
- [Terraform and Packer pattern](https://developer.hashicorp.com/validated-patterns/packer/terraform-integrate-hcp-packer)

### Open Policy Agent

Evaluate versioned policy against normalized deployment or access context.

**Category:** Policy decisions · **Layer:** Shared services · **Owner:** Policy engineering

In: validated context. Out: policy decision and evaluation metadata.

1. Define a typed context schema and explicit deny behavior for missing required inputs.
2. Version and test the Rego bundle; run it in observation mode against representative decisions.
3. Enforce the decision in the deployment or access service and record the rule version and reasons.

**Implementation consideration:** A policy result needs an enforcement point. OPA by itself does not issue or remove cloud credentials.

- [OPA policy language](https://www.openpolicyagent.org/docs/policy-language)
- [OPA with HCP Terraform](https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement/define-policies/opa)

### Kyverno

Apply Kubernetes admission policy and expose policy results for the platform.

**Category:** Kubernetes guardrails · **Layer:** Platform · **Owner:** Kubernetes security / platform

In: resource and image policy. Out: admission decisions and policy reports.

1. Select a pilot cluster and supported policy version; test policies against its workload patterns.
2. Observe violations, then enforce the approved rules for image, security context, and ownership requirements.
3. Import policy results using cluster, namespace, and resource identities; retain admission-denial evidence separately.

**Implementation consideration:** Background policy reporting does not automatically repair existing workloads; remediation needs a controlled change.

- [Applying Kyverno policies](https://kyverno.io/docs/guides/applying-policies/)
- [Policy reports](https://kyverno.io/docs/guides/reports/)

### SGNL

Provide contextual access decisions through supported protected-system integrations.

**Category:** Contextual authorization · **Layer:** Shared services / API gateway · **Owner:** IAM / access engineering

In: principal, action, resource, and trusted context. Out: access decision to an enforcement integration.

1. Configure approved sources and map identity, resource, and relationship identifiers.
2. Integrate one protected system or gateway; test the candidate policies in simulation.
3. Enable the supported enforcement path and measure context freshness and removal behavior end to end.

**Implementation consideration:** Connector support and enforcement semantics vary. Do not assume a decision automatically terminates every downstream cloud session.

- [SGNL API gateway integration](https://help.sgnl.ai/articles/protected-systems/protected-system-api-aws-gateway/)
- [SGNL SDK enforcement](https://help.sgnl.ai/articles/protected-systems/protected-system-sdk/)

### Microsoft Entra PIM

Use eligible assignments, activation controls, and time-bounded privileged roles.

**Category:** Azure / directory access · **Layer:** Cloud identity · **Owner:** IAM / Azure access

In: eligible role and activation request. Out: activation, review, and audit records.

1. Select the role and resource scope; configure eligibility and the approved activation requirements.
2. Map the Cloud Trust request to the appropriate API for that resource type and retain the native request ID.
3. Test activation, expiry, explicit removal, audit export, and the effective behavior of existing tokens.

**Implementation consideration:** Verify licensing and tenant configuration. Microsoft Entra roles and Azure resource roles use different permission and API models.

- [PIM overview](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)
- [Plan a PIM deployment](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-deployment-plan)

### AWS IAM / STS

Issue scoped temporary role credentials through an approved access broker.

**Category:** AWS access · **Layer:** Infrastructure · **Owner:** IAM / AWS access

In: authorized role and session context. Out: temporary session and grant / removal evidence.

1. Define a limited pilot role, its trust policy, and the broker’s allowed role assumptions.
2. Issue credentials only after server-side authorization; retain scope, issue time, expiry, and correlation IDs.
3. Test a provider-appropriate removal mechanism against existing credentials and block re-assumption when trust is lost.

**Implementation consideration:** The standard role session-revoke policy affects all older sessions for that role. Identity Center roles require their own supported revocation path; scope and blast radius must be tested.

- [Using temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)
- [Revoking role sessions](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html)

### Google Cloud PAM

Define entitlements and request temporary grants for scoped cloud roles.

**Category:** GCP access · **Layer:** Infrastructure · **Owner:** IAM / GCP access

In: entitlement and grant request. Out: grant state and audit events.

1. Configure one entitlement with its scope, eligible requesters, approval path, and duration.
2. Map grants to Cloud Trust requests and reconcile state from the provider.
3. Exercise expiry and revoke; verify effective access after propagation and retain audit references.

**Implementation consideration:** PAM changes IAM bindings; propagation still applies. Infrastructure automation must not overwrite PAM-managed bindings.

- [PAM overview](https://docs.cloud.google.com/iam/docs/pam-overview)
- [Revoke grants](https://docs.cloud.google.com/iam/docs/pam-revoke-grants)

### Wiz

Supply asset, vulnerability, and configuration context for accountable remediation.

**Category:** Posture and vulnerability signals · **Layer:** Cloud / workload inventory · **Owner:** Cloud Monitoring / Detection

In: scoped source integration. Out: source findings, resource identifiers, and context.

1. Agree pilot coverage and provision a read-only integration with the required tenant permissions.
2. Map the documented tenant schema and resource IDs into normalized findings; handle pagination and incremental ingestion.
3. Correlate findings to owners, link remediation tasks, and verify closure using a fresh source observation.

**Implementation consideration:** Use the tenant’s supported API or integration. This guide does not assume a universal endpoint or available license/module.

- [Wiz integration catalog](https://www.wiz.io/integrations)
- [Wiz and ServiceNow VR](https://www.wiz.io/integrations/servicenow-vulnerability-response)

### Falco

Detect suspicious runtime behavior and emit contextual security alerts.

**Category:** Runtime detection · **Layer:** Platform / runtime · **Owner:** Cloud Runtime + Kubernetes

In: selected event sources and detection rules. Out: alerts with workload context.

1. Validate sensor support and resource overhead in a pilot node or cluster.
2. Enable and tune the approved rules, then route alerts through the existing event pipeline.
3. Attach cluster, namespace, and workload IDs; use controlled response playbooks for policy-relevant events.

**Implementation consideration:** An alert is a detection, not proof of containment. Any automated response needs separate authorization and verification.

- [Falco documentation](https://falco.org/docs/)

### AWS Systems Manager

Use approved automation runbooks and patch workflows for managed nodes.

**Category:** Runtime remediation · **Layer:** Infrastructure / VMs · **Owner:** Cloud Runtime / Remediation

In: approved change, target set, and runbook. Out: execution, patch, and verification results.

1. Onboard pilot nodes with the required agent, service permissions, and network connectivity.
2. Choose a vetted runbook or patch baseline and a maintenance window; limit targets and execution concurrency.
3. Record execution receipts, check service health, and request a new control observation before closure.

**Implementation consideration:** Patching can disrupt workloads. Build rollback or rebuild paths and define the required post-change checks.

- [Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-documents-reference.html)
- [Patch Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html)

### Argo CD

Reconcile Kubernetes application configuration from approved Git state.

**Category:** Kubernetes delivery · **Layer:** Platform · **Owner:** Kubernetes platform

In: reviewed desired state. Out: sync status, health, and deployment revision.

1. Connect a pilot application repository and limit its destination cluster and namespaces.
2. Use the approved change path to update image references or workload configuration.
3. Track sync and service health, then rescan the relevant security condition and retain the revision as evidence.

**Implementation consideration:** A successful sync is not a security attestation. Define separate vulnerability and baseline verification.

- [Argo CD documentation](https://argo-cd.readthedocs.io/en/stable/)

### ServiceNow Vulnerability Response

Track vulnerability and configuration work with accountable remediation owners.

**Category:** Remediation workflow · **Layer:** Operational systems · **Owner:** Cloud Triage / Remediation

In: findings and linked assets. Out: task IDs, assignments, due dates, and workflow status.

1. Confirm the installed modules and supported integration, then configure pilot resource and finding mappings.
2. Route work to the accountable groups and retain source IDs for deduplication and reconciliation.
3. Synchronize task progress to Cloud Trust while requiring fresh technical verification for finding closure.

**Implementation consideration:** Module availability and field mappings depend on the instance. A closed ticket is not a passing technical control.

- [Wiz integration documentation](https://www.servicenow.com/docs/r/security-management/vulnerability-response/vr-wiz-exploring-host-cf.html)

### Archer

Serve as a candidate authoritative record for approved risk and exception decisions.

**Category:** Risk and control records · **Layer:** Risk systems · **Owner:** Risk / control governance

In: scoped risk decision and evidence references. Out: authoritative record ID and approved status.

1. Map the actual application, level, and field IDs with the risk platform owner.
2. Create the least-privileged integration and map approved workflow states, expiry, and evidence references.
3. Reconcile updates and review conflicts; keep failed synchronizations visible for the accountable owner.

**Implementation consideration:** Do not infer approval authority from an API write. Enforce the risk workflow, protect locked or concurrent edits, and validate the deployed version’s API.

- [Archer RESTful API guide](https://help.archerirm.cloud/api_2025_04/content/api/restfulapi/starting.htm)

## Reference architecture

The browser calls an authenticated Cloud Trust API. The backend resolves authoritative context and evaluates policy. Durable workflows call provider-specific adapters, receive execution receipts, and reconcile actual state. Observations and lifecycle events update the same workload and evidence model. No cloud credentials belong in the browser.

| Component | Delivery owner | Responsibility |
| --- | --- | --- |
| Experience & API | Cloud Trust team | Authenticated portal and API; workload views, requests, workbench, and evidence navigation. |
| Identity & inventory join | IAM + inventory owners | Resolve people, groups, service ownership, provider resources, clusters, and namespaces with stable IDs. |
| Policy decision service | Policy + control owners | Versioned decisions using current authoritative signals, explicit freshness, and scoped exceptions. |
| Workflow & adapter workers | Cloud + platform delivery teams | Durable approval, provisioning, grant, removal, remediation, and synchronization jobs. |
| Evidence & operational data | Cloud Trust + governance | Durable workflow database; protected evidence objects; event transport; retention and integrity controls. |

| Contract | Minimum fields | Behavior |
| --- | --- | --- |
| Workload identity | workloadId, provider resourceRef, serviceId, ownerGroup, layer, lifecycle | Inventory owner maps resource aliases. Unknown ownership is a triage state. |
| Observation | eventId, sourceId, observedAt, ingestedAt, controlId, result, evidenceRefs | Use pass / fail / unknown. Validate source authenticity, deduplicate, and reject stale overwrites. |
| Decision | requestId, correlationId, subject, scope, policyVersion, reasons, validUntil | Evaluate server-side and recheck before enforcement. Link authenticated approver where required. |
| Enforcement receipt | externalJobId, grantId, requestedAt, confirmedAt, effectiveScope, expiresAt, result | Confirm the protected-system result. A timeout remains pending or failed and triggers reconciliation. |
| Risk & attestation | recordId, controlScope, owner, reviewer, snapshotRef, expiry, sourceRecordId | Keep approved treatment separate from technical control state; retain the historical evidence. |

### Grant and removal lifecycle

| Transition | Action | Failure behavior |
| --- | --- | --- |
| Requested → Evaluated | Gather current identity, task, workload, and entitlement context. | Deny missing or stale required signals. |
| Evaluated → Approved | Use the defined approval path; record reviewer and decision version. | Block self-approval and recheck changed conditions. |
| Approved → Grant pending | Send an idempotent command to the provider-specific adapter. | Keep the request pending until provider confirmation. |
| Grant pending → Active confirmed | Record the effective scope, start time, and actual provider expiry. | Escalate failures; never display an unconfirmed grant as active. |
| Active → Revoke pending | Expiry, loss of trust, or manual termination starts removal and blocks renewal. | Track outstanding exposure; retry or escalate adapter failures. |
| Revoke pending → Revoked confirmed | Verify the provider state and loss of the protected capability. | Record observed latency and residual limitations; expire only with provider evidence. |

### Operating the adapters

Use stable idempotency keys, bounded retries, exponential backoff, dead-letter handling, and scheduled reconciliation. Authenticate incoming signals and validate schema, ordering, timestamps, and source scope. Separate observation permissions from write/execute permissions. Store connector credentials in a server-side secret store; rotate them through the owning team.

A successful API call, a policy decision, a closed task, and effective enforcement are different events. Retain each receipt. Provider tokens, role models, and propagation prevent a universal promise of instantaneous revocation. Agree a tested bound per provider and report unresolved exposure.

For high-impact actions, record the current resource version and recheck trust just before execution. Stop automation on scope mismatch. Use a separately authorized emergency path, with bounded access and review, when the normal path cannot support recovery.

The demo keeps state in memory. Production needs authenticated backend authorization, durable state, independent reviewers, background workers, source reconciliation, protected evidence retention, and operational recovery. A browser-generated JSON export is not immutable audit evidence.

## Delivery plan

Sequence by acceptance gates, not assumed dates. Start with one complete workload path before expanding coverage.

### 01. Agree the operating contract

**Scope:** One workload pattern · one cloud · one named delivery group

**Owners:** Product, IAM, provisioning, security, Kubernetes, and risk leads

- Confirm the layered model, role boundaries, common IDs, baseline, and approved tool choices.
- Select authoritative systems, pilot controls, freshness thresholds, exception authority, and evidence retention.

**Exit gate:** The owners approve the control-to-team mapping and can trace a sample workload across all systems.

### 02. Establish trusted provisioning

**Scope:** Foundations + read-only posture integration

**Owners:** Cloud Provisioning + Monitoring / Detection

- Provision from an approved blueprint and import live inventory and control results.
- Record policy, deployment, and observation evidence in durable storage; run negative control cases.

**Exit gate:** Unapproved plans are blocked and live configuration is verified before a workload is declared trusted.

### 03. Prove temporary access

**Scope:** One operator role · one provider enforcement adapter

**Owners:** IAM + cloud enforcement owner

- Connect authoritative identity and task signals, approval, grant, expiry, and explicit removal.
- Exercise stale signals, approval races, connector failure, replay, and existing-credential behavior.

**Exit gate:** The protected operation is denied after removal within an agreed, measured bound; unresolved failures are visible.

### 04. Close the assurance loop

**Scope:** Prioritized finding → owner → fix → independent verification

**Owners:** Runtime + Triage / Remediation + Kubernetes for platform scope

- Integrate the finding workbench and task system, then one approved remediation playbook.
- Add controlled change, service-health checks, fresh rescans, and recurrence handling.

**Exit gate:** A finding cannot close merely because a job or ticket succeeded; fresh technical evidence proves recovery.

### 05. Prove and expand

**Scope:** Governance + Kubernetes pilot + additional cloud adapters

**Owners:** Risk / control owners + all delivery domains

- Add scoped exceptions, independent attestations, protected evidence, and reconciliation with the risk system.
- Validate a Kubernetes workload and expand one provider / pattern at a time after operational readiness review.

**Exit gate:** Reviewers can reconstruct the lifecycle; the service has owned support, recovery procedures, and measured coverage.

## Outcome measures

Define scope, signal freshness, and measurement windows before adopting targets. These are proposed metric definitions, not external compliance requirements.

| Measure | Definition |
| --- | --- |
| Trusted coverage | Active in-scope workloads with all required controls passing and fresh ÷ all active in-scope workloads. Unknowns stay in the denominator. |
| Standing privilege exposure | Number of in-scope human privileged assignments active without a bounded grant; report emergency and service identities separately. |
| Removal latency | Time from the recorded loss-of-trust / expiry trigger to confirmed loss of protected access; report p50, p95, and unresolved removals. |
| Verified remediation | Time from first observation to fresh verified resolution; report severity and workload tier. Exclude accepted and archived findings from resolved counts. |
| Attestation coverage | Current independently approved snapshots ÷ all in-scope workloads requiring attestation, with stale and overdue counts. |
| Evidence completeness | Decisions with linked policy, source observations, actor, and required enforcement receipts ÷ all decisions that require those records. |

## Decisions to validate

- Confirm the final product name; Cloud Trust remains the working name.
- Confirm the application/service entry point represented by ASC in the strategy. Its acronym is intentionally not expanded here.
- Select one existing tool per capability where practical; the example catalog is not a procurement list.
- Agree identity and entitlement ownership across IAM, cloud infrastructure, and the separate Kubernetes vertical.
- Set production policy thresholds, risk authority, retention, and access-removal objectives; demo limits are illustrative.
