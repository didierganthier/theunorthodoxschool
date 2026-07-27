import { siteConfig } from "./site-config";

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Do I need programming experience?",
    answer:
      "No. The program starts from the beginning and builds up. Early levels focus on mindset, learning skills, and using AI. Programming is introduced gradually in Level 3.",
  },
  {
    question: "Do I need a degree?",
    answer:
      "No. This school is built for self-taught learners, students, and anyone willing to learn by doing. What matters is your effort and the work you produce.",
  },
  {
    question: "Is the program completely online?",
    answer:
      "Yes. Everything happens online and at your own pace. You can start today and progress whenever you have time.",
  },
  {
    question: "Are lessons live?",
    answer:
      "No. Lessons are self-paced and available whenever you are. There is no required live session and no fixed class time.",
  },
  {
    question: "How long does the program take?",
    answer:
      `There are ${siteConfig.recommendedDuration.levels} levels, usually completed in about ${siteConfig.recommendedDuration.typicalWeeks} weeks. But it is self-paced — you can move faster or slower depending on your schedule.`,
  },
  {
    question: "What happens when I get stuck?",
    answer:
      "Getting stuck is part of learning. You can re-read the lesson, retry the checkpoint, and use optional community support. Administrative support is available for account, technical, and evaluation issues.",
  },
  {
    question: "Do I need a GitHub account?",
    answer:
      "Yes, for the technical levels. You will create one in Level 0. GitHub is where your projects are stored, checked, and published. Setting it up early removes friction later.",
  },
  {
    question: "Will I receive a certificate?",
    answer:
      "You finish with something stronger than a certificate: a real, published project on GitHub and verifiable proof of the skills you demonstrated. Formal recognition may be added over time.",
  },
  {
    question: "Can I complete the program using only a phone?",
    answer:
      "Partly. Reading lessons and quizzes work on a phone. However, the programming projects in later levels are much easier on a computer, and we recommend access to one for those parts.",
  },
  {
    question: `What does the ${siteConfig.price.label} cover?`,
    answer:
      `The ${siteConfig.price.label} supports access to the guided curriculum, automated checkpoints, and the project infrastructure that verifies your work. Payment is not yet enabled on the site — enrollment currently happens through the application.`,
  },
];
