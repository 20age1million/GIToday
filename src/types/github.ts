// define interfaces for githun stat handling

export interface RepoSummary {
    name: string;
    default_branch: string;
    private: boolean;
    fork: boolean;
    archived: boolean;
}

export interface BranchSummary {
    name: string;
    headSha: string;
}

export interface CommitDetails {
    sha: string;
    authorLogin?: string;
    authorEmail?: string;
    date: string;
}

export interface CommitStat {
    additions: number;
    deletions: number;
    total: number;
}

export interface CommitSummary {
    sha: string;
    authorKey: string;
    stats: CommitStat;
    isMerged: boolean;
}

export interface AuthorAggregate {
    authorKey: string;
    additions: number;
    deletions: number;
    total: number;
}

export interface TimeWindow {
    // (ISO 8601，UTC)
    since: string; 
    until: string;
}

export interface ListOptions {
    perPage?: number;
    includeForks?: boolean;
    includeArchived?:boolean;
    branch?: string;
    author?: string;
    concurrency?: number;
    ignoreMerges?: boolean;
    repoConcurrency?: number;
}

