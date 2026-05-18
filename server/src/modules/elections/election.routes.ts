import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireLevels } from "../../middleware/role.middleware.js";
import {
  getElectionResults,
  getElections,
  postCandidate,
  postElection,
  postNominate,
  postTally,
  postVote,
} from "./election.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/", getElections);
r.get("/:id/results", getElectionResults);
r.post("/:id/nominate", postNominate);
r.post("/", requireLevels("L1", "L2", "L3"), postElection);
r.post("/:id/candidates", postCandidate);
r.post("/:id/vote", postVote);
r.post("/:id/tally", requireLevels("L1", "L2", "L3"), postTally);

export const electionRouter = r;
