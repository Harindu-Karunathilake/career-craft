export type WhyChooseUsCard = {
  title: string
  description: string
  highlights: string[]
  metric: string
}

export const whyChooseUsCards: WhyChooseUsCard[] = [
  {
    title: "Interview prep that sticks",
    description: "Structured practice plans with feedback loops so you walk into every interview prepared and calm.",
    highlights: ["AI mock interviews", "Role-specific rubrics"],
    metric: "92% felt more confident in two weeks",
  },
  {
    title: "Application command center",
    description: "One view for tracking applications, due dates, referrals, and follow-ups so nothing slips.",
    highlights: ["Automated reminders", "Collaboration spaces"],
    metric: "Save ~4 hrs every week",
  },
  {
    title: "Guidance from mentors",
    description: "Tap into curated mentor notes and community playbooks built by hiring managers.",
    highlights: ["Weekly office hours", "Peer feedback"],
    metric: "850+ mentors available globally",
  },
]
