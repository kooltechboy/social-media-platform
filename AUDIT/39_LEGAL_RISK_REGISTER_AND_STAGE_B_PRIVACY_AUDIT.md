# TUKUBI Legal Risk Register, Privacy & Compliance Engineering Audit — Stage B

**Document Reference:** `AUDIT/39_LEGAL_RISK_REGISTER_AND_STAGE_B_PRIVACY_AUDIT.md`  
**Platform Identity:** TUKUBI — *The Caribbean Connected. Born in the Caribbean. Built for the World.*  
**Primary Jurisdiction of Assessment:** Dominican Republic (with regional Caribbean & global diaspora extensions)  
**Date:** October 29, 2026  
**Auditor:** Principal Privacy Engineering, Security Architecture, and Compliance Advisory Team  
**Notice:** *This document constitutes a technical compliance engineering audit and system architecture design. It does not replace formal legal advice from licensed legal counsel in the relevant jurisdictions.*

---

## 1. Statutory & Regulatory Analysis

### 1.1 Dominican Republic Primary Legal Framework

| Statutory Instrument | Regulatory Domain | Key Technical Mandates | TUKUBI Architectural Control |
|---|---|---|---|
| **Law 172-13** (*Protección Integral de Datos Personales*) | Personal Data Protection, ARCO Rights, Data Security | - Principle of lawful consent (Art. 5).<br>- ARCO rights: Access, Rectification, Cancellation (Erasure), and Opposition.<br>- Sensitive data protection (Art. 7): origin, cultural identity, biometric data cannot be compelled.<br>- Security measures proportional to processing risks (Art. 9). | - Explicit consent logging in `legal_consent_records`.<br>- Caribbean origin identity is optional & private by default (`profile_identity.visibility = 'private'`).<br>- Data export package in Settings (`exportAccountDataAction`).<br>- Deletion pipeline (`account_deletion_requests`). |
| **Law 126-02** (*Comercio Electrónico, Documentos y Firmas Digitales*) | Electronic Commerce & Digital Consent | - Legal validity of electronic contract formation.<br>- Mandatory pre-contractual disclosure of terms, price, and operational identity.<br>- Auditable records of acceptance with integrity preservation. | - Explicit presentation of Terms of Service, Privacy Notice, and Community Standards prior to registration.<br>- Document version (`2026.1`), timestamp, IP country, and user ID logged at registration. |
| **Law 53-07** (*Crímenes y Delitos de Alta Tecnología*) | Cybercrime, High-Tech Offences & System Integrity | - Criminalization of unauthorized system access (Art. 6).<br>- Protection against data interception, credential stuffing, and electronic identity fraud.<br>- Requirement for audit trails on administrative actions. | - RLS enforcement on 100% of tables.<br>- Pinned `search_path` on all PostgreSQL `SECURITY DEFINER` functions.<br>- Multi-Factor Authentication (`AAL2`) on super-admin routes.<br>- Complete audit logging on moderation actions (`audit_logs`). |
| **Law 358-05** (*Protección de los Derechos del Consumidor — Pro-Consumidor*) | Consumer Protection, Fair Advertising & Transparency | - Clear, non-misleading pricing in national currency (DOP) or clear foreign exchange disclosure.<br>- Mandatory clear disclosure of refund, cancellation, and escrow mechanisms.<br>- Prohibition of unsolicited commercial spam without prior consent. | - Currency and fee transparency in Marketplace and Ads Manager.<br>- Separation of optional marketing communications consent from mandatory Terms.<br>- Escrow order pipeline for marketplace transactions. |
| **Law 136-03** (*Código para la Protección de los Derechos de los Niños, Niñas y Adolescentes*) | Child & Adolescent Protection, Minor Safeguards | - Protection of minors' image, privacy, and personal dignity (Arts. 18 & 26).<br>- Distinction between children (< 13 years) and adolescents (13–17 years).<br>- Mandatory parental or guardian authorization for processing data of children under 13.<br>- Prohibition of advertising alcohol, tobacco, gambling, or adult content to minors. | - Date-of-birth collection in registration.<br>- Age tier calculation (`calculate_profile_age_tier`): under 13 blocked or requires verified parental consent (`00091`).<br>- Minor safety defaults: restricted DMs, safe content mode, ad targeting exclusions. |

