# Discord Bot Commands — Usage Guide

## `/ls`

List GitHub resources (repositories, branches, people).

### Subcommands

#### `/ls repos`
- **Options:**
  - `org` *(string, required)* — GitHub organization name.
  - `max` *(integer, optional)* — Maximum number of repos to list.
- **Example:**  
  `/ls repos org:my-org max:10`

#### `/ls branches`
- **Options:**
  - `org` *(string, required)* — GitHub organization name.
  - `repo` *(string, required)* — Repository name.
  - `max` *(integer, optional)* — Maximum number of branches to list.
- **Example:**  
  `/ls branches org:my-org repo:frontend max:5`

#### `/ls people`
- **Options:**
  - `org` *(string, required)* — GitHub organization name.
  - `max` *(integer, optional)* — Maximum number of people to list.
- **Example:**  
  `/ls people org:my-org max:15`

---

## `/echo`

Echo back the provided string.

- **Options:**
  - `text` *(string, required)* — The message to echo.
- **Example:**  
  `/echo text:"This bot works!"`

---

## `/hello`

Say hello in the current channel.

- **Options:**  
  *(none)*
- **Behavior:**  
  Prints **`Hello,World!`** in the channel.
- **Example:**  
  `/hello`

---

## `/report`

Generate commit activity reports from GitHub.

### Subcommands

#### `/report default`
- **Description:** Report for the last **1 day**.
- **Options:**
  - `repo` *(string, optional)* — Target repository name.  
    If absent → report covers the entire org.
- **Example:**  
  `/report default repo:backend`

#### `/report rel`
- **Description:** Report for a **relative time window** (days or hours).
- **Options:**
  - `rel` *(string, required)* — Relative window, e.g. `"7d"` or `"24h"`.
  - `repo` *(string, optional)* — Target repository name.
- **Example:**  
  `/report rel rel:"7d"`  
  `/report rel rel:"24h" repo:frontend`

#### `/report window`
- **Description:** Report for an **absolute time window**.
- **Options:**
  - `since` *(ISO8601, required)* — Start time (UTC).
  - `until` *(ISO8601, required)* — End time (UTC).
  - `repo` *(string, optional)* — Target repository name.
- **Example:**  
  `/report window since:2025-09-01T00:00:00Z until:2025-09-07T23:59:59Z`  
  `/report window since:2025-09-01T00:00:00Z until:2025-09-07T23:59:59Z repo:infra`

---

# Notes
- All GitHub commands require the `GITHUB_ORG` environment variable to be set.
- Time windows for `/report` must not exceed **90 days**.
- Invalid repos or invalid ISO8601 timestamps will result in errors.