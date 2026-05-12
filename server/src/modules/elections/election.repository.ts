import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";

export class ElectionRepository {
  async findById(id: string) {
    return prisma.election.findUnique({
      where: { id },
      include: {
        candidates: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });
  }

  async create(data: Prisma.ElectionCreateInput) {
    return prisma.election.create({ data });
  }

  async upsertCandidate(electionId: string, userId: string, leadershipScore?: number) {
    return prisma.electionCandidate.upsert({
      where: { electionId_userId: { electionId, userId } },
      create: { electionId, userId, leadershipScore: leadershipScore ?? undefined },
      update: { leadershipScore: leadershipScore ?? undefined },
    });
  }

  async castVote(electionId: string, voterUserId: string, candidateUserId: string) {
    return prisma.$transaction(async (tx) => {
      const vote = await tx.electionVote.create({
        data: { electionId, voterUserId, candidateUserId },
      });
      await tx.electionCandidate.update({
        where: { electionId_userId: { electionId, userId: candidateUserId } },
        data: { totalVotes: { increment: 1 } },
      });
      return vote;
    });
  }

  async tally(electionId: string) {
    const sorted = await prisma.electionCandidate.findMany({
      where: { electionId },
      orderBy: { totalVotes: "desc" },
    });
    let rank = 1;
    for (const c of sorted) {
      await prisma.electionCandidate.update({
        where: { id: c.id },
        data: { finalRank: rank++ },
      });
    }
    return prisma.electionCandidate.findMany({
      where: { electionId },
      orderBy: { finalRank: "asc" },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }
}

export const electionRepository = new ElectionRepository();
