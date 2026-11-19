import "dotenv/config";
import { Document } from "mongodb";
import {
  connectDB,
  usersCollection,
  tuitionsCollection,
  applicationsCollection,
} from "./config/db";
import {
  ADMIN_EMAIL,
  DEMO_TUTOR_EMAIL,
  DEMO_STUDENT_EMAIL,
  seedTutors,
  seedStudents,
  seedTuitions,
  seedApplications,
} from "./data/seedData";

async function runSeed() {
  await connectDB();
  const users = await usersCollection();
  const tuitions = await tuitionsCollection();
  const applications = await applicationsCollection();

  // Step 1: ager seed data muche felbo (real data ke chhunbo na)
  await users.deleteMany({ isSeed: true });
  await tuitions.deleteMany({ isSeed: true });
  await applications.deleteMany({ isSeed: true });
  console.log("Old seed data removed");

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  // Step 2: fake tutor ar student toiri
  const userDocs: Document[] = [];

  for (let i = 0; i < seedTutors.length; i++) {
    const tutor = seedTutors[i];
    const tutorDoc = {
      name: tutor.name,
      email: tutor.email,
      emailVerified: true,
      image: "",
      role: "tutor",
      phone: tutor.phone,
      bio: tutor.bio,
      plan: tutor.plan,
      createdAt: now,
      updatedAt: now,
      isSeed: true,
    };
    userDocs.push(tutorDoc);
  }

  for (let i = 0; i < seedStudents.length; i++) {
    const student = seedStudents[i];
    const studentDoc = {
      name: student.name,
      email: student.email,
      emailVerified: true,
      image: "",
      role: "student",
      phone: student.phone,
      bio: "",
      plan: "free",
      createdAt: now,
      updatedAt: now,
      isSeed: true,
    };
    userDocs.push(studentDoc);
  }

  await users.insertMany(userDocs);
  console.log("Users added: " + userDocs.length);

  // Step 3: tomar real demo account gula khuje ber kora
  const demoTutor = await users.findOne({ email: DEMO_TUTOR_EMAIL });
  const demoStudent = await users.findOne({ email: DEMO_STUDENT_EMAIL });

  if (!demoTutor) {
    console.log("Demo tutor account not found, its tuition will use name 'Demo Tutor'");
  }
  if (!demoStudent) {
    console.log("Demo student account not found, its applications will be skipped");
  }

  // Step 4: tuition toiri (index 0 shob theke notun)
  const tuitionDocs: Document[] = [];

  for (let i = 0; i < seedTuitions.length; i++) {
    const item = seedTuitions[i];

    let tutorName = item.tutorName;
    if (item.tutorEmail === DEMO_TUTOR_EMAIL && demoTutor) {
      tutorName = demoTutor.name;
    }

    const createdAt = new Date(now.getTime() - i * oneDay);

    const tuitionDoc = {
      title: item.title,
      subject: item.subject,
      classLevel: item.classLevel,
      mode: item.mode,
      location: item.location,
      monthlyFee: item.monthlyFee,
      daysPerWeek: item.daysPerWeek,
      bannerImage: item.bannerImage,
      description: item.description,
      tutorName: tutorName,
      tutorEmail: item.tutorEmail,
      approvalStatus: item.approvalStatus,
      isActive: true,
      createdAt: createdAt,
      isSeed: true,
    };
    tuitionDocs.push(tuitionDoc);
  }

  const tuitionResult = await tuitions.insertMany(tuitionDocs);
  console.log("Tuitions added: " + tuitionDocs.length);

  // Step 5: student list (fake + demo student)
  const studentList = [];

  for (let i = 0; i < seedStudents.length; i++) {
    studentList.push(seedStudents[i]);
  }

  if (demoStudent) {
    const demoStudentInfo = {
      name: demoStudent.name as string,
      email: demoStudent.email as string,
      phone: "01900000000",
    };
    studentList.push(demoStudentInfo);
  }

  // Step 6: application toiri
  const applicationDocs: Document[] = [];

  for (let i = 0; i < seedApplications.length; i++) {
    const item = seedApplications[i];

    // ei email er student khuje ber kora
    let foundStudent = null;
    for (let j = 0; j < studentList.length; j++) {
      if (studentList[j].email === item.studentEmail) {
        foundStudent = studentList[j];
      }
    }

    if (!foundStudent) {
      continue;
    }

    const tuition = tuitionDocs[item.tuitionIndex];
    const tuitionId = tuitionResult.insertedIds[item.tuitionIndex].toString();

    const applicationDoc = {
      tuitionId: tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail,
      studentName: foundStudent.name,
      studentEmail: foundStudent.email,
      studentPhone: foundStudent.phone,
      preferredSchedule: item.preferredSchedule,
      studentNote: item.studentNote,
      status: item.status,
      appliedAt: new Date(now.getTime() - i * oneDay),
      isSeed: true,
    };
    applicationDocs.push(applicationDoc);
  }

  await applications.insertMany(applicationDocs);
  console.log("Applications added: " + applicationDocs.length);

  // Step 7: admin account ke admin role deya
  const adminResult = await users.updateOne(
    { email: ADMIN_EMAIL },
    { $set: { role: "admin" } }
  );

  if (adminResult.matchedCount === 1) {
    console.log("Admin role given to " + ADMIN_EMAIL);
  } else {
    console.log("Admin account not found. Sign up with " + ADMIN_EMAIL + " first");
  }

  console.log("Seeding finished!");
}

runSeed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log("Seed failed:", error);
    process.exit(1);
  });