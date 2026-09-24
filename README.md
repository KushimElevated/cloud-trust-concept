# Cloud Trust

**Start Trusted. Access When Trusted. Stay Trusted. Prove Trust.**

Cloud Trust is one working product demonstration with four connected pillars.

| Pillar | Promise | Implemented experience |
| --- | --- | --- |
| Cloud Foundations | Start Trusted | Synthetic AWS, Azure, and GCP provisioning; six baseline controls; approved images; network and security defaults; owner and workload tags; shared policy definition |
| Cloud Access | Access When Trusted | Justified temporary privilege; scoped approved work; identity and device checks; role approval; duration limits; automatic revocation and expiration |
| Cloud Assurance | Stay Trusted | Posture matrix; vulnerability and drift findings; accountable assignments; remediation plans; verification; ownership reviews; workload retirement |
| Cloud Governance | Prove Trust | Policy and exception review; risk decisions; owner attestations and independent review; historical snapshots; connected evidence; session metrics |

Version 2 extends the existing unified demo. The original two standalone applications were not supplied for a source-level merge.

## Implement the strategy

Version 2.1 adds **Implementation guide** to the supporting navigation and **How to implement** to each pillar. It is an in-product guide to the proposed production design. Example integrations remain unconnected candidates.

- **Strategy & ownership:** maps the supplied application, platform, and infrastructure vision to the four product pillars and five delivery domains. Kubernetes retains its distinct ownership; IAM, shared product services, and risk review are explicit cross-cutting responsibilities. The ASC acronym remains unexpanded pending confirmation.
- **Build playbooks:** each pillar has prerequisites, accountable delivery, six implementation steps, expected outputs, a copyable example, acceptance checks, and a link back to the working demo.
- **Example tools:** 14 searchable candidates, each with its role, integration steps, data exchange, owner, limitations, and official source links. Candidates include Terraform, Packer, OPA, Kyverno, SGNL, Entra PIM, AWS IAM/STS, Google Cloud PAM, Wiz, Falco, Systems Manager, Argo CD, ServiceNow, and Archer.
- **Architecture:** proposed backend responsibilities, shared contracts, verified grant/removal states, and adapter failure and reconciliation behavior.
- **Delivery plan:** five gated phases, proposed outcome measures, and decisions that need agreement before production implementation.

Use `#implementation/strategy` for the entry point or `#implementation/playbooks/assurance` for a pillar deep link. The **Download guide** link exports the complete Markdown handoff, including official references reviewed on September 24, 2026. Source capability summaries use vendor/project documentation; the workflow and ownership mappings are proposed designs.

The editable guide data is in `dist/implementation-data.mjs`. Run `npm run export-guide` after content changes to regenerate `dist/cloud-trust-implementation.md`. The downloadable guide is built from the same data used by the interface.

## Present the full product

Open **Trust overview → Run guided demo**. The seven-step walkthrough includes presenter notes and updates the same records shown in all four pillars.

1. **Establish the foundation.** Provision `claims-api-prod` in AWS from the managed workload blueprint. The environment has approved-image, private-networking, encryption, audit-logging, ownership, and current-signal controls.
2. **Justify temporary access.** Casey Morgan receives 30-minute operator access for an approved change after the environment, identity, device, MFA, task scope, role, and business justification pass evaluation.
3. **Detect changed trust.** Inject a critical image finding. Assurance creates an accountable finding and Access revokes the active session. The events are linked by workload, request, session, and finding identifiers.
4. **Record the decision and start remediation.** Assign Claims Platform, record a Remediate risk decision, and start the clean-image remediation plan. The control remains failed while the work is in progress.
5. **Verify the recovery.** Apply the simulated fix and verify the control. The finding closes and its risk decision is closed. The revoked session stays closed.
6. **Submit the control attestation.** The workload owner submits a statement with a snapshot of the six passing controls, ownership, and supporting evidence references.
7. **Review and prove trust.** Taylor Brooks, the simulated independent reviewer, approves the attestation. Review the single timeline from provisioning through attestation and export the complete JSON evidence bundle.

