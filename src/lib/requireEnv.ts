// encapsulated env so ts can notice token will always non-empty

export function requireEnv(name :string) {
    const res = process.env[name];
    if (!res) throw new Error("[Error] .env is missing info");
    return res;
}
