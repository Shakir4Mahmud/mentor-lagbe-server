// Ei 3 ta email tomar real account er sathe mile thakte hobe
export const ADMIN_EMAIL = "admin@mentorlagbe.com";
export const DEMO_TUTOR_EMAIL = "tutor@mentorlagbe.com";
export const DEMO_STUDENT_EMAIL = "student@mentorlagbe.com";

function img(photoId: string) {
  return (
    "https://images.unsplash.com/" +
    photoId +
    "?auto=format&fit=crop&w=800&q=80"
  );
}

export const seedTutors = [
  {
    name: "Rahim Uddin",
    email: "rahim.uddin@seed.mentorlagbe.com",
    phone: "01711000001",
    bio: "Mathematics teacher with 8 years of experience in SSC and HSC preparation.",
    plan: "free",
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat.jahan@seed.mentorlagbe.com",
    phone: "01711000002",
    bio: "Physics and Chemistry mentor. BUET graduate who loves concept based teaching.",
    plan: "pro",
  },
  {
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@seed.mentorlagbe.com",
    phone: "01711000003",
    bio: "Software engineer who teaches Python, C++ and problem solving to beginners.",
    plan: "pro",
  },
  {
    name: "Farhana Akter",
    email: "farhana.akter@seed.mentorlagbe.com",
    phone: "01711000004",
    bio: "IELTS trainer and English language coach. Overall band score 8.0.",
    plan: "pro",
  },
  {
    name: "Sabbir Hossain",
    email: "sabbir.hossain@seed.mentorlagbe.com",
    phone: "01711000005",
    bio: "Biology and General Science tutor. Medical admission coaching experience.",
    plan: "free",
  },
];

export const seedStudents = [
  {
    name: "Ayesha Siddika",
    email: "ayesha.siddika@seed.mentorlagbe.com",
    phone: "01811000001",
  },
  {
    name: "Imran Hossain",
    email: "imran.hossain@seed.mentorlagbe.com",
    phone: "01811000002",
  },
  {
    name: "Mitu Rahman",
    email: "mitu.rahman@seed.mentorlagbe.com",
    phone: "01811000003",
  },
];

// Index 0 theke 11 porjonto approved, 12 ar 13 pending
export const seedTuitions = [
  {
    title: "Complete SSC Mathematics Mastery",
    subject: "Mathematics",
    classLevel: "SSC (9-10)",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 3500,
    daysPerWeek: 4,
    bannerImage: img("photo-1635070041078-e363dbe005cb"),
    description:
      "Step by step coverage of the full SSC math syllabus including algebra, geometry and trigonometry. Weekly practice tests and doubt solving sessions are included.",
    tutorName: "Rahim Uddin",
    tutorEmail: "rahim.uddin@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "HSC Physics Concept Builder",
    subject: "Physics",
    classLevel: "HSC (11-12)",
    mode: "Offline",
    location: "Dhanmondi, Dhaka",
    monthlyFee: 4000,
    daysPerWeek: 3,
    bannerImage: img("photo-1509062522246-3755977927d7"),
    description:
      "Small batch classroom coaching focused on understanding concepts rather than memorizing. Includes numerical problem practice for every chapter.",
    tutorName: "Nusrat Jahan",
    tutorEmail: "nusrat.jahan@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Python Programming for Beginners",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 5000,
    daysPerWeek: 3,
    bannerImage: img("photo-1555066931-4365d14bab8c"),
    description:
      "Learn Python from zero. Variables, loops, functions, and small real projects. Perfect for university students starting their coding journey.",
    tutorName: "Tanvir Ahmed",
    tutorEmail: "tanvir.ahmed@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "IELTS Band 7+ Crash Course",
    subject: "IELTS",
    classLevel: "Professional",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 6000,
    daysPerWeek: 5,
    bannerImage: img("photo-1543269865-cbf427effbad"),
    description:
      "Intensive preparation for all four modules: Listening, Reading, Writing and Speaking. Includes weekly mock tests and personal speaking feedback.",
    tutorName: "Farhana Akter",
    tutorEmail: "farhana.akter@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Class 8 General Science Made Fun",
    subject: "Science",
    classLevel: "Class 6-8",
    mode: "Offline",
    location: "Mymensingh Sadar",
    monthlyFee: 2500,
    daysPerWeek: 3,
    bannerImage: img("photo-1503676260728-1c00da094a0b"),
    description:
      "Simple experiments and visual explanations to make science enjoyable for middle school students. Homework support included.",
    tutorName: "Sabbir Hossain",
    tutorEmail: "sabbir.hossain@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "HSC Biology Made Easy",
    subject: "Biology",
    classLevel: "HSC (11-12)",
    mode: "Offline",
    location: "GEC Circle, Chattogram",
    monthlyFee: 3500,
    daysPerWeek: 3,
    bannerImage: img("photo-1532094349884-543bc11b234d"),
    description:
      "Diagram focused teaching with memory tricks for botany and zoology. Medical admission oriented question practice.",
    tutorName: "Sabbir Hossain",
    tutorEmail: "sabbir.hossain@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Spoken English Confidence Program",
    subject: "English",
    classLevel: "Professional",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 3000,
    daysPerWeek: 3,
    bannerImage: img("photo-1522202176988-66273c2fd55f"),
    description:
      "Daily conversation practice, pronunciation training and interview speaking skills. Small group sessions with real life role plays.",
    tutorName: "Farhana Akter",
    tutorEmail: "farhana.akter@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "HSC Chemistry: Organic and Physical",
    subject: "Chemistry",
    classLevel: "HSC (11-12)",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 4000,
    daysPerWeek: 4,
    bannerImage: img("photo-1456513080510-7bf3a84b82f8"),
    description:
      "Chapter wise recorded notes, live problem solving and weekly exams. Special focus on organic reaction mechanisms.",
    tutorName: "Nusrat Jahan",
    tutorEmail: "nusrat.jahan@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "JavaScript and React Bootcamp",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 5500,
    daysPerWeek: 4,
    bannerImage: img("photo-1498050108023-c5249f4df085"),
    description:
      "From JavaScript basics to building real React projects. Weekly project reviews and career guidance for junior developers.",
    tutorName: "Demo Tutor",
    tutorEmail: DEMO_TUTOR_EMAIL,
    approvalStatus: "approved",
  },
  {
    title: "Class 6-8 Math Foundation",
    subject: "Mathematics",
    classLevel: "Class 6-8",
    mode: "Offline",
    location: "Jamalpur Town",
    monthlyFee: 2000,
    daysPerWeek: 3,
    bannerImage: img("photo-1434030216411-0b793f4b4173"),
    description:
      "Build a strong base in arithmetic, fractions and basic algebra with daily practice sheets and friendly one to one attention.",
    tutorName: "Rahim Uddin",
    tutorEmail: "rahim.uddin@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Engineering Admission Physics",
    subject: "Physics",
    classLevel: "HSC (11-12)",
    mode: "Offline",
    location: "Shaheb Bazar, Rajshahi",
    monthlyFee: 4500,
    daysPerWeek: 5,
    bannerImage: img("photo-1517694712202-14dd9538aa97"),
    description:
      "Admission test focused physics batch with previous year question solving and timed model tests every week.",
    tutorName: "Nusrat Jahan",
    tutorEmail: "nusrat.jahan@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Data Structures and Algorithms with C++",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Online (Discord)",
    monthlyFee: 4500,
    daysPerWeek: 3,
    bannerImage: img("photo-1555066931-4365d14bab8c"),
    description:
      "Learn arrays, linked lists, trees, graphs and sorting with C++. Great for university students preparing for coding interviews.",
    tutorName: "Tanvir Ahmed",
    tutorEmail: "tanvir.ahmed@seed.mentorlagbe.com",
    approvalStatus: "approved",
  },
  {
    title: "Academic Writing and Grammar Booster",
    subject: "English",
    classLevel: "SSC (9-10)",
    mode: "Offline",
    location: "Mirpur, Dhaka",
    monthlyFee: 2800,
    daysPerWeek: 3,
    bannerImage: img("photo-1513258496099-48168024aec0"),
    description:
      "Improve grammar, paragraph writing and composition skills for SSC exams with weekly writing practice and feedback.",
    tutorName: "Farhana Akter",
    tutorEmail: "farhana.akter@seed.mentorlagbe.com",
    approvalStatus: "pending",
  },
  {
    title: "Advanced Calculus for Engineering Students",
    subject: "Mathematics",
    classLevel: "University",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 4200,
    daysPerWeek: 3,
    bannerImage: img("photo-1635070041078-e363dbe005cb"),
    description:
      "Limits, derivatives, integrals and differential equations explained with engineering examples and solved problem sets.",
    tutorName: "Rahim Uddin",
    tutorEmail: "rahim.uddin@seed.mentorlagbe.com",
    approvalStatus: "pending",
  },
];

