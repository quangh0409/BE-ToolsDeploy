import { HttpError, HttpStatus, Result, ResultSuccess, success } from "app";
import axios from "axios";
import Github from "../models/git";
import { v1 } from "uuid";
import { createUser } from "../services/user.service";
import { login } from "../services/auth.service";

export async function createGitHub(params: {
    access_token: string;
    token_type: string;
    scope?: string;
    git_id: string;
}): Promise<ResultSuccess> {
    const check = await Github.findOne({ git_id: params.git_id });

    if (check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GITHUB_EXITSED",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.git_id,
                },
            ],
        });
    }

    const github = new Github({
        id: v1(),
        git_id: params.git_id,
        access_token: params.access_token,
        token_type: params.token_type,
        scope: params.scope,
    });

    await github.save();

    return success.ok(github);
}

export async function updateGitHub(params: {
    access_token: string;
    token_type: string;
    scope?: string;
    git_id: string;
}): Promise<ResultSuccess> {
    const check = await Github.findOneAndUpdate(
        { git_id: params.git_id },
        {
            $set: {
                access_token: params.access_token,
                token_type: params.token_type,
                scope: params.scope,
            },
        }
    );

    if (!check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GITHUB_EXITSED",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.git_id,
                },
            ],
        });
    }

    return success.ok(check);
}

export async function getAGithubByCode(params: {
    code: string;
}): Promise<Result> {
    const client_id = "66602684d99f3683ebe0";
    const client_secret = "2a5519307a6d3f29668a8a2924622af5970bcde2";

    try {
        const response = await axios.post(
            `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${params.code}`,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        const data: {
            access_token: string;
            scope: string;
            token_type: string;
        } = parseAccessToken(response.data);

        if (data.access_token) {
            return success.ok(data);
        }
        return success.ok(response.data);
    } catch (error) {
        console.error(error);
        return {
            status: HttpStatus.INTERNAL_SERVER,
            code: "ACCOUNT_IS_INACTIVE",
            errors: [
                {
                    location: "body",
                    param: "email",
                    message: "Internal Server Error",
                },
            ],
        };
    }
}

export async function GetInfoUserGitByAccesToken(params: {
    access_token: string;
}): Promise<ResultSuccess> {
    const response = await axios.get(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${params.access_token}`,
        },
    });

    return success.ok(response.data);
}

export async function GetReposGitByAccessToken(params: {
    access_token_git: string;
    user: string;
}) {
    const response = await axios.get(
        `https://api.github.com/users/${params.user}/repos`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    return success.ok({ data: response.data });
}

export async function GetBranchesByAccessToken(params: {
    access_token_git: string;
    user: string;
    repository: string;
}) {
    const response = await axios.get(
        `https://api.github.com/repos/${params.user}/${params.repository}/branches`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const dataArray = response.data.map((branch: any) => ({
        branch: branch.name,
    }));

    return success.ok({ data: dataArray });
}

export async function GetLanguagesByAccessToken(params: {
    access_token_git: string;
    user: string;
    repository: string;
}) {
    const response = await axios.get(
        `https://api.github.com/repos/${params.user}/${params.repository}/languages`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const dataArray = Object.entries(response.data).map(
        ([language, number]) => ({
            language,
            number,
        })
    );

    return success.ok({ data: dataArray });
}

function parseAccessToken(input: string): {
    access_token: string;
    scope: string;
    token_type: string;
} {
    const parts = input.split("&");
    const result: { access_token: string; scope: string; token_type: string } =
        {
            access_token: "",
            scope: "",
            token_type: "",
        };

    for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "access_token") {
            result.access_token = value;
        } else if (key === "scope") {
            result.scope = value;
        } else if (key === "token_type") {
            result.token_type = value;
        }
    }

    return result;
}
