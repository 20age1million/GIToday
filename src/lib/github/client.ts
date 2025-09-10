// step 1
// encapsulate auth

import { Octokit } from "octokit";
import { requireEnv } from "../requireEnv.js";

const token = requireEnv("GITHUB_TOKEN");

export const octokit = new Octokit({auth: token, userAgent: "GIToday"});
