import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { electionRepository } from "./election.repository.js";
import { prisma } from "../../config/db.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
import type { AuthUser } from "../../types/auth.js";

export const createElectionSchema = z.object({
  title: z.string().min(3),
  roleId: z.string().uuid().optional().nullable(),
  areaType: z.enum(["STATE", "DISTRICT", "BLOCK", "BOOTH"]),
  stateId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  boothId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const registerCandidateSchema = z.object({
  userId: z.string().uuid(),
});

export const voteSchema = z
  .object({
    candidateUserId: z.string().uuid().optional(),
    candidateId: z.string().uuid().optional(),
  })
  .refine((d) => !!(d.candidateUserId || d.candidateId), { message: "candidate required" });

export const nominateSchema = z.object({
  statement: z.string().max(8000).optional().nullable(),
});

export class ElectionService {
  async listElections(viewer: AuthUser) {
    const or: Prisma.ElectionWhereInput[] = [];
    if (viewer.stateId) or.push({ stateId: viewer.stateId });
    if (viewer.districtId) or.push({ districtId: viewer.districtId });
    if (viewer.blockId) or.push({ blockId: viewer.blockId });
    if (viewer.boothId) or.push({ boothId: viewer.boothId });

    return prisma.election.findMany({
      where: or.length ? { OR: or } : {},
      include: {
        candidates: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                totalReferrals: true,
              },
            },
          },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { startDate: "desc" },
    });
  }

  async electionResults(electionId: string) {
    const tallies = await prisma.electionVote.groupBy({
      by: ["candidateUserId"],
      where: { electionId },
      _count: { candidateUserId: true },
    });

    const ids = tallies.map((t) => t.candidateUserId);
    const rows = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, profileImage: true, totalReferrals: true },
    });

    return tallies
      .map((t) => {
        const u = rows.find((r) => r.id === t.candidateUserId);
        return {
          id: u?.id,
          name: u?.fullName,
          profilePhotoUrl: u?.profileImage,
          directCount: u?.totalReferrals ?? 0,
          voteCount: t._count.candidateUserId,
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);
  }

  async selfNominate(electionId: string, viewer: AuthUser, statement?: string | null) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new NotFoundError("Election not found");
    if (election.status !== "UPCOMING" && election.status !== "ACTIVE") {
      throw new ValidationError("Election not open for registration");
    }

    const directRefs = await prisma.user.count({ where: { referredById: viewer.id } });
    if (directRefs < 50) throw new ForbiddenError("Need 50+ direct referrals to nominate");

    const user = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: { leadershipScore: true },
    });
    if (!user) throw new NotFoundError("User");

    return electionRepository.upsertCandidate(electionId, viewer.id, {
      leadershipScore: Number(user.leadershipScore),
      statement: statement ?? undefined,
    });
  }

  async createElection(input: z.infer<typeof createElectionSchema>, by: AuthUser) {
    return electionRepository.create({
      title: input.title,
      role: input.roleId ? { connect: { id: input.roleId } } : undefined,
      areaType: input.areaType,
      state: input.stateId ? { connect: { id: input.stateId } } : undefined,
      district: input.districtId ? { connect: { id: input.districtId } } : undefined,
      block: input.blockId ? { connect: { id: input.blockId } } : undefined,
      booth: input.boothId ? { connect: { id: input.boothId } } : undefined,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: "UPCOMING",
      createdBy: { connect: { id: by.id } },
    });
  }

  async registerCandidate(electionId: string, body: z.infer<typeof registerCandidateSchema>, viewer: AuthUser) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new NotFoundError("Election not found");
    if (election.status !== "UPCOMING" && election.status !== "ACTIVE") {
      throw new ValidationError("Election not open for registration");
    }
    if (body.userId !== viewer.id) throw new ForbiddenError();

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { leadershipScore: true },
    });
    if (!user) throw new NotFoundError("User not found");

    return electionRepository.upsertCandidate(electionId, body.userId, {
      leadershipScore: Number(user.leadershipScore),
    });
  }

  async vote(electionId: string, body: z.infer<typeof voteSchema>, voter: AuthUser) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new NotFoundError("Election not found");
    if (election.status !== "ACTIVE") throw new ValidationError("Election is not active");

    const candidateUserId = body.candidateUserId ?? body.candidateId;
    if (!candidateUserId) throw new ValidationError("candidate required");

    const candidate = await prisma.electionCandidate.findUnique({
      where: { electionId_userId: { electionId, userId: candidateUserId } },
    });
    if (!candidate) throw new ValidationError("Candidate not standing in this election");

    try {
      return await electionRepository.castVote(electionId, voter.id, candidateUserId);
    } catch {
      throw new ValidationError("Vote already cast");
    }
  }

  async closeAndTally(electionId: string) {
    await prisma.election.update({
      where: { id: electionId },
      data: { status: "COMPLETED" },
    });
    return electionRepository.tally(electionId);
  }
}

export const electionService = new ElectionService();
