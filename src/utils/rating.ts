import { applicationsCollection, usersCollection } from "../config/db";

export type RatingSummary = {
  average: number;
  count: number;
};

// Onek gulo tuition er average rating ek shathe ber kore
export async function getRatingSummaries(tuitionIds: string[]) {
  const applications = await applicationsCollection();

  const groups = await applications
    .aggregate([
      {
        $match: {
          tuitionId: { $in: tuitionIds },
          rating: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$tuitionId",
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const map: Record<string, RatingSummary> = {};

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const average = Math.round(Number(group.average) * 10) / 10;

    map[String(group._id)] = {
      average: average,
      count: Number(group.count),
    };
  }

  return map;
}

// Ekta tuition er shob review, average ar star wise count
export async function getTuitionReviews(tuitionId: string) {
  const applications = await applicationsCollection();

  const list = await applications
    .find({ tuitionId: tuitionId, rating: { $exists: true } })
    .sort({ reviewedAt: -1 })
    .toArray();

  // Student der profile photo ber kori
  const emails: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const email = list[i].studentEmail as string;
    if (!emails.includes(email)) {
      emails.push(email);
    }
  }

  const users = await usersCollection();
  const students = await users.find({ email: { $in: emails } }).toArray();

  const reviews = [];

  // distribution[0] = 1 star koyta, distribution[4] = 5 star koyta
  const distribution = [0, 0, 0, 0, 0];
  let sum = 0;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    let studentImage = "";
    for (let j = 0; j < students.length; j++) {
      if (students[j].email === item.studentEmail && students[j].image) {
        studentImage = students[j].image;
      }
    }

    const rating = Number(item.rating);
    sum = sum + rating;

    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1] = distribution[rating - 1] + 1;
    }

    reviews.push({
      _id: item._id.toString(),
      studentName: item.studentName as string,
      studentImage: studentImage,
      rating: rating,
      review: (item.review as string) || "",
      reviewedAt: item.reviewedAt,
    });
  }

  let average = 0;
  if (list.length > 0) {
    average = Math.round((sum / list.length) * 10) / 10;
  }

  return {
    reviews: reviews,
    summary: {
      average: average,
      count: list.length,
      distribution: distribution,
    },
  };
}