// tuitionIndex = seedTuitions array er index
export const seedApplications = [
  {
    tuitionIndex: 7,
    studentEmail: "ayesha.siddika@seed.mentorlagbe.com",
    status: "pending",
    preferredSchedule: "Sat, Mon, Wed at 8 PM",
    studentNote: "I know basic HTML and want to learn React step by step.",
  },
  {
    tuitionIndex: 7,
    studentEmail: "imran.hossain@seed.mentorlagbe.com",
    status: "accepted",
    preferredSchedule: "Sun, Tue, Thu at 9 PM",
    studentNote: "I want to build a portfolio project during the course.",
  },
  {
    tuitionIndex: 7,
    studentEmail: DEMO_STUDENT_EMAIL,
    status: "pending",
    preferredSchedule: "Fri and Sat evening",
    studentNote: "Beginner in JavaScript, looking for guidance.",
  },
  {
    tuitionIndex: 0,
    studentEmail: DEMO_STUDENT_EMAIL,
    status: "accepted",
    preferredSchedule: "Sat to Tue at 6 PM",
    studentNote: "I am weak in geometry and need extra practice.",
  },
  {
    tuitionIndex: 0,
    studentEmail: "ayesha.siddika@seed.mentorlagbe.com",
    status: "pending",
    preferredSchedule: "Evening after 5 PM",
    studentNote: "Preparing for SSC next year.",
  },
  {
    tuitionIndex: 3,
    studentEmail: DEMO_STUDENT_EMAIL,
    status: "rejected",
    preferredSchedule: "Morning 7 AM",
    studentNote: "Need IELTS band 7 for scholarship application.",
  },
  {
    tuitionIndex: 1,
    studentEmail: "imran.hossain@seed.mentorlagbe.com",
    status: "pending",
    preferredSchedule: "Sat, Mon, Wed at 4 PM",
    studentNote: "I stay near Dhanmondi, offline class is perfect for me.",
  },
  {
    tuitionIndex: 3,
    studentEmail: "ayesha.siddika@seed.mentorlagbe.com",
    status: "accepted",
    preferredSchedule: "Evening 8 PM",
    studentNote: "Targeting 7.5 band in the next exam.",
  },
  {
    tuitionIndex: 5,
    studentEmail: "mitu.rahman@seed.mentorlagbe.com",
    status: "pending",
    preferredSchedule: "Fri to Sun at 7 PM",
    studentNote: "I get nervous during interviews and want to improve.",
  },
];