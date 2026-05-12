import { z } from "zod";
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

export const voteSchema = z.object({
  candidateUserId: z.string().uuid(),
});

export class ElectionService {
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

    return electionRepository.upsertCandidate(
      electionId,
      body.userId,
      Number(user.leadershipScore),
    );
  }

  async vote(electionId: string, body: z.infer<typeof voteSchema>, voter: AuthUser) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new NotFoundError("Election not found");
    if (election.status !== "ACTIVE") throw new ValidationError("Election is not active");

    const candidate = await prisma.electionCandidate.findUnique({
      where: { electionId_userId: { electionId, userId: body.candidateUserId } },
    });
    if (!candidate) throw new ValidationError("Candidate not standing in this election");

    try {
      return await electionRepository.castVote(electionId, voter.id, body.candidateUserId);
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
