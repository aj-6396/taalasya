export interface TermClause {
  number: string;
  title: string;
  subclauses?: string[];
  content?: string;
  points?: string[];
}

export const TERMS_AND_CONDITIONS = {
  title: "TERMS AND CONDITIONS FOR ENTRY PASSES: JHOOM '26",
  organization: "Taalasya Dance Society, Banaras Hindu University",
  aegis: "Dean of Students, BHU",
  preamble:
    "Jhoom'26 is organised by the Taalasya Dance Society, Banaras Hindu University (\"Taalasya\" or \"the Organisers\"), under the aegis of the Dean of Students, BHU. By purchasing an entry pass, you (\"the Attendee\") agree to the following terms.",
  clauses: [
    {
      number: "1",
      title: "Acceptance and electronic consent",
      subclauses: [
        "1.1 Ticking the checkbox and purchasing a pass constitutes your electronic consent to, and legally binding acceptance of, these terms, and your agreement to comply with them.",
        "1.2 Attendees below 18 years of age may attend only if accompanied throughout the event by a parent or legal guardian who is 18 or above, holds a valid pass, accepts these terms, and is responsible for the minor's conduct and safety. The pass for a minor must be purchased by or through the accompanying parent or guardian. Any minor who is not so accompanied may be refused entry or removed without refund.",
        "1.3 You consent to the collection and use of your personal details as set out in Clause 13.",
        "1.4 If you do not agree, do not purchase a pass or attend the event.",
      ],
    },
    {
      number: "2",
      title: "Eligibility and entry",
      subclauses: [
        "2.1 Entry is permitted only on presentation of a valid pass together with a valid BHU ID card.",
        "2.2 Passes are non-transferable and non-refundable, except as provided in Clause 12.",
        "2.3 The Organisers may refuse entry to anyone who cannot verify their identity or who appears to be under the influence of alcohol or any prohibited substance.",
        "2.4 Passes are valid for a single entry. Re-entry is not permitted.",
      ],
    },
    {
      number: "3",
      title: "Dress code",
      subclauses: [
        "3.1 Attendees must wear attire that is decent and appropriate for a University cultural event.",
        "3.2 Clothing carrying obscene, offensive, abusive or provocative slogans or imagery is not permitted.",
        "3.3 Footwear should be suitable for a crowded dance event, and attendees should avoid items that could injure themselves or others.",
        "3.4 The Organisers may refuse entry to, or ask to leave, any Attendee who does not comply, without refund. Their decision on this is final.",
      ],
    },
    {
      number: "4",
      title: "Code of conduct",
      content: "Attendees must not:",
      points: [
        "(a) engage in or provoke any physical or verbal altercation, threat, intimidation or violence;",
        "(b) harass, stalk, or behave in a derogatory, abusive, discriminatory or sexually inappropriate manner towards any person, including on grounds of gender, caste, religion, region, language or appearance;",
        "(c) bring or consume alcohol, narcotics, or any substance prohibited by law or University rules;",
        "(d) bring weapons, sharp objects, firecrackers or any item that may endanger others;",
        "(e) damage or deface property, stage, equipment or decorations;",
        "(f) climb on structures, enter restricted areas, or block entry and exit routes;",
        "(g) disobey instructions of the Organisers, volunteers, security personnel or University authorities;",
        "(h) otherwise act in a way that makes the event unsafe or disrupts its smooth conduct.",
      ],
    },
    {
      number: "5",
      title: "Right to remove and refuse entry",
      subclauses: [
        "5.1 Taalasya, acting through its core committee, volunteers or designated security, reserves the right, at its sole discretion, to refuse entry to, or remove from the venue, any Attendee who violates these terms, the University's rules, or who in the Organisers' opinion poses a risk to the safety or comfort of others.",
        "5.2 Removal under this clause will be without refund and without any liability on the Organisers.",
        "5.3 Attendees must comply immediately with a removal instruction. Resistance may result in the matter being referred to the authorities under Clause 6.",
      ],
    },
    {
      number: "6",
      title: "Disciplinary and legal authorities",
      subclauses: [
        "6.1 Incidents of violence, misconduct or disputes between students on the BHU campus fall within the jurisdiction of the Proctorial Board, BHU. The Organisers may report any such incident to the Proctorial Board, and the Attendee agrees to be subject to its proceedings and decisions.",
        "6.2 All other criminal or legal matters are for the police and competent authorities, to whom the Organisers may report or hand over any Attendee.",
        "6.3 The Organisers are not an investigating, adjudicating or law-enforcement body, and their role is limited to organising the event, maintaining order at it and reporting incidents.",
      ],
    },
    {
      number: "7",
      title: "Assumption of risk",
      content:
        "The Attendee acknowledges that attending a crowded public event involves inherent risks, including crowd movement, noise, physical contact, injury and loss of property, and attends voluntarily and at their own risk.",
    },
    {
      number: "8",
      title: "Limitation of liability",
      subclauses: [
        "8.1 To the fullest extent permitted by law, the Organisers, Taalasya Dance Society, its office-bearers, members and volunteers, and the University (including the Dean of Students' office) shall not be liable for any injury, loss, theft, damage, or harm to any person or property arising from or in connection with the event, including acts or omissions of other Attendees or third parties.",
        "8.2 The Attendee is solely responsible for their personal belongings and for their own conduct and its consequences.",
        "8.3 The Attendee agrees not to bring claims against the Organisers for the above, except where the harm results from the Organisers' own gross negligence or wilful misconduct, or where law does not permit exclusion.",
      ],
    },
    {
      number: "9",
      title: "Responsibility for own acts",
      content:
        "Attendees are individually liable for any damage, injury or loss they cause, and agree to indemnify the Organisers against claims arising from their own breach of these terms or unlawful conduct.",
    },
    {
      number: "10",
      title: "Safety, security and searches",
      content:
        "The Organisers or security personnel may conduct bag checks and pat-downs (by personnel of the same gender) at entry. Refusal to comply may result in denial of entry without refund. Attendees must follow emergency and evacuation instructions.",
    },
    {
      number: "11",
      title: "Further action",
      content:
        "Any breach of these terms may result in such further action as the Organisers, the University authorities or other competent authorities may deem appropriate.",
    },
    {
      number: "12",
      title: "Refunds, cancellation and changes",
      subclauses: [
        "12.1 Passes are non-refundable once purchased, except as stated in this clause.",
        "12.2 If the Organisers cancel the event, the Attendee will be refunded the pass amount paid, excluding non-refundable payment gateway transaction and processing fees to the original payment method, within 15 working days of the cancellation announcement.",
        "12.3 If the event is postponed or rescheduled, the pass remains valid for the new date. An Attendee who cannot attend the new date may request a refund within 7 days of the announcement (subject to deduction of payment gateway transaction charges).",
        "12.4 No refund will be given where the Attendee is refused entry or removed under these terms, does not attend or arrives late, is unable to attend for personal reasons, or where the event is interrupted or shortened after it has begun due to weather, safety concerns, or directions of the University or authorities.",
        "12.5 Change of performers, programme or venue within the University do not entitle the Attendee to a refund.",
      ],
    },
    {
      number: "13",
      title: "Data and privacy",
      subclauses: [
        "13.1 Personal details submitted by the Attendee in connection with the purchase of a pass (such as name, contact details and ID details) will be accessible only to authorised members of Taalasya Dance Society and will not be shared with anyone outside the Organisers, other than the platforms used to process payment and registration for the event.",
        "13.2 These details will be used only to verify the Attendee's details and to communicate with the Attendee about the event, and for no other purpose.",
        "13.3 These details will be deleted within 30 days after the conclusion of the event, and will not be used further.",
        "13.4 Nothing in this clause prevents the Organisers from sharing relevant details with the Proctorial Board, University authorities or the police where required to report or deal with an incident under Clause 6 or where required by law, and retaining them until that matter is resolved.",
        "13.5 Photographs and recordings are governed separately by Clause 14.",
      ],
    },
    {
      number: "14",
      title: "Photography and recording",
      content:
        "The event may be photographed or recorded for documentation and promotion. By attending, the Attendee consents to the use of their image or likeness in such material by the Organisers. Attendees who object must inform the Organisers in writing before the event.",
    },
    {
      number: "15",
      title: "University rules",
      content:
        "All Attendees remain bound by BHU's rules, ordinances and the directions of the Proctorial Board and University authorities throughout the event.",
    },
    {
      number: "16",
      title: "Governing law and jurisdiction",
      content:
        "These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts at Varanasi, Uttar Pradesh.",
    },
    {
      number: "17",
      title: "Contact",
      content: "For queries or concerns, contact:",
    },
  ],
  contacts: [
    {
      name: "Avinash",
      role: "Secretary",
      phone: "8677953892",
    },
    {
      name: "Agrimaa",
      role: "Joint Secretary",
      phone: "9289399669",
    },
  ],
};