Use **Reset demo** before repeating the scenario. Selecting the walkthrough after it has already been completed offers a reset. Reloading the page restores the original sample portfolio because state is local to the current page.

## Explore Assurance

**Findings** is the remediation workbench. Filter by state, priority, or workload. Review a finding, assign an owner, start remediation, and apply and verify its fix. Repeated observations update the existing unresolved finding; recurrence after resolution creates a new finding.

**Posture** shows provider-level control coverage and a workload-by-control matrix. **Run posture scan** observes current synthetic signals and records the observation. Posture evidence older than 24 hours fails the Current signals control; a scan refreshes that evidence. A scan does not repair any other failed control or connect to a real scanner. **Advance 25 h** on the Posture view demonstrates the lapse.

**Ownership & lifecycle** records the accountable owner, cost center, and next review. Finding assignments are separate from workload ownership and remain assigned until explicitly changed.

Workloads follow **Active → Retiring → Retired**. Entering retirement blocks new grants, revokes active access, closes open exceptions, and invalidates current attestations. Completing retirement preserves history and archives unresolved findings. Archived findings do not count as verified remediations.

The demonstration remediation targets are four hours for Critical, eight hours for High, and 24 hours for Medium findings. They are example policy settings, not a mandated industry standard.

## Explore Governance

**Overview** separates passing controls from approved attestations, and displays current exceptions, findings without a risk decision, evidence events, and measured outcomes from the current synthetic session.

**Risk & policies** includes the risk register, shared access policy, administrator review queue, and exception workflow. Choose Remediate for an unresolved finding, or Accept temporarily when a matching approved exception exists. Temporary acceptance inherits the exception expiry and leaves the finding open. It does not override another control or identity check.

Only a failing private-networking control on an active nonproduction environment is eligible for the 60-minute exception in this demo. Production failures and identity failures cannot be waived. An exception request has no effect before approval. Expiry re-evaluates dependent sessions. An exception covers one failure: it closes as soon as the control passes again, so a later recurrence needs a new, reviewed exception. The simulated reviewer cannot decide an exception or attestation for a workload they own.

**Attestations** captures an owner statement and historical evidence snapshot. All six controls must pass; exception-covered failures cannot be attested as healthy. A separate simulated reviewer must approve the submission. Approved attestations remain Current for up to 30 days, unless baseline, ownership, tags, or lifecycle changes make them Stale. Expired and stale records cannot be revived by merely restoring the environment; a new submission is required.

**Evidence** retains the combined history and supports workload and domain filters. Export includes the policy definition, environments, identities, approved tasks, access requests, sessions, scans, findings, risk decisions, exceptions, attestation snapshots, metrics, and events.

The older `#policies` and `#evidence` links route to their corresponding Governance views.

## Additional demo paths

| Try | Expected result |
| --- | --- |
| Request access as Jordan Lee | Denied because the device is unmanaged. |
| Request access as Alex Chen | Denied because the identity is inactive. |
| Withdraw Casey's employment, MFA, or device signal | All affected active privileges are revoked. |
| Request Platform administrator | Queued for the independent demo reviewer. |
| Fail a control before approving an administrator request | Denied on current checks; review cannot bypass the failure. |
| Advance the demo clock by 31 minutes in Cloud Access | A 30-minute grant expires. Two advances also expire a newly approved 60-minute exception. |
| Record temporary risk acceptance without an approved matching exception | The decision is rejected. |
| Run scans repeatedly on the same failing control | One unresolved finding is retained; no duplicate is created. |
| Select Advance 25 h on the Posture view | Current signals fails on every workload, live access is revoked, and current attestations become Stale. Run posture scan to refresh the evidence. |
| Restore a network control covered by an approved exception, then fail it again | The exception closes on restoration; the recurrence is not waived. |
| Approve an attestation and then change the owner's identity or cost center | The prior attestation becomes Stale. |
| Approve an attestation and inject a new posture finding | The prior snapshot is retained but is no longer Current. |
| Retire a workload with a live session | Access is revoked before simulated decommissioning. |