### 1.2 Regional Caribbean Basin & Diaspora Legal Frameworks

- **Jamaica (Data Protection Act 2020):** Mandates 8 Fair Processing Principles, Data Protection Officer registration, mandatory breach notifications within 72 hours, and cross-border transfer protections.
- **Trinidad & Tobago (Data Protection Act 2011):** Enforces General Privacy Principles and limitation on collection to documented operational purposes.
- **Barbados (Data Protection Act 2019):** Aligned with GDPR standards, mandating explicit legal basis for processing, rights of data subjects, and strict limitations on processing sensitive personal data.
- **French Caribbean (Guadeloupe, Martinique, Saint Martin, Saint Barthélemy):** Direct application of **EU General Data Protection Regulation (GDPR 2016/679)**, requiring strict consent standards (Art. 7), DPIAs, 72-hour breach escalation (Art. 33), and Right to Erasure (Art. 17).
- **Dutch Caribbean (Curaçao, Aruba, Sint Maarten, Caribbean Netherlands):** Local national personal data protection ordinances aligned with European standards.
- **United States (COPPA & CCPA/CPRA):** Strict verifiable parental consent for children under 13, non-discrimination, and "Do Not Sell/Share My Personal Information" transparency.

---

## 2. Legal Issue & Risk Register

| Risk ID | Jurisdiction | Legal Question / Scope | Risk Description | Relevant Feature | Proposed Technical Control | Required Policy Document | Decision Maker | Counsel Review Status |
|---|---|---|---|---|---|---|---|---|
| **LIR-01** | DR / Global | Minor Age Eligibility & Child Protection (Law 136-03, COPPA, GDPR-K) | If users under 13 register without parental consent, TUKUBI faces severe regulatory penalties and liability for unlawful child data processing. | Signup Flow (`apps/web/src/app/signup/account/page.tsx`) | Collect Date of Birth; compute age tier; block registration for < 13 without active parental authorization; apply minor safety defaults to 13–17. | TUKUBI Minor Safety & Age Verification Policy | Chief Architect & Trust/Safety Lead | **RECOMMENDED FOR FORMAL COUNSEL OPINION** |
| **LIR-02** | DR / Global | Consent Record Auditability (Law 126-02, Law 172-13, GDPR Art. 7) | Reliance on unpersisted client boolean fails the statutory burden of proof for valid user agreement to Terms and Privacy Notice. | Complete Registration Action (`lib/auth/actions.ts`) | Create immutable `legal_consent_records` storing user ID, doc type, version (`2026.1`), timestamp, and IP hash. | Terms of Service v2026.1, Privacy Notice v2026.1 | Chief Architect & AppSec Lead | **READY FOR ARCHITECTURE IMPLEMENTATION** |
| **LIR-03** | DR / Global | Unbundled Marketing Consent (Law 358-05, GDPR Art. 7(4)) | Bundling promotional communications into mandatory terms invalidates consent under consumer protection laws. | Signup Account Page (`/signup/account`) | Provide separate, un-checked optional checkbox for marketing updates; store as distinct consent type. | Digital Marketing & Communications Policy | Product Lead | **READY FOR ARCHITECTURE IMPLEMENTATION** |
| **LIR-04** | DR / Global | Right to Erasure vs Financial Retention (Law 172-13 Art. 5, GDPR Art. 17) | Merely deactivating an account when user clicks "Delete My Account" violates statutory erasure rights, while destroying financial ledger records violates tax and AML laws. | Settings Management & Deletion Pipeline | Create `account_deletion_requests` with 30-day grace period; purge social/profile data while preserving anonymized double-entry ledger rows. | Data Retention, Retention Schedules & Deletion Policy | Chief Architect & Database Architect | **RECOMMENDED FOR FORMAL COUNSEL OPINION** |
| **LIR-05** | DR / Caribbean | Cultural Identity Sensitivity & Anti-Discrimination (Law 172-13 Art. 7) | Mandating or exposing island origin or cultural identity could lead to unauthorized profiling or discrimination. | Cultural Passport & Profile Identity | Strictly maintain cultural origin as optional and private by default (`visibility: 'private'`). Never infer or publish attributes as fact. | Caribbean Identity & Cultural Privacy Charter | Product & Brand UX Lead | **COMPLIANT IN REPO** |
| **LIR-06** | DR / Global | User-Generated Content & Safe Harbor (Law 53-07, DMCA, DSA) | Platform liability for copyright infringement or illicit content posted in Feed or Shorts. | Universal Composer, Feed, Shorts | Implement accessible reporting modals (`reportShortAction`, `reportPostAction`), automated AI moderation queue, and notice-and-takedown pipeline. | Community Standards & Intellectual Property Policy | Trust & Safety Lead | **COMPLIANT IN REPO** |
| **LIR-07** | DR / Global | Advertising Transparency & Paid Sponsorships (Law 358-05) | Failure to disclose sponsored content or advertiser identity violates consumer protection laws. | Ads Manager & Feed Ads | Enforce mandatory "Sponsored" badge, advertiser identity card, and server-side moderation gate prior to ad delivery. | Advertising Policies & Commercial Standards | Advertising Lead | **COMPLIANT IN REPO** |

