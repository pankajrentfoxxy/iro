import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import {
  createElectionSchema,
  electionService,
  registerCandidateSchema,
  voteSchema,
} from "./election.service.js";

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

export async function postElection(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(createElectionSchema, req.body);
    const election = await electionService.createElection(body, req.user!);
    ok(res, { election }, 201);
  } catch (e) {
    next(e);
  }
}

export async function postCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(registerCandidateSchema, req.body);
    const c = await electionService.registerCandidate(req.params.id!, body, req.user!);
    ok(res, { candidate: c }, 201);
  } catch (e) {
    next(e);
  }
}

export async function postVote(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(voteSchema, req.body);
    const vote = await electionService.vote(req.params.id!, body, req.user!);
    ok(res, { vote }, 201);
  } catch (e) {
    next(e);
  }
}

export async function postTally(req: Request, res: Response, next: NextFunction) {
  try {
    const results = await electionService.closeAndTally(req.params.id!);
    ok(res, { results });
  } catch (e) {
    next(e);
  }
}