## Engineering handoff

The application uses browser-native JavaScript modules, semantic HTML, and CSS. It has no third-party runtime dependencies.

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Application document, accessible entry point, metadata, and favicon |
| `dist/styles.css` | Existing shared visual system |
| `dist/pillars.css` | Four-pillar navigation, workbenches, posture, governance, and responsive layouts |
| `dist/engine.mjs` | Synthetic state, policy, trust checks, access, assurance lifecycle, governance, and evidence |
| `dist/app.mjs` | Shared shell, Foundations, Access, policy and evidence views, and guided scenario |
| `dist/pillars.mjs` | Assurance and Governance screens, forms, and actions |
| `dist/implementation.mjs` | Strategy, playbooks, searchable tool catalog, detail dialogs, architecture, and delivery views |
| `dist/implementation-data.mjs` | Implementation content, candidate tool references, and Markdown export generation |
| `dist/implementation.css` | Guide layouts and responsive styles |
| `dist/cloud-trust-implementation.md` | Downloadable implementation handoff generated from the guide data |
| `scripts/export-guide.mjs` | Regenerates the downloadable guide |
| `tests/engine.test.mjs` | Original access and exception behavior checks |
| `tests/assurance-governance.test.mjs` | Connected assurance, retirement, risk, attestation, and evidence checks |

Serve `dist/` with a static HTTP server. For example: `python3 -m http.server 8080 --directory dist`. Opening the HTML via `file://` is not supported because JavaScript module loading requires HTTP.

Run `npm test` for the 19 engine checks and `npm run check` for syntax validation. Version 2.1 template/runtime verification rendered 18 main and guide routes, exercised all 14 integration dialogs, search/filter/reset behavior, four example-copy actions, invalid routes, and legacy aliases. The seven-step connected demo still completed with revoked access and a current attestation. The downloadable Markdown matched the in-product content source. This was not a visual browser test; live browser QA was unavailable in the build environment.

## Simulation boundaries

All providers, resources, tasks, people, role labels, controls, findings, reviews, and records are synthetic. There are no real cloud, identity, ticketing, scanner, or security-platform connections. Provider labels communicate a multi-cloud product concept; they are not working adapters or provider permission mappings.

The browser engine is presentation logic, not an authorization boundary. Requester, owner, operator, and reviewer roles are exposed for presentation. The demo does not enforce authenticated identities or real separation of duties.

State is in memory for the current page. There is no backend database, saved account data, shared session, or background cloud monitoring. The engine re-evaluates access as simulated signals change and on clock ticks. Browser background throttling can delay visible updates until the next tick or action.

Trusted means that the defined synthetic baseline passes. It is not a guarantee of zero vulnerabilities. Exception-active workloads do not count as fully trusted. No actual sessions are created or terminated, and no actual resources are decommissioned. Real revocation depends on provider/session mechanics, cached credentials, propagation, and enforcement confirmation.

Evidence is an ordinary JSON snapshot with linked identifiers. It is not signed, immutable audit storage, formal control certification, or production compliance evidence. Attestations are simulated owner/reviewer records; their historical snapshots remain separate from current control state.

Production implementation requires authoritative posture and identity sources, server-side authorization, authenticated reviewers, cloud-specific provisioning and access adapters, approved-task and entitlement integrations, durable policy and evidence stores, scanner/remediation integrations, enforcement confirmation, retention controls, and failure-handling design.

Cloud Trust is one product experience across four capabilities. Engineering ownership can remain distributed across provisioning, IAM, security, and risk teams while sharing workload identities, policy contracts, and evidence.