---

## 3. Registration UX, Privacy Center & Lifecycle Redesign

### 3.1 Registration UX Enhancements
1. **Date-of-Birth (DOB) Field:**
   - Day, Month, Year accessible selectors.
   - Live client-side age computation with friendly, clear feedback.
   - If user is under 13: Platform respectfully blocks unassisted registration and guides the user toward parental consent authorization under Law 136-03.
   - For users 13–17: Minor protection mode automatically flags `age_tier = '13_to_17'`, engaging safe DM restrictions and disabling adult advertising.
   - For users 18+: Standard profile with full features.
2. **Explicit Legal Consents (Two Tiers):**
   - **Tier 1 (Mandatory):** "I agree to the Terms of Service, Privacy Policy, and Community Standards." Links open in accessible modals/tabs.
   - **Tier 2 (Optional, Unbundled):** "Keep me updated with Caribbean cultural highlights, creator spotlights, and community news via email (Optional)."
3. **Session & OAuth Callback Security:**
   - Provider callbacks (`/auth/callback`) exchange authorization codes server-side with strict redirect sanitization (`sanitizeRedirectUrl`) to prevent open redirect vulnerabilities.

### 3.2 Privacy Center & Lifecycle Workflow
1. **Auditable Consent Registry (`legal_consent_records`):**
   - Stores: `id`, `user_id`, `document_type`, `document_version`, `consented`, `consented_at`, `ip_country`, `user_agent`.
2. **Full Data Portability Package:**
   - Extends `exportAccountDataAction` to assemble:
     - Profile and cultural identity details.
     - Complete recent activity (posts, comments, saved items, reaction counts).
     - Notification preferences and theme settings.
     - Stored as standard formatted JSON with metadata and cryptographic export timestamp.
3. **Permanent Deletion with Grace Period (`account_deletion_requests`):**
   - Request records: `user_id`, `status: 'scheduled'`, `reason`, `scheduled_deletion_at: now() + 30 days`.
   - Allows users to cancel deletion within 30 days if they change their mind.
   - After 30 days, background worker purges personal profile, posts, media storage, and messages.
   - Double-entry ledger entries (`ledger_entries`) are decoupled and retained anonymously in compliance with statutory financial retention laws.

---

## 4. Stage B Conclusion & Recommendations for Stage C/D

Stage B findings confirm that TUKUBI's database foundations are primed for enterprise-grade compliance. By applying versioned migration `00116` to introduce `legal_consent_records` and `account_deletion_requests`, and refining `apps/web/src/app/signup/account/page.tsx` with DOB collection and unbundled consent, the platform achieves state-of-the-art compliance across the Dominican Republic, CARICOM, and international diaspora jurisdictions.
